import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * 请求日志中间件
 * 记录所有HTTP请求的详细信息和性能数据
 */
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip, headers } = req;
    const userAgent = headers['user-agent'] || '';
    const contentLength = headers['content-length'] || '0';
    const referer = headers['referer'] || '';
    
    // 记录请求开始时间
    const startTime = Date.now();
    const startHrTime = process.hrtime.bigint();
    
    // 获取客户端IP
    const clientIp = this.getClientIp(req);
    
    // 记录请求开始
    this.logger.log(
      `→ ${method} ${originalUrl} - ${clientIp} - ${userAgent} - Content-Length: ${contentLength}`
    );

    // 监听响应完成事件
    res.on('finish', () => {
      const { statusCode } = res;
      const endTime = Date.now();
      const duration = endTime - startTime;
      const hrDuration = Number(process.hrtime.bigint() - startHrTime) / 1000000; // 转换为毫秒
      
      // 获取响应大小
      const responseSize = res.get('content-length') || '0';
      
      // 构建日志消息
      const logMessage = [
        `← ${method} ${originalUrl}`,
        `${statusCode}`,
        `${duration}ms`,
        `${clientIp}`,
        `${responseSize}B`,
        referer ? `Referer: ${referer}` : '',
      ].filter(Boolean).join(' - ');
      
      // 根据状态码和响应时间选择日志级别
      if (statusCode >= 500) {
        this.logger.error(logMessage);
      } else if (statusCode >= 400) {
        this.logger.warn(logMessage);
      } else if (duration > 1000) {
        // 慢请求警告
        this.logger.warn(`SLOW REQUEST: ${logMessage}`);
      } else {
        this.logger.log(logMessage);
      }
      
      // 记录详细性能信息（仅在开发环境或调试模式下）
      if (process.env.NODE_ENV === 'development' || process.env.LOG_LEVEL === 'debug') {
        this.logPerformanceDetails(req, res, duration, hrDuration);
      }
    });

    // 监听响应错误事件
    res.on('error', (error) => {
      const duration = Date.now() - startTime;
      this.logger.error(
        `✗ ${method} ${originalUrl} - ${clientIp} - ERROR after ${duration}ms: ${error.message}`,
        error.stack
      );
    });

    next();
  }

  /**
   * 获取客户端真实IP地址
   */
  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'] as string;
    const realIp = req.headers['x-real-ip'] as string;
    const remoteAddress = req.connection?.remoteAddress || req.socket?.remoteAddress;
    
    if (forwarded) {
      // X-Forwarded-For 可能包含多个IP，取第一个
      return forwarded.split(',')[0].trim();
    }
    
    if (realIp) {
      return realIp;
    }
    
    if (remoteAddress) {
      // 移除IPv6的前缀
      return remoteAddress.replace(/^::ffff:/, '');
    }
    
    return req.ip || 'unknown';
  }

  /**
   * 记录详细的性能信息
   */
  private logPerformanceDetails(
    req: Request,
    res: Response,
    duration: number,
    hrDuration: number
  ) {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    const performanceInfo = {
      request: {
        method: req.method,
        url: req.originalUrl,
        headers: this.sanitizeHeaders(req.headers),
        query: req.query,
        params: req.params,
      },
      response: {
        statusCode: res.statusCode,
        headers: this.sanitizeHeaders(res.getHeaders()),
      },
      performance: {
        duration: `${duration}ms`,
        hrDuration: `${hrDuration.toFixed(3)}ms`,
        memory: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
          external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
        },
        cpu: {
          user: `${cpuUsage.user}μs`,
          system: `${cpuUsage.system}μs`,
        },
      },
    };
    
    this.logger.debug(`Performance Details: ${JSON.stringify(performanceInfo, null, 2)}`);
  }

  /**
   * 清理敏感的请求头信息
   */
  private sanitizeHeaders(headers: any): any {
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'x-api-key',
      'x-auth-token',
      'x-access-token',
    ];
    
    const sanitized = { ...headers };
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }
}

