import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { User } from './entity/user.entity';
import { Favorite } from './entity/favorite.entity';
import { Episode } from '../video/entity/episode.entity';
import { UserService } from './user.service';
import { FavoriteService } from './services/favorite.service';
import { UserController } from './user.controller';
import { FavoriteController } from './controllers/favorite.controller';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { TelegramAuthService } from '../auth/telegram-auth.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Favorite, Episode]),
    PassportModule,
    forwardRef(() => AuthModule), // 使用forwardRef避免循环依赖，AuthModule已经提供了JwtModule
  ],
  controllers: [UserController, FavoriteController],
  providers: [UserService, FavoriteService, JwtStrategy, TelegramAuthService],
  exports: [UserService, FavoriteService],
})
export class UserModule {}
