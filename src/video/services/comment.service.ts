import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, MoreThan } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Comment } from '../entity/comment.entity';
import { Episode } from '../entity/episode.entity';
import { FakeCommentService } from './fake-comment.service';
import { CommentLikeService } from './comment-like.service';
import { DefaultAvatarUtil } from '../../common/utils/default-avatar.util';

/**
 * 评论管理服务
 * 负责视频评论和弹幕的管理
 */
@Injectable()
export class CommentService {
  /** 用户头像：有则用用户头像，无则用默认头像（按 userId 固定） */
  private static getPhotoUrl(user: { id?: number; photo_url?: string | null } | null): string {
    if (!user) return DefaultAvatarUtil.getRandomAvatar();
    if (user.photo_url && String(user.photo_url).trim()) return user.photo_url.trim();
    if (user.id != null) return DefaultAvatarUtil.getAvatarByUserId(user.id);
    return DefaultAvatarUtil.getRandomAvatar();
  }
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(Episode)
    private readonly episodeRepo: Repository<Episode>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly fakeCommentService: FakeCommentService,
    private readonly commentLikeService: CommentLikeService,
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
   * @param userId 可选，用于查询用户的点赞状态
   */
  async getCommentsByEpisodeShortId(
    episodeShortId: string,
    page: number = 1,
    size: number = 20,
    replyPreviewCount: number = 2,
    userId?: number
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
    
    // ✅ 批量获取所有被回复用户的信息
    const replyToUserIds = [...new Set(allReplies.map(r => r.replyToUserId).filter(Boolean))] as number[];
    const replyToUsersMap = new Map<number, any>();
    
    if (replyToUserIds.length > 0) {
      const replyToUsers = await this.commentRepo.manager
        .getRepository('User')
        .createQueryBuilder('user')
        .where('user.id IN (:...ids)', { ids: replyToUserIds })
        .getMany();
      
      replyToUsers.forEach((user: any) => {
        replyToUsersMap.set(user.id, {
          nickname: user.nickname,
          photoUrl: CommentService.getPhotoUrl(user),
        });
      });
    }
    
    // 批量查询用户的点赞状态（如果提供了 userId）
    let likedCommentsMap = new Map<number, boolean>();
    let likedRepliesMap = new Map<number, boolean>();
    
    if (userId) {
      const allCommentIds = [
        ...commentIds,
        ...allReplies.map(r => r.id)
      ];
      likedCommentsMap = await this.commentLikeService.batchCheckLiked(userId, allCommentIds);
      likedRepliesMap = likedCommentsMap; // 同一个 Map，包含所有评论和回复
    }
    
    // 组装最终结果
    const formattedComments = comments.map(comment => {
      const recentReplies = repliesMap.get(comment.id) || [];
      
      // 计算显示昵称（与 /user/me 保持一致）
      const getDisplayNickname = (user: any) => {
        if (user?.nickname?.trim()) return user.nickname.trim();
        const firstName = user?.first_name?.trim() || '';
        const lastName = user?.last_name?.trim() || '';
        const fullName = [firstName, lastName].filter(Boolean).join(' ');
        if (fullName) return fullName;
        return user?.username || null;
      };

      return {
        id: comment.id,
        content: comment.content,
        appearSecond: comment.appearSecond,
        replyCount: comment.replyCount,
        likeCount: comment.likeCount || 0,
        liked: userId ? (likedCommentsMap.get(comment.id) || false) : undefined,
        createdAt: comment.createdAt,
        // 用户信息（username字段返回nickname值，避免泄漏Telegram信息）
        username: getDisplayNickname(comment.user),
        nickname: getDisplayNickname(comment.user),
        photoUrl: CommentService.getPhotoUrl(comment.user),
        // 回复预览
        recentReplies: recentReplies.map(reply => {
          const replyToUser = reply.replyToUserId ? replyToUsersMap.get(reply.replyToUserId) : null;
          return {
            id: reply.id,
            content: reply.content,
            floorNumber: reply.floorNumber,
            likeCount: reply.likeCount || 0,
            liked: userId ? (likedRepliesMap.get(reply.id) || false) : undefined,
            createdAt: reply.createdAt,
            username: getDisplayNickname(reply.user),
            nickname: getDisplayNickname(reply.user),
            photoUrl: CommentService.getPhotoUrl(reply.user),
            // ✅ 被回复者信息（username字段返回nickname值）
            replyToUserId: reply.replyToUserId || null,
            replyToUsername: getDisplayNickname(replyToUser),
            replyToNickname: getDisplayNickname(replyToUser),
            replyToPhotoUrl: replyToUser?.photoUrl ?? CommentService.getPhotoUrl(null),
          };
        }),
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
    
    // 计算显示昵称（与 /user/me 保持一致）
    const getDisplayNickname = (user: any) => {
      if (user?.nickname?.trim()) return user.nickname.trim();
      const firstName = user?.first_name?.trim() || '';
      const lastName = user?.last_name?.trim() || '';
      const fullName = [firstName, lastName].filter(Boolean).join(' ');
      if (fullName) return fullName;
      return user?.username || null;
    };

    return {
      id: savedWithUser.id,
      parentId: savedWithUser.parentId,
      rootId: savedWithUser.rootId,
      floorNumber: savedWithUser.floorNumber,
      content: savedWithUser.content,
      likeCount: savedWithUser.likeCount || 0,
      createdAt: savedWithUser.createdAt,
      username: getDisplayNickname(savedWithUser.user),
      nickname: getDisplayNickname(savedWithUser.user),
      photoUrl: CommentService.getPhotoUrl(savedWithUser.user),
      replyToUsername: getDisplayNickname(parentComment.user),
      replyToNickname: getDisplayNickname(parentComment.user),
    };
  }

  /**
   * 获取某条评论的所有回复
   * @param userId 可选，用于查询用户的点赞状态
   */
  async getCommentReplies(
    commentId: number,
    page: number = 1,
    size: number = 20,
    userId?: number
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
    
    // 3. 批量获取被回复用户的信息
    const replyToUserIds = [...new Set(replies.map(r => r.replyToUserId).filter(Boolean))] as number[];
    const replyToUsersMap = new Map<number, any>();
    
    if (replyToUserIds.length > 0) {
      const replyToUsers = await this.commentRepo.manager
        .getRepository('User')
        .createQueryBuilder('user')
        .where('user.id IN (:...ids)', { ids: replyToUserIds })
        .getMany();
      
      replyToUsers.forEach((user: any) => {
        replyToUsersMap.set(user.id, {
          nickname: user.nickname,
          photoUrl: CommentService.getPhotoUrl(user),
        });
      });
    }
    
    // 4. 批量查询用户的点赞状态（如果提供了 userId）
    let likedMap = new Map<number, boolean>();
    if (userId) {
      const allCommentIds = [commentId, ...replies.map(r => r.id)];
      likedMap = await this.commentLikeService.batchCheckLiked(userId, allCommentIds);
    }
    
    // 计算显示昵称（与 /user/me 保持一致）
    const getDisplayNickname = (user: any) => {
      if (user?.nickname?.trim()) return user.nickname.trim();
      const firstName = user?.first_name?.trim() || '';
      const lastName = user?.last_name?.trim() || '';
      const fullName = [firstName, lastName].filter(Boolean).join(' ');
      if (fullName) return fullName;
      return user?.username || null;
    };

    return {
      rootComment: {
        id: rootComment.id,
        content: rootComment.content,
        username: getDisplayNickname(rootComment.user),
        nickname: getDisplayNickname(rootComment.user),
        photoUrl: CommentService.getPhotoUrl(rootComment.user),
        replyCount: rootComment.replyCount,
        likeCount: rootComment.likeCount || 0,
        liked: userId ? (likedMap.get(commentId) || false) : undefined,
        createdAt: rootComment.createdAt,
      },
      replies: replies.map(reply => {
        const replyToUser = reply.replyToUserId ? replyToUsersMap.get(reply.replyToUserId) : null;
        return {
          id: reply.id,
          parentId: reply.parentId,
          floorNumber: reply.floorNumber,
          content: reply.content,
          likeCount: reply.likeCount || 0,
          liked: userId ? (likedMap.get(reply.id) || false) : undefined,
          createdAt: reply.createdAt,
          username: getDisplayNickname(reply.user),
          nickname: getDisplayNickname(reply.user),
          photoUrl: CommentService.getPhotoUrl(reply.user),
          // ✅ 新增：回复目标用户信息（username字段返回nickname值）
          replyToUserId: reply.replyToUserId || null,
          replyToUsername: getDisplayNickname(replyToUser),
          replyToNickname: getDisplayNickname(replyToUser),
          replyToPhotoUrl: replyToUser?.photoUrl ?? CommentService.getPhotoUrl(null),
        };
      }),
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
   * 获取用户收到的未读回复消息
   * @param userId 用户ID
   * @param page 页码
   * @param size 每页数量
   */
  async getUserUnreadReplies(
    userId: number,
    page: number = 1,
    size: number = 20
  ) {
    const skip = (page - 1) * size;
    
    // 查找回复给该用户的所有未读评论，使用 leftJoinAndSelect 确保加载用户信息
    const queryBuilder = this.commentRepo
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .where('comment.reply_to_user_id = :userId', { userId })
      .andWhere('comment.is_read = :isRead', { isRead: false })
      .orderBy('comment.createdAt', 'DESC')
      .skip(skip)
      .take(size);
    
    const [replies, total] = await queryBuilder.getManyAndCount();
    
    // 批量获取被回复的原评论信息
    const parentIds = [...new Set(replies.map(r => r.parentId).filter(Boolean))] as number[];
    const parentCommentsMap = new Map<number, any>();
    
    if (parentIds.length > 0) {
      const parentComments = await this.commentRepo
        .createQueryBuilder('comment')
        .where('comment.id IN (:...ids)', { ids: parentIds })
        .getMany();
      
      parentComments.forEach(comment => {
        parentCommentsMap.set(comment.id, {
          id: comment.id,
          content: comment.content,
          episodeShortId: comment.episodeShortId,
        });
      });
    }
    
    // 批量获取剧集和系列信息
    const episodeShortIds = [...new Set(replies.map(r => r.episodeShortId).filter(Boolean))];
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
          episodeId: episode.id,
          episodeShortId: episode.shortId,
          episodeNumber: episode.episodeNumber,
          episodeTitle: episode.title,
          seriesId: episode.series?.id,
          seriesShortId: episode.series?.shortId,
          seriesTitle: episode.series?.title,
          seriesCoverUrl: episode.series?.coverUrl,
        });
      });
    }
    
    // 计算显示昵称（与评论列表保持一致）
    const getDisplayNickname = (user: any) => {
      if (user?.nickname?.trim()) return user.nickname.trim();
      const firstName = user?.first_name?.trim() || '';
      const lastName = user?.last_name?.trim() || '';
      const fullName = [firstName, lastName].filter(Boolean).join(' ');
      if (fullName) return fullName;
      return user?.username || null;
    };
    
    // 格式化返回数据
    const formattedReplies = replies.map(reply => {
      const parentComment = reply.parentId ? parentCommentsMap.get(reply.parentId) : null;
      const episodeInfo = episodeInfoMap.get(reply.episodeShortId) || null;
      
      return {
        id: reply.id,
        content: reply.content,
        createdAt: reply.createdAt,
        isRead: reply.isRead,
        // 剧集和系列信息
        episodeNumber: episodeInfo?.episodeNumber || null,
        episodeTitle: episodeInfo?.episodeTitle || null,
        seriesShortId: episodeInfo?.seriesShortId || null,  // 用于跳转
        seriesTitle: episodeInfo?.seriesTitle || null,
        seriesCoverUrl: episodeInfo?.seriesCoverUrl || null,
        // 回复者信息（与评论列表保持一致）
        fromUserId: reply.userId,
        fromUsername: getDisplayNickname(reply.user),
        fromNickname: getDisplayNickname(reply.user),
        fromPhotoUrl: CommentService.getPhotoUrl(reply.user),
        // 被回复的评论信息
        myComment: parentComment?.content || null,
        // 楼层信息
        floorNumber: reply.floorNumber,
      };
    });
    
    return {
      list: formattedReplies,
      total,
      page,
      size,
      hasMore: total > page * size,
      totalPages: Math.ceil(total / size),
    };
  }

