import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrowseHistory } from '../entity/browse-history.entity';
import { User } from '../../user/entity/user.entity';
import { Series } from '../entity/series.entity';
import { BrowseHistoryService } from '../services/browse-history.service';

@Module({
  imports: [TypeOrmModule.forFeature([BrowseHistory, User, Series])],
  providers: [BrowseHistoryService],
  exports: [BrowseHistoryService, TypeOrmModule],
})
export class HistoryModule {}


