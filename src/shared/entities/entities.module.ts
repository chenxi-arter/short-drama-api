import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// 用户相关实体
import { User } from '../../user/entity/user.entity';
import { RefreshToken } from '../../auth/entity/refresh-token.entity';

// 视频相关实体
import { Series } from '../../video/entity/series.entity';
import { Episode } from '../../video/entity/episode.entity';
import { EpisodeUrl } from '../../video/entity/episode-url.entity';
import { Comment } from '../../video/entity/comment.entity';
import { WatchProgress } from '../../video/entity/watch-progress.entity';
import { Category } from '../../video/entity/category.entity';
import { ShortVideo } from '../../video/entity/short-video.entity';

/**
 * 全局实体模块（Deprecated）
 * 建议：各业务模块使用 `TypeOrmModule.forFeature([...])` 就地注册实体；
 * 本模块仅为兼容历史引用保留，后续版本将逐步下线。
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      // 用户相关实体
      User,
      RefreshToken,
      
      // 视频相关实体
      Series,
      Episode,
      EpisodeUrl,
      Comment,
      WatchProgress,
      Category,
      ShortVideo,

    ])
  ],
  exports: [TypeOrmModule]
})
export class EntitiesModule {
  /**
   * 模块初始化时的日志
   */
  constructor() {
    console.log('📦 All entities registered globally');
  }
}