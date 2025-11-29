import { Controller, Post, Get, Body, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { BaseController } from './base.controller';
import { CommentLikeService } from '../services/comment-like.service';

/**
 * 评论点赞控制器
 * 处理评论点赞相关的所有API
 */
@Controller('video/comment')
export class CommentLikeController extends BaseController {
  constructor(
    private readonly commentLikeService: CommentLikeService,
  ) {
    super();
  }

  /**
   * 点赞/取消点赞评论（切换状态）
   * POST /api/video/comment/like
   */
  @UseGuards(JwtAuthGuard)
  @Post('like')
  async toggleLike(
    @Req() req,
    @Body('commentId') commentId: number,
    @Body('action') action?: 'like' | 'unlike',
  ) {
    try {
      if (!commentId) {
        return this.error('评论ID不能为空', 400);
      }

      // 如果没有指定 action，则自动切换状态
      let result;
      if (!action) {
        // 先检查当前状态
        const hasLiked = await this.commentLikeService.hasLiked(
          req.user.userId,
          commentId,
        );
        
        if (hasLiked) {
          result = await this.commentLikeService.unlikeComment(
            req.user.userId,
            commentId,
          );
        } else {
          result = await this.commentLikeService.likeComment(
            req.user.userId,
            commentId,
          );
        }
      } else {
        // 根据指定的 action 执行
        if (action === 'like') {
          result = await this.commentLikeService.likeComment(
            req.user.userId,
            commentId,
          );
        } else {
          result = await this.commentLikeService.unlikeComment(
            req.user.userId,
            commentId,
          );
        }
      }

      if (!result.success) {
        return this.success(result, result.message, 200);
      }

      return this.success(
        {
          commentId,
          likeCount: result.likeCount,
          liked: action === 'like' || (!action && result.message.includes('点赞成功')),
        },
        result.message,
        200
      );
    } catch (error) {
      return this.handleServiceError(error, '操作失败');
    }
  }

  /**
   * 获取评论的点赞用户列表
   * POST /api/video/comment/like-users
   */
  @Post('like-users')
  async getLikeUsers(
    @Body('commentId') commentId: number,
    @Body('page') page?: number,
    @Body('size') size?: number,
  ) {
    try {
      if (!commentId) {
        return this.error('评论ID不能为空', 400);
      }

      const pageNum = Math.max(page || 1, 1);
      const sizeNum = Math.max(size || 20, 1);

      const result = await this.commentLikeService.getLikeUsers(
        commentId,
        pageNum,
        sizeNum,
      );

      return this.success(result, '获取成功', 200);
    } catch (error) {
      return this.handleServiceError(error, '获取点赞用户列表失败');
    }
  }

  /**
   * 获取用户收到的未读点赞通知
   * GET /api/video/comment/my-unread-likes?page=1&size=20
   */
  @UseGuards(JwtAuthGuard)
  @Get('my-unread-likes')
  async getMyUnreadLikes(
    @Req() req,
    @Query('page') page?: string,
    @Query('size') size?: string,
  ) {
    try {
      const userId = req.user?.userId;
      if (!userId) return this.error('未认证', 401);

      const pageNum = Math.max(parseInt(page ?? '1', 10) || 1, 1);
      const sizeNum = Math.max(parseInt(size ?? '20', 10) || 20, 1);

      const result = await this.commentLikeService.getUserUnreadLikes(
        userId,
        pageNum,
        sizeNum,
      );

      return this.success(result, '获取成功', 200);
    } catch (error) {
      return this.handleServiceError(error, '获取未读点赞失败');
    }
  }

  /**
   * 标记点赞通知为已读
   * POST /api/video/comment/likes/mark-read
   * Body: { likeIds?: number[] } // 可选，不传则标记所有未读点赞
   */
  @UseGuards(JwtAuthGuard)
  @Post('likes/mark-read')
  async markLikesAsRead(
    @Req() req,
    @Body('likeIds') likeIds?: number[],
  ) {
    try {
      const userId = req.user?.userId;
      if (!userId) return this.error('未认证', 401);

      const result = await this.commentLikeService.markLikesAsRead(
        userId,
        likeIds,
      );

      return this.success(result, '已标记为已读', 200);
    } catch (error) {
      return this.handleServiceError(error, '标记失败');
    }
  }

  /**
   * 获取未读点赞数量
   * GET /api/video/comment/unread-like-count
   */
  @UseGuards(JwtAuthGuard)
  @Get('unread-like-count')
  async getUnreadLikeCount(@Req() req) {
    try {
      const userId = req.user?.userId;
      if (!userId) return this.error('未认证', 401);

      const count = await this.commentLikeService.getUnreadLikeCount(userId);

      return this.success({ count }, '获取成功', 200);
    } catch (error) {
      return this.handleServiceError(error, '获取未读点赞数量失败');
    }
  }
}
