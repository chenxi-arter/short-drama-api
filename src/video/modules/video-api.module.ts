import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoController } from '../video.controller';
import { PublicVideoController } from '../public-video.controller';
import { HomeController } from '../home.controller';
import { ListController } from '../list.controller';
import { CategoryController } from '../category.controller';
import { BannerController } from '../controllers/banner.controller';

// 新增的专门控制器
import { ProgressController } from '../controllers/progress.controller';
import { CommentController } from '../controllers/comment.controller';
import { UrlController } from '../controllers/url.controller';
import { ContentController } from '../controllers/content.controller';
import { InteractionController } from '../controllers/interaction.controller';
import { CommentsController } from '../controllers/comments.controller';
import { CompatBrowseHistoryController } from '../controllers/compat-browse-history.controller';
import { RecommendController } from '../controllers/recommend.controller';
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
import { WatchProgressService } from '../services/watch-progress.service';
import { BannerService } from '../services/banner.service';
import { CategoryService } from '../services/category.service';
import { IngestService } from '../services/ingest.service';
import { RecommendService } from '../services/recommend.service';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { AppConfigService } from '../../common/config/app-config.service';
import { PlayCountService } from '../services/play-count.service';
import { EpisodeInteractionService } from '../services/episode-interaction.service';
import { CatalogModule } from './catalog.module';
import { SeriesModule } from './series.module';
import { EpisodeModule } from './episode.module';
import { BannerModule } from './banner.module';
// import { HistoryModule } from './history.module';
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
// import { BrowseHistory } from '../entity/browse-history.entity';
import { SeriesGenreOption } from '../entity/series-genre-option.entity';

@Module({
  imports: [
    CatalogModule,
    SeriesModule,
    EpisodeModule,
    BannerModule,
    // HistoryModule,
    TypeOrmModule.forFeature([
      Series, Episode, EpisodeUrl, Comment, WatchProgress, Category, ShortVideo, Banner, FilterType, FilterOption,
      SeriesGenreOption
    ]),
    forwardRef(() => import('../../user/user.module').then(m => m.UserModule)),
  ],
  controllers: [
    // 原始控制器（保持兼容）
    PublicVideoController,
    VideoController,
    HomeController,
    ListController,
    CategoryController,
    BannerController,
    // BrowseHistoryController,
    CompatBrowseHistoryController,

    // 新增的专门控制器
    ProgressController,
    CommentController,
    UrlController,
    ContentController,
    // PublicBrowseHistoryController,
    InteractionController,
    CommentsController,
    RecommendController,
  ],
  providers: [
    VideoService,
    PlaybackService,
    ContentService,
    HomeService,
    MediaService,
    UrlService,
    PlayCountService,
    EpisodeInteractionService,
    FilterService,
    SeriesService,
    EpisodeService,
    // BrowseHistoryService,
    // BrowseHistoryCleanupService,
    WatchProgressService,
    BannerService,
    CategoryService,
    IngestService,
    CommentService,
    RecommendService,
    AppLoggerService,
    AppConfigService,
  ],
  exports: [],
})
export class VideoApiModule {}


