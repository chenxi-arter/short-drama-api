import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { RecommendService } from '../services/recommend.service';
import { RecommendQueryDto } from '../dto/recommend.dto';
import { BaseController } from './base.controller';
import { OptionalJwtAuthGuard } from '../../auth/guards/optional-jwt-auth.guard';

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
   * 支持可选登录：登录用户会返回交互状态，未登录用户仅返回基础数据
   */
  @Get('recommend')
  @UseGuards(OptionalJwtAuthGuard)
  async getRecommendList(
    @Query() dto: RecommendQueryDto,
    @Req() req: { user?: { userId?: number } },
  ) {
    try {
      const { page, size } = this.normalizePagination(dto.page, dto.size, 20);
      const userId = req.user?.userId;

      const result = await this.recommendService.getRecommendList(page, size, userId);

      return this.success(result, '获取推荐成功', 200);
    } catch (error) {
      return this.handleServiceError(error, '获取推荐失败');
    }
  }
}
