import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from '../user/entity/user.entity';
import { WatchProgress } from '../video/entity/watch-progress.entity';
import { Favorite } from '../user/entity/favorite.entity';
import { EpisodeReaction } from '../video/entity/episode-reaction.entity';
import { Comment } from '../video/entity/comment.entity';
import { CommentLike } from '../video/entity/comment-like.entity';
import { RefreshToken } from './entity/refresh-token.entity';

/**
 * 账户合并服务
 * 处理游客用户转正式用户时的数据合并
 */
@Injectable()
export class AccountMergeService {
  private readonly logger = new Logger(AccountMergeService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(WatchProgress)
    private readonly watchProgressRepo: Repository<WatchProgress>,
    @InjectRepository(Favorite)
    private readonly favoriteRepo: Repository<Favorite>,
    @InjectRepository(EpisodeReaction)
    private readonly episodeReactionRepo: Repository<EpisodeReaction>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(CommentLike)
    private readonly commentLikeRepo: Repository<CommentLike>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 合并游客账户数据到目标用户，并删除游客账户
   * @param guestUserId 游客用户ID
   * @param targetUserId 目标正式用户ID
   * @returns 合并统计信息
   */
  async mergeGuestToUser(guestUserId: number, targetUserId: number) {
    this.logger.log(`开始合并游客账户 ${guestUserId} 到正式用户 ${targetUserId}`);

    const stats = {
      watchProgress: 0,
      favorites: 0,
      episodeReactions: 0,
      comments: 0,
      commentLikes: 0,
    };

    // 使用事务确保数据一致性
    await this.dataSource.transaction(async (manager) => {
      // 1. 合并观看进度
      const watchProgresses = await manager.find(WatchProgress, {
        where: { userId: guestUserId },
      });

      for (const wp of watchProgresses) {
        // 检查目标用户是否已有相同剧集的观看进度
        const existing = await manager.findOne(WatchProgress, {
          where: { userId: targetUserId, episodeId: wp.episodeId },
        });

        if (existing) {
          // 保留更新时间更晚的记录
          if (new Date(wp.updatedAt) > new Date(existing.updatedAt)) {
            existing.stopAtSecond = wp.stopAtSecond;
            existing.updatedAt = wp.updatedAt;
            await manager.save(WatchProgress, existing);
          }
          // 删除游客的记录
          await manager.remove(WatchProgress, wp);
        } else {
          // 直接转移给目标用户
          wp.userId = targetUserId;
          await manager.save(WatchProgress, wp);
        }
        stats.watchProgress++;
      }

      // 2. 合并收藏
      const favorites = await manager.find(Favorite, {
        where: { userId: guestUserId },
      });

      for (const fav of favorites) {
        // 检查目标用户是否已收藏
        const whereCondition: any = {
          userId: targetUserId,
          seriesId: fav.seriesId,
          favoriteType: fav.favoriteType,
        };
        if (fav.episodeId) {
          whereCondition.episodeId = fav.episodeId;
        }
        const existing = await manager.findOne(Favorite, {
          where: whereCondition,
        });

        if (existing) {
          // 已存在，删除游客的收藏
          await manager.remove(Favorite, fav);
        } else {
          // 转移给目标用户
          fav.userId = targetUserId;
          await manager.save(Favorite, fav);
        }
        stats.favorites++;
      }

      // 3. 合并剧集点赞/点踩
      const reactions = await manager.find(EpisodeReaction, {
        where: { userId: guestUserId },
      });

      for (const reaction of reactions) {
        // 检查目标用户是否已有相同剧集的反应
        const existing = await manager.findOne(EpisodeReaction, {
          where: { userId: targetUserId, episodeId: reaction.episodeId },
        });

        if (existing) {
          // 保留更新时间更晚的记录
          if (new Date(reaction.updatedAt) > new Date(existing.updatedAt)) {
            existing.reactionType = reaction.reactionType;
            existing.updatedAt = reaction.updatedAt;
            await manager.save(EpisodeReaction, existing);
          }
          // 删除游客的记录
          await manager.remove(EpisodeReaction, reaction);
        } else {
          // 转移给目标用户
          reaction.userId = targetUserId;
          await manager.save(EpisodeReaction, reaction);
        }
        stats.episodeReactions++;
      }

      // 4. 合并评论（虽然游客不能评论，但为了完整性处理）
      const comments = await manager.find(Comment, {
        where: { userId: guestUserId },
      });

      for (const comment of comments) {
        comment.userId = targetUserId;
        await manager.save(Comment, comment);
        stats.comments++;
      }

      // 5. 合并评论点赞
      const commentLikes = await manager.find(CommentLike, {
        where: { userId: guestUserId },
      });

      for (const like of commentLikes) {
        // 检查目标用户是否已点赞同一条评论
        const existing = await manager.findOne(CommentLike, {
          where: { userId: targetUserId, commentId: like.commentId },
        });

        if (existing) {
          // 已存在，删除游客的点赞
          await manager.remove(CommentLike, like);
        } else {
          // 转移给目标用户
          like.userId = targetUserId;
          await manager.save(CommentLike, like);
        }
        stats.commentLikes++;
      }

      // 6. 删除游客的刷新令牌
      await manager.delete(RefreshToken, { userId: guestUserId });

      // 7. 删除游客用户
      await manager.delete(User, { id: guestUserId });

      this.logger.log(`账户合并完成: ${JSON.stringify(stats)}`);
    });

    return stats;
  }

  /**
   * 检查是否可以合并账户
   * @param guestUserId 游客用户ID
   * @returns 是否为有效的游客用户
   */
  async canMergeAccount(guestUserId: number): Promise<boolean> {
    const user = await this.userRepo.findOne({ where: { id: guestUserId } });
    return user?.isGuest === true;
  }
}
