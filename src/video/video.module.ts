// src/video/video.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Series } from './entity/series.entity';               // 系列/剧集实体
import { Episode } from './entity/episode.entity';             // 单集视频实体
import { EpisodeUrl } from './entity/episode-url.entity';      // 视频播放地址实体
import { EpisodeReaction } from './entity/episode-reaction.entity'; // 剧集点赞点踩实体
import { Comment } from './entity/comment.entity';             // 用户评论实体
import { WatchProgress } from './entity/watch-progress.entity';// 观看进度记录实体
import { BrowseHistory } from './entity/browse-history.entity';// 浏览记录实体
import { Category } from './entity/category.entity';           // 视频分类实体
import { ShortVideo } from './entity/short-video.entity';      // 短视频实体
import { Banner } from './entity/banner.entity';              // 轮播图实体
import { User } from '../user/entity/user.entity';            // 用户实体（用于BrowseHistoryService）

import { FilterType } from './entity/filter-type.entity';      // 筛选器类型实体
import { FilterOption } from './entity/filter-option.entity';  // 筛选器选项实体
import { SeriesGenreOption } from './entity/series-genre-option.entity'; // 系列题材中间表
import { VideoService } from './video.service';                // 视频业务逻辑服务
import { CacheMonitorController } from './cache-monitor.controller'; // 缓存监控API控制器
import { VideoApiModule } from './modules/video-api.module';
import { WatchProgressService } from './services/watch-progress.service';
import { CommentService } from './services/comment.service';
import { FakeCommentService } from './services/fake-comment.service';
import { EpisodeService } from './services/episode.service';
import { CategoryService } from './services/category.service';

import { FilterService } from './services/filter.service';
import { SeriesService } from './services/series.service';
// import { BannerService } from './services/banner.service';     // 轮播图服务
import { BrowseHistoryService } from './services/browse-history.service'; // 浏览记录服务
import { BrowseHistoryCleanupService } from './services/browse-history-cleanup.service'; // 浏览记录清理服务

// ✅ 新增：专门的业务服务
import { PlaybackService } from './services/playback.service';
import { ContentService } from './services/content.service';
import { HomeService } from './services/home.service';
import { MediaService } from './services/media.service';
import { UrlService } from './services/url.service';
import { AppLoggerService } from '../common/logger/app-logger.service';
import { AppConfigService } from '../common/config/app-config.service';
import { CatalogModule } from './modules/catalog.module';
import { SeriesModule } from './modules/series.module';
import { EpisodeModule } from './modules/episode.module';
import { BannerModule } from './modules/banner.module';
import { HistoryModule } from './modules/history.module';
import { IsValidChannelExistsConstraint } from './validators/channel-exists.validator';
import { IngestService } from './services/ingest.service';
import { PlayCountService } from './services/play-count.service';
import { EpisodeInteractionService } from './services/episode-interaction.service';
import { CategoryValidator } from '../common/validators/category-validator';
import { SearchSuggestionsService } from './services/search-suggestions.service';
import { SearchController } from './controllers/search.controller';
@Module({
  imports: [
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
      EpisodeReaction,// 剧集点赞点踩数据表
      Comment,        // 评论数据表
      WatchProgress,  // 用户观看进度数据表
      Category,       // 分类目录数据表
      ShortVideo,     // 短视频数据表
      Banner,         // 轮播图数据表
      User,           // 用户数据表（用于BrowseHistoryService）

      FilterType,     // 筛选器类型数据表
      FilterOption,   // 筛选器选项数据表
      SeriesGenreOption, // 系列题材中间表
      BrowseHistory   // 浏览记录数据表
    ]),
    VideoApiModule,
    forwardRef(() => import('../user/user.module').then(m => m.UserModule)), // 导入UserModule以访问FavoriteService
  ],
  providers: [
    // ✅ 重构后的协调器服务
    VideoService,
    
    // ✅ 新的专门业务服务
    PlaybackService,
    ContentService,
    HomeService,
    MediaService,
    UrlService,
    PlayCountService,
    
    // 现有服务（注意：FakeCommentService 必须在 CommentService 之前，因为存在依赖）
    WatchProgressService,
    FakeCommentService,  // ← 移到 CommentService 之前
    CommentService,
    EpisodeService,
    EpisodeInteractionService,
    CategoryService,
    IngestService,
    FilterService,
    SeriesService,
    BrowseHistoryService,
    BrowseHistoryCleanupService,
    SearchSuggestionsService,
    
    // 工具和配置服务
    AppLoggerService,
    AppConfigService,
    IsValidChannelExistsConstraint,
    CategoryValidator,
  ],    // 注册本模块的服务提供者（业务逻辑）
  controllers: [
    CacheMonitorController,
    SearchController
  ], // 仅保留内部控制器；公开API控制器移至 VideoApiModule；管理端控制器收敛到 AdminModule
  exports: [
    VideoService,
    PlaybackService,
    ContentService,
    HomeService,
    MediaService,
    UrlService,
    FilterService,
    CommentService,
    EpisodeService,
    SeriesService,
    CategoryService,
    IngestService,
    CategoryValidator,
    SearchSuggestionsService,
  ], // 导出服务供其他模块使用
})
export class VideoModule {}
