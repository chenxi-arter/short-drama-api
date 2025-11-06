import { Controller, Get, Query } from '@nestjs/common';
import { SearchSuggestionsService } from '../services/search-suggestions.service';
import { BaseController } from './base.controller';

/**
 * 搜索相关控制器
 */
@Controller('search')
export class SearchController extends BaseController {
  constructor(
    private readonly searchSuggestionsService: SearchSuggestionsService
  ) {
    super();
  }

  /**
   * 获取热门搜索建议
   * 用于搜索框展示，随机返回最近热度最高的剧集
   * 
   * GET /api/search/hot-suggestions?limit=10&categoryId=1
   * 
   * @param limit 返回数量，默认10
   * @param categoryId 分类ID（可选）
   * @param daysRange 时间范围（天数），默认30天
   */
  @Get('hot-suggestions')
  async getHotSuggestions(
    @Query('limit') limit?: string,
    @Query('categoryId') categoryId?: string,
    @Query('daysRange') daysRange?: string
  ) {
    try {
      const limitNum = limit ? Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50) : 10;
      const categoryIdNum = categoryId ? parseInt(categoryId, 10) : undefined;
      const daysRangeNum = daysRange ? parseInt(daysRange, 10) : 30;

      const suggestions = await this.searchSuggestionsService.getHotSearchSuggestions(
        limitNum,
        categoryIdNum,
        daysRangeNum
      );

      return this.success(suggestions, '获取热门搜索建议成功');
    } catch (error) {
      return this.handleServiceError(error, '获取热门搜索建议失败');
    }
  }

  /**
   * 获取简化版热门搜索词（只返回标题数组）
   * 用于搜索框placeholder轮播
   * 
   * GET /api/search/hot-keywords?limit=5
   */
  @Get('hot-keywords')
  async getHotKeywords(
    @Query('limit') limit?: string,
    @Query('categoryId') categoryId?: string
  ) {
    try {
      const limitNum = limit ? Math.min(Math.max(parseInt(limit, 10) || 5, 1), 20) : 5;
      const categoryIdNum = categoryId ? parseInt(categoryId, 10) : undefined;

      const suggestions = await this.searchSuggestionsService.getHotSearchSuggestions(
        limitNum,
        categoryIdNum,
        30 // 最近30天
      );

      // 只返回标题数组
      const keywords = suggestions.map(s => s.title);

      return this.success(keywords, '获取热门关键词成功');
    } catch (error) {
      return this.handleServiceError(error, '获取热门关键词失败');
    }
  }
}

