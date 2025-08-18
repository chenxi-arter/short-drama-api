// src/video/browse-history.controller.ts
import { Controller, Get, Query, Delete, UseGuards, Req, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RateLimitGuard, RateLimit, RateLimitConfigs } from '../common/guards/rate-limit.guard';
import { BrowseHistoryService } from './services/browse-history.service';

/**
 * 浏览记录控制器
 * 提供用户浏览历史的管理功能
 */
@UseGuards(JwtAuthGuard, RateLimitGuard)
@Controller('video/browse-history')
export class BrowseHistoryController {
  constructor(private readonly browseHistoryService: BrowseHistoryService) {}

  /**
   * 获取用户浏览记录
   * @param req 请求对象
   * @param page 页码
   * @param size 每页大小
   */
  @RateLimit(RateLimitConfigs.NORMAL)
  @Get()
  async getUserBrowseHistory(
    @Req() req,
    @Query('page') page: string = '1',
    @Query('size') size: string = '20'
  ) {
    const pageNum = parseInt(page, 10);
    const sizeNum = parseInt(size, 10);
    
    return this.browseHistoryService.getUserBrowseHistory(
      req.user.userId,
      pageNum,
      sizeNum
    );
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
    const limitNum = parseInt(limit, 10);
    
    return {
      code: 200,
      data: await this.browseHistoryService.getRecentBrowsedSeries(
        req.user.userId,
        limitNum
      ),
      msg: null
    };
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
    @Query('browseType') browseType: string = 'episode_list',
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
      req.user.userId,
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
      req.user.userId,
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
    await this.browseHistoryService.deleteBrowseHistory(req.user.userId);
    
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
}
