import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AppLoggerService } from '../logger/app-logger.service';

/**
 * 错误处理中间件
 * 统一处理未捕获的错误和异常
 */
@Injectable()
export class ErrorHandlingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ErrorHandlingMiddleware.name);

  constructor(private readonly appLogger: AppLoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // 捕获未处理的Promise拒绝
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      this.logger.error('未处理的Promise拒绝', {
        reason: reason?.message || reason,
        stack: reason?.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
    });

    // 捕获未处理的异常
    process.on('uncaughtException', (error: Error) => {
      this.logger.error('未捕获的异常', {
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
    });

    // 设置错误处理
    const originalSend = res.send;
    res.send = function(body: any) {
      // 如果是错误响应，记录日志
      if (res.statusCode >= 400) {
        const errorInfo = {
          statusCode: res.statusCode,
          url: req.url,
          method: req.method,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          body: typeof body === 'string' ? body : JSON.stringify(body),
          timestamp: new Date().toISOString(),
        };

        if (res.statusCode >= 500) {
          this.appLogger.error('服务器错误', JSON.stringify(errorInfo), 'ErrorHandling');
        } else {
          this.appLogger.warn('客户端错误', 'ErrorHandling');
        }
      }

      return originalSend.call(this, body);
    }.bind(res);

    next();
  }
}

/**
 * 请求日志中间件
 * 记录所有HTTP请求的详细信息
 */
@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  constructor(private readonly appLogger: AppLoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const { method, url, ip } = req;
    const userAgent = req.get('User-Agent') || '';

    // 记录请求开始
    this.appLogger.debug(`${method} ${url} - 请求开始`, 'RequestLogging');

    // 监听响应结束
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;

      this.appLogger.logApiRequest(method, url, statusCode, duration, userAgent || '', ip || '');

      // 记录慢请求
      if (duration > 1000) {
        this.appLogger.warn(`慢请求检测: ${method} ${url} - ${duration}ms`, 'Performance');
      }
    });

    next();
  }

  /**
   * 清理敏感数据
   */
  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***';
      }
    }

    return sanitized;
  }
}

/**
 * 安全头中间件
 * 添加安全相关的HTTP头
 */
@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // 防止点击劫持
    res.setHeader('X-Frame-Options', 'DENY');
    
    // 防止MIME类型嗅探
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // 启用XSS保护
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // 强制HTTPS（生产环境）
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    
    // 内容安全策略
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    
    // 隐藏服务器信息
    res.removeHeader('X-Powered-By');
    
    next();
  }
}

/**
 * 速率限制中间件
 * 简单的内存速率限制实现
 */
@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly requests = new Map<string, { count: number; resetTime: number }>();
  private readonly maxRequests = 100; // 每分钟最大请求数
  private readonly windowMs = 60 * 1000; // 1分钟窗口

  constructor(private readonly appLogger: AppLoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const key = req.ip || 'unknown';
    const now = Date.now();
    
    // 清理过期记录
    this.cleanup(now);
    
    const record = this.requests.get(key);
    
    if (!record) {
      // 新IP，创建记录
      this.requests.set(key, {
        count: 1,
        resetTime: now + this.windowMs,
      });
    } else if (now > record.resetTime) {
      // 窗口已过期，重置计数
      record.count = 1;
      record.resetTime = now + this.windowMs;
    } else {
      // 在窗口内，增加计数
      record.count++;
      
      if (record.count > this.maxRequests) {
        // 超过限制
        this.appLogger.logSecurity('速率限制触发', {
          ip: req.ip || 'unknown',
          url: req.url,
          method: req.method,
          count: record.count,
          userAgent: req.get('User-Agent') || 'unknown',
        }, 'medium');
        
        res.status(429).json({
          code: 429,
          message: '请求过于频繁，请稍后再试',
          data: null,
        });
        return;
      }
    }
    
    // 设置响应头
    res.setHeader('X-RateLimit-Limit', this.maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, this.maxRequests - (record?.count || 0)));
    res.setHeader('X-RateLimit-Reset', Math.ceil((record?.resetTime || now) / 1000));
    
    next();
  }

  /**
   * 清理过期的记录
   */
  private cleanup(now: number) {
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}