import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoController } from '../video.controller';
import { PublicVideoController } from '../public-video.controller';
import { BrowseHistoryController } from '../browse-history.controller';
import { HomeController } from '../home.controller';
import { ListController } from '../list.controller';
import { CategoryController } from '../category.controller';
import { BannerController } from '../controllers/banner.controller';
import { VideoService } from '../video.service';
import { CommentService } from '../services/comment.service';
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
    PublicVideoController,
    VideoController,
    HomeController,
    ListController,
    CategoryController,
    BannerController,
    BrowseHistoryController,
  ],
  providers: [VideoService, CommentService],
  exports: [],
})
export class VideoApiModule {}


