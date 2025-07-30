import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

/**
 * 限流配置接口
 */
export interface RateLimitConfig {
  windowMs: number;  // 时间窗口（毫秒）
  maxRequests: number;  // 最大请求数
  message?: string;  // 自定义错误消息
  skipSuccessfulRequests?: boolean;  // 是否跳过成功请求
  skipFailedRequests?: boolean;  // 是否跳过失败请求
}

/**
 * 限流元数据键
 */
export const RATE_LIMIT_KEY = 'rate-limit-config';

/**
 * 限流装饰器
 */
export const RateLimit = (config: RateLimitConfig) => SetMetadata(RATE_LIMIT_KEY, config);

/**
 * 请求限流守卫
 * 基于内存的简单限流实现，生产环境建议使用Redis
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);
  private readonly requestCounts = new Map<string, { count: number; resetTime: number }>();
  
  // 默认配置
  private readonly defaultConfig: RateLimitConfig = {
    windowMs: 60 * 1000, // 1分钟
    maxRequests: 100,    // 100次请求
    message: '请求过于频繁，请稍后再试',
  };

  constructor(private reflector: Reflector) {
    // 定期清理过期的计数器
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    
    // 获取限流配置
    const config = this.getRateLimitConfig(context) || this.defaultConfig;
    
    // 生成唯一键（IP + 路径）
    const key = this.generateKey(request);
    
    // 检查限流
    const allowed = this.checkRateLimit(key, config);
    
    if (!allowed) {
      this.logger.warn(`Rate limit exceeded for ${request.ip} on ${request.path}`);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: config.message || this.defaultConfig.message,
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  /**
   * 获取限流配置
   */
  private getRateLimitConfig(context: ExecutionContext): RateLimitConfig | null {
    // 先尝试获取方法级别的配置
    const methodConfig = this.reflector.get<RateLimitConfig>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );
    
    if (methodConfig) {
      return methodConfig;
    }

    // 再尝试获取类级别的配置
    const classConfig = this.reflector.get<RateLimitConfig>(
      RATE_LIMIT_KEY,
      context.getClass(),
    );
    
    return classConfig;
  }

  /**
   * 生成限流键
   */
  private generateKey(request: Request): string {
    const ip = this.getClientIp(request);
    const path = request.route?.path || request.path;
    return `${ip}:${path}`;
  }

  /**
   * 获取客户端IP
   */
  private getClientIp(request: Request): string {
    return (
      request.headers['x-forwarded-for'] as string ||
      request.headers['x-real-ip'] as string ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      request.ip ||
      'unknown'
    ).split(',')[0].trim();
  }

  /**
   * 检查限流
   */
  private checkRateLimit(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    let requestInfo = this.requestCounts.get(key);
    
    // 如果没有记录或者已过期，创建新记录
    if (!requestInfo || requestInfo.resetTime <= now) {
      requestInfo = {
        count: 1,
        resetTime: now + config.windowMs,
      };
      this.requestCounts.set(key, requestInfo);
      return true;
    }
    
    // 检查是否超过限制
    if (requestInfo.count >= config.maxRequests) {
      return false;
    }
    
    // 增加计数
    requestInfo.count++;
    return true;
  }

  /**
   * 清理过期的计数器
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, info] of this.requestCounts.entries()) {
      if (info.resetTime <= now) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.requestCounts.delete(key));
    
    if (keysToDelete.length > 0) {
      this.logger.debug(`Cleaned up ${keysToDelete.length} expired rate limit entries`);
    }
  }

  /**
   * 获取当前限流状态（用于调试）
   */
  getRateLimitStatus(request: Request): { count: number; resetTime: number } | null {
    const key = this.generateKey(request);
    return this.requestCounts.get(key) || null;
  }
}

/**
 * 预定义的限流配置
 */
export const RateLimitConfigs = {
  // 严格限流：每分钟10次
  STRICT: {
    windowMs: 60 * 1000,
    maxRequests: 10,
    message: '请求过于频繁，请稍后再试',
  },
  
  // 普通限流：每分钟100次
  NORMAL: {
    windowMs: 60 * 1000,
    maxRequests: 100,
    message: '请求过于频繁，请稍后再试',
  },
  
  // 宽松限流：每分钟500次
  LOOSE: {
    windowMs: 60 * 1000,
    maxRequests: 500,
    message: '请求过于频繁，请稍后再试',
  },
  
  // 登录限流：每15分钟5次
  LOGIN: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    message: '登录尝试过于频繁，请15分钟后再试',
  },
  
  // 评论限流：每分钟3次
  COMMENT: {
    windowMs: 60 * 1000,
    maxRequests: 3,
    message: '评论发表过于频繁，请稍后再试',
  },
};