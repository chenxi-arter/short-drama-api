import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisUsername = configService.get('REDIS_USERNAME') || configService.get('REDIS_USER');
        const redisPassword = configService.get('REDIS_PASSWORD') || configService.get('REDIS_PASS');
        const config: any = {
          store: redisStore,
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          db: configService.get('REDIS_DB', 0),
          ttl: configService.get('REDIS_TTL', 300), // 默认5分钟缓存
        };
        
        // 只有在有用户名时才添加username参数
        if (redisUsername && redisUsername.trim() !== '') {
          config.username = redisUsername;
        }
        
        // 只有在有密码时才添加password参数
        if (redisPassword && redisPassword.trim() !== '') {
          config.password = redisPassword;
        }
        
        return config;
      },
      inject: [ConfigService],
    }),
  ],
  exports: [CacheModule],
})
export class RedisCacheModule {}