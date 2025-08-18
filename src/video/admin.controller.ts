import { Controller, Delete, Param, Post, Get, Query, ParseIntPipe } from '@nestjs/common';
import { VideoService } from './video.service';

/**
 * 管理员剧集管理控制器
 * 处理剧集的软删除、恢复等管理操作
 */
@Controller('admin/series')
export class AdminController {
  constructor(private readonly videoService: VideoService) {}

  /**
   * 软删除剧集
   * @param id 剧集ID
   * @param deletedBy 删除者用户ID（可选，从请求头或认证中获取）
   */
  @Delete(':id')
  async softDeleteSeries(
    @Param('id', ParseIntPipe) id: number,
    // @User() user?: any // 如果有用户认证的话
  ) {
    // const deletedBy = user?.id; // 从认证用户中获取
    const result = await this.videoService.softDeleteSeries(id);
    return result;
  }

  /**
   * 恢复已删除的剧集
   * @param id 剧集ID
   */
  @Post(':id/restore')
  async restoreSeries(@Param('id', ParseIntPipe) id: number) {
    const result = await this.videoService.restoreSeries(id);
    return result;
  }

  /**
   * 获取已删除的剧集列表
   * @param page 页码
   * @param size 每页数量
   */
  @Get('deleted')
  async getDeletedSeries(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('size', ParseIntPipe) size: number = 10
  ) {
    const result = await this.videoService.getDeletedSeries(page, size);
    return result;
  }
}

