// src/test/test.controller.ts
import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // 你之前写的守卫

@Controller('test')
export class TestController {
  // 访问方式：GET /test/me
  // Header: Authorization: Bearer <access_token>
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req) {
    // req.user 来自 JwtStrategy.validate()
    return {
      message: '登录有效',
      userId: req.user.userId,
    };
  }
}