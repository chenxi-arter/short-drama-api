// src/video/services/watch-logs-cleanup.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
// import { Cron, CronExpression } from '@nestjs/schedule';  // 需要时取消注释
import { WatchLog } from '../entity/watch-log.entity';

/**
 * 观看日志归档服务
 * 负责定期归档或清理旧的观看日志，避免表无限增长
 * 
 * 策略：
 * - 保留最近1年的数据用于统计分析
 * - 1年以上的数据可以选择：
 *   1. 归档到历史表（如果需要长期保存）
 *   2. 直接删除（如果不需要长期保存）
 */
@Injectable()
export class WatchLogsCleanupService {
  private readonly logger = new Logger(WatchLogsCleanupService.name);

  constructor(
    @InjectRepository(WatchLog)
    private readonly watchLogRepo: Repository<WatchLog>,
  ) {}

  /**
   * 定时归档任务（默认禁用，需要时可启用）
   * 每月1日凌晨3点执行归档任务
   * 归档1年前的观看日志
   */
  // @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)  // 默认禁用
  async scheduledArchiveOldLogs(): Promise<void> {
    this.logger.log('开始执行定时归档任务...');
    
    try {
      const result = await this.archiveOldLogs(365); // 归档1年前的数据
      
      this.logger.log(
        `定时归档任务完成: 归档了 ${result.archivedCount} 条记录，删除了 ${result.deletedCount} 条记录，耗时 ${result.duration}ms`
      );
    } catch (error) {
      this.logger.error('定时归档任务执行失败:', error);
    }
  }

  /**
   * 归档旧的观看日志
   * @param daysToKeep 保留最近多少天的数据（默认365天）
   * @param archiveBeforeDelete 是否在删除前先归档（默认false，直接删除）
   */
  async archiveOldLogs(
    daysToKeep: number = 365,
    archiveBeforeDelete: boolean = false,
  ): Promise<{
    archivedCount: number;
    deletedCount: number;
    duration: number;
  }> {
    const startTime = Date.now();
    this.logger.log(`开始归档 ${daysToKeep} 天前的观看日志...`);

    try {
      // 计算截止日期
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      cutoffDate.setHours(0, 0, 0, 0);

      let archivedCount = 0;
      let deletedCount = 0;

      // 1. 检查是否有需要归档的数据
      const oldLogsCount = await this.watchLogRepo.count({
        where: {
          watchDate: LessThan(cutoffDate),
        },
      });

      if (oldLogsCount === 0) {
        this.logger.log('没有需要归档的观看日志');
        return {
          archivedCount: 0,
          deletedCount: 0,
          duration: Date.now() - startTime,
        };
      }

      this.logger.log(`发现 ${oldLogsCount} 条需要归档的观看日志`);

      // 2. 如果需要归档，先创建归档表（如果不存在）
      if (archiveBeforeDelete) {
        try {
          await this.createArchiveTableIfNotExists();
          
          // 3. 将旧数据插入归档表
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const archiveResult: any = await this.watchLogRepo.query(`
            INSERT INTO watch_logs_archive 
            SELECT * FROM watch_logs 
            WHERE watch_date < ?
          `, [cutoffDate]);

          archivedCount = archiveResult?.affectedRows || 0;
          this.logger.log(`已归档 ${archivedCount} 条观看日志到 watch_logs_archive 表`);
        } catch (error) {
          this.logger.error('归档数据失败，跳过归档步骤:', error);
        }
      }

      // 4. 删除旧数据
      const deleteResult = await this.watchLogRepo.delete({
        watchDate: LessThan(cutoffDate),
      });

      deletedCount = deleteResult.affected || 0;
      this.logger.log(`已删除 ${deletedCount} 条旧的观看日志`);

      const duration = Date.now() - startTime;

      return {
        archivedCount,
        deletedCount,
        duration,
      };
    } catch (error) {
      this.logger.error('归档旧日志失败:', error);
      throw error;
    }
  }

