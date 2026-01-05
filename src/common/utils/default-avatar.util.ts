/**
 * 默认头像工具类
 * 提供随机默认头像URL
 */
export class DefaultAvatarUtil {
  /**
   * 默认头像列表（5个）
   */
  private static readonly DEFAULT_AVATARS = [
    'https://static.656932.com/defaultavatar/1.png',
    'https://static.656932.com/defaultavatar/2.png',
    'https://static.656932.com/defaultavatar/3.png',
    'https://static.656932.com/defaultavatar/4.png',
    'https://static.656932.com/defaultavatar/5.png',
  ];

  /**
   * 获取随机默认头像
   * @returns 随机的默认头像URL
   */
  static getRandomAvatar(): string {
    const randomIndex = Math.floor(Math.random() * this.DEFAULT_AVATARS.length);
    return this.DEFAULT_AVATARS[randomIndex];
  }

  /**
   * 基于用户ID获取固定的默认头像（同一用户每次获取相同的头像）
   * @param userId 用户ID
   * @returns 固定的默认头像URL
   */
  static getAvatarByUserId(userId: number): string {
    const index = userId % this.DEFAULT_AVATARS.length;
    return this.DEFAULT_AVATARS[index];
  }

  /**
   * 基于种子生成头像（用于假评论等需要固定随机的场景）
   * @param seed 种子值
   * @returns 根据种子固定的默认头像URL
   */
  static getAvatarBySeed(seed: number): string {
    const index = Math.abs(seed) % this.DEFAULT_AVATARS.length;
    return this.DEFAULT_AVATARS[index];
  }

  /**
   * 获取所有默认头像列表
   * @returns 默认头像URL数组
   */
  static getAllAvatars(): string[] {
    return [...this.DEFAULT_AVATARS];
  }
}

