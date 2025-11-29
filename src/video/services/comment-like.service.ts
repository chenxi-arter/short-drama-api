import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommentLike } from '../entity/comment-like.entity';
import { Comment } from '../entity/comment.entity';

/**
 * 评论点赞服务
 * 处理评论点赞/取消点赞的业务逻辑
 */
@Injectable()
export class CommentLikeService {
  constructor(
    @InjectRepository(CommentLike)
    private readonly commentLikeRepo: Repository<CommentLike>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
  ) {}

  /**
   * 点赞评论
   * @param userId 用户ID
   * @param commentId 评论ID
   * @returns 点赞结果
   */
  async likeComment(userId: number, commentId: number) {
    // 1. 检查评论是否存在
    const comment = await this.commentRepo.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new Error('评论不存在');
    }

    // 2. 检查是否已经点赞
    const existingLike = await this.commentLikeRepo.findOne({
      where: { userId, commentId },
    });

    if (existingLike) {
      return {
        success: false,
        message: '已经点赞过了',
        likeCount: comment.likeCount,
      };
    }

    // 3. 创建点赞记录
    const like = this.commentLikeRepo.create({
      userId,
      commentId,
    });
    await this.commentLikeRepo.save(like);

    // 4. 更新评论的点赞数
    await this.commentRepo.increment({ id: commentId }, 'likeCount', 1);

