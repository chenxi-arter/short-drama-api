import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { User } from './entity/user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { AuthModule } from '../auth/auth.module';
import { TelegramAuthService } from '../auth/telegram-auth.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    JwtModule.register({}),
    forwardRef(() => AuthModule), // 导入AuthModule以使用AuthService
  ],
  controllers: [UserController],
  providers: [UserService, JwtStrategy, TelegramAuthService],
  exports: [UserService],
})
export class UserModule {}
