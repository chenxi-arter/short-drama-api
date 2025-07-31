import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Comment } from '../entity/comment.entity';

/**
 * 评论管理服务
 * 负责视频评论和弹幕的管理
 */
@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  /**
   * 添加评论或弹幕
   */
  async addComment(
    userId: number,
    episodeId: number,
    content: string,
    appearSecond?: number
  ) {
    const comment = this.commentRepo.create({
      userId,
      episodeId,
      content,
      appearSecond: appearSecond ?? 0,
    });
    
    const saved = await this.commentRepo.save(comment);
    
    // 清除相关缓存
    await this.clearCommentCache(episodeId.toString());
    
    return saved;
  }

  /**
   * 获取剧集的评论列表
   */
  async getCommentsByEpisode(
    episodeId: number,
    page: number = 1,
    size: number = 20
  ) {
    const skip = (page - 1) * size;
    
    const [comments, total] = await this.commentRepo.findAndCount({
      where: { episodeId },
      order: { createdAt: 'DESC' },
      skip,
      take: size,
      relations: ['user'],
    });
    
    return {
      comments,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  /**
   * 获取剧集的弹幕列表
   */
  async getDanmuByEpisode(episodeId: number) {
    return this.commentRepo.find({
      where: {
        episodeId,
        appearSecond: { $gt: 0 } as any, // 弹幕有出现时间
      },
      order: { appearSecond: 'ASC' },
      relations: ['user'],
    });
  }

  /**
   * 删除评论
   */
  async deleteComment(commentId: number, userId?: number) {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId },
    });
    
    if (!comment) {
      throw new Error('评论不存在');
    }
    
    // 如果指定了用户ID，检查权限
    if (userId && comment.userId !== userId) {
      throw new Error('无权删除此评论');
    }
    
    await this.commentRepo.remove(comment);
    
    // 清除相关缓存
    await this.clearCommentCache(comment.episodeId.toString());
    
    return { ok: true };
  }

  /**
   * 获取用户的评论历史
   */
  async getUserComments(
    userId: number,
    page: number = 1,
    size: number = 20
  ) {
    const skip = (page - 1) * size;
    
    const [comments, total] = await this.commentRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip,
      take: size,
      relations: ['episode', 'episode.series'],
    });
    
    return {
      comments,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  /**
   * 获取评论统计信息
   */
  async getCommentStats(episodeId: number) {
    const totalComments = await this.commentRepo.count({
      where: { episodeId },
    });
    
    const danmuCount = await this.commentRepo.count({
      where: {
        episodeId,
        appearSecond: { $gt: 0 } as any,
      },
    });
    
    const regularComments = totalComments - danmuCount;
    
    return {
      totalComments,
      danmuCount,
      regularComments,
    };
  }

  /**
   * 举报评论
   */
  async reportComment(
    commentId: number,
    reporterId: number,
    reason: string
  ) {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId },
    });
    
    if (!comment) {
      throw new Error('评论不存在');
    }
    
    // 这里可以添加举报记录到专门的举报表
    // 暂时只是标记评论状态
    
    return { ok: true, message: '举报已提交' };
  }

  /**
   * 点赞评论
   */
  async likeComment(commentId: number, userId: number) {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId },
    });
    
    if (!comment) {
      throw new Error('评论不存在');
    }
    
    // 这里可以添加点赞记录到专门的点赞表
    // 暂时只返回成功状态，实际点赞逻辑需要单独的点赞表来实现
    
    // 清除相关缓存
    await this.clearCommentCache(comment.episodeId.toString());
    
    return { ok: true };
  }

  /**
   * 清除评论相关缓存
   */
  private async clearCommentCache(episodeId: string) {
    try {
      // 清除视频详情缓存
      await this.cacheManager.del(`video_details_${episodeId}`);
      
      // 清除评论列表缓存
      await this.cacheManager.del(`comments_${episodeId}`);
      
      // 清除弹幕缓存
      await this.cacheManager.del(`danmu_${episodeId}`);
    } catch (error) {
      console.error('清除评论缓存失败:', error);
    }
  }
}