/**
 * 调试工具类
 * 提供可配置的调试日志输出功能
 */
export class DebugUtil {
  private static readonly isDebugEnabled = process.env.DEBUG_ENABLED === 'true';
  private static readonly debugCacheEnabled = process.env.DEBUG_CACHE === 'true';
  private static readonly debugDatabaseEnabled = process.env.DEBUG_DATABASE === 'true';
  private static readonly debugServiceEnabled = process.env.DEBUG_SERVICE === 'true';

  /**
   * 通用调试日志
   */
  static log(message: string, data?: any): void {
    if (this.isDebugEnabled) {
      const timestamp = new Date().toISOString();
      console.log(`[DEBUG ${timestamp}] ${message}`, data ? data : '');
    }
  }

  /**
   * 缓存相关调试日志
   */
  static cache(message: string, cacheKey?: string): void {
    if (this.isDebugEnabled && this.debugCacheEnabled) {
      const timestamp = new Date().toISOString();
      const keyInfo = cacheKey ? ` | Key: ${cacheKey}` : '';
      console.log(`[CACHE ${timestamp}] ${message}${keyInfo}`);
    }
  }

  /**
   * 数据库相关调试日志
   */
  static database(message: string, query?: string): void {
    if (this.isDebugEnabled && this.debugDatabaseEnabled) {
      const timestamp = new Date().toISOString();
      console.log(`[DB ${timestamp}] ${message}`);
      if (query) {
        console.log(`[DB QUERY] ${query}`);
      }
    }
  }

  /**
   * 服务层调试日志
   */
  static service(serviceName: string, method: string, message: string, data?: any): void {
    if (this.isDebugEnabled && this.debugServiceEnabled) {
      const timestamp = new Date().toISOString();
      console.log(`[SERVICE ${timestamp}] ${serviceName}.${method}: ${message}`, data ? data : '');
    }
  }

  /**
   * 错误调试日志
   */
  static error(message: string, error?: Error): void {
    const timestamp = new Date().toISOString();
    console.error(`[ERROR ${timestamp}] ${message}`);
    if (error) {
      console.error(`[ERROR STACK]`, error.stack);
    }
  }

  /**
   * 性能监控调试日志
   */
  static performance(operation: string, startTime: number): void {
    if (this.isDebugEnabled) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      const timestamp = new Date().toISOString();
      console.log(`[PERF ${timestamp}] ${operation}: ${duration}ms`);
    }
  }

  /**
   * 获取调试配置状态
   */
  static getConfig(): {
    enabled: boolean;
    cache: boolean;
    database: boolean;
    service: boolean;
  } {
    return {
      enabled: this.isDebugEnabled,
      cache: this.debugCacheEnabled,
      database: this.debugDatabaseEnabled,
      service: this.debugServiceEnabled,
    };
  }
}
