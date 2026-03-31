import { Global, Module, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { RedisConfig } from '../config/redis.config';

export const REDIS_CLIENT = 'REDIS_CLIENT';

/**
 * 全局 Redis 模块
 * 统一管理 Redis 连接，连接成功/失败时打印日志
 * 通过 REDIS_CLIENT token 注入共享客户端
 */
@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: async (redisConfig: RedisConfig): Promise<RedisClientType | null> => {
        const logger = new Logger('RedisModule');
        try {
          const cfg: any = {
            socket: {
              host: redisConfig.host,
              port: redisConfig.port,
              connectTimeout: redisConfig.connectTimeout ?? 5000,
            },
            database: redisConfig.db ?? 0,
          };
          if (redisConfig.username?.trim()) cfg.username = redisConfig.username;
          if (redisConfig.password?.trim()) cfg.password = redisConfig.password;

          const client = createClient(cfg) as RedisClientType;

          client.on('error', (err) =>
            logger.error(`Redis connection error: ${err?.message ?? err}`),
          );
          client.on('reconnecting', () =>
            logger.warn('Redis reconnecting...'),
          );

          await client.connect();

          logger.log(
            `\x1b[32m🟢 Redis connected ✔  ${redisConfig.host}:${redisConfig.port}  db=${redisConfig.db ?? 0}\x1b[0m`,
          );

          return client;
        } catch (e) {
          logger.warn(
            `\x1b[33m⚠️  Redis unavailable — DAU tracking falls back to MySQL. Reason: ${
              (e as Error)?.message ?? e
            }\x1b[0m`,
          );
          return null;
        }
      },
      inject: [RedisConfig],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
