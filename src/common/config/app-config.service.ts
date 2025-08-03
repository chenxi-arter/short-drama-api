import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * 应用配置服务
 * 统一管理所有配置项，提供类型安全的配置访问
 */
@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  // 数据库配置
  get database() {
    return {
      host: this.configService.get<string>('DB_HOST', 'localhost'),
      port: this.configService.get<number>('DB_PORT', 3306),
      username: this.configService.get<string>('DB_USERNAME', 'root'),
      password: this.configService.get<string>('DB_PASSWORD', ''),
      database: this.configService.get<string>('DB_DATABASE', 'short_drama'),
      synchronize: this.configService.get<boolean>('DB_SYNCHRONIZE', false),
      logging: this.configService.get<boolean>('DB_LOGGING', false),
    };
  }

  // Redis配置
  get redis() {
    return {
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
      db: this.configService.get<number>('REDIS_DB', 0),
      ttl: this.configService.get<number>('REDIS_TTL', 300), // 默认5分钟
    };
  }

  // 应用配置
  get app() {
    return {
      port: this.configService.get<number>('PORT', 3000),
      env: this.configService.get<string>('NODE_ENV', 'development'),
      apiPrefix: this.configService.get<string>('API_PREFIX', 'api'),
      corsOrigin: this.configService.get<string>('CORS_ORIGIN', '*'),
      maxFileSize: this.configService.get<number>('MAX_FILE_SIZE', 10 * 1024 * 1024), // 10MB
    };
  }

  // JWT配置
  get jwt() {
    return {
      secret: this.configService.get<string>('JWT_SECRET', 'your-secret-key'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '7d'),
      refreshSecret: this.configService.get<string>('JWT_REFRESH_SECRET', 'your-refresh-secret'),
      refreshExpiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '30d'),
    };
  }

  // 文件上传配置
  get upload() {
    return {
      destination: this.configService.get<string>('UPLOAD_DESTINATION', './uploads'),
      maxSize: this.configService.get<number>('UPLOAD_MAX_SIZE', 10 * 1024 * 1024),
      allowedMimeTypes: this.configService.get<string>('UPLOAD_ALLOWED_TYPES', 'image/jpeg,image/png,image/gif,video/mp4').split(','),
    };
  }

  // 缓存配置
  get cache() {
    return {
      defaultTtl: this.configService.get<number>('CACHE_DEFAULT_TTL', 300), // 5分钟
      homeVideosTtl: this.configService.get<number>('CACHE_HOME_VIDEOS_TTL', 600), // 10分钟
      filterDataTtl: this.configService.get<number>('CACHE_FILTER_DATA_TTL', 300), // 5分钟
      videoDetailsTtl: this.configService.get<number>('CACHE_VIDEO_DETAILS_TTL', 1800), // 30分钟
      categoriesTtl: this.configService.get<number>('CACHE_CATEGORIES_TTL', 3600), // 1小时
      tagsTtl: this.configService.get<number>('CACHE_TAGS_TTL', 3600), // 1小时
    };
  }

  // 分页配置
  get pagination() {
    return {
      defaultLimit: this.configService.get<number>('PAGINATION_DEFAULT_LIMIT', 20),
      maxLimit: this.configService.get<number>('PAGINATION_MAX_LIMIT', 100),
      defaultPage: this.configService.get<number>('PAGINATION_DEFAULT_PAGE', 1),
    };
  }

  // 日志配置
  get logging() {
    return {
      level: this.configService.get<string>('LOG_LEVEL', 'info'),
      enableConsole: this.configService.get<boolean>('LOG_ENABLE_CONSOLE', true),
      enableFile: this.configService.get<boolean>('LOG_ENABLE_FILE', false),
      filePath: this.configService.get<string>('LOG_FILE_PATH', './logs'),
      maxFiles: this.configService.get<number>('LOG_MAX_FILES', 7),
      maxSize: this.configService.get<string>('LOG_MAX_SIZE', '20m'),
    };
  }

  // 安全配置
  get security() {
    return {
      rateLimitTtl: this.configService.get<number>('RATE_LIMIT_TTL', 60), // 1分钟
      rateLimitMax: this.configService.get<number>('RATE_LIMIT_MAX', 100), // 每分钟最多100次请求
      enableHelmet: this.configService.get<boolean>('SECURITY_ENABLE_HELMET', true),
      enableCors: this.configService.get<boolean>('SECURITY_ENABLE_CORS', true),
    };
  }

  // 第三方服务配置
  get thirdParty() {
    return {
      // CDN配置
      cdnUrl: this.configService.get<string>('CDN_URL'),
      cdnAccessKey: this.configService.get<string>('CDN_ACCESS_KEY'),
      cdnSecretKey: this.configService.get<string>('CDN_SECRET_KEY'),
      
      // 邮件服务配置
      emailHost: this.configService.get<string>('EMAIL_HOST'),
      emailPort: this.configService.get<number>('EMAIL_PORT', 587),
      emailUser: this.configService.get<string>('EMAIL_USER'),
      emailPassword: this.configService.get<string>('EMAIL_PASSWORD'),
      
      // 短信服务配置
      smsAccessKey: this.configService.get<string>('SMS_ACCESS_KEY'),
      smsSecretKey: this.configService.get<string>('SMS_SECRET_KEY'),
      smsSignName: this.configService.get<string>('SMS_SIGN_NAME'),
    };
  }

  // 业务配置
  get business() {
    return {
      // 视频相关
      maxVideoSize: this.configService.get<number>('MAX_VIDEO_SIZE', 100 * 1024 * 1024), // 100MB
      supportedVideoFormats: this.configService.get<string>('SUPPORTED_VIDEO_FORMATS', 'mp4,avi,mov').split(','),
      
      // 评论相关
      maxCommentLength: this.configService.get<number>('MAX_COMMENT_LENGTH', 500),
      enableCommentReview: this.configService.get<boolean>('ENABLE_COMMENT_REVIEW', false),
      
      // 用户相关
      maxUsernameLength: this.configService.get<number>('MAX_USERNAME_LENGTH', 20),
      minPasswordLength: this.configService.get<number>('MIN_PASSWORD_LENGTH', 6),
      
      // 系列相关
      maxSeriesEpisodes: this.configService.get<number>('MAX_SERIES_EPISODES', 1000),
      defaultSeriesStatus: this.configService.get<number>('DEFAULT_SERIES_STATUS', 1),
    };
  }

  /**
   * 检查是否为开发环境
   */
  get isDevelopment(): boolean {
    return this.app.env === 'development';
  }

  /**
   * 检查是否为生产环境
   */
  get isProduction(): boolean {
    return this.app.env === 'production';
  }

  /**
   * 检查是否为测试环境
   */
  get isTest(): boolean {
    return this.app.env === 'test';
  }

  /**
   * 获取完整的数据库连接URL
   */
  get databaseUrl(): string {
    const db = this.database;
    return `mysql://${db.username}:${db.password}@${db.host}:${db.port}/${db.database}`;
  }

  /**
   * 获取Redis连接URL
   */
  get redisUrl(): string {
    const redis = this.redis;
    const auth = redis.password ? `:${redis.password}@` : '';
    return `redis://${auth}${redis.host}:${redis.port}/${redis.db}`;
  }
}