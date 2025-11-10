import { Controller, Get, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { WatchProgress } from '../../video/entity/watch-progress.entity';
import { User } from '../../user/entity/user.entity';
import { EpisodeReaction } from '../../video/entity/episode-reaction.entity';
import { Favorite } from '../../user/entity/favorite.entity';
import { Episode } from '../../video/entity/episode.entity';

/**
 * 数据导出控制器
 * 用于运维导出Excel所需的统计数据
 */
@Controller('admin/export')
export class AdminExportController {
  constructor(
    @InjectRepository(WatchProgress)
    private readonly wpRepo: Repository<WatchProgress>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(EpisodeReaction)
    private readonly reactionRepo: Repository<EpisodeReaction>,
    @InjectRepository(Favorite)
    private readonly favoriteRepo: Repository<Favorite>,
    @InjectRepository(Episode)
    private readonly episodeRepo: Repository<Episode>,
  ) {}

  /**
   * 获取播放数据统计（按日期）
   * GET /api/admin/export/play-stats?startDate=2025-11-01&endDate=2025-11-30
   * 
   * 返回格式：
   * [
   *   {
   *     date: "11月1日",
   *     playCount: 1000,           // 播放量
   *     completionRate: 0.65,      // 完播率
   *     avgWatchDuration: 180,     // 平均观看时长（秒）
   *     likeCount: 50,             // 点赞数
   *     shareCount: 0,             // 分享数（暂无数据）
   *     favoriteCount: 30          // 收藏数
   *   }
   * ]
   */
  @Get('play-stats')
  async getPlayStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      // 1. 按日期统计播放量（所有观看记录的总数）
      const playStats = await this.wpRepo
        .createQueryBuilder('wp')
        .select("DATE_FORMAT(wp.updated_at, '%Y-%m-%d')", 'date')
        .addSelect('COUNT(*)', 'playCount')  // 改为统计所有记录，不去重
        .addSelect('AVG(wp.stop_at_second)', 'avgDuration')
        .where('wp.updated_at BETWEEN :start AND :end', { start, end })
        .groupBy('date')
        .orderBy('date', 'ASC')
        .getRawMany<{ date: string; playCount: string; avgDuration: string }>();

      // 2. 按日期统计完播率
      const completionStats = await this.wpRepo
        .createQueryBuilder('wp')
        .innerJoin('wp.episode', 'episode')
        .select("DATE_FORMAT(wp.updated_at, '%Y-%m-%d')", 'date')
        .addSelect('COUNT(*)', 'total')
        .addSelect(
          'SUM(CASE WHEN wp.stop_at_second >= episode.duration * 0.9 THEN 1 ELSE 0 END)',
          'completed'
        )
        .where('wp.updated_at BETWEEN :start AND :end', { start, end })
        .andWhere('episode.duration > 0')
        .groupBy('date')
        .getRawMany<{ date: string; total: string; completed: string }>();

      // 3. 按日期统计点赞数
      const likeStats = await this.reactionRepo
        .createQueryBuilder('r')
        .select("DATE_FORMAT(r.created_at, '%Y-%m-%d')", 'date')
        .addSelect('COUNT(*)', 'likeCount')
        .where('r.created_at BETWEEN :start AND :end', { start, end })
        .andWhere('r.reaction_type = :type', { type: 'like' })
        .groupBy('date')
        .getRawMany<{ date: string; likeCount: string }>();

      // 4. 按日期统计收藏数
      const favoriteStats = await this.favoriteRepo
        .createQueryBuilder('f')
        .select("DATE_FORMAT(f.created_at, '%Y-%m-%d')", 'date')
        .addSelect('COUNT(*)', 'favoriteCount')
        .where('f.created_at BETWEEN :start AND :end', { start, end })
        .groupBy('date')
        .getRawMany<{ date: string; favoriteCount: string }>();

      // 合并数据
      const statsMap = new Map<string, any>();
      
      playStats.forEach(item => {
        statsMap.set(item.date, {
          date: this.formatDate(item.date),
          playCount: parseInt(item.playCount),
          avgWatchDuration: Math.round(parseFloat(item.avgDuration) || 0),
          completionRate: 0,
          likeCount: 0,
          shareCount: 0,
          favoriteCount: 0,
        });
      });

      completionStats.forEach(item => {
        const stats = statsMap.get(item.date);
        if (stats) {
          const total = parseInt(item.total);
          const completed = parseInt(item.completed);
          stats.completionRate = total > 0 ? parseFloat((completed / total).toFixed(4)) : 0;
        }
      });

      likeStats.forEach(item => {
        const stats = statsMap.get(item.date);
        if (stats) {
          stats.likeCount = parseInt(item.likeCount);
        }
      });

      favoriteStats.forEach(item => {
        const stats = statsMap.get(item.date);
        if (stats) {
          stats.favoriteCount = parseInt(item.favoriteCount);
        }
      });

      const result = Array.from(statsMap.values()).sort((a, b) => 
        a.date.localeCompare(b.date)
      );

      return {
        code: 200,
        data: result,
        message: '播放数据统计获取成功',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        code: 500,
        data: null,
        message: `获取播放数据失败: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取用户数据统计（按日期）
   * GET /api/admin/export/user-stats?startDate=2025-11-01&endDate=2025-11-30
   * 
   * 返回格式：
   * [
   *   {
   *     date: "11月1日",
   *     newUsers: 100,             // 总新增
   *     nextDayRetention: 0.45,    // 次日留存率
   *     dau: 500,                  // 日活
   *     avgWatchDuration: 180,     // 平均观影时长（秒）
   *     newUserSource: "自然增长"   // 新增来源
   *   }
   * ]
   */
  @Get('user-stats')
  async getUserStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      // 1. 按日期统计新增用户
      const newUserStats = await this.userRepo
        .createQueryBuilder('u')
        .select("DATE_FORMAT(u.created_at, '%Y-%m-%d')", 'date')
        .addSelect('COUNT(*)', 'newUsers')
        .where('u.created_at BETWEEN :start AND :end', { start, end })
        .groupBy('date')
        .orderBy('date', 'ASC')
        .getRawMany<{ date: string; newUsers: string }>();

      // 2. 按日期统计日活（DAU）
      const dauStats = await this.wpRepo
        .createQueryBuilder('wp')
        .select("DATE_FORMAT(wp.updated_at, '%Y-%m-%d')", 'date')
        .addSelect('COUNT(DISTINCT wp.user_id)', 'dau')
        .where('wp.updated_at BETWEEN :start AND :end', { start, end })
        .groupBy('date')
        .getRawMany<{ date: string; dau: string }>();

      // 3. 按日期统计平均观影时长
      const avgDurationStats = await this.wpRepo
        .createQueryBuilder('wp')
        .select("DATE_FORMAT(wp.updated_at, '%Y-%m-%d')", 'date')
        .addSelect('AVG(wp.stop_at_second)', 'avgDuration')
        .where('wp.updated_at BETWEEN :start AND :end', { start, end })
        .groupBy('date')
        .getRawMany<{ date: string; avgDuration: string }>();

      // 4. 计算次日留存率（需要逐日计算）
      const retentionMap = new Map<string, number>();
      for (const item of newUserStats) {
        const cohortDate = new Date(item.date);
        const nextDay = new Date(cohortDate);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDayEnd = new Date(nextDay);
        nextDayEnd.setHours(23, 59, 59, 999);

        // 获取该日注册的用户
        const cohortUsers = await this.userRepo
          .createQueryBuilder('u')
          .select('u.id')
          .where('DATE(u.created_at) = :date', { date: item.date })
          .getRawMany<{ id: number }>();

        if (cohortUsers.length === 0) {
          retentionMap.set(item.date, 0);
          continue;
        }

        const userIds = cohortUsers.map(u => u.id);

        // 统计次日活跃用户数
        const retainedCount = await this.wpRepo
          .createQueryBuilder('wp')
          .where('wp.user_id IN (:...userIds)', { userIds })
          .andWhere('wp.updated_at BETWEEN :start AND :end', { 
            start: nextDay, 
            end: nextDayEnd 
          })
          .select('COUNT(DISTINCT wp.user_id)', 'count')
          .getRawOne<{ count: string }>();

        const retention = parseInt(retainedCount?.count || '0') / cohortUsers.length;
        retentionMap.set(item.date, parseFloat(retention.toFixed(4)));
      }

      // 合并数据
      const statsMap = new Map<string, any>();
      
      newUserStats.forEach(item => {
        statsMap.set(item.date, {
          date: this.formatDate(item.date),
          newUsers: parseInt(item.newUsers),
          nextDayRetention: retentionMap.get(item.date) || 0,
          dau: 0,
          avgWatchDuration: 0,
          newUserSource: '自然增长', // 暂时固定值，后续可扩展
        });
      });

      dauStats.forEach(item => {
        const stats = statsMap.get(item.date);
        if (stats) {
          stats.dau = parseInt(item.dau);
        }
      });

      avgDurationStats.forEach(item => {
        const stats = statsMap.get(item.date);
        if (stats) {
          stats.avgWatchDuration = Math.round(parseFloat(item.avgDuration) || 0);
        }
      });

      const result = Array.from(statsMap.values()).sort((a, b) => 
        a.date.localeCompare(b.date)
      );

      return {
        code: 200,
        data: result,
        message: '用户数据统计获取成功',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        code: 500,
        data: null,
        message: `获取用户数据失败: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 格式化日期为 "11月1日" 格式
   */
  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  }
}
