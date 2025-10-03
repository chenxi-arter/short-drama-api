import { Controller, Get, Query } from '@nestjs/common';
import { BaseController } from './base.controller';
import { VideoService } from '../video.service';
import { CommentService } from '../services/comment.service';

@Controller('video/comments')
export class CommentsController extends BaseController {
  constructor(
    private readonly videoService: VideoService,
    private readonly commentService: CommentService,
  ) {
    super();
  }

  /**
   * 获取某剧集的评论列表（通过短ID）
   * 公开接口：GET /api/video/comments?episodeShortId=xxx&page=1&size=20
   */
  @Get()
  async listByEpisodeShortId(
    @Query('episodeShortId') episodeShortId?: string,
    @Query('page') page?: string,
    @Query('size') size?: string,
  ) {
    try {
      const shortId = (episodeShortId ?? '').trim();
      if (!shortId) return this.error('episodeShortId 必填', 400);

      const pageNum = Math.max(parseInt(page ?? '1', 10) || 1, 1);
      const sizeNum = Math.max(parseInt(size ?? '20', 10) || 20, 1);

      // 直接使用 shortId 查询评论，无需先查询 episode
      const result = await this.commentService.getCommentsByEpisodeShortId(
        shortId,
        pageNum,
        sizeNum,
      );
      return this.success(result, '获取评论成功', 200);
    } catch (error) {
      return this.handleServiceError(error, '获取评论失败');
    }
  }
}


