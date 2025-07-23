// src/test/test.controller.ts
import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserService } from '../user/user.service'; // ✅ 引入

@Controller('test')
export class TestController {
  constructor(private readonly userService: UserService) {} // ✅ 注入

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req) {
    const user = await this.userService.findUserById(req.user.userId);
    if (!user) {
      return { message: '用户不存在' };
    }
    return {
      message: '登录有效',
      user: {
        id: user.id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        isActive: user.is_active,
        createdAt: user.created_at,
      },
    };
  }
}