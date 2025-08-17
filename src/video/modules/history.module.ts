import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrowseHistory } from '../entity/browse-history.entity';
import { BrowseHistoryService } from '../services/browse-history.service';

@Module({
  imports: [TypeOrmModule.forFeature([BrowseHistory])],
  providers: [BrowseHistoryService],
  exports: [BrowseHistoryService, TypeOrmModule],
})
export class HistoryModule {}


