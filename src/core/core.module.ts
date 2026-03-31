import { Global, Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { AppConfig } from './config/app.config';
import { RedisConfig } from './config/redis.config';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { R2StorageService } from './storage/r2-storage.service';
import { RedisModule } from './redis/redis.module';

/**
 * 核心基础设施模块
 * 提供全局的基础服务：配置、数据库、缓存、健康检查、限流等
 */
@Global()
@Module({
  imports: [
    // 配置模块 - 必须最先导入
    ConfigModule,
    
    // 数据库模块
    DatabaseModule,
    
    // 缓存模块
    CacheModule.registerAsync({
      useFactory: async (redisConfig: RedisConfig) => {
        const config = redisConfig.getCacheConfig();
        return {
          store: redisStore as any,
          host: config.host,
          port: config.port,
          password: config.password,
          db: config.db,
          ttl: config.ttl,
          max: config.max,
        };
      },
      inject: [RedisConfig],
      isGlobal: true,
    }),
    
    // 限流模块
    ThrottlerModule.forRootAsync({
      useFactory: (appConfig: AppConfig) => {
        const config = appConfig.getThrottleConfig();
        return [{
          ttl: config.ttl || 60,
          limit: config.limit || 10,
        }];
      },
      inject: [AppConfig],
    }),
    
    // 健康检查模块
    HealthModule,

    // Redis 模块（全局共享客户端）
    RedisModule,
  ],
  providers: [R2StorageService],
  exports: [
    ConfigModule,
    DatabaseModule,
    CacheModule,
    ThrottlerModule,
    HealthModule,
    R2StorageService,
    RedisModule,
  ],
})
export class CoreModule {
  /**
   * 模块初始化时的日志
   */
  constructor() {
    console.log('🚀 Core infrastructure modules initialized');
  }
}