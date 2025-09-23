import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export interface TelegramInitData {
  query_id?: string;
  user: TelegramUser;
  auth_date: number;
  hash: string;
}

@Injectable()
export class TelegramAuthService {
  private readonly logger = new Logger(TelegramAuthService.name);
  private readonly botToken: string;

  constructor(private configService: ConfigService) {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN') || '8303051100:AAETrfsTOPHgjlDv1v06jdRTpzjE-cnX7-w';
    this.botToken = token;
    this.logger.log(`Using Telegram Bot Token: ${token.substring(0, 10)}...`);
  }

  /**
   * 验证Telegram Web App的initData
   * @param initData 来自前端的initData字符串
   * @returns 验证成功返回用户信息，失败返回null
   */
  verifyInitData(initData: string): TelegramUser | null {
    try {
      // 解析query string
      const urlParams = new URLSearchParams(initData);
      const data = Object.fromEntries(urlParams.entries());

      // 提取hash并从数据中删除
      const receivedHash = data.hash;
      delete data.hash;

      if (!receivedHash) {
        this.logger.warn('缺少hash参数');
        return null;
      }

      // 检查auth_date（防止重放攻击）
      const authDate = parseInt(data.auth_date);
      const currentTime = Math.floor(Date.now() / 1000);
      const timeDiff = currentTime - authDate;
      
      // 获取过期时间配置（默认7天，可通过环境变量配置）
      const maxAge = parseInt(process.env.TELEGRAM_AUTH_MAX_AGE || '604800'); // 7天 = 604800秒
      
      if (timeDiff > maxAge) {
        this.logger.warn(`initData过期: ${timeDiff}秒前的数据，最大允许${maxAge}秒`);
        return null;
      }

      // 按字母顺序构建待验证字符串
      const dataCheckArr: string[] = [];
      for (const key of Object.keys(data).sort()) {
        const value = data[key];
        if (typeof value === 'string') {
          dataCheckArr.push(`${key}=${value}`);
        }
      }
      const dataCheckString = dataCheckArr.join('\n');

      // 计算HMAC-SHA256
      const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(this.botToken)
        .digest();
      
      const hmacHash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

      // 验证hash
      if (hmacHash !== receivedHash) {
        this.logger.warn(`initData hash验证失败 - 计算值: ${hmacHash}, 接收值: ${receivedHash}`);
        return null;
      }

      // 解析用户数据
      if (!data.user) {
        this.logger.warn('缺少用户数据');
        return null;
      }

      const userData = JSON.parse(decodeURIComponent(data.user)) as TelegramUser;
      
      this.logger.log(`Telegram用户验证成功: ${userData.id} (${userData.username || userData.first_name})`);
      return userData;

    } catch (error) {
      this.logger.error('验证initData时发生错误:', error);
      return null;
    }
  }

  /**
   * 生成Telegram登录URL（用于调试）
   * @param redirectUrl 重定向URL
   * @returns Telegram登录URL
   */
  generateLoginUrl(redirectUrl: string): string {
    // 这是一个示例实现，实际使用时需要根据Telegram Web App的具体要求调整
    const botUsername = this.configService.get<string>('TELEGRAM_BOT_USERNAME');
    if (!botUsername) {
      throw new Error('TELEGRAM_BOT_USERNAME is not defined');
    }
    
    const params = new URLSearchParams({
      start: 'auth',
      redirect_uri: redirectUrl,
    });

    return `https://t.me/${botUsername}?${params.toString()}`;
  }
}
