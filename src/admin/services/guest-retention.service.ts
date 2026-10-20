/**
 * 游客留存清理服务
 *
 * 用途：彻底删除「长期不活跃的游客用户」及其全部关联数据。
 *
 * 与 `GuestService.cleanInactiveGuests()` 的区别：
 * - 后者只把 `users.is_active` 置 0（软标记），数据全部保留；
 * - 本服务是**硬删除**，连同评论、点赞、观看进度、收藏、登录态等一起清掉。
 *
 * ⚠️ 判定「不活跃」的方式
 * `users` 表没有 `last_login_at` 列，所以最后活跃时间由几张业务表反推，
 * 取其中「最新的一条」作为最后活跃时间，只要它早于截止时间就认为不活跃：
 *   - users.created_at            （注册时间，兜底）
 *   - user_online_daily.date      （每日在线心跳，由 /api/user/heartbeat 与游客登录写入）
 *   - watch_progress.updated_at   （看剧进度更新时间）
 *   - watch_logs.watch_date       （观看日志日期）
 *   - refresh_tokens.created_at   （签发登录态的时间）
 *
 * 这样即使某个信号缺失（比如没打心跳），只要有任何一条活动痕迹在阈值内，就不会被删。
 *
 * ⚠️ 安全设计
 * - 默认 dryRun，只有显式传 `dryRun: false` 才真正删除；
 * - 定时任务默认关闭，需要 `GUEST_PURGE_ENABLED=true` 才启用；
 * - 只删 `is_guest=1` 且 `email` / `telegram_id` 都为空的行，转正用户永不触碰；
 * - 分批（默认 200/批）独立事务，单批失败不影响已完成的批；
 * - 单次运行有上限（默认 5000），避免一次误删太多；
 * - 最终 `DELETE FROM users` 上再挂一次 `is_guest=1` 条件，
 *   防止「选中之后用户刚好转正」这种竞态把它删掉。
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisClientType } from 'redis';
import { User } from '../../user/entity/user.entity';
import { REDIS_CLIENT } from '../../core/redis/redis.module';

/** 默认判定周期：3 个月（按月 = 30 天折算） */
export const DEFAULT_INACTIVE_MONTHS = 3;
/**
 * 判定周期下限：2 个月（60 天）。
 *
 * 这是硬保护，不能低于 35 天。原因：
 * - Redis 的 DAU HyperLogLog（`dau:YYYYMMDD`）只保留 35 天，
 *   超过 35 天的日期没有任何 HLL 兜底，DAU 完全依赖 `user_online_daily` / `watch_logs`；
 * - 一旦把阈值压到 35 天以内，删掉的用户就可能有「最近 35 天内」的记录，
 *   这些日期的 DAU、在线时长会出现永久缺口，且无法用 HLL 补回来。
 * - 判定条件本身就要求「cutoff 之后零活动」，所以只要 cutoff ≥ 35 天前，
 *   被删用户在最近 35 天里必然没有任何记录 —— 数据天然准确。
 *
 * 留到 60 天是为了给阈值本身留 25 天余量，避免边界日期踩线。
 */
export const MIN_INACTIVE_MONTHS = 2;
/** 判定周期上限：60 个月，防止误传天数导致永不命中 */
export const MAX_INACTIVE_MONTHS = 60;
/** 默认单批删除条数 */
export const DEFAULT_BATCH_SIZE = 200;
/** 默认单次运行最多删除多少个用户 */
export const DEFAULT_MAX_PER_RUN = 5000;
/** 预览时最多展示多少个样本用户 */
const PREVIEW_SAMPLE_SIZE = 20;

export interface GuestPurgeOptions {
  /** 判定周期（月），默认 3 */
  inactiveMonths?: number;
  /** 每批处理条数，默认 200 */
  batchSize?: number;
  /** 单次最多删除多少个用户，默认 5000 */
  maxPerRun?: number;
  /** 是否只演练不删除，默认 true */
  dryRun?: boolean;
}

