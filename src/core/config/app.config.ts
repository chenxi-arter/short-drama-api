import { IsString, IsNumber, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

export enum Environment {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TEST = 'test',
}

/**
 * 应用配置类
 * 统一管理应用级别的配置项
 */
export class AppConfig {
  @IsEnum(Environment)
  @Transform(({ value }) => value || Environment.DEVELOPMENT)
  nodeEnv: Environment = Environment.DEVELOPMENT;

  @IsNumber()
  @Transform(({ value }) => parseInt(value) || 3000)
  port: number = 3000;

  @IsString()
  @Transform(({ value }) => value || 'short-drama-api')
  appName: string = 'short-drama-api';

  @IsString()
  @Transform(({ value }) => value || '1.0.0')
  appVersion: string = '1.0.0';

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value || 'http://localhost:3000')
  appUrl?: string = 'http://localhost:3000';

  @IsOptional()
  @IsString()
  globalPrefix?: string = 'api';

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  enableCors?: boolean = true;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  enableSwagger?: boolean = true;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  enableVersioning?: boolean = true;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value || '1')
  defaultVersion?: string = '1';

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value) || 100)
  throttleTtl?: number = 100;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value) || 1000)
  throttleLimit?: number = 1000;

  @IsOptional()
  @IsString()
  jwtSecret?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value || '1d')
  jwtExpiresIn?: string = '1d';

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value || '7d')
  jwtRefreshExpiresIn?: string = '7d';

  /**
   * 是否为开发环境
   */
  get isDevelopment(): boolean {
    return this.nodeEnv === Environment.DEVELOPMENT;
  }

  /**
   * 是否为生产环境
   */
  get isProduction(): boolean {
    return this.nodeEnv === Environment.PRODUCTION;
  }

  /**
   * 是否为测试环境
   */
  get isTest(): boolean {
    return this.nodeEnv === Environment.TEST;
  }

  /**
   * 获取CORS配置
   */
  getCorsConfig() {
    return {
      origin: this.isDevelopment ? true : [this.appUrl],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true,
    };
  }

  /**
   * 获取限流配置
   */
  getThrottleConfig() {
    return {
      ttl: this.throttleTtl,
      limit: this.throttleLimit,
    };
  }

  /**
   * 获取JWT配置
   */
  getJwtConfig() {
    return {
      secret: this.jwtSecret,
      signOptions: {
        expiresIn: this.jwtExpiresIn,
      },
    };
  }
}