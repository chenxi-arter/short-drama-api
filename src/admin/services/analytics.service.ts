import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { User } from '../../user/entity/user.entity';
import { WatchProgress } from '../../video/entity/watch-progress.entity';
import { WatchLog } from '../../video/entity/watch-log.entity';
import { BrowseHistory } from '../../video/entity/browse-history.entity';
import { Episode } from '../../video/entity/episode.entity';

/**
 * 数据分析服务
 * 提供用户行为分析、留存率、完播率等高级统计功能
 */
@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(WatchProgress)
    private readonly wpRepo: Repository<WatchProgress>,
    @InjectRepository(WatchLog)
    private readonly watchLogRepo: Repository<WatchLog>,
    @InjectRepository(BrowseHistory)
    private readonly bhRepo: Repository<BrowseHistory>,
    @InjectRepository(Episode)
    private readonly episodeRepo: Repository<Episode>,
  ) {}

  /**
   * 获取DAU（日活跃用户数）
   * 基于观看进度更新时间统计
   */
  async getDAU(date?: Date): Promise<number> {
    const targetDate = date || new Date();
    const dateStr = targetDate.toISOString().split('T')[0];

    // 统计当天有观看行为的唯一用户数（使用 DATE() 避免时区问题）
    const result = await this.wpRepo
      .createQueryBuilder('wp')
      .select('COUNT(DISTINCT wp.user_id)', 'count')
      .where('DATE(wp.updated_at) = :date', { date: dateStr })
      .getRawOne<{ count: string }>();

    return parseInt(result?.count || '0', 10);
  }

  /**
   * 获取WAU（周活跃用户数）
   * 基于最近7天的观看行为
   */
  async getWAU(endDate?: Date): Promise<number> {
    const end = endDate || new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 7);
    
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    // 统计最近7天有观看行为的唯一用户数
    const result = await this.wpRepo
      .createQueryBuilder('wp')
      .select('COUNT(DISTINCT wp.user_id)', 'count')
      .where('DATE(wp.updated_at) BETWEEN :start AND :end', {
        start: startStr,
        end: endStr,
      })
      .getRawOne<{ count: string }>();

    return parseInt(result?.count || '0', 10);
  }

  /**
   * 获取MAU（月活跃用户数）
   * 基于最近30天的观看行为
   */
  async getMAU(endDate?: Date): Promise<number> {
    const end = endDate || new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 30);
    
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    // 统计最近30天有观看行为的唯一用户数
    const result = await this.wpRepo
      .createQueryBuilder('wp')
      .select('COUNT(DISTINCT wp.user_id)', 'count')
      .where('DATE(wp.updated_at) BETWEEN :start AND :end', {
        start: startStr,
        end: endStr,
      })
      .getRawOne<{ count: string }>();

    return parseInt(result?.count || '0', 10);
  }

  /**
   * 获取用户留存率
   * @param retentionDays 留存天数（1=次日留存，7=7日留存）
   * @param cohortDate 队列日期（该日注册的用户）
   * @param includeBrowseHistory 为 true 时，「留存」= 留存日有观看进度更新 或 浏览记录更新（任一即可），否则仅看观看进度
   */
  async getRetentionRate(
    retentionDays: number = 1,
    cohortDate?: Date,
    includeBrowseHistory: boolean = true,
  ): Promise<{ totalUsers: number; retainedUsers: number; retentionRate: number }> {
    const cohort = cohortDate || new Date();
    
    // 使用 DATE() 函数确保时区一致性
    const cohortDateStr = cohort.toISOString().split('T')[0];

    // 1. 获取该天注册的所有用户ID（使用 DATE() 函数避免时区问题）
    const cohortUsers = await this.userRepo
      .createQueryBuilder('u')
      .select('u.id')
      .where('DATE(u.created_at) = :cohortDate', { cohortDate: cohortDateStr })
      .getMany();

    const totalUsers = cohortUsers.length;

    if (totalUsers === 0) {
      return { totalUsers: 0, retainedUsers: 0, retentionRate: 0 };
    }

    const userIds = cohortUsers.map(u => u.id);

    // 2. 计算留存日期（直接在队列日基础上加天数）
    const retentionDate = new Date(cohort);
    retentionDate.setDate(retentionDate.getDate() + retentionDays);
    const retentionDateStr = retentionDate.toISOString().split('T')[0];

    // 3. 统计在留存日有活跃行为的用户数（观看进度 或 可选：浏览记录）
    const retainedUserIds = new Set<number>();

    // 查询留存日有观看进度更新的用户
    const wpRows = await this.wpRepo
      .createQueryBuilder('wp')
      .select('DISTINCT wp.user_id', 'userId')
      .where('wp.user_id IN (:...userIds)', { userIds })
      .andWhere('DATE(wp.updated_at) = :retentionDate', { retentionDate: retentionDateStr })
      .getRawMany<{ userId: number }>();
    wpRows.forEach(r => retainedUserIds.add(r.userId));

    if (includeBrowseHistory) {
      // 查询留存日有浏览记录更新的用户
      const bhRows = await this.bhRepo
        .createQueryBuilder('bh')
        .select('DISTINCT bh.user_id', 'userId')
        .where('bh.user_id IN (:...userIds)', { userIds })
        .andWhere('DATE(bh.updated_at) = :retentionDate', { retentionDate: retentionDateStr })
        .getRawMany<{ userId: number }>();
      bhRows.forEach(r => retainedUserIds.add(r.userId));
    }

    const retainedUsers = retainedUserIds.size;
    const retentionRate = totalUsers > 0 ? (retainedUsers / totalUsers) * 100 : 0;

    return {
      totalUsers,
      retainedUsers,
      retentionRate: Math.round(retentionRate * 100) / 100, // 保留2位小数
    };
  }

  /**
   * 获取最近N天的每日留存率数据
   * @param days 天数
   * @param retentionDays 留存天数（1=次日留存，7=7日留存）
   */
  async getRetentionTrend(
    days: number = 7,
    retentionDays: number = 1,
  ): Promise<Array<{
    date: string;
    totalUsers: number;
    retainedUsers: number;
    retentionRate: number;
  }>> {
    const results: Array<{
      date: string;
      totalUsers: number;
      retainedUsers: number;
      retentionRate: number;
    }> = [];
    
    // 使用今天的日期，但设置为0点，避免时区问题
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = days - 1; i >= 0; i--) {
      const cohortDate = new Date(today);
      cohortDate.setDate(cohortDate.getDate() - i - retentionDays); // 往前推，确保有留存数据

      const retention = await this.getRetentionRate(retentionDays, cohortDate);
      
      results.push({
        date: cohortDate.toISOString().split('T')[0],
        ...retention,
      });
    }

    return results;
  }

  /**
   * 获取完播率统计
   * 完播定义：观看进度 >= 90%
   * 通过 JOIN episodes 表计算百分比：stop_at_second / duration >= 0.9
   */
  async getCompletionRate(): Promise<{
    totalWatchRecords: number;
    completedRecords: number;
    completionRate: number;
  }> {
    // 总观看记录数
    const totalRecords = await this.wpRepo.count();

    if (totalRecords === 0) {
      return {
        totalWatchRecords: 0,
        completedRecords: 0,
        completionRate: 0,
      };
    }

    // 完播记录数（观看进度 >= 90%）
    // 通过 JOIN episodes 表，计算 stop_at_second / duration >= 0.9
    const completedResult = await this.wpRepo
      .createQueryBuilder('wp')
      .innerJoin('wp.episode', 'ep')
      .where('ep.duration > 0')
      .andWhere('(wp.stopAtSecond / ep.duration) >= :threshold', { threshold: 0.9 })
      .getCount();

    const completionRate = totalRecords > 0 ? (completedResult / totalRecords) * 100 : 0;

    return {
      totalWatchRecords: totalRecords,
      completedRecords: completedResult,
      completionRate: Math.round(completionRate * 100) / 100,
    };
  }

  /**
   * 获取平均观影时长（秒）
   * 平均日观看时长 = 当天所有用户观看时长总和 ÷ 当天日活数
   * 
   * 数据来源策略（优雅降级）：
   * 1. 优先使用 watch_logs 表（2026年1月后的新数据，更准确）
   * 2. 如果 watch_logs 无数据，降级使用 watch_progress 表（历史数据）
   */
  async getAverageWatchDuration(): Promise<{
    averageWatchProgress: number;  // 平均日观看时长（秒）
    averageWatchPercentage: number; // 平均观看百分比
    totalWatchTime: number;         // 总观看时长（秒）
  }> {
    // 1. 尝试从 watch_logs 获取数据（准确的观看时长）
    const watchLogResult = await this.watchLogRepo
      .createQueryBuilder('wl')
      .select('SUM(wl.watch_duration) / COUNT(DISTINCT wl.user_id)', 'avgDuration')
      .addSelect('SUM(wl.watch_duration)', 'totalDuration')
      .addSelect('COUNT(DISTINCT wl.user_id)', 'uniqueUsers')
      .getRawOne<{
        avgDuration: string;
        totalDuration: string;
        uniqueUsers: string;
      }>();

    const watchLogCount = parseInt(watchLogResult?.uniqueUsers || '0', 10);

    // 2. 如果 watch_logs 有数据，使用它
    if (watchLogCount > 0) {
      const avgDuration = Math.round(parseFloat(watchLogResult?.avgDuration || '0'));
      const totalDuration = parseInt(watchLogResult?.totalDuration || '0', 10);

      // 计算平均观看百分比（需要关联episode表）
      const percentageResult = await this.watchLogRepo
        .createQueryBuilder('wl')
        .innerJoin('wl.episode', 'ep')
        .select('AVG(CASE WHEN ep.duration > 0 THEN (wl.watch_duration / ep.duration * 100) ELSE 0 END)', 'avgPercentage')
        .where('ep.duration > 0')
        .getRawOne<{ avgPercentage: string }>();

      return {
        averageWatchProgress: avgDuration,
        averageWatchPercentage: Math.round(parseFloat(percentageResult?.avgPercentage || '0') * 100) / 100,
        totalWatchTime: totalDuration,
      };
    }

    // 3. 降级：使用 watch_progress 表（历史数据）
    const result = await this.wpRepo
      .createQueryBuilder('wp')
      .innerJoin('wp.episode', 'ep')
      .select('SUM(wp.stopAtSecond) / COUNT(DISTINCT wp.user_id)', 'avgProgress')
      .addSelect('AVG(CASE WHEN ep.duration > 0 THEN (wp.stopAtSecond / ep.duration * 100) ELSE 0 END)', 'avgPercentage')
      .addSelect('SUM(wp.stopAtSecond)', 'totalTime')
      .where('ep.duration > 0')
      .getRawOne<{
        avgProgress: string;
        avgPercentage: string;
        totalTime: string;
      }>();

    return {
      averageWatchProgress: Math.round(parseFloat(result?.avgProgress || '0')),
      averageWatchPercentage: Math.round(parseFloat(result?.avgPercentage || '0') * 100) / 100,
      totalWatchTime: parseInt(result?.totalTime || '0', 10),
    };
  }

  /**
   * 获取新增注册统计
   * @param days 统计最近N天
   */
  async getRegistrationStats(days: number = 30): Promise<{
    totalNewUsers: number;
    dailyAverage: number;
    trend: Array<{ date: string; count: number }>;
  }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 按天统计新增用户
    const dailyStats = await this.userRepo
      .createQueryBuilder('u')
      .select("DATE_FORMAT(u.created_at, '%Y-%m-%d')", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('u.created_at BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string; count: string }>();

    const totalNewUsers = dailyStats.reduce((sum, item) => sum + parseInt(item.count, 10), 0);
    const dailyAverage = days > 0 ? Math.round(totalNewUsers / days) : 0;

    return {
      totalNewUsers,
      dailyAverage,
      trend: dailyStats.map(item => ({
        date: item.date,
        count: parseInt(item.count, 10),
      })),
    };
  }

  /**
   * 获取活跃用户详细统计
   */
  async getActiveUsersStats(): Promise<{
    dau: number;
    wau: number;
    mau: number;
    dau7DayAvg: number;
    sticky: number; // DAU/MAU 粘性系数
  }> {
    const today = new Date();
    
    // 并发查询
    const [dau, wau, mau] = await Promise.all([
      this.getDAU(today),
      this.getWAU(today),
      this.getMAU(today),
    ]);

    // 计算7天平均DAU
    const last7DaysDAU: number[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dauValue = await this.getDAU(date);
      last7DaysDAU.push(dauValue);
    }
    const dau7DayAvg = Math.round(last7DaysDAU.reduce((a, b) => a + b, 0) / 7);

    // 计算粘性系数（DAU/MAU）
    const sticky = mau > 0 ? Math.round((dau / mau) * 100 * 100) / 100 : 0;

    return {
      dau,
      wau,
      mau,
      dau7DayAvg,
      sticky,
    };
  }

  /**
   * 获取内容播放统计
   */
  async getContentPlayStats(): Promise<{
    totalPlayCount: number;
    uniqueWatchedEpisodes: number;
    averagePlayCountPerEpisode: number;
    top10Episodes: Array<{
      episodeId: number;
      shortId: string;
      title: string;
      playCount: number;
    }>;
  }> {
    // 总播放量
    const playCountResult = await this.episodeRepo
      .createQueryBuilder('ep')
      .select('COALESCE(SUM(ep.play_count), 0)', 'total')
      .addSelect('COUNT(DISTINCT CASE WHEN ep.play_count > 0 THEN ep.id END)', 'uniqueCount')
      .addSelect('AVG(ep.play_count)', 'avgCount')
      .getRawOne<{
        total: string;
        uniqueCount: string;
        avgCount: string;
      }>();

    const totalPlayCount = parseInt(playCountResult?.total || '0', 10);
    const uniqueWatchedEpisodes = parseInt(playCountResult?.uniqueCount || '0', 10);
    const averagePlayCountPerEpisode = Math.round(parseFloat(playCountResult?.avgCount || '0'));

    // Top 10 播放量最高的剧集
    const topEpisodes = await this.episodeRepo
      .createQueryBuilder('ep')
      .select(['ep.id', 'ep.shortId', 'ep.title', 'ep.playCount'])
      .orderBy('ep.play_count', 'DESC')
      .limit(10)
      .getMany();

    return {
      totalPlayCount,
      uniqueWatchedEpisodes,
      averagePlayCountPerEpisode,
      top10Episodes: topEpisodes.map(ep => ({
        episodeId: ep.id,
        shortId: ep.shortId,
        title: ep.title,
        playCount: ep.playCount || 0,
      })),
    };
  }

  /**
   * 获取综合数据统计（用于管理后台首页）
   */
  async getComprehensiveStats(): Promise<{
    activeUsers: {
      dau: number;
      wau: number;
      mau: number;
      dau7DayAvg: number;
      sticky: number;
    };
    retention: {
      day1: { totalUsers: number; retainedUsers: number; retentionRate: number };
      day7: { totalUsers: number; retainedUsers: number; retentionRate: number };
    };
    content: {
      totalPlayCount: number;
      uniqueWatchedEpisodes: number;
      averagePlayCountPerEpisode: number;
    };
    watching: {
      averageWatchProgress: number;
      averageWatchPercentage: number;
      totalWatchTime: number;
      completionRate: number;
    };
    registration: {
      today: number;
      yesterday: number;
      last7Days: number;
      last30Days: number;
    };
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 并发查询所有数据
    const [
      activeUsers,
      retention1Day,
      retention7Day,
      contentStats,
      watchDuration,
      completionRate,
    ] = await Promise.all([
      this.getActiveUsersStats(),
      this.getRetentionRate(1, yesterday), // 昨天注册用户的次日留存
      this.getRetentionRate(7, sevenDaysAgo), // 7天前注册用户的7日留存
      this.getContentPlayStats(),
      this.getAverageWatchDuration(),
      this.getCompletionRate(),
    ]);

    // 获取注册统计（使用 DATE() 避免时区问题）
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const [todayRegistrations, yesterdayRegistrations, last7DaysReg, last30DaysReg] = await Promise.all([
      this.userRepo
        .createQueryBuilder('u')
        .where('DATE(u.created_at) = :date', { date: todayStr })
        .getCount(),
      this.userRepo
        .createQueryBuilder('u')
        .where('DATE(u.created_at) = :date', { date: yesterdayStr })
        .getCount(),
      this.userRepo.count({
        where: {
          created_at: MoreThan(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
        },
      }),
      this.userRepo.count({
        where: {
          created_at: MoreThan(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
        },
      }),
    ]);

    return {
      activeUsers,
      retention: {
        day1: retention1Day,
        day7: retention7Day,
      },
      content: {
        totalPlayCount: contentStats.totalPlayCount,
        uniqueWatchedEpisodes: contentStats.uniqueWatchedEpisodes,
        averagePlayCountPerEpisode: contentStats.averagePlayCountPerEpisode,
      },
      watching: {
        averageWatchProgress: watchDuration.averageWatchProgress,
        averageWatchPercentage: watchDuration.averageWatchPercentage,
        totalWatchTime: watchDuration.totalWatchTime,
        completionRate: completionRate.completionRate,
      },
      registration: {
        today: todayRegistrations,
        yesterday: yesterdayRegistrations,
        last7Days: last7DaysReg,
        last30Days: last30DaysReg,
      },
    };
  }

  /**
   * 获取运营数据维度（按日期）
   * 返回每天的运营指标：新增用户、次日留存、日活、平均观影时长等
   * @param startDate 开始日期
   * @param endDate 结束日期
   */
  async getOperationalMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<Array<{
    date: string;
    newUsers: number;
    nextDayRetention: number;
    dau: number;
    averageWatchTime: number;
    newUserSource: string;
  }>> {
    const results: Array<{
      date: string;
      newUsers: number;
      nextDayRetention: number;
      dau: number;
      averageWatchTime: number;
      newUserSource: string;
    }> = [];

    // 遍历日期范围
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      // 1. 获取当天新增用户数
      const newUsers = await this.userRepo
        .createQueryBuilder('u')
        .where('u.created_at BETWEEN :start AND :end', {
          start: dayStart,
          end: dayEnd,
        })
        .getCount();

      // 2. 获取当天的DAU
      const dau = await this.getDAU(currentDate);

      // 3. 获取当天的平均观影时长（秒）
      const watchTimeResult = await this.wpRepo
        .createQueryBuilder('wp')
        .innerJoin('wp.episode', 'ep')
        .select('AVG(wp.stop_at_second)', 'avgTime')
        .where('wp.updated_at BETWEEN :start AND :end', {
          start: dayStart,
          end: dayEnd,
        })
        .getRawOne<{ avgTime: string }>();
      
      const averageWatchTime = Math.round(parseFloat(watchTimeResult?.avgTime || '0'));

      // 4. 计算次日留存率（需要等到第二天才有数据）
      const nextDay = new Date(currentDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const retentionData = await this.getRetentionRate(1, currentDate);
      const nextDayRetention = parseFloat(retentionData.retentionRate.toFixed(2));

      // 5. 统计当天新增用户的来源分布（基于推广码）
      const sourceDistribution = await this.userRepo
        .createQueryBuilder('u')
        .select('u.promo_code', 'promoCode')
        .addSelect('COUNT(*)', 'count')
        .where('u.created_at BETWEEN :start AND :end', {
          start: dayStart,
          end: dayEnd,
        })
        .groupBy('u.promo_code')
        .orderBy('count', 'DESC')
        .getRawMany<{ promoCode: string | null; count: string }>();

      // 格式化来源数据：显示主要来源
      let newUserSource = '自然流量';
      if (sourceDistribution.length > 0) {
        const topSources = sourceDistribution
          .filter(s => s.promoCode) // 过滤掉null（自然流量）
          .slice(0, 3) // 取前3个
          .map(s => `${s.promoCode}(${s.count})`)
          .join(', ');
        newUserSource = topSources || '自然流量';
      }

      results.push({
        date: currentDate.toISOString().split('T')[0],
        newUsers,
        nextDayRetention,
        dau,
        averageWatchTime,
        newUserSource, // 显示来源分布，例如："tiktok(45), facebook(23), youtube(12)"
      });

      // 移动到下一天
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return results;
  }

  /**
   * 获取内容数据维度（按日期和视频）
   * 返回每天每个视频的表现指标：播放量、完播率、平均观看时长、点赞、收藏等
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @param limit 每天返回的视频数量限制（默认100）
   */
  async getContentMetrics(
    startDate: Date,
    endDate: Date,
    limit: number = 100,
  ): Promise<Array<{
    date: string;
    videoId: string;
    videoTitle: string;
    playCount: number;
    completionRate: number;
    averageWatchTime: number;
    likeCount: number;
    shareCount: number;
    favoriteCount: number;
  }>> {
    const results: Array<{
      date: string;
      videoId: string;
      videoTitle: string;
      playCount: number;
      completionRate: number;
      averageWatchTime: number;
      likeCount: number;
      shareCount: number;
      favoriteCount: number;
    }> = [];

    // 遍历日期范围
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      // 查询当天有观看记录的视频
      const episodeStats = await this.wpRepo
        .createQueryBuilder('wp')
        .innerJoin('wp.episode', 'ep')
        .select('ep.id', 'episodeId')
        .addSelect('ep.short_id', 'shortId')
        .addSelect('ep.title', 'title')
        .addSelect('COUNT(DISTINCT wp.user_id)', 'playCount')
        .addSelect('AVG(wp.stop_at_second)', 'avgWatchTime')
        .addSelect('ep.duration', 'duration')
        .addSelect('ep.like_count', 'likeCount')
        .addSelect('ep.favorite_count', 'favoriteCount')
        .where('wp.updated_at BETWEEN :start AND :end', {
          start: dayStart,
          end: dayEnd,
        })
        .groupBy('ep.id')
        .addGroupBy('ep.short_id')
        .addGroupBy('ep.title')
        .addGroupBy('ep.duration')
        .addGroupBy('ep.like_count')
        .addGroupBy('ep.favorite_count')
        .orderBy('playCount', 'DESC')
        .limit(limit)
        .getRawMany<{
          episodeId: number;
          shortId: string;
          title: string;
          playCount: string;
          avgWatchTime: string;
          duration: number;
          likeCount: number;
          favoriteCount: number;
        }>();

      // 处理每个视频的数据
      for (const stat of episodeStats) {
        const playCount = parseInt(stat.playCount, 10);
        const avgWatchTime = Math.round(parseFloat(stat.avgWatchTime || '0'));
        
        // 计算完播率：当天观看进度>=90%的次数 / 总播放次数
        const completionCount = await this.wpRepo
          .createQueryBuilder('wp')
          .where('wp.episode_id = :episodeId', { episodeId: stat.episodeId })
          .andWhere('wp.updated_at BETWEEN :start AND :end', {
            start: dayStart,
            end: dayEnd,
          })
          .andWhere('wp.stop_at_second >= :threshold', {
            threshold: stat.duration * 0.9,
          })
          .getCount();
        
        const completionRate = playCount > 0 
          ? parseFloat(((completionCount / playCount) * 100).toFixed(2))
          : 0;

        results.push({
          date: currentDate.toISOString().split('T')[0],
          videoId: stat.shortId || stat.episodeId.toString(),
          videoTitle: stat.title,
          playCount,
          completionRate,
          averageWatchTime: avgWatchTime,
          likeCount: stat.likeCount || 0,
          shareCount: 0, // 目前数据库没有分享字段
          favoriteCount: stat.favoriteCount || 0,
        });
      }

      // 移动到下一天
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return results;
  }

  /**
   * 获取推广来源统计（按推广码）
   * 返回各个推广渠道的新增用户数、活跃用户、转化率等指标
   * @param startDate 开始日期
   * @param endDate 结束日期
   */
  async getUserSourceStats(
    startDate: Date,
    endDate: Date,
  ): Promise<Array<{
    promoCode: string;
    totalUsers: number;
    activeUsers: number;
    conversionRate: number;
  }>> {
    const dayStart = new Date(startDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(endDate);
    dayEnd.setHours(23, 59, 59, 999);

    // 按推广码分组统计用户
    const promoStats = await this.userRepo
      .createQueryBuilder('u')
      .select('COALESCE(u.promo_code, "organic")', 'promoCode')
      .addSelect('COUNT(*)', 'totalUsers')
      .where('u.created_at BETWEEN :start AND :end', {
        start: dayStart,
        end: dayEnd,
      })
      .groupBy('promoCode')
      .orderBy('totalUsers', 'DESC')
      .getRawMany<{
        promoCode: string;
        totalUsers: string;
      }>();

    const results: Array<{
      promoCode: string;
      totalUsers: number;
      activeUsers: number;
      conversionRate: number;
    }> = [];
    
    for (const stat of promoStats) {
      const totalUsers = parseInt(stat.totalUsers, 10);

      // 计算活跃用户数（有观看行为的用户）
      const activeUsersResult = await this.wpRepo
        .createQueryBuilder('wp')
        .innerJoin('wp.user', 'u')
        .select('COUNT(DISTINCT wp.user_id)', 'count')
        .where('u.created_at BETWEEN :start AND :end', {
          start: dayStart,
          end: dayEnd,
        })
        .andWhere('COALESCE(u.promo_code, "organic") = :promoCode', { promoCode: stat.promoCode })
        .getRawOne<{ count: string }>();

      const activeUsers = parseInt(activeUsersResult?.count || '0', 10);
      const conversionRate = totalUsers > 0 ? parseFloat(((activeUsers / totalUsers) * 100).toFixed(2)) : 0;

      results.push({
        promoCode: stat.promoCode,
        totalUsers,
        activeUsers,
        conversionRate, // 转化率：有观看行为的用户比例
      });
    }

    return results;
  }
}

