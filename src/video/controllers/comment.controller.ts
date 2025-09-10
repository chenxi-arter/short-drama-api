import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { VideoService } from '../video.service';
import { BaseController } from './base.controller';

/**
 * 评论控制器
 * 处理用户评论相关的所有API
 */
@UseGuards(JwtAuthGuard)
@Controller('video/comment')
export class CommentController extends BaseController {
  constructor(private readonly videoService: VideoService) {
    super();
  }

  /**
   * 添加评论/弹幕
   * 支持ID或ShortID自动识别
   */
  @Post()
  async addComment(
    @Req() req,
    @Body('episodeIdentifier') episodeIdentifier: string | number,
    @Body('content') content: string,
    @Body('appearSecond') appearSecond?: number,
  ) {
    try {
      if (!episodeIdentifier) {
        return this.error('剧集标识符不能为空', 400);
      }

      if (!content || content.trim().length === 0) {
        return this.error('评论内容不能为空', 400);
      }

      if (content.length > 500) {
        return this.error('评论内容不能超过500个字符', 400);
      }

      if (appearSecond !== undefined && (appearSecond < 0 || appearSecond > 86400)) {
        return this.error('弹幕出现时间无效', 400);
      }

      // 自动识别是shortId还是ID
      const isShortId = typeof episodeIdentifier === 'string' &&
        episodeIdentifier.length === 11 &&
        !/^\d+$/.test(episodeIdentifier);

      if (isShortId) {
        // 通过shortId找到episode ID
        const episode = await this.videoService.getEpisodeByShortId(episodeIdentifier as string);
        if (!episode) {
          return this.error('剧集不存在', 404);
        }
        const result = await this.videoService.addComment(
          req.user.userId,
          episode.id,
          content.trim(),
          appearSecond
        );
        return this.success(result, '评论发表成功', 200);
      } else {
        const result = await this.videoService.addComment(
          req.user.userId,
          Number(episodeIdentifier),
          content.trim(),
          appearSecond
        );
        return this.success(result, '评论发表成功', 200);
      }
    } catch (error) {
      return this.handleServiceError(error, '发表评论失败');
    }
  }
}
