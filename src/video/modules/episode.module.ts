import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Episode } from '../entity/episode.entity';
import { EpisodeUrl } from '../entity/episode-url.entity';
import { Series } from '../entity/series.entity';
import { EpisodeService } from '../services/episode.service';
import { WatchProgressService } from '../services/watch-progress.service';

@Module({
  imports: [TypeOrmModule.forFeature([Episode, EpisodeUrl, Series])],
  providers: [EpisodeService, WatchProgressService],
  exports: [EpisodeService, WatchProgressService, TypeOrmModule],
})
export class EpisodeModule {}


