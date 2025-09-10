import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoController } from '../video.controller';
import { PublicVideoController } from '../public-video.controller';
import { BrowseHistoryController } from '../browse-history.controller';
import { HomeController } from '../home.controller';
import { ListController } from '../list.controller';
import { CategoryController } from '../category.controller';
import { BannerController } from '../controllers/banner.controller';

// 新增的专门控制器
import { ProgressController } from '../controllers/progress.controller';
import { CommentController } from '../controllers/comment.controller';
import { UrlController } from '../controllers/url.controller';
import { ContentController } from '../controllers/content.controller';
import { PublicBrowseHistoryController } from '../controllers/public-browse-history.controller';
import { VideoService } from '../video.service';
import { CommentService } from '../services/comment.service';
import { PlaybackService } from '../services/playback.service';
import { ContentService } from '../services/content.service';
import { HomeService } from '../services/home.service';
import { MediaService } from '../services/media.service';
import { UrlService } from '../services/url.service';
import { FilterService } from '../services/filter.service';
import { SeriesService } from '../services/series.service';
import { EpisodeService } from '../services/episode.service';
import { BrowseHistoryService } from '../services/browse-history.service';
import { WatchProgressService } from '../services/watch-progress.service';
import { BannerService } from '../services/banner.service';
import { CategoryService } from '../services/category.service';
import { IngestService } from '../services/ingest.service';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { AppConfigService } from '../../common/config/app-config.service';
import { PlayCountService } from '../services/play-count.service';
import { CatalogModule } from './catalog.module';
import { SeriesModule } from './series.module';
import { EpisodeModule } from './episode.module';
import { BannerModule } from './banner.module';
import { HistoryModule } from './history.module';
import { Series } from '../entity/series.entity';
import { Episode } from '../entity/episode.entity';
import { EpisodeUrl } from '../entity/episode-url.entity';
import { Comment } from '../entity/comment.entity';
import { WatchProgress } from '../entity/watch-progress.entity';
import { Category } from '../entity/category.entity';
import { ShortVideo } from '../entity/short-video.entity';
import { Banner } from '../entity/banner.entity';
import { FilterType } from '../entity/filter-type.entity';
import { FilterOption } from '../entity/filter-option.entity';
import { BrowseHistory } from '../entity/browse-history.entity';

@Module({
  imports: [
    CatalogModule,
    SeriesModule,
    EpisodeModule,
    BannerModule,
    HistoryModule,
    TypeOrmModule.forFeature([
      Series, Episode, EpisodeUrl, Comment, WatchProgress, Category, ShortVideo, Banner, FilterType, FilterOption, BrowseHistory
    ])
  ],
  controllers: [
    // 原始控制器（保持兼容）
    PublicVideoController,
    VideoController,
    HomeController,
    ListController,
    CategoryController,
    BannerController,
    BrowseHistoryController,

    // 新增的专门控制器
    ProgressController,
    CommentController,
    UrlController,
    ContentController,
    PublicBrowseHistoryController,
  ],
  providers: [
    VideoService,
    PlaybackService,
    ContentService,
    HomeService,
    MediaService,
    UrlService,
    PlayCountService,
    FilterService,
    SeriesService,
    EpisodeService,
    BrowseHistoryService,
    WatchProgressService,
    BannerService,
    CategoryService,
    IngestService,
    CommentService,
    AppLoggerService,
    AppConfigService,
  ],
  exports: [],
})
export class VideoApiModule {}


