import { Controller, Get, Query } from '@nestjs/common';
import { RecommendService } from '../services/recommend.service';
import { RecommendQueryDto } from '../dto/recommend.dto';
import { BaseController } from './base.controller';

/**
 * 推荐控制器
 * 提供类似抖音的随机推荐功能
 */
@Controller('video')
export class RecommendController extends BaseController {
  constructor(private readonly recommendService: RecommendService) {
    super();
  }

  /**
   * 获取推荐剧集列表
   * GET /api/video/recommend
   */
  @Get('recommend')
  async getRecommendList(@Query() dto: RecommendQueryDto) {
    try {
      const { page, size } = this.normalizePagination(dto.page, dto.size, 20);

      const result = await this.recommendService.getRecommendList(page, size);

      return this.success(result, '获取推荐成功', 200);
    } catch (error) {
      return this.handleServiceError(error, '获取推荐失败');
    }
  }
}
