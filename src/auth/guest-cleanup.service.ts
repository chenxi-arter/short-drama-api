import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GuestService } from './guest.service';

/**
 * 游客清理定时任务服务
 * 可选服务，用于自动清理不活跃游客
 */
@Injectable()
export class GuestCleanupService {
  private readonly logger = new Logger(GuestCleanupService.name);

  constructor(private readonly guestService: GuestService) {}

  /**
   * 每天凌晨3点执行清理任务
   * 清理90天未活跃的游客
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleDailyCleanup() {
    this.logger.log('开始执行每日游客清理任务');

    try {
      const result = await this.guestService.cleanInactiveGuests(90, 30);
      
      this.logger.log(
        `每日清理任务完成: ${result.message}, 清理数量: ${result.deactivated}`,
      );

      // 可选：发送通知或记录到监控系统
      if (result.deactivated > 0) {
        this.logger.warn(`今日清理了 ${result.deactivated} 个不活跃游客`);
      }
    } catch (error) {
      this.logger.error(`每日清理任务失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 每周一凌晨4点执行统计任务
   * 记录游客统计数据
   */
  @Cron('0 4 * * 1')
  async handleWeeklyStatistics() {
    this.logger.log('开始执行每周游客统计任务');

    try {
      const stats = await this.guestService.getGuestStatistics();
      
      this.logger.log('每周游客统计:', {
        总游客数: stats.totalGuests,
        活跃游客: stats.activeGuests,
        不活跃游客: stats.inactiveGuests,
        已转化游客: stats.convertedGuests,
        转化率: stats.conversionRate,
      });

      // 可选：将统计数据发送到监控系统或数据仓库
    } catch (error) {
      this.logger.error(`每周统计任务失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 手动触发清理任务（用于测试）
   * @param inactiveDays 不活跃天数
   * @param recentActivityDays 最近活跃天数
   */
  async manualCleanup(inactiveDays: number = 90, recentActivityDays: number = 30) {
    this.logger.log('手动触发清理任务');
    return this.guestService.cleanInactiveGuests(inactiveDays, recentActivityDays);
  }
}
