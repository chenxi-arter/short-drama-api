import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Redis配置类
 * 统一管理Redis缓存相关配置项
 */
export class RedisConfig {
  @IsString()
  @Transform(({ value }) => value || 'localhost')
  host: string = 'localhost';

  @IsNumber()
  @Transform(({ value }) => parseInt(value) || 6379)
  port: number = 6379;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value) || 0)
  db?: number = 0;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value) || 300)
  ttl?: number = 300; // 默认5分钟

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value) || 100)
  max?: number = 100; // 最大缓存数量

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value) || 5000)
  connectTimeout?: number = 5000;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value) || 3000)
  lazyConnect?: number = 3000;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value) || 3)
  retryAttempts?: number = 3;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value) || 3000)
  retryDelay?: number = 3000;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  enableReadyCheck?: boolean = true;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value) || 20000)
  maxRetriesPerRequest?: number = 20000;

  /**
   * 获取Redis配置对象
   */
  getRedisConfig() {
    return {
      host: this.host,
      port: this.port,
      password: this.password,
      db: this.db,
      connectTimeout: this.connectTimeout,
      lazyConnect: this.lazyConnect,
      retryAttempts: this.retryAttempts,
      retryDelayOnFailover: this.retryDelay,
      enableReadyCheck: this.enableReadyCheck,
      maxRetriesPerRequest: this.maxRetriesPerRequest,
    };
  }

  /**
   * 获取缓存模块配置
   */
  getCacheConfig() {
    return {
      store: 'redis',
      host: this.host,
      port: this.port,
      password: this.password,
      db: this.db,
      ttl: this.ttl,
      max: this.max,
    };
  }
}