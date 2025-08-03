import { Injectable, LoggerService, LogLevel } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';

/**
 * 应用日志服务
 * 提供统一的日志记录功能，支持不同级别的日志输出
 */
@Injectable()
export class AppLoggerService implements LoggerService {
  private context = 'Application';

  constructor(private readonly configService: AppConfigService) {}

  /**
   * 设置日志上下文
   */
  setContext(context: string) {
    this.context = context;
  }

  /**
   * 记录普通日志
   */
  log(message: any, context?: string) {
    this.writeLog('log', message, context);
  }

  /**
   * 记录错误日志
   */
  error(message: any, trace?: string, context?: string) {
    this.writeLog('error', message, context, trace);
  }

  /**
   * 记录警告日志
   */
  warn(message: any, context?: string) {
    this.writeLog('warn', message, context);
  }

  /**
   * 记录调试日志
   */
  debug(message: any, context?: string) {
    if (this.configService.isDevelopment) {
      this.writeLog('debug', message, context);
    }
  }

  /**
   * 记录详细日志
   */
  verbose(message: any, context?: string) {
    if (this.configService.isDevelopment) {
      this.writeLog('verbose', message, context);
    }
  }

  /**
   * 记录数据库操作日志
   */
  logDatabaseOperation(operation: string, table: string, data?: any, duration?: number) {
    const message = {
      operation,
      table,
      data: this.sanitizeData(data),
      duration: duration ? `${duration}ms` : undefined,
      timestamp: new Date().toISOString(),
    };
    this.log(`Database ${operation}: ${table}`, 'Database');
    if (this.configService.isDevelopment && data) {
      this.debug(message, 'Database');
    }
  }

  /**
   * 记录缓存操作日志
   */
  logCacheOperation(operation: 'GET' | 'SET' | 'DEL', key: string, hit?: boolean, ttl?: number) {
    const message = {
      operation,
      key,
      hit,
      ttl,
      timestamp: new Date().toISOString(),
    };
    this.debug(`Cache ${operation}: ${key} ${hit !== undefined ? (hit ? '(HIT)' : '(MISS)') : ''}`, 'Cache');
  }

  /**
   * 记录API请求日志
   */
  logApiRequest(method: string, url: string, statusCode: number, duration: number, userAgent?: string, ip?: string) {
    const message = {
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
      userAgent,
      ip,
      timestamp: new Date().toISOString(),
    };
    
    const logMessage = `${method} ${url} ${statusCode} - ${duration}ms`;
    
    if (statusCode >= 500) {
      this.error(logMessage, undefined, 'HTTP');
    } else if (statusCode >= 400) {
      this.warn(logMessage, 'HTTP');
    } else {
      this.log(logMessage, 'HTTP');
    }
    
    if (this.configService.isDevelopment) {
      this.debug(message, 'HTTP');
    }
  }

  /**
   * 记录业务操作日志
   */
  logBusinessOperation(operation: string, entity: string, entityId?: number | string, userId?: number, details?: any) {
    const message = {
      operation,
      entity,
      entityId,
      userId,
      details: this.sanitizeData(details),
      timestamp: new Date().toISOString(),
    };
    
    this.log(`Business: ${operation} ${entity}${entityId ? ` (ID: ${entityId})` : ''}${userId ? ` by User ${userId}` : ''}`, 'Business');
    
    if (this.configService.isDevelopment && details) {
      this.debug(message, 'Business');
    }
  }

  /**
   * 记录性能日志
   */
  logPerformance(operation: string, duration: number, metadata?: any) {
    const message = {
      operation,
      duration: `${duration}ms`,
      metadata,
      timestamp: new Date().toISOString(),
    };
    
    if (duration > 1000) {
      this.warn(`Slow operation: ${operation} took ${duration}ms`, 'Performance');
    } else {
      this.debug(`Performance: ${operation} took ${duration}ms`, 'Performance');
    }
    
    if (this.configService.isDevelopment && metadata) {
      this.debug(message, 'Performance');
    }
  }

  /**
   * 记录安全相关日志
   */
  logSecurity(event: string, details: any, severity: 'low' | 'medium' | 'high' = 'medium') {
    const message = {
      event,
      severity,
      details: this.sanitizeData(details),
      timestamp: new Date().toISOString(),
    };
    
    const logMessage = `Security Event: ${event} (${severity.toUpperCase()})`;
    
    switch (severity) {
      case 'high':
        this.error(logMessage, undefined, 'Security');
        break;
      case 'medium':
        this.warn(logMessage, 'Security');
        break;
      default:
        this.log(logMessage, 'Security');
    }
    
    this.debug(message, 'Security');
  }

  /**
   * 写入日志
   */
  private writeLog(level: LogLevel, message: any, context?: string, trace?: string) {
    const timestamp = new Date().toISOString();
    const ctx = context || this.context;
    const logLevel = level.toUpperCase().padEnd(7);
    
    let formattedMessage: string;
    
    if (typeof message === 'object') {
      formattedMessage = JSON.stringify(message, null, 2);
    } else {
      formattedMessage = String(message);
    }
    
    const logEntry = `[${timestamp}] [${logLevel}] [${ctx}] ${formattedMessage}`;
    
    // 控制台输出
    if (this.configService.logging.enableConsole) {
      switch (level) {
        case 'error':
          console.error(logEntry);
          if (trace) {
            console.error(trace);
          }
          break;
        case 'warn':
          console.warn(logEntry);
          break;
        case 'debug':
        case 'verbose':
          if (this.configService.isDevelopment) {
            console.debug(logEntry);
          }
          break;
        default:
          console.log(logEntry);
      }
    }
    
    // 文件输出（如果启用）
    if (this.configService.logging.enableFile) {
      // 这里可以实现文件日志写入逻辑
      // 例如使用 winston 或其他日志库
    }
  }

  /**
   * 清理敏感数据
   */
  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }
    
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    const sanitized = { ...data };
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***';
      }
    }
    
    return sanitized;
  }

  /**
   * 创建子日志器
   */
  createChildLogger(context: string): AppLoggerService {
    const childLogger = new AppLoggerService(this.configService);
    childLogger.setContext(context);
    return childLogger;
  }
}