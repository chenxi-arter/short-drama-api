import { Controller, Get, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { WatchProgress } from '../../video/entity/watch-progress.entity';
import { WatchLog } from '../../video/entity/watch-log.entity';
import { User } from '../../user/entity/user.entity';
import { EpisodeReaction } from '../../video/entity/episode-reaction.entity';
import { Favorite } from '../../user/entity/favorite.entity';
import { Episode } from '../../video/entity/episode.entity';
import { Series } from '../../video/entity/series.entity';
import { Comment } from '../../video/entity/comment.entity';
import { ExportSeriesDetailsDto, SeriesDetailData } from '../dto/export-series-details.dto';
import { WatchLogService } from '../../video/services/watch-log.service';
import { AnalyticsService } from '../services/analytics.service';

/**
 * 数据导出控制器
 * 用于运维导出Excel所需的统计数据
 */
@Controller('admin/export')
export class AdminExportController {
  constructor(
    @InjectRepository(WatchProgress)
    private readonly wpRepo: Repository<WatchProgress>,
    @InjectRepository(WatchLog)
    private readonly watchLogRepo: Repository<WatchLog>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(EpisodeReaction)
    private readonly reactionRepo: Repository<EpisodeReaction>,
    @InjectRepository(Favorite)
    private readonly favoriteRepo: Repository<Favorite>,
    @InjectRepository(Episode)
    private readonly episodeRepo: Repository<Episode>,
    @InjectRepository(Series)
    private readonly seriesRepo: Repository<Series>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    private readonly watchLogService: WatchLogService,
    private readonly analyticsService: AnalyticsService,
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
        .addSelect('SUM(wp.stop_at_second) / COUNT(DISTINCT wp.user_id)', 'avgDuration')
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

      // 3. 按日期统计平均观影时长（优先使用 watch_logs 表的数据）
      // 策略：先尝试从 watch_logs 获取，如果没有数据则降级到 watch_progress
      const watchLogStats = await this.watchLogRepo
        .createQueryBuilder('wl')
        .select("DATE(wl.watch_date)", 'date')
        .addSelect('SUM(wl.watch_duration) / COUNT(DISTINCT wl.user_id)', 'avgDuration')
        .where('wl.watch_date BETWEEN :start AND :end', { 
          start: start.toISOString().split('T')[0], 
          end: end.toISOString().split('T')[0] 
        })
        .groupBy('date')
        .getRawMany<{ date: string; avgDuration: string }>();

      // 如果 watch_logs 没有数据，降级使用 watch_progress
      const avgDurationStats = watchLogStats.length > 0 
        ? watchLogStats 
        : await this.wpRepo
            .createQueryBuilder('wp')
            .select("DATE_FORMAT(wp.updated_at, '%Y-%m-%d')", 'date')
            .addSelect('SUM(wp.stop_at_second) / COUNT(DISTINCT wp.user_id)', 'avgDuration')
            .where('wp.updated_at BETWEEN :start AND :end', { start, end })
            .groupBy('date')
            .getRawMany<{ date: string; avgDuration: string }>();

      // 4. 计算次日留存率（逐日计算，使用 DATE() 函数避免时区问题）
      const retentionMap = new Map<string, number>();
      for (const item of newUserStats) {
        // 计算次日的日期字符串，避免使用 Date 对象的时区偏移
        const cohortDate = new Date(item.date);
        const nextDayDate = new Date(cohortDate);
        nextDayDate.setDate(nextDayDate.getDate() + 1);
        const nextDayStr = nextDayDate.toISOString().split('T')[0];

        // 获取该日注册的用户
        const cohortStart = new Date(item.date);
        cohortStart.setHours(0, 0, 0, 0);
        const cohortEnd = new Date(item.date);
        cohortEnd.setHours(23, 59, 59, 999);

        const cohortUsers = await this.userRepo
          .createQueryBuilder('u')
          .select('u.id', 'id')
          .where('u.created_at >= :cohortStart', { cohortStart })
          .andWhere('u.created_at <= :cohortEnd', { cohortEnd })
          .getRawMany<{ id: number }>();

        if (cohortUsers.length === 0) {
          retentionMap.set(item.date, 0);
          continue;
        }

        const userIds = cohortUsers.map(u => u.id);

        // 统计次日活跃用户数（watch_progress）
        const nextDayStart = new Date(nextDayStr);
        nextDayStart.setHours(0, 0, 0, 0);
        const nextDayEnd = new Date(nextDayStr);
        nextDayEnd.setHours(23, 59, 59, 999);

        const wpRetained = await this.wpRepo
          .createQueryBuilder('wp')
          .select('DISTINCT wp.user_id', 'userId')
          .where('wp.user_id IN (:...userIds)', { userIds })
          .andWhere('wp.updated_at >= :nextDayStart', { nextDayStart })
          .andWhere('wp.updated_at <= :nextDayEnd', { nextDayEnd })
          .getRawMany<{ userId: number }>();

        const retainedIds = new Set(wpRetained.map(r => r.userId));
        const retention = retainedIds.size / cohortUsers.length;
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
   * 获取系列明细数据
   * GET /api/admin/export/series-details?startDate=2025-11-01&endDate=2025-11-17&categoryId=1
   * 
   * 返回每个系列在每一天的汇总统计数据
   */
  @Get('series-details')
  async getSeriesDetails(@Query() query: ExportSeriesDetailsDto) {
    try {
      const { startDate, endDate, categoryId } = query;
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      // 1. 获取所有符合条件的系列
      const seriesQuery = this.seriesRepo
        .createQueryBuilder('series')
        .leftJoinAndSelect('series.category', 'category')
        .leftJoinAndSelect('series.episodes', 'episodes')
        .where('series.id IS NOT NULL');

      if (categoryId) {
        seriesQuery.andWhere('series.category_id = :categoryId', { categoryId });
      }

      const seriesList = await seriesQuery.getMany();

      if (seriesList.length === 0) {
        return {
          code: 200,
          message: 'success',
          timestamp: new Date().toISOString(),
          data: [],
        };
      }

      const seriesIds = seriesList.map(s => s.id);
      const episodeIds = seriesList.flatMap(s => s.episodes.map(e => e.id));

      if (episodeIds.length === 0) {
        return {
          code: 200,
          message: 'success',
          timestamp: new Date().toISOString(),
          data: [],
        };
      }

      // 2. 按日期和系列统计观看数据（优先使用 watch_logs）
      // 先尝试从 watch_logs 获取平均观看时长
      const watchLogStatsByDate = await this.watchLogRepo
        .createQueryBuilder('wl')
        .innerJoin('wl.episode', 'episode')
        .select("DATE(wl.watch_date)", 'date')
        .addSelect('episode.series_id', 'seriesId')
        .addSelect('SUM(wl.watch_duration) / COUNT(DISTINCT wl.user_id)', 'avgDuration')
        .where('wl.watch_date BETWEEN :start AND :end', { 
          start: start.toISOString().split('T')[0], 
          end: end.toISOString().split('T')[0] 
        })
        .andWhere('episode.series_id IN (:...seriesIds)', { seriesIds })
        .groupBy('date, episode.series_id')
        .getRawMany<{
          date: string;
          seriesId: number;
          avgDuration: string;
        }>();

      // 创建日志数据映射（用于快速查找）
      const logDataMap = new Map<string, number>();
      watchLogStatsByDate.forEach(item => {
        const key = `${item.date}-${item.seriesId}`;
        logDataMap.set(key, parseFloat(item.avgDuration || '0'));
      });

      // 从 watch_progress 获取播放量和完播率
      const watchStats = await this.wpRepo
        .createQueryBuilder('wp')
        .innerJoin('wp.episode', 'episode')
        .select("DATE_FORMAT(wp.updated_at, '%Y-%m-%d')", 'date')
        .addSelect('episode.series_id', 'seriesId')
        .addSelect('COUNT(*)', 'playCount')
        .addSelect('SUM(wp.stop_at_second) / COUNT(DISTINCT wp.user_id)', 'avgDurationFallback')
        .addSelect(
          'AVG(CASE WHEN wp.stop_at_second >= episode.duration * 0.9 THEN 1 ELSE 0 END)',
          'completionRate'
        )
        .where('wp.updated_at BETWEEN :start AND :end', { start, end })
        .andWhere('episode.series_id IN (:...seriesIds)', { seriesIds })
        .groupBy('date, episode.series_id')
        .getRawMany<{
          date: string;
          seriesId: number;
          playCount: string;
          avgDurationFallback: string;
          completionRate: string;
        }>();

      // 3. 按日期和系列统计点赞/踩数
      const reactionStats = await this.reactionRepo
        .createQueryBuilder('r')
        .innerJoin('r.episode', 'episode')
        .select("DATE_FORMAT(r.created_at, '%Y-%m-%d')", 'date')
        .addSelect('episode.series_id', 'seriesId')
        .addSelect(
          'SUM(CASE WHEN r.reaction_type = "like" THEN 1 ELSE 0 END)',
          'likeCount'
        )
        .addSelect(
          'SUM(CASE WHEN r.reaction_type = "dislike" THEN 1 ELSE 0 END)',
          'dislikeCount'
        )
        .where('r.created_at BETWEEN :start AND :end', { start, end })
        .andWhere('episode.series_id IN (:...seriesIds)', { seriesIds })
        .groupBy('date, episode.series_id')
        .getRawMany<{
          date: string;
          seriesId: number;
          likeCount: string;
          dislikeCount: string;
        }>();

      // 4. 按日期和系列统计收藏数
      const favoriteStats = await this.favoriteRepo
        .createQueryBuilder('f')
        .select("DATE_FORMAT(f.created_at, '%Y-%m-%d')", 'date')
        .addSelect('f.series_id', 'seriesId')
        .addSelect('COUNT(*)', 'favoriteCount')
        .where('f.created_at BETWEEN :start AND :end', { start, end })
        .andWhere('f.series_id IN (:...seriesIds)', { seriesIds })
        .groupBy('date, f.series_id')
        .getRawMany<{
          date: string;
          seriesId: number;
          favoriteCount: string;
        }>();

      // 5. 按日期统计评论数（通过episodeShortId关联）
      const episodeShortIds = seriesList.flatMap(s => 
        s.episodes.map(e => e.shortId).filter(Boolean)
      );

      let commentStats: Array<{
        date: string;
        episodeShortId: string;
        commentCount: string;
      }> = [];

      if (episodeShortIds.length > 0) {
        commentStats = await this.commentRepo
          .createQueryBuilder('c')
          .select("DATE_FORMAT(c.created_at, '%Y-%m-%d')", 'date')
          .addSelect('c.episode_short_id', 'episodeShortId')
          .addSelect('COUNT(*)', 'commentCount')
          .where('c.created_at BETWEEN :start AND :end', { start, end })
          .andWhere('c.episode_short_id IN (:...episodeShortIds)', { episodeShortIds })
          .groupBy('date, c.episode_short_id')
          .getRawMany();
      }

      // 创建episodeShortId到seriesId的映射
      const shortIdToSeriesMap = new Map<string, number>();
      seriesList.forEach(series => {
        series.episodes.forEach(episode => {
          if (episode.shortId) {
            shortIdToSeriesMap.set(episode.shortId, series.id);
          }
        });
      });

      // 按日期和系列聚合评论数
      const commentStatsBySeriesMap = new Map<string, number>();
      commentStats.forEach(stat => {
        const seriesId = shortIdToSeriesMap.get(stat.episodeShortId);
        if (seriesId) {
          const key = `${stat.date}-${seriesId}`;
          commentStatsBySeriesMap.set(
            key,
            (commentStatsBySeriesMap.get(key) || 0) + parseInt(stat.commentCount)
          );
        }
      });

      // 6. 合并所有数据
      const resultMap = new Map<string, SeriesDetailData>();

      watchStats.forEach(stat => {
        const key = `${stat.date}-${stat.seriesId}`;
        const series = seriesList.find(s => s.id === stat.seriesId);
        if (!series) return;

        // 优先使用 watch_logs 的数据，如果没有则降级到 watch_progress
        const avgDuration = logDataMap.get(key) || parseFloat(stat.avgDurationFallback || '0');

        resultMap.set(key, {
          date: stat.date,
          seriesId: stat.seriesId,
          seriesTitle: series.title,
          categoryName: series.category?.name || '未分类',
          episodeCount: series.episodes.length,
          playCount: parseInt(stat.playCount),
          completionRate: parseFloat(parseFloat(stat.completionRate).toFixed(4)),
          avgWatchDuration: Math.round(avgDuration),
          likeCount: 0,
          dislikeCount: 0,
          shareCount: 0, // 暂无分享数据
          favoriteCount: 0,
          commentCount: 0,
        });
      });

      reactionStats.forEach(stat => {
        const key = `${stat.date}-${stat.seriesId}`;
        const data = resultMap.get(key);
        if (data) {
          data.likeCount = parseInt(stat.likeCount);
          data.dislikeCount = parseInt(stat.dislikeCount);
        }
      });

      favoriteStats.forEach(stat => {
        const key = `${stat.date}-${stat.seriesId}`;
        const data = resultMap.get(key);
        if (data) {
          data.favoriteCount = parseInt(stat.favoriteCount);
        }
      });

      commentStatsBySeriesMap.forEach((count, key) => {
        const data = resultMap.get(key);
        if (data) {
          data.commentCount = count;
        }
      });

      // 7. 转换为数组并排序
      const result = Array.from(resultMap.values()).sort((a, b) => {
        if (a.date !== b.date) {
          return b.date.localeCompare(a.date); // 日期降序
        }
        return b.playCount - a.playCount; // 播放量降序
      });

      return {
        code: 200,
        message: 'success',
        timestamp: new Date().toISOString(),
        data: result,
      };
    } catch (error) {
      return {
        code: 500,
        message: `获取系列明细数据失败: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString(),
        data: [],
      };
    }
  }

  /**
   * 获取运营核心指标（按日期）
   * GET /api/admin/export/overview-stats?startDate=2026-03-20&endDate=2026-03-30
   *
   * 返回按日期倒序的数组，每项包含：
   *   date, new_users, active_users, launches, total_users, new_user_ratio,
   *   retention_next_day, avg_session_duration, avg_daily_duration, avg_daily_launches
   *
   * 说明：
   * - active_users：与 dashboard/active-users 的单日 dau 完全一致
   * - 单日实现：优先读 Redis HyperLogLog（dau:YYYYMMDD），再与 MySQL（当天观看用户 ∪ 当天注册用户）结果取较大值
   * - retention_next_day：今天的数据次日才能计算，返回 null
   * - avg_daily_duration / avg_daily_launches：依赖 watch_logs 表，无数据时返回 null
   */
  @Get('overview-stats')
  async getOverviewStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    try {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      // ── 1. 枚举日期列表 ──────────────────────────────────────────────────
      const dates = this.analyticsService.enumerateLocalDates(start, end);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      // 使用本地日期（避免 UTC 与北京时间 UTC+8 的偏移导致今天被误判为明天）
      const todayStr = this.analyticsService.getLocalDateStr(today);


      // ── 2. 新增用户（按日） ──────────────────────────────────────────────
      const newUserRows = await this.userRepo
        .createQueryBuilder('u')
        .select("DATE_FORMAT(u.created_at, '%Y-%m-%d')", 'date')
        .addSelect('COUNT(*)', 'cnt')
        .where('u.created_at >= :start', { start })
        .andWhere('u.created_at <= :end', { end })
        .groupBy('date')
        .getRawMany<{ date: string; cnt: string }>();
      const newUserMap = new Map(newUserRows.map(r => [r.date, parseInt(r.cnt)]));

      // ── 3. 累计用户（截止每天末尾的总注册数） ───────────────────────────
      // 一次查询获取每天末尾前的累计数，用 subquery 方式：
      const cumulativeRows = await this.userRepo
        .createQueryBuilder('u')
        .select("DATE_FORMAT(u.created_at, '%Y-%m-%d')", 'date')
        .addSelect('COUNT(*)', 'daily')
        .where('u.created_at <= :end', { end })
        .groupBy('date')
        .orderBy('date', 'ASC')
        .getRawMany<{ date: string; daily: string }>();

      // 构建累计map：对全局所有日期做前缀累加
      const cumulativeMap = new Map<string, number>();
      let runningTotal = 0;
      for (const row of cumulativeRows) {
        runningTotal += parseInt(row.daily);
        cumulativeMap.set(row.date, runningTotal);
      }
      // 对于查询范围内的日期，用最近一个有数据的日期的累计值填充
      let lastKnownTotal = 0;
      const sortedCumulativeDates = Array.from(cumulativeMap.keys()).sort();
      // 找到 startDate 之前的累计基数
      for (const d of sortedCumulativeDates) {
        if (d < dates[0]) lastKnownTotal = cumulativeMap.get(d)!;
      }
      const totalUsersMap = new Map<string, number>();
      let rolling = lastKnownTotal;
      for (const d of dates) {
        rolling += newUserMap.get(d) ?? 0;
        totalUsersMap.set(d, rolling);
      }

      // ── 4. 日活（复用 AnalyticsService 统一口径） ─────────────────────
      const activeUsersMap = await this.analyticsService.getActiveUsersForDates(dates);


      // ── 5. 观看次数（watch_progress 更新次数作为代理，非去重） ──────────
      const launchRows = await this.wpRepo
        .createQueryBuilder('wp')
        .select("DATE_FORMAT(wp.updated_at, '%Y-%m-%d')", 'date')
        .addSelect('COUNT(*)', 'cnt')
        .where('wp.updated_at >= :start', { start })
        .andWhere('wp.updated_at <= :end', { end })
        .groupBy('date')
        .getRawMany<{ date: string; cnt: string }>();
      const launchMap = new Map(launchRows.map(r => [r.date, parseInt(r.cnt)]));

      // ── 6. 平均单次观看时长（avg_session_duration）── watch_logs ─────────
      const sessionRows = await this.watchLogRepo
        .createQueryBuilder('wl')
        .select('DATE(wl.watch_date)', 'date')
        .addSelect('AVG(wl.watch_duration)', 'avgSession')
        .where('wl.watch_date >= :startD', { startD: dates[0] })
        .andWhere('wl.watch_date <= :endD', { endD: dates[dates.length - 1] })
        .groupBy('date')
        .getRawMany<{ date: string; avgSession: string }>();
      const sessionMap = new Map(sessionRows.map(r => [r.date, Math.round(parseFloat(r.avgSession) || 0)]));

      // 降级：若 watch_logs 无该日数据，从 watch_progress 取 avg stop_at_second
      const sessionFallbackRows = await this.wpRepo
        .createQueryBuilder('wp')
        .select("DATE_FORMAT(wp.updated_at, '%Y-%m-%d')", 'date')
        .addSelect('AVG(wp.stop_at_second)', 'avgSession')
        .where('wp.updated_at >= :start', { start })
        .andWhere('wp.updated_at <= :end', { end })
        .groupBy('date')
        .getRawMany<{ date: string; avgSession: string }>();
      const sessionFallbackMap = new Map(sessionFallbackRows.map(r => [r.date, Math.round(parseFloat(r.avgSession) || 0)]));

      // ── 7. 平均日观看时长 & 平均日观看次数（watch_logs，今日返回 null） ──
      const dailyDurationRows = await this.watchLogRepo
        .createQueryBuilder('wl')
        .select('DATE(wl.watch_date)', 'date')
        .addSelect('SUM(wl.watch_duration)', 'totalDur')
        .addSelect('COUNT(DISTINCT wl.user_id)', 'uniqueUsers')
        .addSelect('COUNT(*)', 'totalSessions')
        .where('wl.watch_date >= :startD', { startD: dates[0] })
        .andWhere('wl.watch_date <= :endD', { endD: dates[dates.length - 1] })
        .groupBy('date')
        .getRawMany<{ date: string; totalDur: string; uniqueUsers: string; totalSessions: string }>();
      const dailyDurMap = new Map(
        dailyDurationRows.map(r => [
          r.date,
          {
            avgDailyDuration: parseInt(r.uniqueUsers) > 0
              ? Math.round(parseInt(r.totalDur) / parseInt(r.uniqueUsers))
              : null,
            avgDailyLaunches: parseInt(r.uniqueUsers) > 0
              ? parseFloat((parseInt(r.totalSessions) / parseInt(r.uniqueUsers)).toFixed(2))
              : null,
          },
        ]),
      );

      // ── 8. 次日留存率（批量计算，当天 = null） ──────────────────────────
      const retentionMap = new Map<string, number | null>();

      // 找出需要计算留存的日期（排除今天及之后）
      const retentionDates = dates.filter(d => d < todayStr);
      dates.filter(d => d >= todayStr).forEach(d => retentionMap.set(d, null));

      if (retentionDates.length > 0) {
        const retStart = new Date(retentionDates[0]); retStart.setHours(0, 0, 0, 0);
        const retEnd   = new Date(retentionDates[retentionDates.length - 1]); retEnd.setHours(23, 59, 59, 999);

        // 一次查出范围内每天的新增用户数（cohort size）
        const cohortRows = await this.userRepo
          .createQueryBuilder('u')
          .select("DATE_FORMAT(u.created_at, '%Y-%m-%d')", 'date')
          .addSelect('COUNT(*)', 'cnt')
          .where('u.created_at >= :retStart', { retStart })
          .andWhere('u.created_at <= :retEnd', { retEnd })
          .groupBy('date')
          .getRawMany<{ date: string; cnt: string }>();
        const cohortMap = new Map(cohortRows.map(r => [r.date, parseInt(r.cnt)]));

        // 一次查出：当天注册的用户，次日是否有 watch_progress 记录
        // 使用 JOIN：u.created_at 在某天，wp.updated_at 在次日
        const retentionRows = await this.userRepo
          .createQueryBuilder('u')
          .select("DATE_FORMAT(u.created_at, '%Y-%m-%d')", 'cohortDate')
          .addSelect('COUNT(DISTINCT u.id)', 'retained')
          .innerJoin(
            'watch_progress',
            'wp',
            "wp.user_id = u.id AND DATE(wp.updated_at) = DATE(DATE_ADD(u.created_at, INTERVAL 1 DAY))",
          )
          .where('u.created_at >= :retStart', { retStart })
          .andWhere('u.created_at <= :retEnd', { retEnd })
          .groupBy('cohortDate')
          .getRawMany<{ cohortDate: string; retained: string }>();
        const retainedMap = new Map(retentionRows.map(r => [r.cohortDate, parseInt(r.retained)]));

        for (const d of retentionDates) {
          const cohortSize = cohortMap.get(d) ?? 0;
          if (cohortSize === 0) { retentionMap.set(d, 0); continue; }
          const retained = retainedMap.get(d) ?? 0;
          retentionMap.set(d, parseFloat((retained / cohortSize).toFixed(4)));
        }
      }

      // ── 9. 组装结果 ──────────────────────────────────────────────────────
      const result = dates
        .map(d => {
          const newUsers   = newUserMap.get(d) ?? 0;
          const totalUsers = totalUsersMap.get(d) ?? 0;

          // 日活：复用 AnalyticsService 统一口径
          const activeUsers = activeUsersMap.get(d) ?? 0;

          const launches   = launchMap.get(d) ?? 0;
          // new_user_ratio：新用户占活跃用户比例，最大不超过 1
          const newUserRatio = activeUsers > 0
            ? parseFloat(Math.min(newUsers / activeUsers, 1).toFixed(4))
            : 0;

          const avgSessionDuration =
            sessionMap.get(d) ?? sessionFallbackMap.get(d) ?? 0;

          // 今日的 avg_daily_duration / avg_daily_launches 设为 null（次日才可算）
          const daily = dailyDurMap.get(d);
          const avgDailyDuration  = d >= todayStr ? null : (daily?.avgDailyDuration  ?? null);
          const avgDailyLaunches  = d >= todayStr ? null : (daily?.avgDailyLaunches  ?? null);

          return {
            date: d,
            new_users:            newUsers,
            active_users:         activeUsers,
            launches:             launches,
            total_users:          totalUsers,
            new_user_ratio:       newUserRatio,
            retention_next_day:   retentionMap.get(d) ?? null,
            avg_session_duration: avgSessionDuration,
            avg_daily_duration:   avgDailyDuration,
            avg_daily_launches:   avgDailyLaunches,
          };
        })
        .reverse(); // 按日期倒序

      return { code: 200, data: result };
    } catch (error) {
      return {
        code: 500,
        data: null,
        message: `获取运营指标失败: ${error instanceof Error ? error.message : String(error)}`,
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

