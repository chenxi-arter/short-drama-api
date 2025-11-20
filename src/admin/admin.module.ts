import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { User } from '../user/entity/user.entity';
import { Banner } from '../video/entity/banner.entity';
import { Category } from '../video/entity/category.entity';
import { Series } from '../video/entity/series.entity';
import { Episode } from '../video/entity/episode.entity';
import { EpisodeUrl } from '../video/entity/episode-url.entity';
import { RefreshToken } from '../auth/entity/refresh-token.entity';
import { Comment } from '../video/entity/comment.entity';
import { WatchProgress } from '../video/entity/watch-progress.entity';
import { BrowseHistory } from '../video/entity/browse-history.entity';
import { EpisodeReaction } from '../video/entity/episode-reaction.entity';
import { Favorite } from '../user/entity/favorite.entity';
import { FilterOption } from '../video/entity/filter-option.entity';

// Controllers
import { AdminUsersController, AdminBannersController, AdminEpisodesController } from './controllers';
import { AdminCategoriesController } from './controllers/admin-categories.controller';
import { AdminOptionsController } from './controllers/admin-options.controller';
import { IngestController } from './controllers/ingest.controller';
import { TestIngestController } from './controllers/test-ingest.controller';
import { AdminSeriesController } from './controllers/admin-series.controller';
import { AdminDashboardController } from './controllers/admin-dashboard.controller';
import { SeriesValidationController } from './controllers/series-validation.controller';
import { AdminExportController } from './controllers/admin-export.controller';

// Modules
import { VideoModule } from '../video/video.module';
import { CoreModule } from '../core/core.module';
import { AdvertisingModule } from '../advertising/advertising.module';

// Services
import { AnalyticsService } from './services/analytics.service';

@Module({
  imports: [
    VideoModule,
    CoreModule,
    AdvertisingModule,
    TypeOrmModule.forFeature([
      User,
      Banner,
      Series,
      Episode,
      EpisodeUrl,
      RefreshToken,
      Comment,
      WatchProgress,
      BrowseHistory,
      Category,
      EpisodeReaction,
      Favorite,
      FilterOption,
    ])
  ],
  controllers: [
    AdminUsersController,
    AdminBannersController,
    AdminCategoriesController,
    AdminOptionsController,
    AdminEpisodesController,
    AdminSeriesController,
    AdminDashboardController,
    SeriesValidationController,
    AdminExportController,
    // 从 video/controllers 归并的管理端路由
    IngestController,
    TestIngestController,
  ],
  providers: [
    AnalyticsService,
  ],
})
export class AdminModule {}


