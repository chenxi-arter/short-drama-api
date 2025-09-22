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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { TelegramAuthGuard } from './guards/telegram-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { TelegramLoginDto, TelegramLoginResponseDto } from './dto/telegram-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('telegram/login')
  @UseGuards(TelegramAuthGuard)
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
    @Request() req: any,
    @Ip() ip: string,
  ): Promise<TelegramLoginResponseDto> {
    const user = req.user;
    
    if (!user) {
      throw new UnauthorizedException('认证失败');
    }

    // 生成JWT令牌
    const tokens = await this.authService.generateTokens(
      user,
      loginDto.deviceInfo,
      ip
    );

    return {
      ...tokens,
      user: {
        id: user.id,
        shortId: user.shortId,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
      },
    };
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
  async logoutAll(@Request() req: any) {
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
  async getProfile(@Request() req: any) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('用户信息无效');
    }

    // 这里可以从数据库获取完整的用户信息
    return { userId, message: '用户已认证' };
  }
}
