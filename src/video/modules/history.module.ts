import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrowseHistory } from '../entity/browse-history.entity';
import { User } from '../../user/entity/user.entity';
import { Series } from '../entity/series.entity';
import { BrowseHistoryService } from '../services/browse-history.service';
import { BrowseHistoryCleanupService } from '../services/browse-history-cleanup.service';
import { BrowseHistoryController } from '../browse-history.controller';
import { CategoryValidator } from '../../common/validators/category-validator';
import { CategoryService } from '../services/category.service';
import { Category } from '../entity/category.entity';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { AppConfigService } from '../../common/config/app-config.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([BrowseHistory, User, Series, Category]),
  ],
  controllers: [BrowseHistoryController],
  providers: [
    BrowseHistoryService,
    BrowseHistoryCleanupService,
    CategoryService,
    CategoryValidator,
    AppLoggerService,
    AppConfigService,
  ],
  exports: [BrowseHistoryService, BrowseHistoryCleanupService, TypeOrmModule],
})
export class HistoryModule {}


