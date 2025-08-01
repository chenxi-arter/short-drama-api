import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * 数据库配置类
 * 统一管理数据库相关配置项
 */
export class DatabaseConfig {
  @IsString()
  @Transform(({ value }) => value || 'localhost')
  host: string = 'localhost';

  @IsNumber()
  @Transform(({ value }) => parseInt(value) || 3306)
  port: number = 3306;

  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsString()
  database: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value || 'utf8mb4')
  charset?: string = 'utf8mb4';

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value || 'Asia/Shanghai')
  timezone?: string = 'Asia/Shanghai';

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  synchronize?: boolean = false;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  logging?: boolean = false;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value) || 10)
  maxConnections?: number = 10;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value) || 0)
  minConnections?: number = 0;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value) || 30000)
  acquireTimeout?: number = 30000;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value) || 10000)
  timeout?: number = 10000;

  /**
   * 获取TypeORM配置对象
   */
  getTypeOrmConfig() {
    return {
      type: 'mysql' as const,
      host: this.host,
      port: this.port,
      username: this.username,
      password: this.password,
      database: this.database,
      charset: this.charset,
      timezone: this.timezone,
      synchronize: this.synchronize,
      logging: this.logging,
      extra: {
        connectionLimit: this.maxConnections,
        acquireTimeout: this.acquireTimeout,
        timeout: this.timeout,
      },
      autoLoadEntities: true,
      retryAttempts: 3,
      retryDelay: 3000,
    };
  }
}