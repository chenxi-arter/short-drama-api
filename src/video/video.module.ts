// src/video/video.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Series } from './entity/series.entity';               // 系列/剧集实体
import { Episode } from './entity/episode.entity';             // 单集视频实体
import { EpisodeUrl } from './entity/episode-url.entity';      // 视频播放地址实体
import { Comment } from './entity/comment.entity';             // 用户评论实体
import { WatchProgress } from './entity/watch-progress.entity';// 观看进度记录实体
import { Category } from './entity/category.entity';           // 视频分类实体
import { ShortVideo } from './entity/short-video.entity';      // 短视频实体
import { VideoService } from './video.service';                // 视频业务逻辑服务
import { VideoController } from './video.controller';          // 视频相关API控制器
import { PublicVideoController } from './public-video.controller'; // 公开视频API控制器
@Module({
  imports: [
    // 注册当前模块需要的TypeORM实体，使它们可以在本模块的Provider中注入使用
    TypeOrmModule.forFeature([
      Series,         // 系列/剧集数据表
      Episode,        // 单集视频数据表  
      EpisodeUrl,     // 视频播放地址数据表
      Comment,        // 评论数据表
      WatchProgress,  // 用户观看进度数据表
      Category,       // 分类目录数据表
      ShortVideo      // 短视频数据表
    ])
  ],
  providers: [VideoService],    // 注册本模块的服务提供者（业务逻辑）
  controllers: [PublicVideoController, VideoController], // 一起注册
  // 注意：如果需要让其他模块使用这些实体或服务，应该在这里添加exports
})
export class VideoModule {}
