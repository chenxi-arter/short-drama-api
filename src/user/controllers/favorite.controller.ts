import { Controller, Get, Post, Query, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { FavoriteService } from '../services/favorite.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Episode } from '../../video/entity/episode.entity';
import { CategoryValidator } from '../../common/validators/category-validator';

@Controller('user/favorites')
@UseGuards(JwtAuthGuard)
export class FavoriteController {
  constructor(
    private readonly favoriteService: FavoriteService,
    @InjectRepository(Episode)
    private readonly episodeRepo: Repository<Episode>,
    private readonly categoryValidator: CategoryValidator
  ) {}

  /**
   * 获取用户收藏列表
   * GET /api/user/favorites?page=1&size=20&categoryId=1
   * @param categoryId 分类ID（可选，用于筛选特定分类的收藏，支持动态验证）
   */
  @Get()
  async getFavorites(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('size') size?: string,
    @Query('categoryId') categoryId?: string,  // ✅ 支持分类筛选参数，动态验证
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

    const result = await this.favoriteService.getUserFavorites(userId, pageNum, sizeNum, categoryIdNum);

    return {
      code: 200,
      message: '获取收藏列表成功',
      data: result,
    };
  }

  /**
   * 取消收藏
   * POST /api/user/favorites/remove
   * 
   * 说明：
   * - 添加收藏请使用 POST /api/video/episode/activity 接口（type: 'favorite'）
   * - 收藏是针对系列的，通过任意一集的 shortId 都可以取消该系列的收藏
   */
  @Post('remove')
  async removeFavorite(
    @Req() req: any,
    @Body() body: { shortId: string },
  ) {
    const userId: number = req.user?.userId;
    const { shortId } = body;

    if (!shortId) {
      return {
        code: 400,
        message: 'shortId 必填',
      };
    }

    // 通过 shortId 查找剧集
    const episode = await this.episodeRepo.findOne({
      where: { shortId },
      select: ['id', 'seriesId', 'shortId'],
    });

    if (!episode) {
      return {
        code: 404,
        message: '剧集不存在',
      };
    }

    // 取消收藏系列（不传 episodeId）
    const removed = await this.favoriteService.removeFavorite(
      userId,
      episode.seriesId,
    );

    return {
      code: 200,
      message: removed ? '取消收藏成功' : '未找到该收藏',
      data: {
        removed,
        shortId,
        seriesId: episode.seriesId,
        favoriteType: 'series',  // 收藏类型为系列
      },
    };
  }

  /**
   * 获取收藏统计
   * GET /api/user/favorites/stats
   */
  @Get('stats')
  async getFavoriteStats(@Req() req: any) {
    const userId: number = req.user?.userId;
    const stats = await this.favoriteService.getUserFavoriteStats(userId);

    return {
      code: 200,
      message: '获取统计成功',
      data: stats,
    };
  }
}

