import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Episode } from '../entity/episode.entity';
import { EpisodeUrl } from '../entity/episode-url.entity';
import { Series } from '../entity/series.entity';
import { WatchProgress } from '../entity/watch-progress.entity';
import { WatchLog } from '../entity/watch-log.entity';
import { EpisodeService } from '../services/episode.service';
import { WatchProgressService } from '../services/watch-progress.service';
import { DauService } from '../../admin/services/dau.service';

@Module({
  imports: [TypeOrmModule.forFeature([Episode, EpisodeUrl, Series, WatchProgress, WatchLog])],
  providers: [EpisodeService, WatchProgressService, DauService],
  exports: [EpisodeService, WatchProgressService, TypeOrmModule],
})
export class EpisodeModule {}