export interface GuestPurgeImpact {
  /** 用户发表的评论 */
  comments: number;
  /** 用户自己点的赞 */
  commentLikesGiven: number;
  /** 用户评论收到的赞 */
  commentLikesReceived: number;
  /** 别人回复用户评论的条数（删除后 reply_to_user_id 会被置空，评论本身保留） */
  repliesToUserComments: number;
  watchProgress: number;
  watchLogs: number;
  browseHistory: number;
  favorites: number;
  episodeReactions: number;
  refreshTokens: number;
  onlineDaily: number;
  advertisingEvents: number;
  advertisingConversions: number;
}

export interface GuestPurgePreview {
  dryRun: true;
  inactiveMonths: number;
  /** 判定周期下限（月）：低于此值会被自动抬上来 */
  minInactiveMonths: number;
  /**
   * 是否会触及最近 35 天的统计数据。
   * 恒为 false —— 判定周期下限 2 个月已经保证被删用户在最近 35 天内零记录。
   */
  affectsRecent35Days: boolean;
  cutoff: string;
  /** 命中条件的用户总数（可能与单次可删上限不同） */
  totalUsers: number;
  sample: Array<{
    id: number;
    nickname: string | null;
    username: string | null;
    createdAt: Date;
    lastOnlineDate: string | null;
    lastWatchAt: Date | null;
  }>;
  impact: GuestPurgeImpact;
}

export interface GuestPurgeResult {
  dryRun: boolean;
  inactiveMonths: number;
  cutoff: string;
  /** 实际删除的用户数 */
  deletedUsers: number;
  /** 执行批次数 */
  batches: number;
  /** 每张表实际影响的行数 */
  affected: GuestPurgeImpact;
  /** 是否因为达到 maxPerRun 提前结束 */
  truncated: boolean;
  durationMs: number;
}

/** 区分「演练结果」与「真实执行结果」 */
export function isGuestPurgeResult(
  value: GuestPurgeResult | GuestPurgePreview,
): value is GuestPurgeResult {
  return value.dryRun === false;
}

@Injectable()
export class GuestRetentionService {
  private readonly logger = new Logger(GuestRetentionService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: RedisClientType | null,
  ) {}

  // ─────────────────────────── 定时任务 ───────────────────────────

  /**
   * 每天 04:30（北京时间）执行一次彻底清理。
   *
   * 默认不启用：需要在 env 里显式设置 `GUEST_PURGE_ENABLED=true`。
   * 建议先用 `GET /api/admin/users/guest-purge/preview` 看过命中量再开。
   *
   * ⚠️ 执行进程：**admin 进程**（`AdminAppModule` 已开启 `ScheduleModule.forRoot()`）。
   *    注意 admin 进程也加载了 `UserModule`，ScheduleModule 一开就会连带激活
   *    `UserService` 每 5 分钟刷在线时长的任务，所以 `main.admin.ts` 会把
   *    `APP_PROCESS_ROLE` 置为 'admin'，那个任务据此跳过，避免和 client 进程重复累加。
   *
   * 可调参数：
   *   GUEST_PURGE_INACTIVE_MONTHS=3
   *   GUEST_PURGE_BATCH_SIZE=200
   *   GUEST_PURGE_MAX_PER_RUN=5000
   */
  @Cron('30 4 * * *', { timeZone: 'Asia/Shanghai' })
  async scheduledPurge(): Promise<void> {
    if (process.env.GUEST_PURGE_ENABLED !== 'true') {
      return;
    }

    try {
      const result = await this.purge({
        inactiveMonths: this.readPositiveNumber('GUEST_PURGE_INACTIVE_MONTHS', DEFAULT_INACTIVE_MONTHS),
        batchSize: this.readPositiveNumber('GUEST_PURGE_BATCH_SIZE', DEFAULT_BATCH_SIZE),
        maxPerRun: this.readPositiveNumber('GUEST_PURGE_MAX_PER_RUN', DEFAULT_MAX_PER_RUN),
        dryRun: false,
      });

      if (!isGuestPurgeResult(result)) {
        this.logger.warn('[游客清理] 本次仅演练，未删除任何数据');
        return;
      }

      this.logger.log(
        `[游客清理] 完成：删除 ${result.deletedUsers} 个游客 / ${result.batches} 批，` +
          `阈值 ${result.cutoff}（${result.inactiveMonths} 个月），耗时 ${result.durationMs}ms`,
      );
      if (result.truncated) {
        this.logger.warn(
          `[游客清理] 已达到单次上限 ${result.deletedUsers} 个，剩余量留到下次执行`,
        );
      }
    } catch (error) {
      this.logger.error(
        `[游客清理] 执行失败: ${(error as Error)?.message ?? error}`,
        (error as Error)?.stack,
      );
    }
  }

