import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { LikedEpisodesService } from '../services/liked-episodes.service';
import { CategoryValidator } from '../../common/validators/category-validator';

/**
 * 用户点赞剧集控制器
 * 提供获取用户点赞剧集列表的功能
 */
@Controller('user/liked')
@UseGuards(JwtAuthGuard)
export class LikedEpisodesController {
  constructor(
    private readonly likedEpisodesService: LikedEpisodesService,
    private readonly categoryValidator: CategoryValidator
  ) {}

  /**
   * 获取用户点赞的剧集列表
   * GET /api/user/liked?page=1&size=20&categoryId=1
   * @param categoryId 分类ID（可选，用于筛选特定分类的点赞，支持动态验证）
   */
  @Get()
  async getLikedEpisodes(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('size') size?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    const userId: number = req.user?.userId;
    const pageNum = Math.max(parseInt(page ?? '1', 10) || 1, 1);
    const sizeNum = Math.max(parseInt(size ?? '20', 10) || 20, 1);
    
    // 解析并动态验证 categoryId
    let categoryIdNum: number | undefined;
    if (categoryId) {
      categoryIdNum = parseInt(categoryId, 10);
      if (isNaN(categoryIdNum) || categoryIdNum <= 0) {
        return {
          code: 400,
          message: '无效的分类ID格式',
          data: null,
        };
      }
      
      // 动态验证分类是否存在且启用
      const validation = await this.categoryValidator.validateCategoryId(categoryIdNum);
      if (!validation.valid) {
        const availableMsg = await this.categoryValidator.formatAvailableCategoriesMessage();
        return {
          code: 400,
          message: `${validation.message}。${availableMsg}`,
          data: null,
        };
      }
    }

    const result = await this.likedEpisodesService.getUserLikedEpisodes(userId, pageNum, sizeNum, categoryIdNum);

    return {
      code: 200,
      message: '获取点赞列表成功',
      data: result,
    };
  }

  /**
   * 获取用户点赞统计
   * GET /api/user/liked/stats
   */
  @Get('stats')
  async getLikedStats(@Req() req: any) {
    const userId: number = req.user?.userId;
    const stats = await this.likedEpisodesService.getUserLikedStats(userId);

    return {
      code: 200,
      message: '获取统计成功',
      data: stats,
    };
  }
}

