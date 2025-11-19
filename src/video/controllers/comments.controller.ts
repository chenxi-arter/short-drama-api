import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { BaseController } from './base.controller';
import { VideoService } from '../video.service';
import { CommentService } from '../services/comment.service';
import { OptionalJwtAuthGuard } from '../../auth/guards/optional-jwt-auth.guard';

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
   * 公开接口，但支持可选认证以返回用户点赞状态
   * GET /api/video/comments?episodeShortId=xxx&page=1&size=20
   */
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  async listByEpisodeShortId(
    @Req() req,
    @Query('episodeShortId') episodeShortId?: string,
    @Query('page') page?: string,
    @Query('size') size?: string,
  ) {
    try {
      const shortId = (episodeShortId ?? '').trim();
      if (!shortId) return this.error('episodeShortId 必填', 400);

      const pageNum = Math.max(parseInt(page ?? '1', 10) || 1, 1);
      const sizeNum = Math.max(parseInt(size ?? '20', 10) || 20, 1);

      // 获取用户ID（如果已登录）
      const userId = req.user?.userId;

      // 直接使用 shortId 查询评论，传入 userId 以获取点赞状态
      const result = await this.commentService.getCommentsByEpisodeShortId(
        shortId,
        pageNum,
        sizeNum,
        2, // replyPreviewCount
        userId,
      );
      return this.success(result, '获取评论成功', 200);
    } catch (error) {
      return this.handleServiceError(error, '获取评论失败');
    }
  }
}


