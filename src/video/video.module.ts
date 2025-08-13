// src/video/video.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { Series } from './entity/series.entity';               // 系列/剧集实体
import { Episode } from './entity/episode.entity';             // 单集视频实体
import { EpisodeUrl } from './entity/episode-url.entity';      // 视频播放地址实体
import { Comment } from './entity/comment.entity';             // 用户评论实体
import { WatchProgress } from './entity/watch-progress.entity';// 观看进度记录实体
import { BrowseHistory } from './entity/browse-history.entity';// 浏览记录实体
import { Category } from './entity/category.entity';           // 视频分类实体
import { ShortVideo } from './entity/short-video.entity';      // 短视频实体
import { Banner } from './entity/banner.entity';              // 轮播图实体

import { FilterType } from './entity/filter-type.entity';      // 筛选器类型实体
import { FilterOption } from './entity/filter-option.entity';  // 筛选器选项实体
import { VideoService } from './video.service';                // 视频业务逻辑服务
import { VideoController } from './video.controller';          // 视频相关API控制器
import { PublicVideoController } from './public-video.controller'; // 公开视频API控制器
import { HomeController } from './home.controller';           // 首页相关API控制器
import { ListController } from './list.controller';           // 列表筛选相关API控制器
import { CategoryController } from './category.controller';   // 分类相关API控制器
import { BannerController } from './controllers/banner.controller'; // 轮播图API控制器
import { BrowseHistoryController } from './browse-history.controller'; // 浏览记录API控制器
import { WatchProgressService } from './services/watch-progress.service';
import { CommentService } from './services/comment.service';
import { EpisodeService } from './services/episode.service';
import { CategoryService } from './services/category.service';

import { FilterService } from './services/filter.service';
import { SeriesService } from './services/series.service';
import { BannerService } from './services/banner.service';     // 轮播图服务
import { BrowseHistoryService } from './services/browse-history.service'; // 浏览记录服务
import { AppLoggerService } from '../common/logger/app-logger.service';
import { AppConfigService } from '../common/config/app-config.service';
import { IsValidChannelExistsConstraint } from './validators/channel-exists.validator';
@Module({
  imports: [
    CacheModule.register(),
    // 注册当前模块需要的TypeORM实体，使它们可以在本模块的Provider中注入使用
    TypeOrmModule.forFeature([
      Series,         // 系列/剧集数据表
      Episode,        // 单集视频数据表  
      EpisodeUrl,     // 视频播放地址数据表
      Comment,        // 评论数据表
      WatchProgress,  // 用户观看进度数据表
      Category,       // 分类目录数据表
      ShortVideo,     // 短视频数据表
      Banner,         // 轮播图数据表

      FilterType,     // 筛选器类型数据表
      FilterOption,   // 筛选器选项数据表
      BrowseHistory   // 浏览记录数据表
    ])
  ],
  providers: [
    VideoService,
    WatchProgressService,
    CommentService,
    EpisodeService,
    CategoryService,
    BannerService,

    FilterService,
    SeriesService,
    BannerService,
    BrowseHistoryService,
    AppLoggerService,
    AppConfigService,
    IsValidChannelExistsConstraint,
  ],    // 注册本模块的服务提供者（业务逻辑）
  controllers: [
    PublicVideoController, 
    VideoController, 
    HomeController, 
    ListController,
    CategoryController,
    BannerController,
    BrowseHistoryController
  ], // 一起注册
  // 注意：如果需要让其他模块使用这些实体或服务，应该在这里添加exports
})
export class VideoModule {}
