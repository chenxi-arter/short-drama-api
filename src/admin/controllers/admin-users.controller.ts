/**
 * 管理后台 - 用户管理控制器（列表/详情/封禁）
 * 路由前缀: /api/admin/users
 */
import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisClientType } from 'redis';
import { User } from '../../user/entity/user.entity';
import { RefreshToken } from '../../auth/entity/refresh-token.entity';
import { WatchLog } from '../../video/entity/watch-log.entity';
import { UserOnlineDaily } from '../../user/entity/user-online-daily.entity';
import { REDIS_CLIENT } from '../../core/redis/redis.module';
import { AdminJwtAuthGuard } from '../guards/admin-jwt-auth.guard';

type AdminUserListRaw = {
  u_id: string | number;
  loginCount?: string | number | null;
  lastLoginAt?: string | Date | null;
  activeLogins?: string | number | null;
  totalWatchDuration?: string | number | null;
  totalOnlineDuration?: string | number | null;
  lastActiveAt?: string | Date | null;
};

type UserWatchStatsRaw = {
  totalDuration?: string | number | null;
  lastActiveAt?: string | Date | null;
};

@UseGuards(AdminJwtAuthGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    @InjectRepository(WatchLog)
    private readonly watchLogRepo: Repository<WatchLog>,
    @InjectRepository(UserOnlineDaily)
    private readonly onlineDailyRepo: Repository<UserOnlineDaily>,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: RedisClientType | null,
  ) {}

  @Get()
  async list(
    @Query('page') page = 1,
    @Query('size') size = 20,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('loginCount') loginCount?: string,
    @Query('minLoginCount') minLoginCount?: string,
    @Query('maxLoginCount') maxLoginCount?: string,
    @Query('watchDurationRange') watchDurationRange?: string,
    @Query('minWatchMinutes') minWatchMinutes?: string,
    @Query('maxWatchMinutes') maxWatchMinutes?: string,
    @Query('onlineDurationRange') onlineDurationRange?: string,
    @Query('minOnlineMinutes') minOnlineMinutes?: string,
    @Query('maxOnlineMinutes') maxOnlineMinutes?: string,
  ) {
    const take = Math.max(Number(size) || 20, 1);
    const currentPage = Math.max(Number(page) || 1, 1);
    const skip = (currentPage - 1) * take;
    const now = new Date();
    const parsedStartDate = this.parseDateBoundary(startDate, 'start');
    const parsedEndDate = this.parseDateBoundary(endDate, 'end');
    const startDateOnly = parsedStartDate ? this.formatDateOnly(parsedStartDate) : null;
    const endDateOnly = parsedEndDate ? this.formatDateOnly(this.toExclusiveDateOnlyBoundary(parsedEndDate)) : null;

    const queryBuilder = this.userRepo.createQueryBuilder('u')
      .leftJoin(
        qb => qb
          .select('rt.user_id', 'userId')
          .addSelect('COUNT(*)', 'loginCount')
          .addSelect('MAX(rt.created_at)', 'lastLoginAt')
          .from(RefreshToken, 'rt')
          .groupBy('rt.user_id'),
        'login_stats',
        'login_stats.userId = u.id',
      )
      .leftJoin(
        qb => qb
          .select('art.user_id', 'userId')
          .addSelect('COUNT(*)', 'activeLogins')
          .from(RefreshToken, 'art')
          .where('art.is_revoked = 0')
          .andWhere('art.expires_at > :now', { now })
          .groupBy('art.user_id'),
        'active_login_stats',
        'active_login_stats.userId = u.id',
      )
      .leftJoin(
        qb => {
          const watchQb = qb
            .select('wl.user_id', 'userId')
            .addSelect('COALESCE(SUM(wl.watch_duration), 0)', 'totalWatchDuration')
            .addSelect('MAX(wl.created_at)', 'lastActiveAt')
            .from(WatchLog, 'wl');

          if (parsedStartDate) {
            watchQb.where('wl.created_at >= :watchStartDate', { watchStartDate: parsedStartDate });
          }

          if (parsedEndDate) {
            if (parsedStartDate) {
              watchQb.andWhere('wl.created_at < :watchEndDate', { watchEndDate: parsedEndDate });
            } else {
              watchQb.where('wl.created_at < :watchEndDate', { watchEndDate: parsedEndDate });
            }
          }

          return watchQb.groupBy('wl.user_id');
        },
        'watch_stats',
        'watch_stats.userId = u.id',
      )
      .leftJoin(
        qb => {
          const onlineQb = qb
            .select('od.user_id', 'userId')
            .addSelect('COALESCE(SUM(od.duration), 0)', 'totalOnlineDuration')
            .from(UserOnlineDaily, 'od');

          if (startDateOnly) {
            onlineQb.where('od.date >= :onlineStartDate', { onlineStartDate: startDateOnly });
          }

          if (endDateOnly) {
            if (startDateOnly) {
              onlineQb.andWhere('od.date < :onlineEndDate', { onlineEndDate: endDateOnly });
            } else {
              onlineQb.where('od.date < :onlineEndDate', { onlineEndDate: endDateOnly });
            }
          }

          return onlineQb.groupBy('od.user_id');
        },
        'online_stats',
        'online_stats.userId = u.id',
      )
      .addSelect('COALESCE(login_stats.loginCount, 0)', 'loginCount')
      .addSelect('login_stats.lastLoginAt', 'lastLoginAt')
      .addSelect('COALESCE(active_login_stats.activeLogins, 0)', 'activeLogins')
      .addSelect('COALESCE(watch_stats.totalWatchDuration, 0)', 'totalWatchDuration')
      .addSelect('watch_stats.lastActiveAt', 'lastActiveAt')
      .addSelect('COALESCE(online_stats.totalOnlineDuration, 0)', 'totalOnlineDuration')
      .orderBy('u.id', 'DESC');

    const exactLoginCount = this.parseOptionalNumber(loginCount);
    const loginCountMin = this.parseOptionalNumber(minLoginCount);
    const loginCountMax = this.parseOptionalNumber(maxLoginCount);

    if (exactLoginCount !== null) {
      queryBuilder.andWhere('COALESCE(login_stats.loginCount, 0) = :loginCount', { loginCount: exactLoginCount });
    }

    if (loginCountMin !== null) {
      queryBuilder.andWhere('COALESCE(login_stats.loginCount, 0) >= :minLoginCount', { minLoginCount: loginCountMin });
    }

    if (loginCountMax !== null) {
      queryBuilder.andWhere('COALESCE(login_stats.loginCount, 0) <= :maxLoginCount', { maxLoginCount: loginCountMax });
    }

    const watchRange = this.parseDurationRange(watchDurationRange, minWatchMinutes, maxWatchMinutes);
    const hasWatchDurationFilter = Boolean(
      watchDurationRange?.trim() || minWatchMinutes?.trim() || maxWatchMinutes?.trim(),
    );
    if (watchRange.minSeconds !== null) {
      queryBuilder.andWhere('COALESCE(watch_stats.totalWatchDuration, 0) >= :minWatchSeconds', {
        minWatchSeconds: hasWatchDurationFilter ? Math.max(watchRange.minSeconds, 1) : watchRange.minSeconds,
      });
    } else if (hasWatchDurationFilter) {
      queryBuilder.andWhere('COALESCE(watch_stats.totalWatchDuration, 0) > 0');
    }

    if (watchRange.maxSeconds !== null) {
      queryBuilder.andWhere('COALESCE(watch_stats.totalWatchDuration, 0) <= :maxWatchSeconds', {
        maxWatchSeconds: watchRange.maxSeconds,
      });
    }

    const onlineRange = this.parseDurationRange(onlineDurationRange, minOnlineMinutes, maxOnlineMinutes);
    const hasOnlineDurationFilter = Boolean(
      onlineDurationRange?.trim() || minOnlineMinutes?.trim() || maxOnlineMinutes?.trim(),
    );
    if (onlineRange.minSeconds !== null) {
      queryBuilder.andWhere('COALESCE(online_stats.totalOnlineDuration, 0) >= :minOnlineSeconds', {
        minOnlineSeconds: hasOnlineDurationFilter ? Math.max(onlineRange.minSeconds, 1) : onlineRange.minSeconds,
      });
    } else if (hasOnlineDurationFilter) {
      queryBuilder.andWhere('COALESCE(online_stats.totalOnlineDuration, 0) > 0');
    }

    if (onlineRange.maxSeconds !== null) {
      queryBuilder.andWhere('COALESCE(online_stats.totalOnlineDuration, 0) <= :maxOnlineSeconds', {
        maxOnlineSeconds: onlineRange.maxSeconds,
      });
    }

    const total = await queryBuilder.clone().getCount();
    const { entities: users, raw } = await queryBuilder
      .skip(skip)
      .take(take)
      .getRawAndEntities<AdminUserListRaw>();

    const statsByUserId = new Map<number, AdminUserListRaw>();
    raw.forEach((row) => {
      const userId = Number(row.u_id);
      statsByUserId.set(userId, row);
    });

    const items = await Promise.all(
      users.map(async (u) => {
        const stats = statsByUserId.get(Number(u.id));
        const [lastToken, onlineLastActiveAt] = await Promise.all([
          this.refreshTokenRepo.findOne({
            where: { userId: u.id },
            order: { createdAt: 'DESC' },
          }),
          this.redisClient
            ? this.redisClient.get(`online:last:${u.id}`).catch(() => null)
            : Promise.resolve(null),
        ]);

        const totalWatchDuration = Number(stats?.totalWatchDuration || 0);
        const totalOnlineDuration = Number(stats?.totalOnlineDuration || 0);
        const lastWatchAt = stats?.lastActiveAt ? new Date(stats.lastActiveAt) : null;
        const lastActiveAt = onlineLastActiveAt ? new Date(onlineLastActiveAt) : lastWatchAt;
        const isOnline = !!onlineLastActiveAt;

        return {
          ...this.toSafeUser(u),
          loginCount: Number(stats?.loginCount || 0),
          lastLoginAt: lastToken?.createdAt || (stats?.lastLoginAt ? new Date(stats.lastLoginAt) : null),
          lastLoginIp: lastToken?.ipAddress || null,
          lastLoginDevice: lastToken?.deviceInfo || null,
          activeLogins: Number(stats?.activeLogins || 0),
          totalOnlineDuration,
          totalOnlineMinutes: Math.floor(totalOnlineDuration / 60),
          totalWatchDuration,
          totalWatchMinutes: Math.floor(totalWatchDuration / 60),
          lastActiveAt,
          isOnline,
        };
      })
    );

    return { total, items, page: currentPage, size: take };
  }

  @Get(':id')
  async get(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const user = await this.userRepo.findOne({ where: { id: Number(id) } });
    if (!user) return null;
    const now = new Date();
    const [lastToken, activeLogins, watchStats] = await Promise.all([
      this.refreshTokenRepo.findOne({
        where: { userId: user.id },
        order: { createdAt: 'DESC' },
      }),
      this.refreshTokenRepo.createQueryBuilder('rt')
        .where('rt.user_id = :uid', { uid: user.id })
        .andWhere('rt.is_revoked = 0')
        .andWhere('rt.expires_at > :now', { now })
        .getCount(),
      this.watchLogRepo.createQueryBuilder('wl')
        .select('COALESCE(SUM(wl.watch_duration), 0)', 'totalDuration')
        .addSelect('MAX(wl.created_at)', 'lastActiveAt')
        .where('wl.user_id = :uid', { uid: user.id })
        .getRawOne<UserWatchStatsRaw>(),
    ]);

    const totalWatchDuration = Number(watchStats?.totalDuration || 0);
    const lastWatchAt = watchStats?.lastActiveAt ? new Date(watchStats.lastActiveAt) : null;
    const onlineLastActiveAt = this.redisClient
      ? await this.redisClient.get(`online:last:${user.id}`).catch(() => null)
      : null;
    const lastActiveAt = onlineLastActiveAt ? new Date(onlineLastActiveAt) : lastWatchAt;
    const isOnline = !!onlineLastActiveAt;
    const onlineDaily = await this.getOnlineDailyStats(user.id, startDate, endDate);

    return {
      ...this.toSafeUser(user),
      lastLoginAt: lastToken?.createdAt || null,
      lastLoginIp: lastToken?.ipAddress || null,
      lastLoginDevice: lastToken?.deviceInfo || null,
      activeLogins,
      totalWatchDuration,
      lastActiveAt,
      isOnline,
      onlineDaily,
    } as any;
  }

  @Get(':id/login-logs')
  async loginLogs(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('size') size = 20,
  ) {
    const userId = Number(id);
    const take = Math.max(Number(size) || 20, 1);
    const currentPage = Math.max(Number(page) || 1, 1);
    const skip = (currentPage - 1) * take;
    const [logs, total] = await this.refreshTokenRepo.findAndCount({
      where: { userId },
      select: ['id', 'createdAt', 'expiresAt', 'isRevoked', 'deviceInfo', 'ipAddress'],
      order: { createdAt: 'DESC' },
      skip,
      take,
    });

    // 查询用户总在线时长（来自 user_online_daily 表）
    const onlineStats = await this.onlineDailyRepo
      .createQueryBuilder('od')
      .select('SUM(od.duration)', 'totalOnlineDuration')
      .where('od.user_id = :userId', { userId })
      .getRawOne<{ totalOnlineDuration: string }>();

    // 查询在线状态（来自 Redis）
    const onlineLastActiveAt = this.redisClient
      ? await this.redisClient.get(`online:last:${userId}`).catch(() => null)
      : null;
    const isOnline = !!onlineLastActiveAt;

    return {
      total,
      items: logs,
      page: currentPage,
      size: take,
      userSummary: {
        userId,
        totalOnlineDuration: Number(onlineStats?.totalOnlineDuration || 0),
        isOnline,
        lastActiveAt: onlineLastActiveAt || null,
      },
    };
  }

  @Post()
  async create(@Body() body: Partial<User>) {
    const entity = this.userRepo.create(body);
    return this.userRepo.save(entity);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: Partial<User>) {
    await this.userRepo.update({ id: Number(id) }, body);
    return this.userRepo.findOne({ where: { id: Number(id) } });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const userId = Number(id);
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    await this.userRepo.manager.transaction(async (manager) => {
      await manager.query('DELETE FROM comment_likes WHERE user_id = ?', [userId]);
      await manager.query('DELETE FROM comment_likes WHERE comment_id IN (SELECT id FROM comments WHERE user_id = ?)', [userId]);
      await manager.query('UPDATE comments SET reply_to_user_id = NULL WHERE reply_to_user_id = ?', [userId]);
      await manager.query('DELETE FROM comments WHERE user_id = ?', [userId]);
      await manager.query('DELETE FROM watch_progress WHERE user_id = ?', [userId]);
      await manager.query('DELETE FROM watch_logs WHERE user_id = ?', [userId]);
      await manager.query('DELETE FROM browse_history WHERE user_id = ?', [userId]);
      await manager.query('DELETE FROM favorites WHERE user_id = ?', [userId]);
      await manager.query('DELETE FROM episode_reactions WHERE user_id = ?', [userId]);
      await manager.query('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
      await manager.query('DELETE FROM user_online_daily WHERE user_id = ?', [userId]);
      await manager.query('DELETE FROM advertising_events WHERE user_id = ?', [userId]);
      await manager.query('DELETE FROM advertising_conversions WHERE user_id = ?', [userId]);
      await manager.delete(User, { id: userId });
    });

    await this.clearUserOnlineCache(userId);

    return { success: true };
  }

  @Get(':id/online-daily')
  async onlineDaily(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const userId = Number(id);
    return this.getOnlineDailyStats(userId, startDate, endDate);
  }

  private async getOnlineDailyStats(userId: number, startDate?: string, endDate?: string) {
    const end = endDate || new Date().toISOString().slice(0, 10);
    const start = startDate || (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10); })();

    const records = await this.onlineDailyRepo
      .createQueryBuilder('od')
      .where('od.user_id = :userId', { userId })
      .andWhere('od.date >= :start', { start })
      .andWhere('od.date <= :end', { end })
      .andWhere('od.duration > 0')
      .orderBy('od.date', 'DESC')
      .getMany();

    const onlineDurationByDate = new Map<string, number>();
    records.forEach((record) => {
      const date = this.formatDateOnly(record.date);
      onlineDurationByDate.set(date, (onlineDurationByDate.get(date) || 0) + record.duration);
    });

    const onlineDates = Array.from(onlineDurationByDate.keys());
    const watchRows = onlineDates.length > 0
      ? await this.watchLogRepo
        .createQueryBuilder('wl')
        .select('wl.watch_date', 'date')
        .addSelect('COALESCE(SUM(wl.watch_duration), 0)', 'watchDuration')
        .where('wl.user_id = :userId', { userId })
        .andWhere('wl.watch_date IN (:...onlineDates)', { onlineDates })
        .groupBy('wl.watch_date')
        .getRawMany<{ date: string; watchDuration: string }>()
      : [];

    const watchDurationByDate = new Map(
      watchRows.map((row) => [this.formatDateOnly(row.date), Number(row.watchDuration || 0)]),
    );

    const totalOnlineDuration = Array.from(onlineDurationByDate.values()).reduce((sum, duration) => sum + duration, 0);
    const totalWatchDuration = Array.from(watchDurationByDate.values()).reduce((sum, duration) => sum + duration, 0);

    return {
      userId,
      startDate: start,
      endDate: end,
      totalOnlineDuration,
      totalWatchDuration,
      days: onlineDates.sort((a, b) => (a < b ? 1 : -1)).map((date) => {
        const onlineDuration = onlineDurationByDate.get(date) || 0;
        const watchDuration = watchDurationByDate.get(date) || 0;

        return {
          date,
          onlineDuration,
          watchDuration,
          onlineHours: Math.floor(onlineDuration / 3600),
          onlineMinutes: Math.floor((onlineDuration % 3600) / 60),
          watchHours: Math.floor(watchDuration / 3600),
          watchMinutes: Math.floor((watchDuration % 3600) / 60),
        };
      }),
    };
  }

  private toSafeUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      telegram_id: user.telegram_id,
      shortId: user.shortId,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      nickname: user.nickname,
      photo_url: user.photo_url,
      is_active: user.is_active,
      isGuest: user.isGuest,
      created_at: user.created_at,
    };
  }

  private parseDateBoundary(value: string | undefined, boundary: 'start' | 'end'): Date | null {
    if (!value || !value.trim()) return null;

    const normalized = value.trim().replace('T', ' ');
    const match = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2})(?::(\d{1,2})(?::(\d{1,2}))?)?)?$/);
    if (!match) {
      const parsed = new Date(normalized);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    const [, year, month, day, hourRaw, minuteRaw, secondRaw] = match;
    let hour = hourRaw === undefined ? (boundary === 'start' ? 0 : 23) : Number(hourRaw);
    const minute = minuteRaw === undefined ? (boundary === 'start' ? 0 : 59) : Number(minuteRaw);
    const second = secondRaw === undefined ? (boundary === 'start' ? 0 : 59) : Number(secondRaw);
    const date = new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0);

    if (boundary === 'end' && hourRaw === undefined) {
      date.setDate(date.getDate() + 1);
      date.setHours(0, 0, 0, 0);
      return date;
    }

    if (hour === 24) {
      date.setDate(date.getDate() + 1);
      date.setHours(0, 0, 0, 0);
      return date;
    }

    date.setHours(hour, minute, second, boundary === 'start' ? 0 : 999);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private parseOptionalNumber(value?: string): number | null {
    if (value === undefined || value === null || String(value).trim() === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private parseDurationRange(
    durationRange?: string,
    minDurationMinutes?: string,
    maxDurationMinutes?: string,
  ): { minSeconds: number | null; maxSeconds: number | null } {
    let minMinutes = this.parseOptionalNumber(minDurationMinutes);
    let maxMinutes = this.parseOptionalNumber(maxDurationMinutes);

    if (durationRange && durationRange.trim()) {
      const [minRaw, maxRaw] = durationRange.split('-').map(part => part.trim());
      minMinutes = this.parseOptionalNumber(minRaw);
      maxMinutes = this.parseOptionalNumber(maxRaw);
    }

    return {
      minSeconds: minMinutes === null ? null : Math.max(minMinutes, 0) * 60,
      maxSeconds: maxMinutes === null ? null : Math.max(maxMinutes, 0) * 60,
    };
  }

  private toExclusiveDateOnlyBoundary(value: Date): Date {
    const result = new Date(value);
    const hasTimePart = result.getHours() > 0
      || result.getMinutes() > 0
      || result.getSeconds() > 0
      || result.getMilliseconds() > 0;

    if (hasTimePart) {
      result.setDate(result.getDate() + 1);
      result.setHours(0, 0, 0, 0);
    }

    return result;
  }

  private async clearUserOnlineCache(userId: number): Promise<void> {
    if (!this.redisClient) return;

    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    await Promise.all([
      this.redisClient.del(`online:last:${userId}`).catch(() => 0),
      this.redisClient.hDel(`online:${today}`, String(userId)).catch(() => 0),
      this.redisClient.hDel(`online:${yesterday}`, String(userId)).catch(() => 0),
    ]);
  }

  private formatDateOnly(value: string | Date): string {
    if (value instanceof Date) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return String(value).slice(0, 10);
  }
}
