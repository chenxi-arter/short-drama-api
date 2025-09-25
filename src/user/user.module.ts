import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { User } from './entity/user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { TelegramAuthService } from '../auth/telegram-auth.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    JwtModule.register({}),
    forwardRef(() => AuthModule), // 使用forwardRef避免循环依赖
  ],
  controllers: [UserController],
  providers: [UserService, JwtStrategy, TelegramAuthService],
  exports: [UserService],
})
export class UserModule {}