  // ─────────────────────────── 预览 ───────────────────────────

  /**
   * 只统计不删除：返回命中用户数、样本以及会被波及的数据量。
   * 用于正式开启定时任务前先确认范围。
   */
  async preview(options: GuestPurgeOptions = {}): Promise<GuestPurgePreview> {
    const inactiveMonths = this.normalizeMonths(options.inactiveMonths);
    const cutoff = this.resolveCutoff(inactiveMonths);
    const cutoffDate = this.toBeijingDateOnly(cutoff);
    const where = this.buildCandidateWhere(cutoff, cutoffDate);

    const totalRows = await this.userRepo.query(
      `SELECT COUNT(*) AS total FROM users u WHERE ${where.sql}`,
      where.params,
    );
    const totalUsers = Number(totalRows?.[0]?.total ?? 0);

    const sample = totalUsers
      ? await this.userRepo.query(
          `SELECT
             u.id,
             u.nickname,
             u.username,
             u.created_at AS createdAt,
             (SELECT MAX(d.date) FROM user_online_daily d WHERE d.user_id = u.id) AS lastOnlineDate,
             (SELECT MAX(wp.updated_at) FROM watch_progress wp WHERE wp.user_id = u.id) AS lastWatchAt
           FROM users u
           WHERE ${where.sql}
           ORDER BY u.created_at ASC
           LIMIT ${PREVIEW_SAMPLE_SIZE}`,
          where.params,
        )
      : [];

    const impact = await this.countImpact(where.sql, where.params);

    return {
      dryRun: true,
      inactiveMonths,
      minInactiveMonths: MIN_INACTIVE_MONTHS,
      affectsRecent35Days: inactiveMonths * 30 < 35,
      cutoff: cutoffDate,
      totalUsers,
      sample,
      impact,
    };
  }

  // ─────────────────────────── 执行删除 ───────────────────────────

  /**
   * 删除长期不活跃的游客及其关联数据。
   *
   * @returns dryRun 为 true 时返回预览结果（不写库）
   */
  async purge(options: GuestPurgeOptions = {}): Promise<GuestPurgeResult | GuestPurgePreview> {
    const inactiveMonths = this.normalizeMonths(options.inactiveMonths);
    const batchSize = Math.min(Math.max(options.batchSize ?? DEFAULT_BATCH_SIZE, 1), 1000);
    const maxPerRun = Math.max(options.maxPerRun ?? DEFAULT_MAX_PER_RUN, 1);
    const dryRun = options.dryRun !== false; // 只有显式 false 才真删

    if (dryRun) {
      return this.preview({ inactiveMonths });
    }

    const startedAt = Date.now();
    const cutoff = this.resolveCutoff(inactiveMonths);
    const cutoffDate = this.toBeijingDateOnly(cutoff);
    const where = this.buildCandidateWhere(cutoff, cutoffDate);

    const affected: GuestPurgeImpact = this.emptyImpact();
    let deletedUsers = 0;
    let batches = 0;
    let truncated = false;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const remaining = maxPerRun - deletedUsers;
      if (remaining <= 0) {
        truncated = true;
        break;
      }

      const take = Math.min(batchSize, remaining);
      const rows: Array<{ id: string | number }> = await this.userRepo.query(
        `SELECT u.id FROM users u WHERE ${where.sql} ORDER BY u.id ASC LIMIT ${take}`,
        where.params,
      );

      if (!rows || rows.length === 0) {
        break;
      }

      const ids = rows.map((row) => Number(row.id)).filter((id) => Number.isFinite(id) && id > 0);
      if (ids.length === 0) {
        break;
      }

      const batchResult = await this.deleteBatch(ids);
      this.addImpact(affected, batchResult.affected);

      // 死循环保护：选中了但一个都没删掉（例如全部在选中瞬间完成了转正），
      // 这些行已不再满足判定条件，直接结束本次运行，避免反复空转
      if (batchResult.deletedUsers === 0) {
        this.logger.warn(
          `[游客清理] 本批 ${ids.length} 个候选均未删除（可能已转正/绑定），提前结束`,
        );
        break;
      }

      deletedUsers += batchResult.deletedUsers;
      batches += 1;

      await this.clearOnlineCache(ids);

      this.logger.log(
        `[游客清理] 第 ${batches} 批删除 ${ids.length} 个游客（累计 ${deletedUsers}）`,
      );
    }

