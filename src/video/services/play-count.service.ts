import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Series } from '../entity/series.entity';
import { RedisConfig } from '../../core/config/redis.config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class PlayCountService implements OnModuleInit, OnModuleDestroy {
  private redisClient: RedisClientType | null = null;
  private flushTimer: NodeJS.Timeout | null = null;

  private readonly dirtySetKey = 'series:playcount:dirty';
  private deltaKey(seriesId: number) {
    return `series:playcount:inc:${seriesId}`;
  }

  constructor(
    private readonly redisConfig: RedisConfig,
    @InjectRepository(Series)
    private readonly seriesRepo: Repository<Series>,
  ) {}

  async onModuleInit() {
    try {
      this.redisClient = createClient({
        socket: {
          host: this.redisConfig.host,
          port: this.redisConfig.port,
        },
        password: this.redisConfig.password,
        database: this.redisConfig.db,
      });
      this.redisClient.on('error', (err) => {
        console.error('[PlayCountService] Redis error:', err?.message || err);
      });
      await this.redisClient.connect();
      // 定时落库：每30秒
      this.flushTimer = setInterval(() => {
        this.flushDeltasSafely().catch((e) => {
          console.warn('[PlayCountService] flush error (ignored):', e?.message || e);
        });
      }, 30_000);
    } catch (e) {
      console.warn('[PlayCountService] Redis not available, will fallback to MySQL only. Reason:', e?.message || e);
    }
  }

  async onModuleDestroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    if (this.redisClient) {
      try { await this.redisClient.quit(); } catch {}
      this.redisClient = null;
    }
  }

  /**
   * 计数：优先 Redis，自增并打标为脏；Redis 不可用时回退到 MySQL 自增。
   */
  async increment(seriesId: number): Promise<void> {
    if (!seriesId || seriesId <= 0) return;
    if (this.redisClient) {
      try {
        const key = this.deltaKey(seriesId);
        await this.redisClient.multi()
          .incrBy(key, 1)
          .expire(key, 24 * 60 * 60)
          .sAdd(this.dirtySetKey, String(seriesId))
          .exec();
        return;
      } catch (e) {
        console.warn('[PlayCountService] Redis INCR fallback to MySQL:', e?.message || e);
      }
    }
    // Fallback
    await this.seriesRepo.increment({ id: seriesId }, 'playCount', 1);
  }

  /**
   * 立即落库一次（公开方法，便于手动调用/测试）
   */
  async flushDeltas(): Promise<{ updated: number; seriesIds: number[] }> {
    return this.flushDeltasSafely();
  }

  private async flushDeltasSafely(): Promise<{ updated: number; seriesIds: number[] }> {
    if (!this.redisClient) return { updated: 0, seriesIds: [] };
    try {
      const ids = await this.redisClient.sMembers(this.dirtySetKey);
      if (!ids || ids.length === 0) return { updated: 0, seriesIds: [] };

      let updated = 0;
      const flushedIds: number[] = [];

      for (const idStr of ids) {
        const seriesId = parseInt(idStr, 10);
        if (!seriesId || seriesId <= 0) {
          await this.redisClient.sRem(this.dirtySetKey, idStr);
          continue;
        }

        // 使用 Lua 原子获取并清零（兼容无 GETDEL 的版本）
        const lua = `
          local v = redis.call('GET', KEYS[1])
          if v then
            redis.call('DEL', KEYS[1])
            return v
          else
            return 0
          end
        `;
        const deltaRaw = await this.redisClient.eval(lua, { keys: [this.deltaKey(seriesId)], arguments: [] });
        const delta = parseInt(String(deltaRaw || '0'), 10) || 0;
        if (delta > 0) {
          await this.seriesRepo.increment({ id: seriesId }, 'playCount', delta);
          updated += 1;
          flushedIds.push(seriesId);
        }
        // 如果没有增量，移出脏集合
        if (delta === 0) {
          await this.redisClient.sRem(this.dirtySetKey, idStr);
        }
      }

      return { updated, seriesIds: flushedIds };
    } catch (e) {
      console.warn('[PlayCountService] flush failed:', e?.message || e);
      return { updated: 0, seriesIds: [] };
    }
  }
}


