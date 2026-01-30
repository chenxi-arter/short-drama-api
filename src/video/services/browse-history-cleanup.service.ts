// src/video/services/browse-history-cleanup.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrowseHistory } from '../entity/browse-history.entity';

/**
 * 浏览记录清理服务
 * 负责定时清理用户的浏览记录，确保每个用户最多保留100条记录
 */
@Injectable()
export class BrowseHistoryCleanupService {
  private readonly logger = new Logger(BrowseHistoryCleanupService.name);
  
  // 每个用户最大保留的浏览记录数量
  private readonly MAX_RECORDS_PER_USER = 100;

  constructor(
    @InjectRepository(BrowseHistory)
    private readonly browseHistoryRepo: Repository<BrowseHistory>,
  ) {}

  /**
   * ⚠️ 已废弃：browse_history 表已不再使用，统一从 watch_progress 获取观看记录
   * 定时清理任务已停用，保留此方法仅供手动调用
   * 
   * 每天凌晨2点执行浏览记录清理任务
   * 清理每个用户超过100条的浏览记录
   */
  // @Cron(CronExpression.EVERY_DAY_AT_2AM)  // ⚠️ 已禁用定时任务
  async cleanupExcessBrowseHistory(): Promise<void> {
    this.logger.warn('⚠️ 警告：browse_history 表已废弃，此清理任务仅供手动调用');
    this.logger.log('开始执行浏览记录清理任务...');
    
    try {
      const startTime = Date.now();
      
      // 获取所有有浏览记录的用户ID
      const usersWithHistory = await this.getUsersWithBrowseHistory();
      
      let totalCleanedRecords = 0;
      let processedUsers = 0;
      
      for (const userId of usersWithHistory) {
        const cleanedCount = await this.cleanupUserBrowseHistory(userId);
        totalCleanedRecords += cleanedCount;
        processedUsers++;
        
        // 每处理100个用户记录一次日志
        if (processedUsers % 100 === 0) {
          this.logger.log(`已处理 ${processedUsers} 个用户的浏览记录`);
        }
      }
      
      const duration = Date.now() - startTime;
      this.logger.log(
        `浏览记录清理任务完成: 处理了 ${processedUsers} 个用户，清理了 ${totalCleanedRecords} 条记录，耗时 ${duration}ms`
      );
      
    } catch (error) {
      this.logger.error('浏览记录清理任务执行失败:', error);
    }
  }

  /**
   * 获取所有有浏览记录的用户ID列表
   */
  private async getUsersWithBrowseHistory(): Promise<number[]> {
    const result = await this.browseHistoryRepo
      .createQueryBuilder('bh')
      .select('DISTINCT bh.userId', 'userId')
      .getRawMany();
    
    return result.map(row => row.userId);
  }

  /**
   * 清理指定用户的超量浏览记录
   * @param userId 用户ID
   * @returns 清理的记录数量
   */
  private async cleanupUserBrowseHistory(userId: number): Promise<number> {
    try {
      // 获取用户当前的浏览记录总数
      const totalCount = await this.browseHistoryRepo.count({
        where: { userId }
      });

      // 如果记录数量不超过限制，无需清理
      if (totalCount <= this.MAX_RECORDS_PER_USER) {
        return 0;
      }

      // 计算需要删除的记录数量
      const recordsToDelete = totalCount - this.MAX_RECORDS_PER_USER;
      
      // 获取需要删除的最旧记录ID列表
      const recordsToDeleteIds = await this.browseHistoryRepo
        .createQueryBuilder('bh')
        .select('bh.id')
        .where('bh.userId = :userId', { userId })
        .orderBy('bh.updatedAt', 'ASC') // 按更新时间升序，删除最旧的
        .limit(recordsToDelete)
        .getMany();

      if (recordsToDeleteIds.length === 0) {
        return 0;
      }

      // 批量删除最旧的记录
      const deleteResult = await this.browseHistoryRepo
        .createQueryBuilder()
        .delete()
        .where('id IN (:...ids)', { 
          ids: recordsToDeleteIds.map(record => record.id) 
        })
        .execute();

      const deletedCount = deleteResult.affected || 0;
      
      if (deletedCount > 0) {
        this.logger.debug(
          `用户 ${userId} 清理了 ${deletedCount} 条浏览记录 (原总数: ${totalCount})`
        );
      }

      return deletedCount;
      
    } catch (error) {
      this.logger.error(`清理用户 ${userId} 浏览记录失败:`, error);
      return 0;
    }
  }

  /**
   * 手动触发清理任务（用于测试或紧急清理）
   */
  async manualCleanup(): Promise<{
    processedUsers: number;
    totalCleanedRecords: number;
    duration: number;
  }> {
    this.logger.log('手动触发浏览记录清理任务...');
    
    const startTime = Date.now();
    
    try {
      const usersWithHistory = await this.getUsersWithBrowseHistory();
      
      let totalCleanedRecords = 0;
      let processedUsers = 0;
      
      for (const userId of usersWithHistory) {
        const cleanedCount = await this.cleanupUserBrowseHistory(userId);
        totalCleanedRecords += cleanedCount;
        processedUsers++;
      }
      
      const duration = Date.now() - startTime;
      
      this.logger.log(
        `手动清理任务完成: 处理了 ${processedUsers} 个用户，清理了 ${totalCleanedRecords} 条记录，耗时 ${duration}ms`
      );
      
      return {
        processedUsers,
        totalCleanedRecords,
        duration
      };
      
    } catch (error) {
      this.logger.error('手动清理任务执行失败:', error);
      throw error;
    }
  }

  /**
   * 获取清理任务统计信息
   */
  async getCleanupStats(): Promise<{
    totalUsers: number;
    usersWithExcessRecords: number;
    totalExcessRecords: number;
    maxRecordsPerUser: number;
  }> {
    try {
      // 获取所有有浏览记录的用户
      const usersWithHistory = await this.getUsersWithBrowseHistory();
      const totalUsers = usersWithHistory.length;
      
      let usersWithExcessRecords = 0;
      let totalExcessRecords = 0;
      
      // 检查每个用户的记录数量
      for (const userId of usersWithHistory) {
        const userRecordCount = await this.browseHistoryRepo.count({
          where: { userId }
        });
        
        if (userRecordCount > this.MAX_RECORDS_PER_USER) {
          usersWithExcessRecords++;
          totalExcessRecords += (userRecordCount - this.MAX_RECORDS_PER_USER);
        }
      }
      
      return {
        totalUsers,
        usersWithExcessRecords,
        totalExcessRecords,
        maxRecordsPerUser: this.MAX_RECORDS_PER_USER
      };
      
    } catch (error) {
      this.logger.error('获取清理统计信息失败:', error);
      throw error;
    }
  }
}
