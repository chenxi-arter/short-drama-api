import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { BaseController } from './base.controller';
import { NotificationService } from '../services/notification.service';

/**
 * 通知控制器
 * 统一管理用户的各类通知接口
 */
@Controller('notifications')
export class NotificationController extends BaseController {
  constructor(private readonly notificationService: NotificationService) {
    super();
  }

  /**
   * 获取未读通知数量（统一接口）
   * GET /api/notifications/unread-count
   * 返回: { replies: 5, likes: 10, total: 15 }
   */
  @UseGuards(JwtAuthGuard)
  @Get('unread-count')
  async getUnreadCount(@Req() req) {
    try {
      const userId = req.user?.userId;
      if (!userId) return this.error('未认证', 401);

      const counts = await this.notificationService.getUnreadCounts(userId);
      return this.success(counts, '获取成功', 200);
    } catch (error) {
      return this.handleServiceError(error, '获取未读通知数量失败');
    }
  }

  /**
   * 获取所有未读通知（合并回复和点赞）
   * GET /api/notifications/unread?page=1&size=20
   */
  @UseGuards(JwtAuthGuard)
  @Get('unread')
  async getAllUnread(
    @Req() req,
    @Query('page') page?: string,
    @Query('size') size?: string,
  ) {
    try {
      const userId = req.user?.userId;
      if (!userId) return this.error('未认证', 401);

      const pageNum = Math.max(parseInt(page ?? '1', 10) || 1, 1);
      const sizeNum = Math.max(parseInt(size ?? '20', 10) || 20, 1);

      const result = await this.notificationService.getAllUnreadNotifications(
        userId,
        pageNum,
        sizeNum,
      );

      return this.success(result, '获取成功', 200);
    } catch (error) {
      return this.handleServiceError(error, '获取未读通知失败');
    }
  }
}
