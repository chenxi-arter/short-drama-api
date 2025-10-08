import { Body, Controller, Post, Get, Param, Query, BadRequestException, UseGuards, Req } from '@nestjs/common';
import { BaseController } from '../controllers/base.controller';
import { EpisodeInteractionService, EpisodeReactionType } from '../services/episode-interaction.service';
import { EpisodeService } from '../services/episode.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { VideoService } from '../video.service';
import { FavoriteService } from '../../user/services/favorite.service';

// 保留类型声明以供内部复用
class EpisodeActivityDto {
  shortId: string; // episode short id
  type: 'play' | EpisodeReactionType; // 'play' | 'like' | 'dislike' | 'favorite'
}

@Controller('video/episode')
export class InteractionController extends BaseController {
  constructor(
    private readonly interactionService: EpisodeInteractionService,
    private readonly episodeService: EpisodeService,
    private readonly videoService: VideoService,
    private readonly favoriteService: FavoriteService,
  ) { super(); }

  // 合并接口：通过短ID提交单一动作（播放或互动）
  // Body: { shortId: string, type: 'play' | 'like' | 'dislike' | 'favorite' }
  @UseGuards(JwtAuthGuard)
  @Post('activity')
  async activity(
    @Body() body: EpisodeActivityDto,
    @Req() req: { user?: { userId?: number } },
  ) {
    const shortId = body?.shortId?.trim();
    if (!shortId) throw new BadRequestException('shortId 必填');

    const episode = await this.episodeService.getEpisodeByShortId(shortId);
    if (!episode) return this.error('剧集不存在', 404);

    const type = body?.type;
    if (!type) return this.error('type 必填', 400);

    if (type === 'play') {
      await this.episodeService.incrementPlayCount(episode.id);
      return this.success({ episodeId: episode.id, shortId, type: 'play' }, '已更新');
    }

    if (!['like','dislike','favorite'].includes(type)) {
      return this.error('type 必须是 play|like|dislike|favorite', 400);
    }

    // 如果是收藏操作，且用户已登录，则同时存储到收藏表
    if (type === 'favorite' && req && typeof req === 'object' && 'user' in req) {
      const user = (req as { user?: { userId?: number } }).user;
      if (user && typeof user.userId === 'number') {
        try {
          await this.favoriteService.addFavorite(user.userId, episode.seriesId, episode.id);
        } catch (error: any) {
          console.error('收藏操作失败:', error);
          // 如果是重复收藏错误，不抛出异常，继续执行
          if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'ER_DUP_ENTRY') {
            console.log('用户已收藏该剧集，跳过重复收藏');
          } else {
            // 其他错误继续抛出
            throw error;
          }
        }
      }
    }

    await this.interactionService.increment(episode.id, type);
    return this.success({ episodeId: episode.id, shortId, type }, '已更新');
  }

  @UseGuards(JwtAuthGuard)
  @Post('comment')
  async comment(
    @Req() req: { user?: { userId?: number } },
    @Body() body: { shortId: string, content: string }
  ) {
    const shortId = body?.shortId?.trim();
    if (!shortId) throw new BadRequestException('shortId 必填');

    // 验证剧集是否存在
    const episode = await this.episodeService.getEpisodeByShortId(shortId);
    if (!episode) return this.error('剧集不存在', 404);

    const content = body?.content?.trim();
    if (!content) throw new BadRequestException('评论内容必填');

    const userId = req.user?.userId ? Number(req.user.userId) : 0;
    if (!userId) return this.error('未认证', 401);

    // 使用 shortId 存储评论
    const result = await this.videoService.addComment(userId, shortId, content);
    return this.success(result, '评论发表成功', 200);
  }

  /**
   * 回复评论（盖楼功能）
   */
  @UseGuards(JwtAuthGuard)
  @Post('comment/reply')
  async replyComment(
    @Req() req: { user?: { userId?: number } },
    @Body() body: { episodeShortId: string, parentId: number, content: string }
  ) {
    const userId = req.user?.userId ? Number(req.user.userId) : 0;
    if (!userId) return this.error('未认证', 401);

    const { episodeShortId, parentId, content } = body;
    
    if (!episodeShortId?.trim()) throw new BadRequestException('episodeShortId 必填');
    if (!parentId) throw new BadRequestException('parentId 必填');
    if (!content?.trim()) throw new BadRequestException('评论内容必填');

    try {
      const result = await this.interactionService.addReply(
        userId,
        episodeShortId.trim(),
        parentId,
        content.trim(),
      );
      return this.success(result, '回复成功', 200);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : '回复失败';
      return this.error(errMsg, 400);
    }
  }

  /**
   * 获取某条评论的所有回复
   */
  @Get('comments/:commentId/replies')
  async getCommentReplies(
    @Param('commentId') commentId: string,
    @Query('page') page?: string,
    @Query('size') size?: string,
  ) {
    try {
      const pageNum = Math.max(parseInt(page ?? '1', 10) || 1, 1);
      const sizeNum = Math.max(parseInt(size ?? '20', 10) || 20, 1);
      
      const result = await this.interactionService.getCommentReplies(
        parseInt(commentId, 10),
        pageNum,
        sizeNum,
      );
      return this.success(result, '获取成功', 200);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : '获取失败';
      return this.error(errMsg, 400);
    }
  }
}


