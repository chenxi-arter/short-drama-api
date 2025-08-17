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
import { CacheMonitorController } from './cache-monitor.controller'; // 缓存监控API控制器
import { VideoApiModule } from './modules/video-api.module';
import { AdminController } from './admin.controller'; // 管理员API控制器
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
import { CatalogModule } from './modules/catalog.module';
import { SeriesModule } from './modules/series.module';
import { EpisodeModule } from './modules/episode.module';
import { BannerModule } from './modules/banner.module';
import { HistoryModule } from './modules/history.module';
import { IsValidChannelExistsConstraint } from './validators/channel-exists.validator';
@Module({
  imports: [
    CacheModule.register(),
    // 子模块装载（在不改变现有路由前提下分层）
    CatalogModule,
    SeriesModule,
    EpisodeModule,
    BannerModule,
    HistoryModule,
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
  , VideoApiModule],
  providers: [
    VideoService,
    WatchProgressService,
    CommentService,
    EpisodeService,
    CategoryService,
    BannerService,

    FilterService,
    SeriesService,
    BrowseHistoryService,
    AppLoggerService,
    AppConfigService,
    IsValidChannelExistsConstraint,
  ],    // 注册本模块的服务提供者（业务逻辑）
  controllers: [
    CacheMonitorController,
    AdminController
  ], // 仅保留内部控制器；公开API控制器移至 VideoApiModule
  // 注意：如果需要让其他模块使用这些实体或服务，应该在这里添加exports
})
export class VideoModule {}
