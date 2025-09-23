import * as bcrypt from 'bcrypt';

/**
 * 密码加密工具类
 */
export class PasswordUtil {
  private static readonly SALT_ROUNDS = 12;

  /**
   * 加密密码
   * @param password 明文密码
   * @returns 加密后的密码哈希
   */
  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * 验证密码
   * @param password 明文密码
   * @param hashedPassword 加密后的密码哈希
   * @returns 是否匹配
   */
  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  /**
   * 验证密码强度
   * @param password 密码
   * @returns 验证结果
   */
  static validatePasswordStrength(password: string): { valid: boolean; message?: string } {
    if (password.length < 6) {
      return { valid: false, message: '密码长度不能少于6位' };
    }
    
    if (password.length > 20) {
      return { valid: false, message: '密码长度不能超过20位' };
    }

    // 检查是否包含字母和数字
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);

    if (!hasLetter) {
      return { valid: false, message: '密码必须包含至少一个字母' };
    }

    if (!hasNumber) {
      return { valid: false, message: '密码必须包含至少一个数字' };
    }

    return { valid: true };
  }
}

