import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { WatchLog } from '../entity/watch-log.entity';

/**
 * 观看日志服务
 * 用于记录和查询用户观看行为
 */
@Injectable()
export class WatchLogService {
  constructor(
    @InjectRepository(WatchLog)
    private readonly watchLogRepo: Repository<WatchLog>,
  ) {}

  /**
   * 记录观看日志
   * @param userId 用户ID
   * @param episodeId 剧集ID
   * @param startPosition 开始观看位置（秒）
   * @param endPosition 结束观看位置（秒）
   * @param watchDate 观看日期（可选，默认为当天）
   */
  async logWatch(
    userId: number,
    episodeId: number,
    startPosition: number,
    endPosition: number,
    watchDate?: Date,
  ): Promise<WatchLog> {
    // 计算实际观看时长
    const watchDuration = Math.max(0, endPosition - startPosition);
    
    // 如果没有指定观看日期，使用当前日期
    const logDate = watchDate || new Date();
    // 设置为当天的开始时间（去掉时分秒）
    logDate.setHours(0, 0, 0, 0);

    const watchLog = this.watchLogRepo.create({
      userId,
      episodeId,
      watchDuration,
      startPosition,
      endPosition,
      watchDate: logDate,
    });

    return await this.watchLogRepo.save(watchLog);
  }

  /**
   * 获取用户在指定日期范围内的观看日志
   */
  async getUserWatchLogs(
    userId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<WatchLog[]> {
    return await this.watchLogRepo.find({
      where: {
        userId,
        watchDate: Between(startDate, endDate),
      },
      relations: ['episode'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 获取用户在某一天的总观看时长
   */
  async getUserDailyWatchDuration(
    userId: number,
    date: Date,
  ): Promise<number> {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

    const result = await this.watchLogRepo
      .createQueryBuilder('wl')
      .select('SUM(wl.watch_duration)', 'totalDuration')
      .where('wl.user_id = :userId', { userId })
      .andWhere('wl.watch_date = :date', { date: dateStr })
      .getRawOne<{ totalDuration: string }>();

    return parseInt(result?.totalDuration || '0', 10);
  }

  /**
   * 获取剧集在指定日期范围内的观看统计
   */
  async getEpisodeWatchStats(
    episodeId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalWatchDuration: number;
    totalWatchers: number;
    avgWatchDuration: number;
  }> {
    const result = await this.watchLogRepo
      .createQueryBuilder('wl')
      .select('SUM(wl.watch_duration)', 'totalDuration')
      .addSelect('COUNT(DISTINCT wl.user_id)', 'totalWatchers')
      .where('wl.episode_id = :episodeId', { episodeId })
      .andWhere('wl.watch_date BETWEEN :startDate AND :endDate', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      })
      .getRawOne<{
        totalDuration: string;
        totalWatchers: string;
      }>();

    const totalDuration = parseInt(result?.totalDuration || '0', 10);
    const totalWatchers = parseInt(result?.totalWatchers || '0', 10);

    return {
      totalWatchDuration: totalDuration,
      totalWatchers,
      avgWatchDuration: totalWatchers > 0 ? Math.round(totalDuration / totalWatchers) : 0,
    };
  }

  /**
   * 按日期统计观看数据（用于管理端导出）
   * 返回每天的平均观看时长
   */
  async getDailyWatchStats(
    startDate: Date,
    endDate: Date,
  ): Promise<Array<{
    date: string;
    totalWatchDuration: number;
    dau: number;
    avgWatchDuration: number;
  }>> {
    const results = await this.watchLogRepo
      .createQueryBuilder('wl')
      .select('wl.watch_date', 'date')
      .addSelect('SUM(wl.watch_duration)', 'totalDuration')
      .addSelect('COUNT(DISTINCT wl.user_id)', 'dau')
      .where('wl.watch_date BETWEEN :startDate AND :endDate', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      })
      .groupBy('wl.watch_date')
      .orderBy('wl.watch_date', 'ASC')
      .getRawMany<{
        date: string;
        totalDuration: string;
        dau: string;
      }>();

    return results.map(row => {
      const totalDuration = parseInt(row.totalDuration || '0', 10);
      const dau = parseInt(row.dau || '0', 10);

      return {
        date: row.date,
        totalWatchDuration: totalDuration,
        dau,
        avgWatchDuration: dau > 0 ? Math.round(totalDuration / dau) : 0,
      };
    });
  }

  /**
   * 按系列统计观看数据
   */
  async getSeriesWatchStats(
    seriesId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalWatchDuration: number;
    totalWatchers: number;
    avgWatchDuration: number;
  }> {
    const result = await this.watchLogRepo
      .createQueryBuilder('wl')
      .innerJoin('wl.episode', 'ep')
      .select('SUM(wl.watch_duration)', 'totalDuration')
      .addSelect('COUNT(DISTINCT wl.user_id)', 'totalWatchers')
      .where('ep.series_id = :seriesId', { seriesId })
      .andWhere('wl.watch_date BETWEEN :startDate AND :endDate', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      })
      .getRawOne<{
        totalDuration: string;
        totalWatchers: string;
      }>();

    const totalDuration = parseInt(result?.totalDuration || '0', 10);
    const totalWatchers = parseInt(result?.totalWatchers || '0', 10);

    return {
      totalWatchDuration: totalDuration,
      totalWatchers,
      avgWatchDuration: totalWatchers > 0 ? Math.round(totalDuration / totalWatchers) : 0,
    };
  }
}
