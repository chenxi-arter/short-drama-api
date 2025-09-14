/**
 * 日期时间工具类
 * 统一处理时区转换和格式化
 */
export class DateUtil {
  private static timezone: string = process?.env?.APP_TIMEZONE || 'Asia/Shanghai';

  /**
   * 设置全局时区（如 'Asia/Shanghai', 'UTC'）
   */
  static setTimezone(timezone: string) {
    if (timezone && typeof timezone === 'string') {
      this.timezone = timezone;
    }
  }

  /** 获取当前配置的时区 */
  static getTimezone(): string {
    return this.timezone;
  }
  /**
   * 将日期格式化为用户友好的格式（北京时间）
   * @param date 日期对象或字符串
   * @returns 格式化后的日期字符串，如 "2024-01-15 16:30"
   */
  static formatDateTime(date: Date | string): string {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';
    
    // 使用 toLocaleString 方法，指定北京时区
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: this.timezone
    };
    
    const formatted = dateObj.toLocaleString('zh-CN', options);
    // 将格式从 "2024/01/15 16:30" 转换为 "2024-01-15 16:30"
    return formatted.replace(/\//g, '-');
  }

  /**
   * 将日期格式化为用户友好的格式（仅日期）
   * @param date 日期对象或字符串
   * @returns 格式化后的日期字符串，如 "2024-01-15"
   */
  static formatDate(date: Date | string): string {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: this.timezone
    };
    
    const formatted = dateObj.toLocaleDateString('zh-CN', options);
    return formatted.replace(/\//g, '-');
  }

  /**
   * 获取当前北京时间
   * @returns 北京时间的 Date 对象
   */
  static now(): Date {
    return new Date();
  }

  /**
   * 将UTC时间转换为北京时间
   * @param utcDate UTC时间
   * @returns 北京时间字符串
   */
  static utcToBeijing(utcDate: Date | string): string {
    return this.formatDateTime(utcDate);
  }
}
