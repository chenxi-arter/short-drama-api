import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { User } from './entity/user.entity';
import { Favorite } from './entity/favorite.entity';
import { Episode } from '../video/entity/episode.entity';
import { EpisodeReaction } from '../video/entity/episode-reaction.entity';
import { UserService } from './user.service';
import { FavoriteService } from './services/favorite.service';
import { LikedEpisodesService } from './services/liked-episodes.service';
import { UserController } from './user.controller';
import { FavoriteController } from './controllers/favorite.controller';
import { LikedEpisodesController } from './controllers/liked-episodes.controller';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { TelegramAuthService } from '../auth/telegram-auth.service';
import { AuthModule } from '../auth/auth.module';
import { VideoModule } from '../video/video.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Favorite, Episode, EpisodeReaction]),
    PassportModule,
    forwardRef(() => AuthModule), // 使用forwardRef避免循环依赖，AuthModule已经提供了JwtModule
    forwardRef(() => VideoModule), // 导入VideoModule以使用CategoryValidator
  ],
  controllers: [UserController, FavoriteController, LikedEpisodesController],
  providers: [UserService, FavoriteService, LikedEpisodesService, JwtStrategy, TelegramAuthService],
  exports: [UserService, FavoriteService, LikedEpisodesService],
})
export class UserModule {}
