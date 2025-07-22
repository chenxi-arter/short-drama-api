import { Body, Controller, Post, Get, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { TelegramUserDto } from './dto/telegram-user.dto';

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
}
