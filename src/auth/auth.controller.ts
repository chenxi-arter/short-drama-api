import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  UnauthorizedException,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Ip,
  Delete,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { TelegramLoginDto, TelegramLoginResponseDto } from './dto/telegram-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { EmailLoginDto } from '../user/dto/email-login.dto';
import { RegisterDto, RegisterResponseDto } from '../user/dto/register.dto';
import { BotLoginDto } from './dto/bot-login.dto';
import { GuestLoginDto, GuestLoginResponseDto } from './dto/guest-login.dto';
import { UserService } from '../user/user.service';
import { LoginType, TelegramUserDto } from '../user/dto/telegram-user.dto';
import { GuestService } from './guest.service';
import { ConvertGuestToEmailDto, ConvertGuestResponseDto } from '../user/dto/convert-guest.dto';
import { Query } from '@nestjs/common';

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly guestService: GuestService,
  ) {}

  @Post('guest-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '游客登录',
    description: '自动创建游客账号，用于匿名用户访问。首次访问会创建新游客，后续可通过guestToken识别'
  })
  @ApiResponse({
    status: 200,
    description: '登录成功',
    type: GuestLoginResponseDto
  })
  async guestLogin(
    @Body() dto: GuestLoginDto,
  ): Promise<GuestLoginResponseDto> {
    return this.guestService.guestLogin(dto.guestToken, dto.deviceInfo);
  }

  @Post('telegram/webapp-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Telegram Web App登录',
    description: '使用Telegram Web App的initData进行用户认证和登录'
  })
  @ApiResponse({
    status: 200,
    description: '登录成功',
    type: TelegramLoginResponseDto
  })
  @ApiResponse({
    status: 401,
    description: 'Telegram数据验证失败'
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误'
  })
  async telegramLogin(
    @Body() loginDto: TelegramLoginDto,
  ): Promise<TelegramLoginResponseDto> {
    const telegramUserDto: TelegramUserDto = {
      loginType: LoginType.WEBAPP,
      initData: loginDto.initData,
      deviceInfo: loginDto.deviceInfo,
      guestToken: loginDto.guestToken,
    };

    return this.userService.telegramLogin(telegramUserDto);
  }

  @Post('telegram/bot-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Telegram Bot 登录', description: '使用 id/auth_date/hash 进行登录' })
  @ApiResponse({ status: 200, description: '登录成功', type: TelegramLoginResponseDto })
  async telegramBotLogin(
    @Body() dto: BotLoginDto,
  ): Promise<TelegramLoginResponseDto> {
    const loginDto: TelegramUserDto = {
      loginType: LoginType.BOT,
      id: dto.id,
      first_name: dto.first_name,
      last_name: dto.last_name,
      username: dto.username,
      auth_date: dto.auth_date,
      hash: dto.hash,
      deviceInfo: dto.deviceInfo,
      guestToken: dto.guestToken,
    };

    // 复用 UserService 登录逻辑，返回令牌 + 用户信息
    return this.userService.telegramLogin(loginDto);
  }

  @Post('email-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '邮箱密码登录' })
  async emailLogin(@Body() dto: EmailLoginDto) {
    return this.userService.emailLogin(dto);
  }

  @Post('register')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '邮箱注册' })
  async register(@Body() dto: RegisterDto): Promise<RegisterResponseDto> {
    return this.userService.register(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '刷新访问令牌',
    description: '使用refresh token获取新的access token'
  })
  @ApiResponse({
    status: 200,
    description: '刷新成功',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string' },
        token_type: { type: 'string' },
        expires_in: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'refresh token无效或已过期'
  })
  async refreshToken(
    @Body() refreshDto: RefreshTokenDto,
    @Ip() ip: string,
  ) {
    if (!refreshDto.refresh_token) {
      throw new BadRequestException('refresh_token不能为空');
    }

    return this.authService.refreshAccessToken(refreshDto.refresh_token, ip);
  }

  @UseGuards(JwtAuthGuard)
  @Get('devices')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取活跃设备列表' })
  async getActiveDevices(@Request() req: { user?: { userId: number } }) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('用户信息无效');
    }
    const devices = await this.authService.getUserActiveTokens(userId);
    return {
      devices: devices.map((device) => ({
        id: device.id,
        deviceInfo: device.deviceInfo || '未知设备',
        ipAddress: device.ipAddress || '未知IP',
        createdAt: device.createdAt,
        expiresAt: device.expiresAt,
      })),
      total: devices.length,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('devices/:tokenId')
  @ApiBearerAuth()
  @ApiOperation({ summary: '撤销指定设备refresh token（占位实现）' })
  revokeDevice(@Param('tokenId') tokenId: string) {
    const numericTokenId = parseInt(tokenId, 10);
    if (isNaN(numericTokenId)) {
      return {
        message: '无效的设备ID',
        success: false,
      };
    }
    // TODO: 校验 token 归属后执行撤销，确保 numericTokenId 属于 req.user.userId
    // await this.authService.revokeUserSpecificToken(req.user.userId, numericTokenId);
    return {
      message: '设备已登出',
      success: true,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '登出',
    description: '撤销当前的refresh token'
  })
  @ApiResponse({
    status: 200,
    description: '登出成功'
  })
  async logout(@Body() refreshDto: RefreshTokenDto) {
    if (!refreshDto.refresh_token) {
      throw new BadRequestException('refresh_token不能为空');
    }

    await this.authService.revokeRefreshToken(refreshDto.refresh_token);
    return { message: '登出成功' };
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '全设备登出',
    description: '撤销用户所有设备的refresh token'
  })
  @ApiResponse({
    status: 200,
    description: '全设备登出成功'
  })
  async logoutAll(@Request() req: { user?: { userId: number } }) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('用户信息无效');
    }

    await this.authService.revokeAllUserTokens(userId);
    return { message: '已在所有设备上登出' };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '获取当前用户信息',
    description: '获取当前认证用户的基本信息'
  })
  @ApiResponse({
    status: 200,
    description: '获取成功'
  })
  getProfile(@Request() req: { user?: { userId: number } }) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('用户信息无效');
    }

    // 这里可以从数据库获取完整的用户信息
    return { userId, message: '用户已认证' };
  }

  @Post('convert-guest-to-email')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '游客转正式用户（邮箱注册）',
    description: '将当前游客账号转换为正式邮箱注册用户，保留所有历史数据（观看记录、收藏、评论等）'
  })
  @ApiResponse({
    status: 200,
    description: '转换成功',
    type: ConvertGuestResponseDto
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误或用户已是正式用户'
  })
  @ApiResponse({
    status: 409,
    description: '邮箱或用户名已被使用'
  })
  async convertGuestToEmail(
    @Request() req: { user?: { userId: number } },
    @Body() dto: ConvertGuestToEmailDto,
  ): Promise<ConvertGuestResponseDto> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('用户信息无效');
    }

    return this.userService.convertGuestToEmailUser(userId, dto);
  }

  @Post('admin/clean-inactive-guests')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '清理不活跃游客（管理员）',
    description: '将长期不活跃的游客标记为不活跃状态（软删除），不会删除数据，可恢复'
  })
  @ApiResponse({
    status: 200,
    description: '清理成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        deactivated: { type: 'number' },
        message: { type: 'string' },
        details: { type: 'object' }
      }
    }
  })
  async cleanInactiveGuests(
    @Query('inactiveDays') inactiveDays?: number,
    @Query('recentActivityDays') recentActivityDays?: number,
  ) {
    const inactive = inactiveDays ? parseInt(String(inactiveDays)) : 90;
    const recent = recentActivityDays ? parseInt(String(recentActivityDays)) : 30;
    
    return this.guestService.cleanInactiveGuests(inactive, recent);
  }

  @Get('admin/guest-statistics')
  @ApiOperation({
    summary: '获取游客统计信息（管理员）',
    description: '获取游客总数、活跃数、转化率等统计数据'
  })
  @ApiResponse({
    status: 200,
    description: '统计信息',
    schema: {
      type: 'object',
      properties: {
        totalGuests: { type: 'number' },
        activeGuests: { type: 'number' },
        inactiveGuests: { type: 'number' },
        convertedGuests: { type: 'number' },
        recentGuests: { type: 'number' },
        conversionRate: { type: 'string' }
      }
    }
  })
  async getGuestStatistics() {
    return this.guestService.getGuestStatistics();
  }

  @Post('admin/reactivate-guest/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '恢复不活跃游客（管理员）',
    description: '将被标记为不活跃的游客恢复为活跃状态'
  })
  @ApiResponse({
    status: 200,
    description: '恢复成功'
  })
  async reactivateGuest(@Param('userId') userId: string) {
    return this.guestService.reactivateGuest(parseInt(userId));
  }
}
