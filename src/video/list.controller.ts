import { Controller, Get, Query } from '@nestjs/common';
import { VideoService } from './video.service';
import { FilterTagsDto } from './dto/filter-tags.dto';
import { FilterDataDto } from './dto/filter-data.dto';
import { ConditionFilterDto } from './dto/condition-filter.dto';
import { FuzzySearchDto } from './dto/fuzzy-search.dto';

/**
 * 列表筛选相关控制器
 */
@Controller('list')
export class ListController {
  constructor(private readonly videoService: VideoService) {}

  /**
   * 获取筛选器标签
   * @param dto 请求参数
   * @returns 筛选器标签列表
   */
  @Get('/getfilterstags')
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

  /**
   * 模糊搜索
   * 根据关键词在标题中进行模糊搜索
   * @param dto 请求参数
   * @returns 模糊搜索结果
   */
  @Get('fuzzysearch')
  async fuzzySearch(@Query() dto: FuzzySearchDto) {
    if (!dto.keyword || dto.keyword.trim() === '') {
      return {
        code: 400,
        msg: '搜索关键词不能为空',
        data: null
      };
    }
    
    return this.videoService.fuzzySearch(
      dto.keyword,
      dto.channeid,
      dto.page || 1,
      dto.size || 20
    );
  }

  /**
   * 清除筛选器缓存（测试用）
   * @param channeid 可选，指定频道ID
   */
  @Get('clearfiltercache')
  async clearFilterCache(@Query('channeid') channeid?: string) {
    await this.videoService.clearFilterCache(channeid);
    return {
      code: 200,
      msg: channeid ? `已清除频道 ${channeid} 的筛选器缓存` : '已清除所有筛选器缓存',
      data: null
    };
  }
}