  /**
   * 创建归档表（如果不存在）
   */
  private async createArchiveTableIfNotExists(): Promise<void> {
    try {
      await this.watchLogRepo.query(`
        CREATE TABLE IF NOT EXISTS watch_logs_archive (
          id bigint NOT NULL,
          user_id bigint NOT NULL,
          episode_id int NOT NULL,
          watch_duration int NOT NULL DEFAULT 0,
          start_position int NOT NULL DEFAULT 0,
          end_position int NOT NULL DEFAULT 0,
          watch_date date NOT NULL,
          created_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          PRIMARY KEY (id),
          KEY idx_user_watch_date (user_id, watch_date),
          KEY idx_episode_watch_date (episode_id, watch_date),
          KEY idx_watch_date (watch_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='观看日志归档表'
      `);

      this.logger.log('归档表 watch_logs_archive 准备完成');
    } catch (error) {
      this.logger.error('创建归档表失败:', error);
      throw error;
    }
  }

  /**
   * 获取清理统计信息
   */
  async getCleanupStats(): Promise<{
    totalLogs: number;
    logsOlderThan1Year: number;
    logsOlderThan6Months: number;
    logsOlderThan3Months: number;
    oldestLogDate: Date | null;
    newestLogDate: Date | null;
  }> {
    try {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const oneYearAgo = new Date(now);
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const threeMonthsAgo = new Date(now);
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const [
        totalLogs,
        logsOlderThan1Year,
        logsOlderThan6Months,
        logsOlderThan3Months,
      ] = await Promise.all([
        this.watchLogRepo.count(),
        this.watchLogRepo.count({ where: { watchDate: LessThan(oneYearAgo) } }),
        this.watchLogRepo.count({ where: { watchDate: LessThan(sixMonthsAgo) } }),
        this.watchLogRepo.count({ where: { watchDate: LessThan(threeMonthsAgo) } }),
      ]);

      // 获取最老和最新的日志日期
      let oldestLogDate: Date | null = null;
      let newestLogDate: Date | null = null;

      // 只有当存在日志时才查询日期范围
      if (totalLogs > 0) {
        const oldestLog = await this.watchLogRepo
          .createQueryBuilder('log')
          .select('log.watchDate')
          .orderBy('log.watchDate', 'ASC')
          .limit(1)
          .getOne();

        const newestLog = await this.watchLogRepo
          .createQueryBuilder('log')
          .select('log.watchDate')
          .orderBy('log.watchDate', 'DESC')
          .limit(1)
          .getOne();

        oldestLogDate = oldestLog?.watchDate || null;
        newestLogDate = newestLog?.watchDate || null;
      }

      return {
        totalLogs,
        logsOlderThan1Year,
        logsOlderThan6Months,
        logsOlderThan3Months,
        oldestLogDate,
        newestLogDate,
      };
    } catch (error) {
      this.logger.error('获取清理统计信息失败:', error);
      throw error;
    }
  }

  /**
   * 手动触发归档任务（用于测试或紧急清理）
   * @param daysToKeep 保留最近多少天的数据
   * @param archiveBeforeDelete 是否在删除前先归档
   */
  async manualArchive(
    daysToKeep: number = 365,
    archiveBeforeDelete: boolean = false,
  ): Promise<{
    success: boolean;
    message: string;
    archivedCount: number;
    deletedCount: number;
    duration: number;
  }> {
    this.logger.log(`手动触发归档任务: 保留最近 ${daysToKeep} 天的数据，归档模式: ${archiveBeforeDelete ? '归档后删除' : '直接删除'}`);

    try {
      const result = await this.archiveOldLogs(daysToKeep, archiveBeforeDelete);

      return {
        success: true,
        message: `归档任务完成: 归档了 ${result.archivedCount} 条记录，删除了 ${result.deletedCount} 条记录`,
        archivedCount: result.archivedCount,
        deletedCount: result.deletedCount,
        duration: result.duration,
      };
    } catch (error) {
      this.logger.error('手动归档任务执行失败:', error);
      return {
        success: false,
        message: `归档任务失败: ${error instanceof Error ? error.message : String(error)}`,
        archivedCount: 0,
        deletedCount: 0,
        duration: 0,
      };
    }
  }
}
