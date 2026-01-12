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
 * 优化版账户合并服务
 * 使用批量SQL操作，大幅提升性能
 */
@Injectable()
export class AccountMergeOptimizedService {
  private readonly logger = new Logger(AccountMergeOptimizedService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 优化版合并方法 - 使用批量SQL操作
   * 性能提升10-100倍
   */
  async mergeGuestToUser(guestUserId: number, targetUserId: number) {
    this.logger.log(`[优化版] 开始合并游客账户 ${guestUserId} 到正式用户 ${targetUserId}`);
    const startTime = Date.now();

    const stats = {
      watchProgress: 0,
      favorites: 0,
      episodeReactions: 0,
      comments: 0,
      commentLikes: 0,
      deletedDuplicates: 0,
      duration: 0,
    };

    await this.dataSource.transaction(async (manager) => {
      // 1. 合并观看进度 - 批量操作
      // 先删除目标用户中较旧的重复记录，保留游客的较新记录
      const watchProgressResult = await manager.query(`
        UPDATE watch_progress wp_guest
        INNER JOIN watch_progress wp_target 
          ON wp_guest.episode_id = wp_target.episode_id 
          AND wp_target.user_id = ?
        SET wp_target.stop_at_second = wp_guest.stop_at_second,
            wp_target.updated_at = wp_guest.updated_at
        WHERE wp_guest.user_id = ?
          AND wp_guest.updated_at > wp_target.updated_at
      `, [targetUserId, guestUserId]);
      
      // 删除游客的重复记录
      const deletedWatchProgress = await manager.query(`
        DELETE wp_guest FROM watch_progress wp_guest
        INNER JOIN watch_progress wp_target 
          ON wp_guest.episode_id = wp_target.episode_id 
          AND wp_target.user_id = ?
        WHERE wp_guest.user_id = ?
      `, [targetUserId, guestUserId]);
      stats.deletedDuplicates += deletedWatchProgress.affectedRows || 0;
      
      // 转移剩余的观看进度
      const movedWatchProgress = await manager.query(`
        UPDATE watch_progress 
        SET user_id = ? 
        WHERE user_id = ?
      `, [targetUserId, guestUserId]);
      stats.watchProgress = movedWatchProgress.affectedRows || 0;

      // 2. 合并收藏 - 批量操作
      // 删除重复的收藏
      const deletedFavorites = await manager.query(`
        DELETE fav_guest FROM favorites fav_guest
        INNER JOIN favorites fav_target 
          ON fav_guest.series_id = fav_target.series_id 
          AND fav_guest.favorite_type = fav_target.favorite_type
          AND COALESCE(fav_guest.episode_id, 0) = COALESCE(fav_target.episode_id, 0)
          AND fav_target.user_id = ?
        WHERE fav_guest.user_id = ?
      `, [targetUserId, guestUserId]);
      stats.deletedDuplicates += deletedFavorites.affectedRows || 0;
      
      // 转移剩余的收藏
      const movedFavorites = await manager.query(`
        UPDATE favorites 
        SET user_id = ? 
        WHERE user_id = ?
      `, [targetUserId, guestUserId]);
      stats.favorites = movedFavorites.affectedRows || 0;

      // 3. 合并剧集点赞/点踩 - 批量操作
      // 更新目标用户中较旧的记录
      await manager.query(`
        UPDATE episode_reactions er_guest
        INNER JOIN episode_reactions er_target 
          ON er_guest.episode_id = er_target.episode_id 
          AND er_target.user_id = ?
        SET er_target.reaction_type = er_guest.reaction_type,
            er_target.updated_at = er_guest.updated_at
        WHERE er_guest.user_id = ?
          AND er_guest.updated_at > er_target.updated_at
      `, [targetUserId, guestUserId]);
      
      // 删除游客的重复记录
      const deletedReactions = await manager.query(`
        DELETE er_guest FROM episode_reactions er_guest
        INNER JOIN episode_reactions er_target 
          ON er_guest.episode_id = er_target.episode_id 
          AND er_target.user_id = ?
        WHERE er_guest.user_id = ?
      `, [targetUserId, guestUserId]);
      stats.deletedDuplicates += deletedReactions.affectedRows || 0;
      
      // 转移剩余的反应
      const movedReactions = await manager.query(`
        UPDATE episode_reactions 
        SET user_id = ? 
        WHERE user_id = ?
      `, [targetUserId, guestUserId]);
      stats.episodeReactions = movedReactions.affectedRows || 0;

      // 4. 合并评论 - 直接转移（游客理论上没有评论）
      const movedComments = await manager.query(`
        UPDATE comments 
        SET user_id = ? 
        WHERE user_id = ?
      `, [targetUserId, guestUserId]);
      stats.comments = movedComments.affectedRows || 0;

      // 5. 合并评论点赞 - 批量操作
      // 删除重复的点赞
      const deletedCommentLikes = await manager.query(`
        DELETE cl_guest FROM comment_likes cl_guest
        INNER JOIN comment_likes cl_target 
          ON cl_guest.comment_id = cl_target.comment_id 
          AND cl_target.user_id = ?
        WHERE cl_guest.user_id = ?
      `, [targetUserId, guestUserId]);
      stats.deletedDuplicates += deletedCommentLikes.affectedRows || 0;
      
      // 转移剩余的评论点赞
      const movedCommentLikes = await manager.query(`
        UPDATE comment_likes 
        SET user_id = ? 
        WHERE user_id = ?
      `, [targetUserId, guestUserId]);
      stats.commentLikes = movedCommentLikes.affectedRows || 0;

      // 6. 删除游客的刷新令牌
      await manager.delete(RefreshToken, { userId: guestUserId });

      // 7. 删除游客用户
      await manager.delete(User, { id: guestUserId });

      stats.duration = Date.now() - startTime;
      this.logger.log(`[优化版] 账户合并完成: ${JSON.stringify(stats)}`);
    });

    return stats;
  }

  /**
   * 检查是否可以合并账户
   */
  async canMergeAccount(guestUserId: number): Promise<boolean> {
    const user = await this.userRepo.findOne({ where: { id: guestUserId } });
    return user?.isGuest === true;
  }

  /**
   * 获取合并预览信息
   * 在合并前告诉用户将要合并多少数据
   */
  async getMergePreview(guestUserId: number) {
    const [watchProgress] = await this.dataSource.query(
      'SELECT COUNT(*) as count FROM watch_progress WHERE user_id = ?',
      [guestUserId]
    );
    const [favorites] = await this.dataSource.query(
      'SELECT COUNT(*) as count FROM favorites WHERE user_id = ?',
      [guestUserId]
    );
    const [reactions] = await this.dataSource.query(
      'SELECT COUNT(*) as count FROM episode_reactions WHERE user_id = ?',
      [guestUserId]
    );
    const [comments] = await this.dataSource.query(
      'SELECT COUNT(*) as count FROM comments WHERE user_id = ?',
      [guestUserId]
    );
    const [commentLikes] = await this.dataSource.query(
      'SELECT COUNT(*) as count FROM comment_likes WHERE user_id = ?',
      [guestUserId]
    );

    return {
      watchProgress: watchProgress[0].count,
      favorites: favorites[0].count,
      episodeReactions: reactions[0].count,
      comments: comments[0].count,
      commentLikes: commentLikes[0].count,
      total: watchProgress[0].count + favorites[0].count + 
             reactions[0].count + comments[0].count + commentLikes[0].count,
    };
  }
}
