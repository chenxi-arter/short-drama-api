import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, MoreThan } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Comment } from '../entity/comment.entity';
import { Episode } from '../entity/episode.entity';
import { FakeCommentService } from './fake-comment.service';

/**
 * 评论管理服务
 * 负责视频评论和弹幕的管理
 */
@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(Episode)
    private readonly episodeRepo: Repository<Episode>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly fakeCommentService: FakeCommentService,
  ) {}

  /**
   * 添加评论或弹幕（使用 episodeShortId）
   */
  async addComment(
    userId: number,
    episodeShortId: string,
    content: string,
    appearSecond?: number
  ) {
    const comment = this.commentRepo.create({
      userId,
      episodeShortId,
      content,
      appearSecond: appearSecond ?? 0,
    });
    
    const saved = await this.commentRepo.save(comment);
    
    // 清除相关缓存
    await this.clearCommentCache(episodeShortId);
    
    return saved;
  }

  /**
   * 获取剧集的主楼评论列表（带回复预览）
   * 优化版：批量查询，避免 N+1 问题
   */
  async getCommentsByEpisodeShortId(
    episodeShortId: string,
    page: number = 1,
    size: number = 20,
    replyPreviewCount: number = 2
  ) {
    const skip = (page - 1) * size;
    
    // 只获取主楼评论（rootId为null）
    const [comments, total] = await this.commentRepo.findAndCount({
      where: { episodeShortId, rootId: IsNull() },
      order: { createdAt: 'DESC' },
      skip,
      take: size,
      relations: ['user'],
    });
    
    // 如果没有真实评论，直接返回空数组并混入假评论
    if (comments.length === 0) {
      return this.fakeCommentService.mixComments(
        episodeShortId,
        [],  // 空的真实评论数组
        0,   // 真实评论总数为0
        page,
        size,
      );
    }
    
    // ========== 性能优化：批量查询所有回复 ==========
    const commentIds = comments.map(c => c.id);
    
    // 批量获取所有回复（兼容旧版MySQL，不使用子查询LIMIT）
    const allReplies = await this.commentRepo
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .where('comment.rootId IN (:...rootIds)', { rootIds: commentIds })
      .orderBy('comment.rootId', 'ASC')
      .addOrderBy('comment.createdAt', 'DESC')
      .getMany();
    
    // 将回复按主楼ID分组（在内存中处理，并限制每个主楼的回复预览数量）
    const repliesMap = new Map<number, typeof allReplies>();
    allReplies.forEach(reply => {
      if (reply.rootId) { // 确保 rootId 存在
        if (!repliesMap.has(reply.rootId)) {
          repliesMap.set(reply.rootId, []);
        }
        const replies = repliesMap.get(reply.rootId)!;
        // 只保留最新的 N 条回复
        if (replies.length < replyPreviewCount) {
          replies.push(reply);
        }
      }
    });
    
    // 组装最终结果
    const formattedComments = comments.map(comment => {
      const recentReplies = repliesMap.get(comment.id) || [];
      
      return {
        id: comment.id,
        content: comment.content,
        appearSecond: comment.appearSecond,
        replyCount: comment.replyCount,
        createdAt: comment.createdAt,
        // 用户信息
        username: comment.user?.username || null,
        nickname: comment.user?.nickname || null,
        photoUrl: comment.user?.photo_url || null,
        // 回复预览
        recentReplies: recentReplies.map(reply => ({
          id: reply.id,
          content: reply.content,
          floorNumber: reply.floorNumber,
          createdAt: reply.createdAt,
          username: reply.user?.username || null,
          nickname: reply.user?.nickname || null,
        })),
      };
    });
    
    // 混入假评论（如果启用）
    return this.fakeCommentService.mixComments(
      episodeShortId,
      formattedComments,
      total,
      page,
      size,
    );
  }

  /**
   * 发表回复评论
   */
  async addReply(
    userId: number,
    episodeShortId: string,
    parentId: number,
    content: string,
  ) {
    // 1. 查找父评论
    const parentComment = await this.commentRepo.findOne({
      where: { id: parentId },
      relations: ['user'],
    });
    
    if (!parentComment) {
      throw new Error('父评论不存在');
    }
    
    // 2. 确定根评论ID（如果父评论是主楼，则根ID是父ID；否则继承父评论的根ID）
    const rootId = parentComment.rootId || parentComment.id;
    
    // 3. 计算楼层号（同一根评论下的最大楼层号+1）
    const maxFloorResult = await this.commentRepo
      .createQueryBuilder('comment')
      .select('MAX(comment.floorNumber)', 'max')
      .where('comment.rootId = :rootId OR comment.id = :rootId', { rootId })
      .getRawOne<{ max: string | null }>();
    
    const floorNumber = (parseInt(maxFloorResult?.max || '0', 10)) + 1;
    
    // 4. 创建回复
    const reply = this.commentRepo.create({
      userId,
      episodeShortId,
      parentId,
      rootId,
      replyToUserId: parentComment.userId,
      floorNumber,
      content,
      appearSecond: 0,
    });
    
    const saved = await this.commentRepo.save(reply);
    
    // 5. 更新主楼的回复数量
    await this.commentRepo.increment(
      { id: rootId },
      'replyCount',
      1
    );
    
    // 6. 清除缓存
    await this.clearCommentCache(episodeShortId);
    
    // 7. 返回带用户信息的回复
    const savedWithUser = await this.commentRepo.findOne({
      where: { id: saved.id },
      relations: ['user'],
    });
    
    if (!savedWithUser) {
      throw new Error('保存的评论未找到');
    }
    
    return {
      id: savedWithUser.id,
      parentId: savedWithUser.parentId,
      rootId: savedWithUser.rootId,
      floorNumber: savedWithUser.floorNumber,
      content: savedWithUser.content,
      createdAt: savedWithUser.createdAt,
      username: savedWithUser.user?.username || null,
      nickname: savedWithUser.user?.nickname || null,
      photoUrl: savedWithUser.user?.photo_url || null,
      replyToUsername: parentComment.user?.username || null,
      replyToNickname: parentComment.user?.nickname || null,
    };
  }

  /**
   * 获取某条评论的所有回复
   */
  async getCommentReplies(
    commentId: number,
    page: number = 1,
    size: number = 20,
  ) {
    // 1. 获取主楼信息
    const rootComment = await this.commentRepo.findOne({
      where: { id: commentId },
      relations: ['user'],
    });
    
    if (!rootComment) {
      throw new Error('评论不存在');
    }
    
    const skip = (page - 1) * size;
    
    // 2. 获取所有回复（按楼层号排序）
    const [replies, total] = await this.commentRepo.findAndCount({
      where: { rootId: commentId },
      order: { floorNumber: 'ASC' },
      skip,
      take: size,
      relations: ['user'],
    });
    
    return {
      rootComment: {
        id: rootComment.id,
        content: rootComment.content,
        username: rootComment.user?.username || null,
        nickname: rootComment.user?.nickname || null,
        photoUrl: rootComment.user?.photo_url || null,
        replyCount: rootComment.replyCount,
        createdAt: rootComment.createdAt,
      },
      replies: replies.map(reply => ({
        id: reply.id,
        parentId: reply.parentId,
        floorNumber: reply.floorNumber,
        content: reply.content,
        createdAt: reply.createdAt,
        username: reply.user?.username || null,
        nickname: reply.user?.nickname || null,
        photoUrl: reply.user?.photo_url || null,
      })),
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  /**
   * 获取剧集的弹幕列表（通过 ShortID）
   */
  async getDanmuByEpisodeShortId(episodeShortId: string) {
    return this.commentRepo.find({
      where: {
        episodeShortId,
        appearSecond: MoreThan(0), // 弹幕有出现时间
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
    await this.clearCommentCache(comment.episodeShortId);
    
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
   * 获取评论统计信息（通过 ShortID）
   */
  async getCommentStats(episodeShortId: string) {
    const totalComments = await this.commentRepo.count({
      where: { episodeShortId },
    });
    
    const danmuCount = await this.commentRepo.count({
      where: {
        episodeShortId,
        appearSecond: MoreThan(0),
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
   * @param commentId 评论ID
   * @param reporterId 举报人ID（待实现）
   * @param reason 举报原因（待实现）
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
    
    // TODO: 添加举报记录到专门的举报表
    // await this.reportRepo.save({ commentId, reporterId, reason });
    // 暂时只是标记评论状态
    console.log(`Comment ${commentId} reported by user ${reporterId} for: ${reason}`);
    
    return { ok: true, message: '举报已提交' };
  }

  /**
   * 点赞评论
   * @param commentId 评论ID
   * @param userId 点赞用户ID（待实现）
   */
  async likeComment(commentId: number, userId: number) {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId },
    });
    
    if (!comment) {
      throw new Error('评论不存在');
    }
    
    // TODO: 添加点赞记录到专门的点赞表
    // await this.commentLikeRepo.save({ commentId, userId });
    // 暂时只返回成功状态，实际点赞逻辑需要单独的点赞表来实现
    console.log(`User ${userId} liked comment ${commentId}`);
    
    // 清除相关缓存
    await this.clearCommentCache(comment.episodeShortId);
    
    return { ok: true };
  }

  /**
   * 清除评论相关缓存（使用 episodeShortId）
   */
  private async clearCommentCache(episodeShortId: string) {
    try {
      // 清除视频详情缓存
      await this.cacheManager.del(`video_details_${episodeShortId}`);
      
      // 清除评论列表缓存
      await this.cacheManager.del(`comments_${episodeShortId}`);
      
      // 清除弹幕缓存
      await this.cacheManager.del(`danmu_${episodeShortId}`);
    } catch (error) {
      console.error('清除评论缓存失败:', error);
    }
  }

  /**
   * 批量获取多个剧集的评论总数（包括假评论）
   * @param episodeShortIds 剧集短ID数组
   * @returns Map<episodeShortId, commentCount>
   */
  async getCommentCountsByShortIds(episodeShortIds: string[]): Promise<Map<string, number>> {
    const countMap = new Map<string, number>();
    
    if (episodeShortIds.length === 0) {
      return countMap;
    }
    
    // 查询真实评论数（只统计主楼评论）
    const realCommentCounts = await this.commentRepo
      .createQueryBuilder('comment')
      .select('comment.episodeShortId', 'episodeShortId')
      .addSelect('COUNT(*)', 'count')
      .where('comment.episodeShortId IN (:...shortIds)', { shortIds: episodeShortIds })
      .andWhere('comment.rootId IS NULL') // 只统计主楼评论
      .groupBy('comment.episodeShortId')
      .getRawMany();
    
    // 将真实评论数填充到Map中
    realCommentCounts.forEach((item: { episodeShortId: string; count: string }) => {
      countMap.set(item.episodeShortId, parseInt(item.count, 10));
    });
    
    // 批量获取假评论数（性能优化：一次性计算所有剧集）
    const fakeCountMap = this.fakeCommentService.getFakeCommentCounts(episodeShortIds);
    
    // 合并真实评论数和假评论数
    episodeShortIds.forEach(shortId => {
      const realCount = countMap.get(shortId) || 0;
      const fakeCount = fakeCountMap.get(shortId) || 0;
      countMap.set(shortId, realCount + fakeCount);
    });
    
    return countMap;
  }
  
  /**
   * 获取单个剧集的评论总数（包括假评论）
   * @param episodeShortId 剧集短ID
   * @returns 评论总数
   */
  async getCommentCountByShortId(episodeShortId: string): Promise<number> {
    const countMap = await this.getCommentCountsByShortIds([episodeShortId]);
    return countMap.get(episodeShortId) || 0;
  }
}