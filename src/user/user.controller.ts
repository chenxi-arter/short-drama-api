import { Body, Controller, Post, Get, UseGuards, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { BindTelegramDto, BindTelegramResponseDto } from './dto/bind-telegram.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthService } from '../auth/auth.service';
import { BindEmailDto } from './dto/bind-email.dto';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
  };
}

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  // Telegram 登录已统一到 /auth/telegram/login
  // src/user/user.controller.ts
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: AuthenticatedRequest) {
    const user = await this.userService.findUserById(req.user.userId);
    if (!user) {
      return { message: '用户不存在' };
    }
    return {
      // 只返回前端展示必需的信息，保护用户隐私
      email: user.email || null,           // 邮箱地址，用于显示绑定状态
      username: user.username,             // 用户名，用于显示
      firstName: user.first_name,          // 名字，用于显示
      lastName: user.last_name,            // 姓氏，用于显示
      hasTelegram: !!user.telegram_id,     // 是否绑定了Telegram（布尔值，不暴露具体ID）
      isActive: user.is_active,            // 账号状态
      createdAt: user.created_at,          // 注册时间
    };
  }

  // 令牌管理已统一到 /auth 下

  /**
   * 用户注册
   * @param dto 注册信息
   * @returns 注册结果
   */
  // 注册入口已统一到 /auth/register

  /**
   * 邮箱密码登录
   * @param dto 登录信息
   * @returns 登录结果
   */
  // 邮箱登录入口已统一到 /auth/email-login

  /**
   * 绑定Telegram账号
   * 需要用户认证
   * @param dto Telegram信息
   * @param req 请求对象，包含用户信息
   * @returns 绑定结果
   */
  @UseGuards(JwtAuthGuard)
  @Post('bind-telegram')
  async bindTelegram(@Body() dto: BindTelegramDto, @Req() req: AuthenticatedRequest): Promise<BindTelegramResponseDto> {
    return this.userService.bindTelegram(req.user.userId, dto);
  }

  /**
   * 绑定邮箱/密码到当前登录的（可能TG-only）账号
   */
  @UseGuards(JwtAuthGuard)
  @Post('bind-email')
  async bindEmail(@Body() dto: BindEmailDto, @Req() req: AuthenticatedRequest) {
    return this.userService.bindEmail(req.user.userId, dto);
  }
}
