import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from './entity/user.entity';
import { TelegramUserDto, LoginType } from './dto/telegram-user.dto';
import { RegisterDto, RegisterResponseDto } from './dto/register.dto';
import { EmailLoginDto, EmailLoginResponseDto } from './dto/email-login.dto';
import { BindTelegramDto, BindTelegramResponseDto } from './dto/bind-telegram.dto';
import { BindEmailDto } from './dto/bind-email.dto';
import { UpdateNicknameDto, UpdateNicknameResponseDto } from './dto/update-nickname.dto';
import { UpdatePasswordDto, UpdatePasswordResponseDto } from './dto/update-password.dto';
import { verifyTelegramHash } from './telegram.validator';
import { AuthService } from '../auth/auth.service';
import { TelegramAuthService } from '../auth/telegram-auth.service';
import { PasswordUtil } from '../common/utils/password.util';

interface TelegramUserData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

interface TokenResult {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  // 移除 user 字段以保护隐私
  // 前端可以通过 GET /api/user/me 获取用户信息
}

interface TokensOnly {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
    private readonly telegramAuthService: TelegramAuthService,
  ) {}

  async telegramLogin(dto: TelegramUserDto): Promise<TokenResult> {
    // 1. 验证Bot Token配置
    this.validateBotToken();

    // 2. 根据登录方式验证并提取用户数据
    const userData = this.validateAndExtractUserData(dto);

    // 3. 查找或创建用户
    const user = await this.findOrCreateUser(userData);

    // 4. 生成令牌
    const tokens = await this.generateUserTokens(user, dto.deviceInfo);

    // 5. 返回令牌（不包含用户信息以保护隐私）
    return {
      ...tokens,
      // 移除用户信息以保护隐私
      // 前端可以使用 GET /api/user/me 获取用户信息
    };
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
   * 绑定邮箱/密码到当前（可能为 TG-only）账号
   */
  async bindEmail(userId: number, dto: BindEmailDto) {
    // 1) 校验确认密码
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('密码和确认密码不匹配');
    }

    // 2) 校验密码强度
    const validation = PasswordUtil.validatePasswordStrength(dto.password);
    if (!validation.valid) {
      throw new BadRequestException(validation.message);
    }

    // 3) 当前用户存在性
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    // 4) 如果当前用户已经有邮箱，则不允许重复绑定（也可改为合并策略）
    if (user.email) {
      throw new ConflictException('该账号已绑定邮箱');
    }

    // 5) 邮箱是否被其他用户占用
    const occupied = await this.userRepo.findOneBy({ email: dto.email });
    if (occupied) {
      throw new ConflictException('该邮箱已被其他账号使用');
    }

    // 6) 写入邮箱与密码哈希
    const passwordHash = await PasswordUtil.hashPassword(dto.password);
    user.email = dto.email;
    user.password_hash = passwordHash;

    const updated = await this.userRepo.save(user);

    return {
      success: true,
      message: '邮箱绑定成功，现在可以使用邮箱或Telegram登录',
      user: {
        id: updated.id,
        shortId: updated.shortId,
        email: updated.email,
        username: updated.username,
        firstName: updated.first_name,
        lastName: updated.last_name,
        telegramId: updated.telegram_id,
        isActive: updated.is_active,
      },
    };
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

    // 检查auth_date过期时间（防止重放攻击）
    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = currentTime - dto.auth_date;
    
    // 获取过期时间配置（默认7天，可通过环境变量配置）
    const maxAge = parseInt(process.env.TELEGRAM_AUTH_MAX_AGE || '604800'); // 7天 = 604800秒
    
    if (timeDiff > maxAge) {
      throw new UnauthorizedException(`Bot登录数据过期: ${timeDiff}秒前的数据，最大允许${maxAge}秒`);
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
    // 先通过Telegram ID查找用户
    let user = await this.userRepo.findOneBy({ telegram_id: userData.id });
    
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
    // Telegram注册用户的username格式: tg + Telegram用户ID
    const telegramUsername = `tg${userData.id}`;
    
    const user = this.userRepo.create({
      telegram_id: userData.id, // 使用Telegram ID
      first_name: userData.first_name,
      last_name: userData.last_name || '',
      username: userData.username || telegramUsername, // 使用tg+用户ID格式
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
  private generateUserTokens(user: User, deviceInfo?: string): Promise<TokensOnly> {
    return this.authService.generateTokens(
      user,
      deviceInfo || user.username || 'Telegram User',
    );
  }
  // src/user/user.service.ts
  async findUserById(id: number): Promise<User | null> {
    return this.userRepo.findOneBy({ id });
  }

  /**
   * 邮箱注册
   * @param dto 注册信息
   * @returns 注册结果
   */
  async register(dto: RegisterDto): Promise<RegisterResponseDto> {
    // 验证密码确认
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('密码和确认密码不匹配');
    }

    // 验证密码强度
    const passwordValidation = PasswordUtil.validatePasswordStrength(dto.password);
    if (!passwordValidation.valid) {
      throw new BadRequestException(passwordValidation.message);
    }

    // 检查邮箱是否已存在
    const existingUserByEmail = await this.userRepo.findOneBy({ email: dto.email });
    if (existingUserByEmail) {
      throw new ConflictException('该邮箱已被注册');
    }

    // 检查用户名是否已存在（如果提供了用户名）
    if (dto.username) {
      const existingUserByUsername = await this.userRepo.findOneBy({ username: dto.username });
      if (existingUserByUsername) {
        throw new ConflictException('该用户名已被使用');
      }
    }

    // 生成用户ID（使用时间戳 + 随机数）
    const userId = Date.now() + Math.floor(Math.random() * 1000);

    // 生成邮箱注册用户的username格式: e + 随机数
    const randomSuffix = Math.floor(Math.random() * 1000000);
    const emailUsername = `e${randomSuffix}`;

    // 加密密码
    const passwordHash = await PasswordUtil.hashPassword(dto.password);

    // 创建用户
    const user = this.userRepo.create({
      id: userId,
      email: dto.email,
      password_hash: passwordHash,
      username: dto.username || emailUsername, // 邮箱注册用户使用 e+随机数 格式
      first_name: dto.firstName || '', // 如果没有提供名字，使用空字符串
      last_name: dto.lastName || '', // 如果没有提供姓氏，使用空字符串
      is_active: true,
    });

    const savedUser = await this.userRepo.save(user);

    return {
      id: savedUser.id,
      shortId: savedUser.shortId,
      email: savedUser.email,
      username: savedUser.username,
      firstName: savedUser.first_name,
      lastName: savedUser.last_name,
      isActive: savedUser.is_active,
      createdAt: savedUser.created_at,
    };
  }

  /**
   * 邮箱密码登录
   * @param dto 登录信息
   * @returns 登录结果
   */
  async emailLogin(dto: EmailLoginDto): Promise<EmailLoginResponseDto> {
    // 查找用户
    const user = await this.userRepo.findOneBy({ email: dto.email });
    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    // 验证密码
    if (!user.password_hash) {
      throw new UnauthorizedException('该账号不支持密码登录');
    }

    const isPasswordValid = await PasswordUtil.comparePassword(dto.password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    // 检查账号状态
    if (!user.is_active) {
      throw new UnauthorizedException('账号已被禁用');
    }

    // 生成令牌
    const tokens = await this.authService.generateTokens(
      user,
      dto.deviceInfo || 'Email Login',
    );

    return {
      ...tokens,
      // 移除用户信息以保护隐私
      // 前端可以使用 GET /api/user/me 获取用户信息
    };
  }

  /**
   * 绑定Telegram账号到现有邮箱账号
   * @param userId 用户ID
   * @param dto Telegram信息
   * @returns 绑定结果
   */
  async bindTelegram(userId: number, dto: BindTelegramDto): Promise<BindTelegramResponseDto> {
    // 验证Telegram数据
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      throw new BadRequestException('Telegram Bot Token未配置');
    }

    // 创建TelegramUserDto格式的数据进行验证
    const telegramData: TelegramUserDto = {
      loginType: 'bot' as LoginType,
      id: dto.id,
      first_name: dto.first_name,
      last_name: dto.last_name,
      username: dto.username,
      auth_date: dto.auth_date,
      hash: dto.hash,
    };

    const isValid = verifyTelegramHash(botToken, telegramData);
    if (!isValid) {
      throw new UnauthorizedException('Telegram数据验证失败');
    }

    // 查找当前用户
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    // 检查是否已经绑定了Telegram
    if (user.telegram_id) {
      throw new ConflictException('该账号已经绑定了Telegram');
    }

    // 检查Telegram ID是否已被其他用户使用
    const existingTelegramUser = await this.userRepo.findOneBy({ telegram_id: dto.id });
    if (existingTelegramUser) {
      throw new ConflictException('该Telegram账号已被其他用户绑定');
    }

    // 直接绑定Telegram
    user.telegram_id = dto.id;
    user.first_name = dto.first_name;
    user.last_name = dto.last_name || user.last_name;
    user.username = dto.username || user.username;

    const updatedUser = await this.userRepo.save(user);

    return {
      success: true,
      message: 'Telegram账号绑定成功，现在可以使用邮箱或Telegram登录',
      user: {
        id: updatedUser.id,
        shortId: updatedUser.shortId,
        email: updatedUser.email,
        username: updatedUser.username,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        telegramId: updatedUser.telegram_id,
        isActive: updatedUser.is_active,
      },
    };
  }


  /**
   * 根据邮箱查找用户
   * @param email 邮箱地址
   * @returns 用户信息
   */
  async findUserByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOneBy({ email });
  }

  /**
   * 根据Telegram ID查找用户
   * @param telegramId Telegram ID
   * @returns 用户信息
   */
  async findUserByTelegramId(telegramId: number): Promise<User | null> {
    return this.userRepo.findOneBy({ telegram_id: telegramId });
  }

  /**
   * 更新用户昵称
   * @param userId 用户ID
   * @param dto 更新昵称DTO
   * @returns 更新结果
   */
  async updateNickname(userId: number, dto: UpdateNicknameDto): Promise<UpdateNicknameResponseDto> {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    // 昵称可以重复，不需要唯一性检查
    // 直接更新昵称字段
    await this.userRepo.update(userId, { nickname: dto.nickname });

    return {
      success: true,
      message: '昵称修改成功'
    };
  }

  /**
   * 更新用户密码
   * @param userId 用户ID
   * @param dto 更新密码DTO
   * @returns 更新结果
   */
  async updatePassword(userId: number, dto: UpdatePasswordDto): Promise<UpdatePasswordResponseDto> {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    // 检查用户是否有邮箱账号（只有邮箱用户可以修改密码）
    if (!user.email || !user.password_hash) {
      throw new BadRequestException('只有邮箱注册用户可以修改密码');
    }

    // 验证新密码和确认密码是否一致
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('新密码和确认密码不一致');
    }

    // 验证旧密码
    const isOldPasswordValid = await PasswordUtil.comparePassword(dto.oldPassword, user.password_hash);
    if (!isOldPasswordValid) {
      throw new BadRequestException('旧密码错误');
    }

    // 加密新密码
    const newPasswordHash = await PasswordUtil.hashPassword(dto.newPassword);

    // 更新密码
    await this.userRepo.update(userId, { password_hash: newPasswordHash });

    return {
      success: true,
      message: '密码修改成功'
    };
  }
}
