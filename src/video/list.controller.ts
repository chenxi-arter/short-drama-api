import { Controller, Get, Query } from '@nestjs/common';
import { VideoService } from './video.service';
import { FilterTagsDto } from './dto/filter-tags.dto';
import { FilterDataDto } from './dto/filter-data.dto';
import { ConditionFilterDto } from './dto/condition-filter.dto';

/**
 * 列表筛选相关控制器
 */
@Controller('/api/list')
export class ListController {
  constructor(private readonly videoService: VideoService) {}

  /**
   * 获取筛选器标签
   * @param dto 请求参数
   * @returns 筛选器标签列表
   */
  @Get('getfilterstags')
  async getFiltersTags(@Query() dto: FilterTagsDto) {
    return this.videoService.getFiltersTags(dto.channeid || '1');
  }

  /**
   * 获取筛选器列表数据
   * @param dto 请求参数
   * @returns 筛选后的视频列表
   */
  @Get('getfiltersdata')
  async getFiltersData(@Query() dto: FilterDataDto) {
    return this.videoService.getFiltersData(
      dto.channeid || '1',
      dto.ids || '0,0,0,0,0',
      dto.page || '1'
    );
  }

  /**
   * 获取条件筛选数据
   * @param dto 请求参数
   * @returns 根据条件筛选的视频列表
   */
  @Get('getconditionfilterdata')
  async getConditionFilterData(@Query() dto: ConditionFilterDto) {
    return this.videoService.getConditionFilterData(dto);
  }
}