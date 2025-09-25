import { Body, Controller, Post, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { BindTelegramDto, BindTelegramResponseDto } from './dto/bind-telegram.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthService } from '../auth/auth.service';
import { BindEmailDto } from './dto/bind-email.dto';
import { UpdateNicknameDto, UpdateNicknameResponseDto } from './dto/update-nickname.dto';
import { UpdatePasswordDto, UpdatePasswordResponseDto } from './dto/update-password.dto';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
  };
}

@ApiTags('用户')
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
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getMe(@Req() req: AuthenticatedRequest) {
    const user = await this.userService.findUserById(req.user.userId);
    if (!user) {
      return { message: '用户不存在' };
    }
    // 计算nickname字段的显示逻辑
    const getDisplayNickname = () => {
      // 1. 如果有nickname且不为空，使用nickname
      if (user.nickname && user.nickname.trim()) {
        return user.nickname.trim();
      }
      
      // 2. 如果有姓名，使用first_name + last_name组合
      const firstName = user.first_name?.trim() || '';
      const lastName = user.last_name?.trim() || '';
      const fullName = [firstName, lastName].filter(Boolean).join(' ');
      if (fullName) {
        return fullName;
      }
      
      // 3. 最后使用username
      return user.username || '';
    };

    return {
      // 只返回前端展示必需的信息，保护用户隐私
      email: user.email || null,           // 邮箱地址，用于显示绑定状态
      username: user.username,             // 用户名，用于显示
      nickname: getDisplayNickname(),      // 计算后的显示昵称（优先级：nickname > 姓名 > username）
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
  @ApiBearerAuth()
  @ApiOperation({ summary: '绑定Telegram账号' })
  @ApiResponse({ status: 200, description: '绑定成功', type: BindTelegramResponseDto })
  async bindTelegram(@Body() dto: BindTelegramDto, @Req() req: AuthenticatedRequest): Promise<BindTelegramResponseDto> {
    return this.userService.bindTelegram(req.user.userId, dto);
  }

  /**
   * 绑定邮箱/密码到当前登录的（可能TG-only）账号
   */
  @UseGuards(JwtAuthGuard)
  @Post('bind-email')
  @ApiBearerAuth()
  @ApiOperation({ summary: '绑定邮箱' })
  @ApiResponse({ status: 200, description: '绑定成功' })
  async bindEmail(@Body() dto: BindEmailDto, @Req() req: AuthenticatedRequest) {
    return this.userService.bindEmail(req.user.userId, dto);
  }

  /**
   * 更新用户昵称
   */
  @UseGuards(JwtAuthGuard)
  @Post('update-nickname')
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新昵称' })
  @ApiResponse({ status: 200, description: '昵称更新成功', type: UpdateNicknameResponseDto })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 409, description: '昵称已被使用' })
  async updateNickname(@Body() dto: UpdateNicknameDto, @Req() req: AuthenticatedRequest): Promise<UpdateNicknameResponseDto> {
    return await this.userService.updateNickname(req.user.userId, dto);
  }

  /**
   * 更新用户密码
   */
  @UseGuards(JwtAuthGuard)
  @Post('update-password')
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新密码' })
  @ApiResponse({ status: 200, description: '密码更新成功', type: UpdatePasswordResponseDto })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  async updatePassword(@Body() dto: UpdatePasswordDto, @Req() req: AuthenticatedRequest): Promise<UpdatePasswordResponseDto> {
    return await this.userService.updatePassword(req.user.userId, dto);
  }
}
