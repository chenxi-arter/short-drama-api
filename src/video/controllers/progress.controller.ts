import { Controller, Post, Body, Get, Query, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { VideoService } from '../video.service';
import { BaseController } from './base.controller';

/**
 * 播放进度控制器
 * 处理用户观看进度相关的所有API
 */
@UseGuards(JwtAuthGuard)
@Controller('video/progress')
export class ProgressController extends BaseController {
  constructor(private readonly videoService: VideoService) {
    super();
  }

  /**
   * 保存观看进度
   * 支持ID或ShortID自动识别，并自动记录浏览历史
   */
  @Post()
  async saveProgress(
    @Req() req,
    @Body('episodeIdentifier') episodeIdentifier: string | number,
    @Body('stopAtSecond') stopAtSecond: number,
  ) {
    try {
      if (!episodeIdentifier) {
        return this.error('剧集标识符不能为空', 400);
      }

      if (!stopAtSecond || stopAtSecond < 0) {
        return this.error('观看进度必须大于等于0', 400);
      }

      // 自动识别是shortId还是ID
      const isShortId = typeof episodeIdentifier === 'string' &&
        episodeIdentifier.length === 11 &&
        !/^\d+$/.test(episodeIdentifier);

      if (isShortId) {
        // 通过shortId找到episode ID
        const episode = await this.videoService.getEpisodeByShortId(episodeIdentifier);
        if (!episode) {
          return this.error('剧集不存在', 404);
        }
        // 保存进度并自动记录浏览历史
        const result = await this.videoService.saveProgressWithBrowseHistory(
          req.user.userId,
          episode.id,
          stopAtSecond,
          req
        );
        return this.success(result, '观看进度保存成功', 200);
      } else {
        const result = await this.videoService.saveProgressWithBrowseHistory(
          req.user.userId,
          Number(episodeIdentifier),
          stopAtSecond,
          req
        );
        return this.success(result, '观看进度保存成功', 200);
      }
    } catch (error) {
      return this.handleServiceError(error, '保存观看进度失败');
    }
  }

  /**
   * 获取观看进度
   * 支持ID或ShortID自动识别
   */
  @Get()
  async getProgress(
    @Req() req,
    @Query('episodeIdentifier') episodeIdentifier: string
  ) {
    try {
      if (!episodeIdentifier) {
        return this.error('剧集标识符不能为空', 400);
      }

      // 自动识别是shortId还是ID
      const isShortId = episodeIdentifier.length === 11 && !/^\d+$/.test(episodeIdentifier);

      if (isShortId) {
        // 通过shortId找到episode ID
        const episode = await this.videoService.getEpisodeByShortId(episodeIdentifier);
        if (!episode) {
          return this.error('剧集不存在', 404);
        }
        const result = await this.videoService.getProgress(req.user.userId, episode.id);
        return this.success(result, '获取观看进度成功', 200);
      } else {
        const result = await this.videoService.getProgress(req.user.userId, Number(episodeIdentifier));
        return this.success(result, '获取观看进度成功', 200);
      }
    } catch (error) {
      return this.handleServiceError(error, '获取观看进度失败');
    }
  }
}