    const result: GuestPurgeResult = {
      dryRun: false,
      inactiveMonths,
      cutoff: cutoffDate,
      deletedUsers,
      batches,
      affected,
      truncated,
      durationMs: Date.now() - startedAt,
    };

    this.logger.log(
      `[游客清理] 结束：用户 ${deletedUsers}，评论 ${affected.comments}，` +
        `观看进度 ${affected.watchProgress}，收藏 ${affected.favorites}，` +
        `登录态 ${affected.refreshTokens}，耗时 ${result.durationMs}ms`,
    );

    return result;
  }

  // ─────────────────────────── 内部实现 ───────────────────────────

  /**
   * 一批用户的删除逻辑，顺序与后台「删除用户」接口保持一致。
   * 顺序不能随意调整：先删引用方，再删评论，最后删用户。
   */
  private async deleteBatch(
    ids: number[],
  ): Promise<{ affected: GuestPurgeImpact; deletedUsers: number }> {
    const idList = ids.join(',');
    const affected = this.emptyImpact();
    let deletedUsers = 0;

    await this.userRepo.manager.transaction(async (manager) => {
      const run = async (sql: string): Promise<number> => {
        const result = await manager.query(sql);
        return Number(result?.affectedRows ?? 0);
      };

      // 0. 校正冗余计数：comments.like_count 是累加字段，不会随 comment_likes 删除自动减少。
      //    这里先把「这批人点过赞」的评论计数减回去，否则评论区数字会虚高。
      //    （派生表写法是为了绕开 MySQL 不允许 UPDATE 时直接子查询同一张表的限制）
      await run(
        `UPDATE comments c
         JOIN (
           SELECT comment_id, COUNT(*) AS cnt
           FROM comment_likes
           WHERE user_id IN (${idList})
           GROUP BY comment_id
         ) x ON x.comment_id = c.id
         SET c.like_count = GREATEST(c.like_count - x.cnt, 0)`,
      );

      // 1. 用户自己点的评论赞
      affected.commentLikesGiven += await run(
        `DELETE FROM comment_likes WHERE user_id IN (${idList})`,
      );
      // 2. 别人给该用户评论点的赞（评论即将被删，赞也得清）
      affected.commentLikesReceived += await run(
        `DELETE FROM comment_likes WHERE comment_id IN (SELECT id FROM comments WHERE user_id IN (${idList}))`,
      );
      // 3. 别人对他的回复：保留评论本身，只断开指向
      affected.repliesToUserComments += await run(
        `UPDATE comments SET reply_to_user_id = NULL WHERE reply_to_user_id IN (${idList})`,
      );
      // 3.5 校正主楼计数：删除回复前，把 root_id 对应的 reply_count 减回去，
      //     否则主楼会显示「5 条回复」但实际只剩 3 条
      await run(
        `UPDATE comments r
         JOIN (
           SELECT root_id, COUNT(*) AS cnt
           FROM comments
           WHERE user_id IN (${idList}) AND root_id IS NOT NULL
           GROUP BY root_id
         ) x ON x.root_id = r.id
         SET r.reply_count = GREATEST(r.reply_count - x.cnt, 0)`,
      );
      // 4. 他的评论
      affected.comments += await run(`DELETE FROM comments WHERE user_id IN (${idList})`);
      // 5~6. 观看进度与观看日志
      affected.watchProgress += await run(`DELETE FROM watch_progress WHERE user_id IN (${idList})`);
      affected.watchLogs += await run(`DELETE FROM watch_logs WHERE user_id IN (${idList})`);
      // 7. 浏览历史（已废弃的表，但仍保留物理表）
      affected.browseHistory += await run(`DELETE FROM browse_history WHERE user_id IN (${idList})`);
      // 8~9. 收藏与点赞点踩
      affected.favorites += await run(`DELETE FROM favorites WHERE user_id IN (${idList})`);
      affected.episodeReactions += await run(
        `DELETE FROM episode_reactions WHERE user_id IN (${idList})`,
      );
      // 10. 登录态：删掉才彻底断掉 refresh 换 access 的可能
      affected.refreshTokens += await run(`DELETE FROM refresh_tokens WHERE user_id IN (${idList})`);
      // 11. 每日在线记录
      affected.onlineDaily += await run(
        `DELETE FROM user_online_daily WHERE user_id IN (${idList})`,
      );
      // 12~13. 广告事件与转化归因
      affected.advertisingEvents += await run(
        `DELETE FROM advertising_events WHERE user_id IN (${idList})`,
      );
      affected.advertisingConversions += await run(
        `DELETE FROM advertising_conversions WHERE user_id IN (${idList})`,
      );
      // 14. 最后删用户本体；再挂一次游客条件，防「选中后刚好转正」的竞态
      const deleted = await run(
        `DELETE FROM users WHERE id IN (${idList}) AND is_guest = 1 AND email IS NULL AND telegram_id IS NULL`,
      );
      deletedUsers = deleted;
      if (deleted < ids.length) {
        this.logger.warn(
          `[游客清理] 本批 ${ids.length} 个候选中只有 ${deleted} 个仍是游客，` +
            `其余可能在选中后已完成转正/绑定，已跳过`,
        );
      }
    });

    return { affected, deletedUsers };
  }

  /**
   * 判定条件（所有查询共用，保证 preview 与 purge 口径完全一致）
   */
  private buildCandidateWhere(
    cutoff: Date,
    cutoffDate: string,
  ): { sql: string; params: unknown[] } {
    const sql = `
      u.is_guest = 1
      AND u.email IS NULL
      AND u.telegram_id IS NULL
      AND u.created_at < ?
      AND NOT EXISTS (
        SELECT 1 FROM user_online_daily d
        WHERE d.user_id = u.id AND d.date >= ?
      )
      AND NOT EXISTS (
        SELECT 1 FROM watch_progress wp
        WHERE wp.user_id = u.id AND wp.updated_at >= ?
      )
      AND NOT EXISTS (
        SELECT 1 FROM watch_logs wl
        WHERE wl.user_id = u.id AND wl.watch_date >= ?
      )
      AND NOT EXISTS (
        SELECT 1 FROM refresh_tokens rt
        WHERE rt.user_id = u.id AND rt.created_at >= ?
      )
    `;
    // 占位符顺序：created_at, online_daily.date, watch_progress.updated_at,
    //             watch_logs.watch_date, refresh_tokens.created_at
    return { sql, params: [cutoff, cutoffDate, cutoff, cutoffDate, cutoff] };
  }

  /** 统计这批用户在各表里涉及多少行 */
  private async countImpact(sql: string, params: unknown[]): Promise<GuestPurgeImpact> {
    const countByJoin = async (table: string, joinColumn = 'user_id'): Promise<number> => {
      try {
        const rows = await this.userRepo.query(
          `SELECT COUNT(*) AS c FROM ${table} t
           JOIN users u ON u.id = t.${joinColumn}
           WHERE ${sql}`,
          params,
        );
        return Number(rows?.[0]?.c ?? 0);
      } catch (error) {
        // 某张表结构不一致时不阻塞预览，返回 -1 表示「统计失败」
        this.logger.warn(`[游客清理] 统计 ${table} 失败: ${(error as Error)?.message}`);
        return -1;
      }
    };

    const [comments, commentLikesGiven, watchProgress, watchLogs, browseHistory, favorites, episodeReactions, refreshTokens, onlineDaily, advertisingEvents, advertisingConversions] =
      await Promise.all([
        countByJoin('comments'),
        countByJoin('comment_likes'),
        countByJoin('watch_progress'),
        countByJoin('watch_logs'),
        countByJoin('browse_history'),
        countByJoin('favorites'),
        countByJoin('episode_reactions'),
        countByJoin('refresh_tokens'),
        countByJoin('user_online_daily'),
        countByJoin('advertising_events'),
        countByJoin('advertising_conversions'),
      ]);

    // 两个需要绕一层的统计
    let commentLikesReceived = 0;
    let repliesToUserComments = 0;
    try {
      const rows = await this.userRepo.query(
        `SELECT COUNT(*) AS c FROM comment_likes cl
         JOIN comments c ON c.id = cl.comment_id
         JOIN users u ON u.id = c.user_id
         WHERE ${sql}`,
        params,
      );
      commentLikesReceived = Number(rows?.[0]?.c ?? 0);
    } catch {
      commentLikesReceived = -1;
    }
    try {
      const rows = await this.userRepo.query(
        `SELECT COUNT(*) AS c FROM comments c
         JOIN users u ON u.id = c.reply_to_user_id
         WHERE ${sql}`,
        params,
      );
      repliesToUserComments = Number(rows?.[0]?.c ?? 0);
    } catch {
      repliesToUserComments = -1;
    }

    return {
      comments,
      commentLikesGiven,
      commentLikesReceived,
      repliesToUserComments,
      watchProgress,
      watchLogs,
      browseHistory,
      favorites,
      episodeReactions,
      refreshTokens,
      onlineDaily,
      advertisingEvents,
      advertisingConversions,
    };
  }

  /** 清掉 Redis 里的在线缓存，避免删除后仍显示「在线」 */
  private async clearOnlineCache(ids: number[]): Promise<void> {
    if (!this.redisClient || ids.length === 0) return;

    const today = this.toBeijingDateOnly(new Date());
    const yesterday = this.toBeijingDateOnly(new Date(Date.now() - 86400000));

    try {
      const pipeline = this.redisClient.multi();
      ids.forEach((id) => {
        pipeline.del(`online:last:${id}`);
        pipeline.hDel(`online:${today}`, String(id));
        pipeline.hDel(`online:${yesterday}`, String(id));
      });
      await pipeline.exec();
    } catch (error) {
      // 缓存清不掉不影响数据库删除结果，只记录
      this.logger.warn(`[游客清理] 清理在线缓存失败（已忽略）: ${(error as Error)?.message}`);
    }
  }

  private emptyImpact(): GuestPurgeImpact {
    return {
      comments: 0,
      commentLikesGiven: 0,
      commentLikesReceived: 0,
      repliesToUserComments: 0,
      watchProgress: 0,
      watchLogs: 0,
      browseHistory: 0,
      favorites: 0,
      episodeReactions: 0,
      refreshTokens: 0,
      onlineDaily: 0,
      advertisingEvents: 0,
      advertisingConversions: 0,
    };
  }

  private addImpact(target: GuestPurgeImpact, delta: GuestPurgeImpact): void {
    (Object.keys(target) as Array<keyof GuestPurgeImpact>).forEach((key) => {
      target[key] += delta[key];
    });
  }

  private normalizeMonths(months?: number): number {
    const value = Number(months ?? DEFAULT_INACTIVE_MONTHS);
    if (!Number.isFinite(value) || value <= 0) {
      return DEFAULT_INACTIVE_MONTHS;
    }
    const floored = Math.floor(value);
    if (floored < MIN_INACTIVE_MONTHS) {
      this.logger.warn(
        `[游客清理] 判定周期 ${floored} 个月低于安全下限 ${MIN_INACTIVE_MONTHS} 个月，` +
          `已自动抬到 ${MIN_INACTIVE_MONTHS} 个月：更短的阈值会破坏最近 35 天的统计数据`,
      );
      return MIN_INACTIVE_MONTHS;
    }
    return Math.min(floored, MAX_INACTIVE_MONTHS);
  }

  /** 按月 = 30 天折算，避免 setMonth 在月末（如 3-31 减一月）跳日的问题 */
  private resolveCutoff(months: number): Date {
    return new Date(Date.now() - months * 30 * 86400000);
  }

  private toBeijingDateOnly(date: Date): string {
    const beijing = new Date(date.getTime() + 8 * 60 * 60 * 1000);
    return beijing.toISOString().slice(0, 10);
  }

  private readPositiveNumber(envKey: string, fallback: number): number {
    const raw = process.env[envKey];
    const value = Number(raw);
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
  }
}
