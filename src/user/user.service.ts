import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from './entity/user.entity';
import { TelegramUserDto, LoginType } from './dto/telegram-user.dto';
import { verifyTelegramHash } from './telegram.validator';
import { AuthService } from '../auth/auth.service';
import { TelegramAuthService } from '../auth/telegram-auth.service';

interface TelegramUserData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
    private readonly telegramAuthService: TelegramAuthService,
  ) {}

  async telegramLogin(dto: TelegramUserDto) {
    // 1. 验证Bot Token配置
    this.validateBotToken();

    // 2. 根据登录方式验证并提取用户数据
    const userData = this.validateAndExtractUserData(dto);

    // 3. 查找或创建用户
    const user = await this.findOrCreateUser(userData);

    // 4. 生成并返回JWT令牌
    return this.generateUserTokens(user, dto.deviceInfo);
  }

  /**
   * 验证Bot Token配置
   */
  private validateBotToken(): void {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      throw new Error('缺少 TELEGRAM_BOT_TOKEN，请检查 .env');
    }
  }

  /**
   * 根据登录方式验证并提取用户数据
   */
  private validateAndExtractUserData(dto: TelegramUserDto): TelegramUserData {
    switch (dto.loginType) {
      case LoginType.WEBAPP:
        return this.validateWebAppLogin(dto);
      case LoginType.BOT:
        return this.validateBotLogin(dto);
      default:
        throw new UnauthorizedException('无效的登录方式，请指定loginType为webapp或bot');
    }
  }

  /**
   * 验证Web App登录
   */
  private validateWebAppLogin(dto: TelegramUserDto): TelegramUserData {
    console.log('使用Telegram Web App登录方式');
    
    if (!dto.initData) {
      throw new UnauthorizedException('Web App登录需要提供initData');
    }

    const userData = this.telegramAuthService.verifyInitData(dto.initData);
    if (!userData) {
      throw new UnauthorizedException('Telegram Web App数据验证失败');
    }

    return {
      id: userData.id,
      first_name: userData.first_name || '',
      last_name: userData.last_name || '',
      username: userData.username || '',
    };
  }

  /**
   * 验证Bot登录
   */
  private validateBotLogin(dto: TelegramUserDto): TelegramUserData {
    console.log('使用Telegram Bot登录方式');
    
    // 验证必需字段
    if (!dto.id || !dto.first_name || !dto.auth_date || !dto.hash) {
      throw new UnauthorizedException('Bot登录需要提供id、first_name、auth_date和hash字段');
    }

    // 验证hash
    const botToken = process.env.TELEGRAM_BOT_TOKEN!;
    const isValid = verifyTelegramHash(botToken, dto);
    if (!isValid) {
      throw new UnauthorizedException('非法登录');
    }

    // 返回用户数据
    return {
      id: dto.id,
      first_name: dto.first_name,
      last_name: dto.last_name || '',
      username: dto.username || '',
    };
  }

  /**
   * 查找或创建用户
   */
  private async findOrCreateUser(userData: TelegramUserData): Promise<User> {
    let user = await this.userRepo.findOneBy({ id: userData.id });
    
    if (!user) {
      user = await this.createNewUser(userData);
    } else {
      user = await this.updateExistingUser(user, userData);
    }

    return user;
  }

  /**
   * 创建新用户
   */
  private async createNewUser(userData: TelegramUserData): Promise<User> {
    const user = this.userRepo.create({
      id: userData.id,
      first_name: userData.first_name,
      last_name: userData.last_name || '',
      username: userData.username || `user_${userData.id}`,
      is_active: true,
    });
    
    return await this.userRepo.save(user);
  }

  /**
   * 更新现有用户
   */
  private async updateExistingUser(user: User, userData: TelegramUserData): Promise<User> {
    // 更新用户信息
    user.first_name = userData.first_name || user.first_name;
    user.last_name = userData.last_name || user.last_name;
    user.username = userData.username || user.username;
    
    // 如果短ID为空，生成新的短ID
    if (!user.shortId) {
      const { ShortIdUtil } = await import('../shared/utils/short-id.util');
      user.shortId = ShortIdUtil.generate();
    }
    
    return await this.userRepo.save(user);
  }

  /**
   * 生成用户令牌
   */
  private generateUserTokens(user: User, deviceInfo?: string): any {
    return this.authService.generateTokens(
      user,
      deviceInfo || user.username || 'Telegram User',
    );
  }
  // src/user/user.service.ts
  async findUserById(id: number): Promise<User | null> {
    return this.userRepo.findOneBy({ id });
  }
}
