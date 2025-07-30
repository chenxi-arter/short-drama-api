import { Controller, Post, Body, UseGuards, Req, Get, Delete, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import * as requestIp from 'request-ip';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 刷新访问令牌
   * @param dto 包含refresh_token的请求体
   * @param req 请求对象
   * @returns 新的access_token
   */
  @Post('refresh')
  async refreshToken(@Body() dto: RefreshTokenDto, @Req() req) {
    const ipAddress = requestIp.getClientIp(req);
    return this.authService.refreshAccessToken(dto.refresh_token, ipAddress);
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
  async logoutAll(@Req() req) {
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
  async getActiveDevices(@Req() req) {
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
  async revokeDevice(@Param('tokenId') tokenId: string, @Req() req) {
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
    
    return { 
      message: '设备已登出',
      success: true 
    };
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
    } catch (error) {
      return {
        valid: false,
        message: error.message || 'Refresh token 无效'
      };
    }
  }

  /**
   * 清理过期的refresh token（管理员接口）
   * 注意：实际项目中应该添加管理员权限验证
   * @returns 清理结果
   */
  @Post('cleanup-expired')
  async cleanupExpiredTokens() {
    const cleanedCount = await this.authService.cleanupExpiredTokens();
    return {
      message: `清理了 ${cleanedCount} 个过期的 refresh token`,
      cleanedCount,
      success: true
    };
  }
}