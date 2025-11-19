import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Episode } from '../entity/episode.entity';
import { EpisodeReaction } from '../entity/episode-reaction.entity';
import { CommentService } from './comment.service';

export type EpisodeReactionType = 'like' | 'dislike' | 'favorite';

@Injectable()
export class EpisodeInteractionService {
  constructor(
    @InjectRepository(Episode)
    private readonly episodeRepo: Repository<Episode>,
    @InjectRepository(EpisodeReaction)
    private readonly reactionRepo: Repository<EpisodeReaction>,
    private readonly commentService: CommentService,
  ) {}

  /**
   * 记录用户对剧集的点赞/点踩操作
   * 如果用户已有反应，则更新反应类型；否则创建新记录
   */
  async recordReaction(userId: number, episodeId: number, type: 'like' | 'dislike'): Promise<{ changed: boolean; previousType?: string }> {
    const existing = await this.reactionRepo.findOne({
      where: { userId, episodeId },
    });

    if (existing) {
      // 如果已有相同的反应，不做任何操作
      if (existing.reactionType === type) {
        return { changed: false, previousType: existing.reactionType };
      }

      // 更新反应类型，需要调整计数
      const previousType = existing.reactionType;
      existing.reactionType = type;
      await this.reactionRepo.save(existing);

      // 减少旧类型的计数，增加新类型的计数
      if (previousType === 'like') {
        await this.episodeRepo.decrement({ id: episodeId }, 'likeCount', 1);
      } else {
        await this.episodeRepo.decrement({ id: episodeId }, 'dislikeCount', 1);
      }

      if (type === 'like') {
        await this.episodeRepo.increment({ id: episodeId }, 'likeCount', 1);
      } else {
        await this.episodeRepo.increment({ id: episodeId }, 'dislikeCount', 1);
      }

      return { changed: true, previousType };
    }

    // 创建新反应记录
    const reaction = this.reactionRepo.create({
      userId,
      episodeId,
      reactionType: type,
    });
    await this.reactionRepo.save(reaction);

    // 增加对应的计数
    if (type === 'like') {
      await this.episodeRepo.increment({ id: episodeId }, 'likeCount', 1);
    } else {
      await this.episodeRepo.increment({ id: episodeId }, 'dislikeCount', 1);
    }

    return { changed: true };
  }

  /**
   * 取消用户对剧集的点赞/点踩
   */
  async removeReaction(userId: number, episodeId: number): Promise<boolean> {
    const existing = await this.reactionRepo.findOne({
      where: { userId, episodeId },
    });

    if (!existing) {
      return false;
    }

    // 减少对应的计数
    if (existing.reactionType === 'like') {
      await this.episodeRepo.decrement({ id: episodeId }, 'likeCount', 1);
    } else {
      await this.episodeRepo.decrement({ id: episodeId }, 'dislikeCount', 1);
    }

    await this.reactionRepo.remove(existing);
    return true;
  }

  /**
   * 获取用户对某一集的反应状态
   */
  async getUserReaction(userId: number, episodeId: number): Promise<'like' | 'dislike' | null> {
    const reaction = await this.reactionRepo.findOne({
      where: { userId, episodeId },
    });
    return reaction ? reaction.reactionType : null;
  }

  /**
   * 批量获取用户对多个剧集的反应状态
   */
  async getUserReactions(userId: number, episodeIds: number[]): Promise<Map<number, 'like' | 'dislike'>> {
    if (episodeIds.length === 0) {
      return new Map();
    }

    // 使用IN查询获取用户对多个剧集的反应
    const allReactions = await this.reactionRepo
      .createQueryBuilder('r')
      .where('r.userId = :userId', { userId })
      .andWhere('r.episodeId IN (:...episodeIds)', { episodeIds })
      .getMany();

    const map = new Map<number, 'like' | 'dislike'>();
    allReactions.forEach(r => {
      map.set(r.episodeId, r.reactionType);
    });
    return map;
  }

  /**
   * 兼容旧的increment方法（用于favorite类型）
   */
  async increment(episodeId: number, type: EpisodeReactionType): Promise<void> {
    switch (type) {
      case 'like':
      case 'dislike':
        // like 和 dislike 现在通过 recordReaction 处理，这里不再直接增加计数
        throw new Error('Please use recordReaction for like/dislike operations');
      case 'favorite':
        await this.episodeRepo.increment({ id: episodeId }, 'favoriteCount', 1);
        break;
      default:
        throw new Error('Unsupported reaction type');
    }
  }

  // === 评论回复功能（盖楼） ===
  
  async addReply(
    userId: number,
    episodeShortId: string,
    parentId: number,
    content: string,
  ) {
    return this.commentService.addReply(userId, episodeShortId, parentId, content);
  }

  async getCommentReplies(
    commentId: number,
    page: number,
    size: number,
    userId?: number,
  ) {
    return this.commentService.getCommentReplies(commentId, page, size, userId);
  }

  /**
   * 获取用户收到的最新回复消息
   */
  async getUserReceivedReplies(
    userId: number,
    page: number,
    size: number,
  ) {
    return this.commentService.getUserReceivedReplies(userId, page, size);
  }
}


