import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilterType } from '../entity/filter-type.entity';
import { FilterOption } from '../entity/filter-option.entity';
import { Category } from '../entity/category.entity';
import { Series } from '../entity/series.entity';
import { FilterService } from '../services/filter.service';
import { CategoryService } from '../services/category.service';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { AppConfigService } from '../../common/config/app-config.service';

@Module({
  imports: [TypeOrmModule.forFeature([FilterType, FilterOption, Category, Series])],
  providers: [FilterService, CategoryService, AppLoggerService, AppConfigService],
  exports: [FilterService, CategoryService, TypeOrmModule],
})
export class CatalogModule {}


