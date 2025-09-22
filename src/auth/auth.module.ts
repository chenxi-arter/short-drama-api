import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TelegramStrategy } from './strategies/telegram.strategy';
import { AuthService } from './auth.service';
import { TelegramAuthService } from './telegram-auth.service';
import { AuthController } from './auth.controller';
import { RefreshToken } from './entity/refresh-token.entity';
import { User } from '../user/entity/user.entity';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    TypeOrmModule.forFeature([RefreshToken, User]),
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
  providers: [JwtStrategy, TelegramStrategy, AuthService, TelegramAuthService],
  exports: [PassportModule, AuthService, TelegramAuthService],
})
export class AuthModule {}