    return {
      success: true,
      message: '点赞成功',
      likeCount: comment.likeCount + 1,
    };
  }

  /**
   * 取消点赞评论
   * @param userId 用户ID
   * @param commentId 评论ID
   * @returns 取消点赞结果
   */
  async unlikeComment(userId: number, commentId: number) {
    // 1. 检查评论是否存在
    const comment = await this.commentRepo.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new Error('评论不存在');
    }

    // 2. 查找点赞记录
    const existingLike = await this.commentLikeRepo.findOne({
      where: { userId, commentId },
    });

    if (!existingLike) {
      return {
        success: false,
        message: '还未点赞',
        likeCount: comment.likeCount,
      };
    }

    // 3. 删除点赞记录
    await this.commentLikeRepo.remove(existingLike);

    // 4. 更新评论的点赞数（确保不会小于0）
    if (comment.likeCount > 0) {
      await this.commentRepo.decrement({ id: commentId }, 'likeCount', 1);
    }

    return {
      success: true,
      message: '取消点赞成功',
      likeCount: Math.max(0, comment.likeCount - 1),
    };
  }

  /**
   * 检查用户是否点赞了某条评论
   * @param userId 用户ID
   * @param commentId 评论ID
   * @returns 是否已点赞
   */
  async hasLiked(userId: number, commentId: number): Promise<boolean> {
    const like = await this.commentLikeRepo.findOne({
      where: { userId, commentId },
    });
    return !!like;
  }

  /**
   * 批量检查用户是否点赞了多条评论
   * @param userId 用户ID
   * @param commentIds 评论ID数组
   * @returns Map<commentId, hasLiked>
   */
  async batchCheckLiked(
    userId: number,
    commentIds: number[],
  ): Promise<Map<number, boolean>> {
    if (commentIds.length === 0) {
      return new Map();
    }

    const likes = await this.commentLikeRepo.find({
      where: {
        userId,
        commentId: commentIds.length === 1 ? commentIds[0] : undefined,
      },
      select: ['commentId'],
    });

    // 如果有多个评论ID，需要用 IN 查询
    let likedCommentIds: number[];
    if (commentIds.length > 1) {
      const result = await this.commentLikeRepo
        .createQueryBuilder('cl')
        .select('cl.comment_id', 'commentId')
        .where('cl.user_id = :userId', { userId })
        .andWhere('cl.comment_id IN (:...commentIds)', { commentIds })
        .getRawMany();
      likedCommentIds = result.map((r) => r.commentId);
    } else {
      likedCommentIds = likes.map((like) => like.commentId);
    }

    const likedSet = new Set(likedCommentIds);
    const result = new Map<number, boolean>();
    
    for (const commentId of commentIds) {
      result.set(commentId, likedSet.has(commentId));
    }

    return result;
  }

  /**
   * 获取评论的点赞用户列表
   * @param commentId 评论ID
   * @param page 页码
   * @param size 每页数量
   * @returns 点赞用户列表
   */
  async getLikeUsers(commentId: number, page = 1, size = 20) {
    const [likes, total] = await this.commentLikeRepo.findAndCount({
      where: { commentId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * size,
      take: size,
    });

    return {
      users: likes.map((like) => ({
        userId: like.userId,
        username: like.user?.username,
        nickname: like.user?.nickname,
        photoUrl: like.user?.photo_url,
        likedAt: like.createdAt,
      })),
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  /**
   * 获取用户收到的未读点赞通知
   * @param userId 用户ID（评论作者）
   * @param page 页码
   * @param size 每页数量
   */
  async getUserUnreadLikes(userId: number, page = 1, size = 20) {
    const skip = (page - 1) * size;

    // 查询该用户的评论收到的未读点赞
    const [likes, total] = await this.commentLikeRepo
      .createQueryBuilder('like')
      .leftJoinAndSelect('like.user', 'liker')  // 点赞者
      .leftJoinAndSelect('like.comment', 'comment')  // 被点赞的评论
      .where('comment.userId = :userId', { userId })  // 评论作者是当前用户
      .andWhere('like.isRead = :isRead', { isRead: false })  // 未读
      .orderBy('like.createdAt', 'DESC')
      .skip(skip)
      .take(size)
      .getManyAndCount();

    // 批量获取剧集和系列信息
    const episodeShortIds = [...new Set(likes.map(like => like.comment?.episodeShortId).filter(Boolean))];
    const episodeInfoMap = new Map<string, any>();

    if (episodeShortIds.length > 0) {
      const episodes = await this.commentRepo.manager
        .getRepository('Episode')
        .createQueryBuilder('episode')
        .leftJoinAndSelect('episode.series', 'series')
        .where('episode.shortId IN (:...shortIds)', { shortIds: episodeShortIds })
        .getMany();

      episodes.forEach((episode: any) => {
        episodeInfoMap.set(episode.shortId, {
          episodeNumber: episode.episodeNumber,
          episodeTitle: episode.title,
          seriesShortId: episode.series?.shortId,
          seriesTitle: episode.series?.title,
          seriesCoverUrl: episode.series?.coverUrl,
        });
      });
    }

    // 格式化返回数据
    const formattedLikes = likes.map((like) => {
      const comment = like.comment;
      const episodeInfo = comment?.episodeShortId ? episodeInfoMap.get(comment.episodeShortId) : null;

      return {
        id: like.id,
        likedAt: like.createdAt,
        isRead: like.isRead,
        // 点赞者信息
        likerUserId: like.userId,
        likerUsername: like.user?.nickname || like.user?.username || null,
        likerNickname: like.user?.nickname || null,
        likerPhotoUrl: like.user?.photo_url || null,
        // 被点赞的评论信息
        commentId: comment?.id || null,
        commentContent: comment?.content || null,
        // 剧集和系列信息
        episodeShortId: comment?.episodeShortId || null,
        episodeNumber: episodeInfo?.episodeNumber || null,
        episodeTitle: episodeInfo?.episodeTitle || null,
        seriesShortId: episodeInfo?.seriesShortId || null,
        seriesTitle: episodeInfo?.seriesTitle || null,
        seriesCoverUrl: episodeInfo?.seriesCoverUrl || null,
      };
    });

    return {
      list: formattedLikes,
      total,
      page,
      size,
      hasMore: total > page * size,
      totalPages: Math.ceil(total / size),
    };
  }

  /**
   * 标记点赞通知为已读
   * @param userId 用户ID（评论作者）
   * @param likeIds 点赞记录ID数组（可选，不传则标记所有未读）
   */
  async markLikesAsRead(userId: number, likeIds?: number[]) {
    const queryBuilder = this.commentLikeRepo
      .createQueryBuilder('like')
      .leftJoin('like.comment', 'comment')
      .update(CommentLike)
      .set({ isRead: true })
      .where('comment.userId = :userId', { userId })
      .andWhere('like.isRead = :isRead', { isRead: false });

    // 如果指定了特定的点赞ID，只标记这些点赞
    if (likeIds && likeIds.length > 0) {
      queryBuilder.andWhere('like.id IN (:...likeIds)', { likeIds });
    }

    const result = await queryBuilder.execute();
    return {
      ok: true,
      affected: result.affected || 0,
    };
  }

  /**
   * 获取用户未读点赞的数量
   * @param userId 用户ID（评论作者）
   * @returns 未读点赞数量
   */
  async getUnreadLikeCount(userId: number): Promise<number> {
    return await this.commentLikeRepo
      .createQueryBuilder('like')
      .leftJoin('like.comment', 'comment')
      .where('comment.userId = :userId', { userId })
      .andWhere('like.isRead = :isRead', { isRead: false })
      .getCount();
  }
}
