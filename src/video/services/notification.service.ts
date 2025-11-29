import { Injectable } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentLikeService } from './comment-like.service';

/**
 * 通知服务
 * 统一管理用户的各类通知（回复、点赞等）
 */
@Injectable()
export class NotificationService {
  constructor(
    private readonly commentService: CommentService,
    private readonly commentLikeService: CommentLikeService,
  ) {}

  /**
   * 获取用户的未读通知总数
   * @param userId 用户ID
   * @returns 各类未读通知的数量
   */
  async getUnreadCounts(userId: number) {
    // 并行查询各类未读数量
    const [unreadReplies, unreadLikes] = await Promise.all([
      this.commentService.getUnreadReplyCount(userId),
      this.commentLikeService.getUnreadLikeCount(userId),
    ]);

    return {
      replies: unreadReplies,
      likes: unreadLikes,
      total: unreadReplies + unreadLikes,
    };
  }

  /**
   * 获取用户的所有未读通知（合并回复和点赞）
   * @param userId 用户ID
   * @param page 页码
   * @param size 每页数量
   */
  async getAllUnreadNotifications(userId: number, page = 1, size = 20) {
    // 并行获取回复和点赞通知
    const [repliesData, likesData] = await Promise.all([
      this.commentService.getUserUnreadReplies(userId, 1, 100), // 获取更多以便合并排序
      this.commentLikeService.getUserUnreadLikes(userId, 1, 100),
    ]);

    // 合并并按时间排序
    const allNotifications = [
      ...repliesData.list.map(item => ({
        ...item,
        type: 'reply' as const,
        time: new Date(item.createdAt).getTime(),
      })),
      ...likesData.list.map(item => ({
        ...item,
        type: 'like' as const,
        time: new Date(item.likedAt).getTime(),
      })),
    ].sort((a, b) => b.time - a.time);

    // 分页
    const total = allNotifications.length;
    const start = (page - 1) * size;
    const end = start + size;
    const paginatedList = allNotifications.slice(start, end);

    return {
      list: paginatedList,
      total,
      page,
      size,
      hasMore: total > page * size,
      totalPages: Math.ceil(total / size),
    };
  }
}
