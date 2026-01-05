import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TelegramStrategy } from './strategies/telegram.strategy';
import { AuthService } from './auth.service';
import { TelegramAuthService } from './telegram-auth.service';
import { GuestService } from './guest.service';
import { AuthController } from './auth.controller';
import { RefreshToken } from './entity/refresh-token.entity';
import { User } from '../user/entity/user.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    TypeOrmModule.forFeature([RefreshToken, User]),
    forwardRef(() => UserModule),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { 
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '1h'
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, TelegramStrategy, AuthService, TelegramAuthService, GuestService],
  exports: [PassportModule, JwtModule, AuthService, TelegramAuthService, GuestService],
})
export class AuthModule {}