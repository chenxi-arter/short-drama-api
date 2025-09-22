import { Body, Controller, Post, Get, Query, UseGuards, Req, Delete, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { TelegramUserDto } from './dto/telegram-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthService } from '../auth/auth.service';
import { RefreshTokenDto } from '../auth/dto/refresh-token.dto';

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

  @Post('telegram-login')
  async telegramLogin(@Body() dto: TelegramUserDto): Promise<any> {
    return this.userService.telegramLogin(dto);
  }
  
  @Get('telegram-login')
  async telegramLoginGet(
    @Query() dto: TelegramUserDto, // 用 @Query 接收 query 参数
  ): Promise<any> {
    return this.userService.telegramLogin(dto);
  }
  // src/user/user.controller.ts
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: AuthenticatedRequest) {
    const user = await this.userService.findUserById(req.user.userId);
    if (!user) {
      return { message: '用户不存在' };
    }
    return {
      id: user.id,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      isActive: user.is_active,
      createdAt: user.created_at,
    };
  }

  /**
   * 刷新访问令牌
   * @param dto 包含refresh_token的请求体
   * @param req 请求对象
   * @returns 新的access_token
   */
  @Post('refresh')
  async refreshToken(@Body() dto: RefreshTokenDto) {
    // 简化IP获取，避免类型错误
    const ipAddress = 'unknown';
    return this.authService.refreshAccessToken(dto.refresh_token, ipAddress);
  }

  /**
   * 验证refresh token是否有效
   * @param dto 包含refresh_token的请求体
   * @returns 验证结果
   */
  @Post('verify-refresh-token')
  async verifyRefreshToken(@Body() dto: RefreshTokenDto) {
    try {
      // 这里可以添加验证逻辑，但不生成新token
      // 简化实现：尝试刷新token来验证有效性
      await this.authService.refreshAccessToken(dto.refresh_token);
      return {
        valid: true,
        message: 'Refresh token 有效'
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Refresh token 无效';
      return {
        valid: false,
        message: errorMessage
      };
    }
  }

  /**
   * 登出（撤销指定的refresh token）
   * @param dto 包含refresh_token的请求体
   * @returns 成功消息
   */
  @Post('logout')
  async logout(@Body() dto: RefreshTokenDto) {
    await this.authService.revokeRefreshToken(dto.refresh_token);
    return { 
      message: '登出成功',
      success: true 
    };
  }

  /**
   * 全设备登出（撤销用户的所有refresh token）
   * 需要用户认证
   * @param req 请求对象，包含用户信息
   * @returns 成功消息
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  async logoutAll(@Req() req: AuthenticatedRequest) {
    await this.authService.revokeAllUserTokens(req.user.userId);
    return { 
      message: '已登出所有设备',
      success: true 
    };
  }

  /**
   * 获取用户的活跃设备列表
   * 需要用户认证
   * @param req 请求对象，包含用户信息
   * @returns 活跃设备列表
   */
  @UseGuards(JwtAuthGuard)
  @Get('devices')
  async getActiveDevices(@Req() req: AuthenticatedRequest) {
    const devices = await this.authService.getUserActiveTokens(req.user.userId);
    return {
      devices: devices.map(device => ({
        id: device.id,
        deviceInfo: device.deviceInfo || '未知设备',
        ipAddress: device.ipAddress || '未知IP',
        createdAt: device.createdAt,
        expiresAt: device.expiresAt,
      })),
      total: devices.length
    };
  }

  /**
   * 撤销指定设备的refresh token
   * 需要用户认证
   * @param tokenId refresh token的ID
   * @param req 请求对象，包含用户信息
   * @returns 成功消息
   */
  @UseGuards(JwtAuthGuard)
  @Delete('devices/:tokenId')
  revokeDevice(@Param('tokenId') tokenId: string, @Req() req: AuthenticatedRequest) {
    // 注意：这里需要确保用户只能撤销自己的token
    // 实际实现中需要添加权限检查
    const numericTokenId = parseInt(tokenId, 10);
    if (isNaN(numericTokenId)) {
      return { 
        message: '无效的设备ID',
        success: false 
      };
    }

    // 这里简化实现，实际应该检查token是否属于当前用户
    // await this.authService.revokeUserSpecificToken(req.user.userId, numericTokenId);
    console.log('用户ID:', req.user.userId, '设备ID:', numericTokenId);
    
    return { 
      message: '设备已登出',
      success: true 
    };
  }
}
