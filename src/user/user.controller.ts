import { Body, Controller, Post, Get, Query, UseGuards, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { TelegramUserDto } from './dto/telegram-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('telegram-login')
  async telegramLogin(@Body() dto: TelegramUserDto) {
    return this.userService.telegramLogin(dto);
  }
  @Get('telegram-login')
  async telegramLoginGet(
    @Query() dto: TelegramUserDto, // 用 @Query 接收 query 参数
  ) {
    return this.userService.telegramLogin(dto);
  }
  // src/user/user.controller.ts
@UseGuards(JwtAuthGuard)
@Get('me')
async getMe(@Req() req) {
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
}
