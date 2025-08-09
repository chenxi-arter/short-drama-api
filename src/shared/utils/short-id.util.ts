/**
 * 短ID工具类
 * 生成11位的类似base64编码的唯一标识符，用于替换UUID
 */
import * as crypto from 'crypto';

export class ShortIdUtil {
  // 自定义base64字符集（去除容易混淆的字符）
  private static readonly CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  private static readonly CHARSET_LENGTH = ShortIdUtil.CHARSET.length;
  
  /**
   * 生成11位短ID
   * @returns 11位的短ID字符串
   */
  static generate(): string {
    // 生成8字节随机数据
    const randomBytes = crypto.randomBytes(8);
    
    // 将随机字节转换为大整数
    let num = 0n;
    for (let i = 0; i < randomBytes.length; i++) {
      num = (num << 8n) + BigInt(randomBytes[i]);
    }
    
    // 转换为自定义base编码
    let result = '';
    const base = BigInt(ShortIdUtil.CHARSET_LENGTH);
    
    // 确保生成11位字符
    for (let i = 0; i < 11; i++) {
      const remainder = Number(num % base);
      result = ShortIdUtil.CHARSET[remainder] + result;
      num = num / base;
    }
    
    return result;
  }
  
  /**
   * 验证短ID格式
   * @param shortId 要验证的短ID
   * @returns 是否为有效的短ID格式
   */
  static isValid(shortId: string): boolean {
    if (!shortId || shortId.length !== 11) {
      return false;
    }
    
    // 检查是否只包含允许的字符
    for (const char of shortId) {
      if (!ShortIdUtil.CHARSET.includes(char)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * 判断字符串是否为短ID
   * @param str 要判断的字符串
   * @returns 是否为短ID
   */
  static isShortId(str: string): boolean {
    return this.isValid(str);
  }
  
  /**
   * 生成带时间戳前缀的短ID（用于排序）
   * @returns 带时间戳的短ID
   */
  static generateWithTimestamp(): string {
    const timestamp = Date.now();
    const timestampStr = timestamp.toString(36); // 转为36进制
    const randomPart = ShortIdUtil.generate().substring(0, 11 - timestampStr.length);
    return (timestampStr + randomPart).substring(0, 11);
  }
  
  /**
   * 批量生成短ID
   * @param count 生成数量
   * @returns 短ID数组
   */
  static generateBatch(count: number): string[] {
    const ids = new Set<string>();
    
    while (ids.size < count) {
      ids.add(ShortIdUtil.generate());
    }
    
    return Array.from(ids);
  }
  
  /**
   * 检查短ID是否重复（需要传入现有ID列表）
   * @param shortId 要检查的短ID
   * @param existingIds 现有ID列表
   * @returns 是否重复
   */
  static isDuplicate(shortId: string, existingIds: string[]): boolean {
    return existingIds.includes(shortId);
  }
  
  /**
   * 生成唯一的短ID（确保不与现有ID重复）
   * @param existingIds 现有ID列表
   * @param maxAttempts 最大尝试次数
   * @returns 唯一的短ID
   */
  static generateUnique(existingIds: string[], maxAttempts: number = 100): string {
    for (let i = 0; i < maxAttempts; i++) {
      const shortId = ShortIdUtil.generate();
      if (!ShortIdUtil.isDuplicate(shortId, existingIds)) {
        return shortId;
      }
    }
    
    throw new Error('无法生成唯一的短ID，请稍后重试');
  }
}