/**
 * 访问密钥工具类
 * 用于生成和验证防枚举攻击的访问密钥
 */
import { randomBytes, createHmac } from 'crypto';
import { assertStrongSecret } from './security-env.util';

export class AccessKeyUtil {
  /**
   * 取 APP_SECRET 作为 HMAC 密钥
   *
   * 安全审计 XG-03：原实现是 sha256(`${key}_${APP_SECRET || 'default_secret'}`)，
   * 一是缺省值 'default_secret' 公开可推断，二是普通拼接哈希可离线批量枚举。
   * 现改为 HMAC-SHA256，且 APP_SECRET 缺失/过弱直接报错（启动阶段已 fail-fast）。
   */
  private static getSecret(): string {
    return assertStrongSecret('APP_SECRET');
  }
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
    return createHmac('sha256', this.getSecret())
      .update(`${id}_${saltValue}`)
      .digest('hex')
      .substring(0, 32);
  }

  /**
   * 基于稳定字符串生成确定性的访问密钥（推荐用于外部ID）
   */
  static generateFromString(key: string, length: number = 32): string {
    const hash = createHmac('sha256', this.getSecret()).update(key).digest('hex');
    return hash.substring(0, length);
  }

  /**
   * 验证访问密钥格式
   * @param key 待验证的访问密钥
   * @returns 是否为有效格式
   */
  static isValidAccessKey(key: string): boolean {
    // 检查是否为有效的访问密钥格式：
    // 1. 32位或64位十六进制字符串
    // 2. 或者32位包含字母数字的字符串（支持现有格式）
    if (!key || typeof key !== 'string') {
      return false;
    }
    
    // 支持32位或64位十六进制
    const hexPattern = /^[a-f0-9]{32}$|^[a-f0-9]{64}$/i;
    // 支持32位字母数字组合（现有格式）
    const alphanumericPattern = /^[a-zA-Z0-9]{32}$/;
    
    return hexPattern.test(key) || alphanumericPattern.test(key);
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