import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from './entity/user.entity';
import { TelegramUserDto } from './dto/telegram-user.dto';
import { verifyTelegramHash } from './telegram.validator';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
  ) {}

  async telegramLogin(dto: TelegramUserDto) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      throw new Error('缺少 TELEGRAM_BOT_TOKEN，请检查 .env');
    }
    // 1. 验证 Telegram Hash
    const isValid = verifyTelegramHash(botToken, dto);
    if (!isValid) throw new UnauthorizedException('非法登录');

    // 2. 查询或创建用户
    let user = await this.userRepo.findOneBy({ id: dto.id });
    if (!user) {
      user = this.userRepo.create({
        id: dto.id,
        first_name: dto.first_name,
        last_name: dto.last_name || '',
        username: dto.username || '',
      });
      await this.userRepo.save(user);
    }

    // 3. 生成 JWT 和 Refresh Token
    return this.authService.generateTokens(
      user,
      dto.username || 'Telegram User',
    );
  }
  // src/user/user.service.ts
  async findUserById(id: number): Promise<User | null> {
    return this.userRepo.findOneBy({ id });
  }
}
