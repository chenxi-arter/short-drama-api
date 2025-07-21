import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { TelegramUserDto } from './dto/telegram-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('telegram-login')
  async telegramLogin(@Body() dto: TelegramUserDto) {
    return this.userService.telegramLogin(dto);
  }
}
