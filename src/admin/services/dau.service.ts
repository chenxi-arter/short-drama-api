import { Injectable, Inject, Logger } from '@nestjs/common';
import { RedisClientType } from 'redis';
import { REDIS_CLIENT } from '../../core/redis/redis.module';

/**
 * DAU (Daily Active Users) 统计服务
 *
 * 使用 Redis HyperLogLog（PFADD / PFCOUNT）统计日活。
 * key 格式：dau:YYYYMMDD   value：user_id
 *
 * HyperLogLog 误差约 0.81%，适合大规模 DAU 场景。
 * key TTL 设置 35 天，自动过期。
 */
@Injectable()
export class DauService {
  private readonly logger = new Logger(DauService.name);

  /** key TTL：35 天，保证历史查询足够 */
  private readonly KEY_TTL_SECONDS = 35 * 24 * 60 * 60;

  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redisClient: RedisClientType | null,
  ) {}

  /**
   * 记录用户活跃（由 WatchProgressService 在更新进度时调用）
   * @param userId  用户 ID
   * @param date    活跃日期，默认今天
   */
  async trackUser(userId: number, date?: Date): Promise<void> {
    if (!this.redisClient || !userId) return;
    try {
      const key = this.buildKey(date ?? new Date());
      await this.redisClient.multi()
        .pfAdd(key, String(userId))
        .expire(key, this.KEY_TTL_SECONDS)
        .exec();
    } catch (e) {
      this.logger.warn(`trackUser error (ignored): ${(e as Error)?.message ?? e}`);
    }
  }

  /**
   * 获取某天的 DAU（从 Redis HyperLogLog 读取）
   * 如果 Redis 不可用或 key 不存在则返回 null
   * @param dateStr  'YYYY-MM-DD'，默认今天
   */
  async getDAU(dateStr?: string): Promise<number | null> {
    if (!this.redisClient) return null;
    try {
      const key = this.buildKey(dateStr ? new Date(dateStr) : new Date());
      const count = await this.redisClient.pfCount(key);
      return count;
    } catch (e) {
      this.logger.warn(`getDAU error: ${(e as Error)?.message ?? e}`);
      return null;
    }
  }

  /**
   * 批量获取日期范围内每天的 DAU（pipeline 一次性读取）
   * @param dates  'YYYY-MM-DD' 字符串数组
   * @returns      Map<dateStr, count | null>，null 表示 Redis 不可用
   */
  async getDAUBatch(dates: string[]): Promise<Map<string, number | null>> {
    const result = new Map<string, number | null>();
    if (!this.redisClient || dates.length === 0) {
      dates.forEach(d => result.set(d, null));
      return result;
    }
    try {
      const pipeline = this.redisClient.multi();
      dates.forEach(d => pipeline.pfCount(this.buildKey(new Date(d))));
      const values = await pipeline.exec();
      dates.forEach((d, i) => {
        const v = values[i];
        result.set(d, typeof v === 'number' ? v : null);
      });
    } catch (e) {
      this.logger.warn(`getDAUBatch error: ${(e as Error)?.message ?? e}`);
      dates.forEach(d => result.set(d, null));
    }
    return result;
  }

  // ─── helpers ────────────────────────────────────────────────────────────────

  /** 将 Date 转成 dau:YYYYMMDD 格式的 Redis key（统一用北京时间 UTC+8） */
  buildKey(date: Date): string {
    const cst = new Date(date.getTime() + 8 * 60 * 60 * 1000);
    const y = cst.getUTCFullYear();
    const m = String(cst.getUTCMonth() + 1).padStart(2, '0');
    const d = String(cst.getUTCDate()).padStart(2, '0');
    return `dau:${y}${m}${d}`;
  }
}
