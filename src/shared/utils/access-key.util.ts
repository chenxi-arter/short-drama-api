/**
 * 访问密钥工具类
 * 用于生成和验证防枚举攻击的访问密钥
 */
import { randomBytes, createHash } from 'crypto';

export class AccessKeyUtil {
  /**
   * 生成随机访问密钥
   * @param length 密钥长度，默认32字符
   * @returns 随机生成的访问密钥
   */
  static generateAccessKey(length: number = 32): string {
    return randomBytes(length / 2).toString('hex');
  }

  /**
   * 基于ID和时间戳生成确定性访问密钥
   * @param id 实体ID
   * @param salt 盐值，默认使用当前时间戳
   * @returns 基于ID生成的访问密钥
   */
  static generateDeterministicKey(id: number, salt?: string): string {
    const saltValue = salt || Date.now().toString();
    const data = `${id}_${saltValue}_${process.env.APP_SECRET || 'default_secret'}`;
    return createHash('sha256').update(data).digest('hex').substring(0, 32);
  }

  /**
   * 验证访问密钥格式
   * @param key 待验证的访问密钥
   * @returns 是否为有效格式
   */
  static isValidAccessKey(key: string): boolean {
    // 检查是否为32位十六进制字符串
    return /^[a-f0-9]{32}$/i.test(key);
  }

  /**
   * 生成UUID格式的访问密钥（去除连字符）
   * @returns UUID格式的访问密钥
   */
  static generateUuidKey(): string {
    // 生成类似UUID的格式但去除连字符
    const hex = randomBytes(16).toString('hex');
    return [
      hex.substring(0, 8),
      hex.substring(8, 12),
      hex.substring(12, 16),
      hex.substring(16, 20),
      hex.substring(20, 32)
    ].join('');
  }

  /**
   * 批量生成访问密钥
   * @param count 生成数量
   * @param length 密钥长度
   * @returns 访问密钥数组
   */
  static generateBatch(count: number, length: number = 32): string[] {
    const keys: string[] = [];
    const keySet = new Set<string>();
    
    while (keys.length < count) {
      const key = this.generateAccessKey(length);
      if (!keySet.has(key)) {
        keySet.add(key);
        keys.push(key);
      }
    }
    
    return keys;
  }
}