  /**
   * 获取用户收到的最新回复消息
   * @param userId 用户ID
   * @param page 页码
   * @param size 每页数量
   */
  async getUserReceivedReplies(
    userId: number,
    page: number = 1,
    size: number = 20
  ) {
    const skip = (page - 1) * size;
    
    // 查找回复给该用户的所有评论，使用 leftJoinAndSelect 确保加载用户信息
    const queryBuilder = this.commentRepo
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .where('comment.reply_to_user_id = :userId', { userId })
      .orderBy('comment.created_at', 'DESC')
      .skip(skip)
      .take(size);
    
    const [replies, total] = await queryBuilder.getManyAndCount();
    
    // 批量获取被回复的原评论信息
    const parentIds = [...new Set(replies.map(r => r.parentId).filter(Boolean))] as number[];
    const parentCommentsMap = new Map<number, any>();
    
    if (parentIds.length > 0) {
      const parentComments = await this.commentRepo
        .createQueryBuilder('comment')
        .where('comment.id IN (:...ids)', { ids: parentIds })
        .getMany();
      
      parentComments.forEach(comment => {
        parentCommentsMap.set(comment.id, {
          id: comment.id,
          content: comment.content,
          episodeShortId: comment.episodeShortId,
        });
      });
    }
    
    // 批量获取剧集和系列信息
    const episodeShortIds = [...new Set(replies.map(r => r.episodeShortId).filter(Boolean))];
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
          episodeId: episode.id,
          episodeShortId: episode.shortId,
          episodeNumber: episode.episodeNumber,
          episodeTitle: episode.title,
          seriesId: episode.series?.id,
          seriesShortId: episode.series?.shortId,
          seriesTitle: episode.series?.title,
          seriesCoverUrl: episode.series?.coverUrl,
        });
      });
    }
    
    // 计算显示昵称（与评论列表保持一致）
    const getDisplayNickname = (user: any) => {
      if (user?.nickname?.trim()) return user.nickname.trim();
      const firstName = user?.first_name?.trim() || '';
      const lastName = user?.last_name?.trim() || '';
      const fullName = [firstName, lastName].filter(Boolean).join(' ');
      if (fullName) return fullName;
      return user?.username || null;
    };
    
    // 格式化返回数据
    const formattedReplies = replies.map(reply => {
      const parentComment = reply.parentId ? parentCommentsMap.get(reply.parentId) : null;
      const episodeInfo = episodeInfoMap.get(reply.episodeShortId) || null;
      
      return {
        id: reply.id,
        content: reply.content,
        createdAt: reply.createdAt,
        // 剧集和系列信息
        episodeNumber: episodeInfo?.episodeNumber || null,
        episodeTitle: episodeInfo?.episodeTitle || null,
        seriesShortId: episodeInfo?.seriesShortId || null,  // 用于跳转
        seriesTitle: episodeInfo?.seriesTitle || null,
        seriesCoverUrl: episodeInfo?.seriesCoverUrl || null,
        // 回复者信息（与评论列表保持一致）
        fromUserId: reply.userId,
        fromUsername: getDisplayNickname(reply.user),
        fromNickname: getDisplayNickname(reply.user),
        fromPhotoUrl: CommentService.getPhotoUrl(reply.user),
        // 被回复的评论信息
        myComment: parentComment?.content || null,
        // 楼层信息
        floorNumber: reply.floorNumber,
      };
    });
    
    return {
      list: formattedReplies,
      total,
      page,
      size,
      hasMore: total > page * size,
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

  /**
   * 标记回复为已读
   * @param userId 用户ID
   * @param replyIds 回复ID数组（可选，如果不传则标记所有未读回复）
   */
  async markRepliesAsRead(userId: number, replyIds?: number[]) {
    const updateQuery = this.commentRepo
      .createQueryBuilder()
      .update(Comment)
      .set({ isRead: true })
      .where('replyToUserId = :userId', { userId })
      .andWhere('isRead = :isRead', { isRead: false });

    // 如果指定了特定的回复ID，只标记这些回复
    if (replyIds && replyIds.length > 0) {
      updateQuery.andWhere('id IN (:...replyIds)', { replyIds });
    }

    const result = await updateQuery.execute();
    return { 
      ok: true, 
      affected: result.affected || 0 
    };
  }

  /**
   * 获取用户未读回复的数量
   * @param userId 用户ID
   * @returns 未读回复数量
   */
  async getUnreadReplyCount(userId: number): Promise<number> {
    return await this.commentRepo.count({
      where: {
        replyToUserId: userId,
        isRead: false,
      },
    });
  }
}