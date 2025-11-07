import { Controller, Get, Query } from '@nestjs/common';
import { AdminResponseUtil } from '../common/utils/admin-response.util';
import { VideoService } from './video.service';
import { FilterTagsDto } from './dto/filter-tags.dto';
import { FilterDataDto } from './dto/filter-data.dto';
import { ConditionFilterDto } from './dto/condition-filter.dto';
import { FuzzySearchDto } from './dto/fuzzy-search.dto';
import { CategoryValidator } from '../common/validators/category-validator';

/**
 * 列表筛选相关控制器
 */
@Controller('list')
export class ListController {
  constructor(
    private readonly videoService: VideoService,
    private readonly categoryValidator: CategoryValidator
  ) {}

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
   * GET /api/list/fuzzysearch?keyword=xxx&categoryId=1&page=1&size=20
   * @param dto 请求参数
   * @returns 模糊搜索结果
   */
  @Get('fuzzysearch')
  async fuzzySearch(@Query() dto: FuzzySearchDto) {
    if (!dto.keyword || dto.keyword.trim() === '') {
      const resp = AdminResponseUtil.error('搜索关键词不能为空', 400);
      return { code: resp.code, msg: '搜索关键词不能为空', data: null, success: resp.success, timestamp: resp.timestamp };
    }
    
    // 如果指定了 categoryId，验证其有效性
    if (dto.categoryId) {
      const categoryIdNum = parseInt(dto.categoryId, 10);
      if (isNaN(categoryIdNum) || categoryIdNum <= 0) {
        const resp = AdminResponseUtil.error('无效的分类ID格式', 400);
        return { code: resp.code, msg: '无效的分类ID格式', data: null, success: resp.success, timestamp: resp.timestamp };
      }
      
      // 动态验证分类是否存在且启用
      const validation = await this.categoryValidator.validateCategoryId(categoryIdNum);
      if (!validation.valid) {
        const availableMsg = await this.categoryValidator.formatAvailableCategoriesMessage();
        const resp = AdminResponseUtil.error(`${validation.message}。${availableMsg}`, 400);
        return { code: resp.code, msg: `${validation.message}。${availableMsg}`, data: null, success: resp.success, timestamp: resp.timestamp };
      }
    }
    
    return this.videoService.fuzzySearch(
      dto.keyword,
      dto.categoryId,
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
    const message = channeid ? `已清除频道 ${channeid} 的筛选器缓存` : '已清除所有筛选器缓存';
    const resp = AdminResponseUtil.success(null, message);
    return { code: resp.code, msg: message, data: null, success: resp.success, timestamp: resp.timestamp };
  }
}