/**
 * 性能监控中间件
 * 专门用于监控慢请求和资源使用情况
 */
@Injectable()
export class PerformanceMiddleware implements NestMiddleware {
  private readonly logger = new Logger('Performance');
  private readonly slowRequestThreshold = 1000; // 1秒
  private readonly memoryWarningThreshold = 500 * 1024 * 1024; // 500MB

  use(req: Request, res: Response, next: NextFunction) {
    const start = process.hrtime.bigint();
    const initialMemory = process.memoryUsage();

    res.on('finish', () => {
      const duration = Number(process.hrtime.bigint() - start) / 1000000; // ms
      const finalMemory = process.memoryUsage();
      const memoryDiff = finalMemory.heapUsed - initialMemory.heapUsed;

      // 检查慢请求
      if (duration > this.slowRequestThreshold) {
        this.logger.warn(
          `Slow request detected: ${req.method} ${req.originalUrl} - ${duration.toFixed(2)}ms`
        );
      }

      // 检查内存使用
      if (finalMemory.heapUsed > this.memoryWarningThreshold) {
        this.logger.warn(
          `High memory usage: ${Math.round(finalMemory.heapUsed / 1024 / 1024)}MB after ${req.method} ${req.originalUrl}`
        );
      }

      // 检查内存泄漏迹象
      if (memoryDiff > 10 * 1024 * 1024) { // 10MB增长
        this.logger.warn(
          `Potential memory leak: ${Math.round(memoryDiff / 1024 / 1024)}MB increase after ${req.method} ${req.originalUrl}`
        );
      }
    });

    next();
  }
}

/**
 * 安全日志中间件
 * 记录可疑的安全相关活动
 */
@Injectable()
export class SecurityLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('Security');
  private readonly suspiciousPatterns = [
    /\.\.\//, // 路径遍历
    /<script/i, // XSS尝试
    /union.*select/i, // SQL注入
    /javascript:/i, // JavaScript协议
    /data:.*base64/i, // Base64数据URI
  ];

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip, headers, body, query } = req;
    const userAgent = headers['user-agent'] || '';
    const clientIp = this.getClientIp(req);

    // 检查可疑模式
    const suspiciousActivity = this.detectSuspiciousActivity(req);
    
    if (suspiciousActivity.length > 0) {
      this.logger.warn(
        `Suspicious activity detected from ${clientIp}: ${method} ${originalUrl} - ${suspiciousActivity.join(', ')}`
      );
    }

    // 记录失败的认证尝试
    res.on('finish', () => {
      if (res.statusCode === 401 || res.statusCode === 403) {
        this.logger.warn(
          `Authentication/Authorization failure: ${method} ${originalUrl} - ${clientIp} - ${userAgent}`
        );
      }
    });

    next();
  }

  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'] as string;
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || 'unknown';
  }

  private detectSuspiciousActivity(req: Request): string[] {
    const suspicious: string[] = [];
    const { originalUrl, body, query, headers } = req;

    // 检查URL
    this.suspiciousPatterns.forEach(pattern => {
      if (pattern.test(originalUrl)) {
        suspicious.push(`Suspicious URL pattern: ${pattern}`);
      }
    });

    // 检查查询参数
    const queryString = JSON.stringify(query);
    this.suspiciousPatterns.forEach(pattern => {
      if (pattern.test(queryString)) {
        suspicious.push(`Suspicious query parameter: ${pattern}`);
      }
    });

    // 检查请求体
    if (body) {
      const bodyString = JSON.stringify(body);
      this.suspiciousPatterns.forEach(pattern => {
        if (pattern.test(bodyString)) {
          suspicious.push(`Suspicious request body: ${pattern}`);
        }
      });
    }

    // 检查User-Agent
    const userAgent = headers['user-agent'] || '';
    if (!userAgent || userAgent.length < 10) {
      suspicious.push('Missing or suspicious User-Agent');
    }

    return suspicious;
  }
}