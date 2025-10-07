// src/video/browse-history.controller.ts
import { Controller, Get, Query, Delete, UseGuards, Req, Param, Post } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RateLimitGuard, RateLimit, RateLimitConfigs } from '../common/guards/rate-limit.guard';
import { BrowseHistoryService } from './services/browse-history.service';
import { BrowseHistoryCleanupService } from './services/browse-history-cleanup.service';
import { BaseController } from './controllers/base.controller';

/**
 * 私有浏览记录控制器
 * 提供用户私有浏览历史的管理功能
 */
@UseGuards(JwtAuthGuard, RateLimitGuard)
@Controller('video/browse-history')
export class BrowseHistoryController extends BaseController {
  constructor(
    private readonly browseHistoryService: BrowseHistoryService,
    private readonly browseHistoryCleanupService: BrowseHistoryCleanupService
  ) {
    super();
  }

  /**
   * 获取用户浏览记录
   * @param req 请求对象
   * @param page 页码
   * @param size 每页大小（默认10条）
   */
  @RateLimit(RateLimitConfigs.NORMAL)
  @Get()
  async getUserBrowseHistory(
    @Req() req,
    @Query('page') page: string = '1',
    @Query('size') size: string = '10'  // ✅ 修改默认值为10
  ) {
    try {
      const { page: pageNum, size: sizeNum } = this.normalizePagination(page, size, 200);

      const result = await this.browseHistoryService.getUserBrowseHistory(
        Number((req.user as any)?.userId),
        pageNum,
        sizeNum
      );

      return this.success(result, '获取浏览记录成功');
    } catch (error) {
      return this.handleServiceError(error, '获取浏览记录失败');
    }
  }

  /**
   * 获取用户最近浏览的剧集系列
   * @param req 请求对象
   * @param limit 限制数量
   */
  @RateLimit(RateLimitConfigs.NORMAL)
  @Get('recent')
  async getRecentBrowsedSeries(
    @Req() req,
    @Query('limit') limit: string = '10'
  ) {
    try {
      const limitNum = this.validateId(limit, '限制数量');

      const result = await this.browseHistoryService.getRecentBrowsedSeries(
        Number((req.user as any)?.userId),
        limitNum
      );

      return this.success(result, '获取最近浏览记录成功');
    } catch (error) {
      return this.handleServiceError(error, '获取最近浏览记录失败');
    }
  }

  /**
   * 同步浏览记录（用于客户端同步）
   * @param req 请求对象
   * @param seriesShortId 剧集系列ShortID
   * @param browseType 浏览类型
   * @param lastEpisodeNumber 最后访问的集数
   */
  @RateLimit(RateLimitConfigs.STRICT)
  @Get('sync')
  async syncBrowseHistory(
    @Req() req,
    @Query('seriesShortId') seriesShortId: string,
    @Query('browseType') browseType: string = 'episode_watch',
    @Query('lastEpisodeNumber') lastEpisodeNumber?: string
  ) {
    if (!seriesShortId) {
      return {
        code: 400,
        msg: '必须提供 seriesShortId',
        data: null
      };
    }
    
    // 通过 shortId 查找对应的 seriesId
    const series = await this.browseHistoryService.findSeriesByShortId(seriesShortId);
    if (!series) {
      return {
        code: 400,
        msg: '无效的系列ShortID',
        data: null
      };
    }
    
    const seriesIdNum = series.id;
    const episodeNumber = lastEpisodeNumber ? parseInt(lastEpisodeNumber, 10) : undefined;
    
    await this.browseHistoryService.recordBrowseHistory(
      Number((req.user as any)?.userId),
      seriesIdNum,
      browseType,
      episodeNumber,
      req
    );
    
    return {
      code: 200,
      msg: '浏览记录同步成功',
      data: null
    };
  }

  /**
   * 删除指定系列的浏览记录
   * @param req 请求对象
   * @param seriesId 剧集系列ID
   */
  @RateLimit(RateLimitConfigs.STRICT)
  @Delete(':seriesId')
  async deleteBrowseHistory(
    @Req() req,
    @Param('seriesId') seriesId: string
  ) {
    const seriesIdNum = parseInt(seriesId, 10);
    
    await this.browseHistoryService.deleteBrowseHistory(
      Number((req.user as any)?.userId),
      seriesIdNum
    );
    
    return {
      code: 200,
      msg: '浏览记录删除成功',
      data: null
    };
  }

  /**
   * 删除用户所有浏览记录
   * @param req 请求对象
   */
  @RateLimit(RateLimitConfigs.STRICT)
  @Delete()
  async deleteAllBrowseHistory(@Req() req) {
    await this.browseHistoryService.deleteBrowseHistory((req.user as any).userId);
    
    return {
      code: 200,
      msg: '所有浏览记录删除成功',
      data: null
    };
  }

  /**
   * 获取系统统计信息（管理员接口）
   */
  @RateLimit(RateLimitConfigs.NORMAL)
  @Get('stats')
  async getSystemStats() {
    const stats = await this.browseHistoryService.getSystemStats();
    
    return {
      code: 200,
      data: stats,
      msg: null
    };
  }

  /**
   * 清理过期浏览记录（管理员接口）
   */
  @RateLimit(RateLimitConfigs.STRICT)
  @Get('cleanup')
  async cleanupExpiredRecords() {
    await this.browseHistoryService.cleanupExpiredBrowseHistory();
    
    return {
      code: 200,
      msg: '过期记录清理完成',
      data: null
    };
  }

  /**
   * ✅ 新增：手动触发浏览记录清理任务（管理员接口）
   */
  @RateLimit(RateLimitConfigs.STRICT)
  @Post('cleanup-excess')
  async manualCleanupExcessRecords() {
    try {
      const result = await this.browseHistoryCleanupService.manualCleanup();
      
      return {
        code: 200,
        msg: '浏览记录清理任务完成',
        data: {
          processedUsers: result.processedUsers,
          totalCleanedRecords: result.totalCleanedRecords,
          duration: result.duration
        }
      };
    } catch {
      return {
        code: 500,
        msg: '浏览记录清理任务失败',
        data: null
      };
    }
  }

  /**
   * ✅ 新增：获取浏览记录清理统计信息（管理员接口）
   */
  @RateLimit(RateLimitConfigs.NORMAL)
  @Get('cleanup-stats')
  async getCleanupStats() {
    try {
      const stats = await this.browseHistoryCleanupService.getCleanupStats();
      
      return {
        code: 200,
        msg: '获取清理统计信息成功',
        data: stats
      };
    } catch {
      return {
        code: 500,
        msg: '获取清理统计信息失败',
        data: null
      };
    }
  }
}
