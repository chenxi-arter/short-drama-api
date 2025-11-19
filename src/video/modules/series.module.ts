import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Series } from '../entity/series.entity';
import { Episode } from '../entity/episode.entity';
import { EpisodeUrl } from '../entity/episode-url.entity';
import { Category } from '../entity/category.entity';
import { FilterOption } from '../entity/filter-option.entity';
import { Banner } from '../entity/banner.entity';
import { BannerMetricDaily } from '../entity/banner-metric-daily.entity';
import { BrowseHistory } from '../entity/browse-history.entity';
import { Comment } from '../entity/comment.entity';
import { CommentLike } from '../entity/comment-like.entity';
import { SeriesService } from '../services/series.service';
import { EpisodeService } from '../services/episode.service';
import { BrowseHistoryService } from '../services/browse-history.service';
import { WatchProgressService } from '../services/watch-progress.service';
import { BannerService } from '../services/banner.service';
import { CommentService } from '../services/comment.service';
import { CommentLikeService } from '../services/comment-like.service';
import { FakeCommentService } from '../services/fake-comment.service';
import { CatalogModule } from './catalog.module';

@Module({
  imports: [
    CatalogModule,
    TypeOrmModule.forFeature([Series, Episode, EpisodeUrl, Category, FilterOption, BrowseHistory, Banner, BannerMetricDaily, Comment, CommentLike])
  ],
  providers: [
    SeriesService,
    EpisodeService,
    BrowseHistoryService,
    WatchProgressService,
    BannerService,
    FakeCommentService,  // 必须在 CommentService 之前
    CommentService,
    CommentLikeService,
  ],
  exports: [SeriesService, EpisodeService, CommentService, TypeOrmModule],
})
export class SeriesModule {}


