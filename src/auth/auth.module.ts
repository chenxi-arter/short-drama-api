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
import { AccountMergeService } from './account-merge.service';
import { AuthController } from './auth.controller';
import { RefreshToken } from './entity/refresh-token.entity';
import { User } from '../user/entity/user.entity';
import { UserOperationLog } from '../user/entity/user-operation-log.entity';
import { WatchProgress } from '../video/entity/watch-progress.entity';
import { Favorite } from '../user/entity/favorite.entity';
import { EpisodeReaction } from '../video/entity/episode-reaction.entity';
import { Comment } from '../video/entity/comment.entity';
import { CommentLike } from '../video/entity/comment-like.entity';
import { UserModule } from '../user/user.module';
import { CoreModule } from '../core/core.module';
import { DauService } from '../admin/services/dau.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from './guards/optional-jwt-auth.guard';
import { UserOperationLogService } from '../user/services/user-operation-log.service';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    TypeOrmModule.forFeature([
      RefreshToken,
      User,
      UserOperationLog,
      WatchProgress,
      Favorite,
      EpisodeReaction,
      Comment,
      CommentLike,
    ]),
    forwardRef(() => UserModule),
    CoreModule,
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
  providers: [
    JwtStrategy,
    TelegramStrategy,
    AuthService,
    TelegramAuthService,
    GuestService,
    AccountMergeService,
    DauService,
    UserOperationLogService,
    JwtAuthGuard,
    OptionalJwtAuthGuard,
  ],
  exports: [
    PassportModule,
    JwtModule,
    AuthService,
    TelegramAuthService,
    GuestService,
    AccountMergeService,
    JwtAuthGuard,
    OptionalJwtAuthGuard,
  ],
})
export class AuthModule {}