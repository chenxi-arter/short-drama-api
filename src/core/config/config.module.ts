import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule, ConfigService } from '@nestjs/config';
import { plainToClass } from 'class-transformer';
import { validateSync } from 'class-validator';
import { AppConfig } from './app.config';
import { DatabaseConfig } from './database.config';
import { RedisConfig } from './redis.config';

/**
 * 配置验证函数
 * 确保所有必需的环境变量都已设置且格式正确
 */
function validateConfig(config: Record<string, unknown>) {
  // 验证应用配置
  const appConfig = plainToClass(AppConfig, {
    nodeEnv: config.NODE_ENV,
    port: config.PORT,
    appName: config.APP_NAME,
    appVersion: config.APP_VERSION,
    appUrl: config.APP_URL,
    globalPrefix: config.GLOBAL_PREFIX,
    enableCors: config.ENABLE_CORS,
    enableSwagger: config.ENABLE_SWAGGER,
    enableVersioning: config.ENABLE_VERSIONING,
    defaultVersion: config.DEFAULT_VERSION,
    throttleTtl: config.THROTTLE_TTL,
    throttleLimit: config.THROTTLE_LIMIT,
    jwtSecret: config.JWT_SECRET,
    jwtExpiresIn: config.JWT_EXPIRES_IN,
    jwtRefreshExpiresIn: config.JWT_REFRESH_EXPIRES_IN,
  });

  // 验证数据库配置
  const databaseConfig = plainToClass(DatabaseConfig, {
    host: config.DB_HOST,
    port: config.DB_PORT,
    username: config.DB_USER,
    password: config.DB_PASS,
    database: config.DB_NAME,
    charset: config.DB_CHARSET,
    timezone: config.DB_TIMEZONE,
    synchronize: config.DB_SYNCHRONIZE,
    logging: config.DB_LOGGING,
    maxConnections: config.DB_MAX_CONNECTIONS,
    minConnections: config.DB_MIN_CONNECTIONS,
    acquireTimeout: config.DB_ACQUIRE_TIMEOUT,
    timeout: config.DB_TIMEOUT,
  });

  // 验证Redis配置
  const redisConfig = plainToClass(RedisConfig, {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    password: config.REDIS_PASSWORD,
    db: config.REDIS_DB,
    ttl: config.REDIS_TTL,
    max: config.REDIS_MAX,
    connectTimeout: config.REDIS_CONNECT_TIMEOUT,
    lazyConnect: config.REDIS_LAZY_CONNECT,
    retryAttempts: config.REDIS_RETRY_ATTEMPTS,
    retryDelay: config.REDIS_RETRY_DELAY,
    enableReadyCheck: config.REDIS_ENABLE_READY_CHECK,
    maxRetriesPerRequest: config.REDIS_MAX_RETRIES_PER_REQUEST,
  });

  // 验证所有配置
  const configs = [appConfig, databaseConfig, redisConfig];
  
  for (const configInstance of configs) {
    const errors = validateSync(configInstance, {
      skipMissingProperties: false,
    });

    if (errors.length > 0) {
      throw new Error(
        `Configuration validation error: ${errors
          .map((error) => Object.values(error.constraints || {}).join(', '))
          .join('; ')}`
      );
    }
  }

  return {
    app: appConfig,
    database: databaseConfig,
    redis: redisConfig,
  };
}

/**
 * 全局配置模块
 * 提供类型安全的配置访问
 */
@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validate: validateConfig,
      cache: true,
    }),
  ],
  providers: [
    {
      provide: AppConfig,
      useFactory: (configService: ConfigService) => {
        return configService.get('app');
      },
      inject: [ConfigService],
    },
    {
      provide: DatabaseConfig,
      useFactory: (configService: ConfigService) => {
        return configService.get('database');
      },
      inject: [ConfigService],
    },
    {
      provide: RedisConfig,
      useFactory: (configService: ConfigService) => {
        return configService.get('redis');
      },
      inject: [ConfigService],
    },
  ],
  exports: [AppConfig, DatabaseConfig, RedisConfig],
})
export class ConfigModule {}