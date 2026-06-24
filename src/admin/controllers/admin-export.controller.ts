/**
 * 管理后台 - 数据导出控制器
 * 路由前缀: /api/admin/export
 */
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WatchLog } from '../../video/entity/watch-log.entity';
import { User } from '../../user/entity/user.entity';
import { EpisodeReaction } from '../../video/entity/episode-reaction.entity';
import { Favorite } from '../../user/entity/favorite.entity';
import { Series } from '../../video/entity/series.entity';
import { Comment } from '../../video/entity/comment.entity';
import { UserOnlineDaily } from '../../user/entity/user-online-daily.entity';
import { ExportSeriesDetailsDto, SeriesDetailData } from '../dto/export-series-details.dto';
import { AnalyticsService } from '../services/analytics.service';
import { AdminJwtAuthGuard } from '../guards/admin-jwt-auth.guard';

/**
 * 数据导出控制器
 * 用于运维导出Excel所需的统计数据
 */
@UseGuards(AdminJwtAuthGuard)
@Controller('admin/export')
export class AdminExportController {
  constructor(
    @InjectRepository(WatchLog)
    private readonly watchLogRepo: Repository<WatchLog>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(EpisodeReaction)
    private readonly reactionRepo: Repository<EpisodeReaction>,
    @InjectRepository(Favorite)
    private readonly favoriteRepo: Repository<Favorite>,
    @InjectRepository(Series)
    private readonly seriesRepo: Repository<Series>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(UserOnlineDaily)
    private readonly onlineDailyRepo: Repository<UserOnlineDaily>,
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
      const dates = this.analyticsService.enumerateLocalDateStrings(startDate, endDate);
      const start = dates[0] || startDate;
      const end = dates[dates.length - 1] || endDate;
      const { startDate: startTime } = this.analyticsService.getLocalDateRange(start);
      const { endDate: endTime } = this.analyticsService.getLocalDateRange(end);

      const statsMap = new Map<string, any>();
      dates.forEach(d => statsMap.set(d, {
        date: this.formatDate(d),
        playCount: 0,
        completionRate: 0,
        avgWatchDuration: 0,
        likeCount: 0,
        shareCount: 0,
        favoriteCount: 0,
      }));

      const watchRows = await this.watchLogRepo.query(
        `SELECT DATE_FORMAT(wl.watch_date, '%Y-%m-%d') date,
                COUNT(*) playCount,
                AVG(wl.watch_duration) avgWatchDuration,
                SUM(CASE WHEN ep.duration > 0 AND wl.end_position >= ep.duration * 0.9 THEN 1 ELSE 0 END) completedCount,
                SUM(CASE WHEN ep.duration > 0 THEN 1 ELSE 0 END) completableCount
         FROM watch_logs wl
         INNER JOIN episodes ep ON ep.id = wl.episode_id
         WHERE wl.watch_date >= ? AND wl.watch_date <= ?
         GROUP BY DATE_FORMAT(wl.watch_date, '%Y-%m-%d')`,
        [start, end],
      ) as Array<{ date: string; playCount: string; avgWatchDuration: string; completedCount: string; completableCount: string }>;

      watchRows.forEach(row => {
        const item = statsMap.get(row.date);
        if (!item) return;
        const total = Number(row.completableCount || 0);
        item.playCount = Number(row.playCount || 0);
        item.avgWatchDuration = Math.round(Number(row.avgWatchDuration || 0));
        item.completionRate = total > 0 ? Number((Number(row.completedCount || 0) / total).toFixed(4)) : 0;
      });

      const likeRows = await this.reactionRepo.query(
        `SELECT DATE_FORMAT(DATE_ADD(created_at, INTERVAL 8 HOUR), '%Y-%m-%d') date, COUNT(*) likeCount
         FROM episode_reactions
         WHERE created_at >= ? AND created_at <= ? AND reaction_type = 'like'
         GROUP BY DATE_FORMAT(DATE_ADD(created_at, INTERVAL 8 HOUR), '%Y-%m-%d')`,
        [startTime, endTime],
      ) as Array<{ date: string; likeCount: string }>;
      likeRows.forEach(row => { const item = statsMap.get(row.date); if (item) item.likeCount = Number(row.likeCount || 0); });

      const favoriteRows = await this.favoriteRepo.query(
        `SELECT DATE_FORMAT(DATE_ADD(created_at, INTERVAL 8 HOUR), '%Y-%m-%d') date, COUNT(*) favoriteCount
         FROM favorites
         WHERE created_at >= ? AND created_at <= ?
         GROUP BY DATE_FORMAT(DATE_ADD(created_at, INTERVAL 8 HOUR), '%Y-%m-%d')`,
        [startTime, endTime],
      ) as Array<{ date: string; favoriteCount: string }>;
      favoriteRows.forEach(row => { const item = statsMap.get(row.date); if (item) item.favoriteCount = Number(row.favoriteCount || 0); });

      return {
        code: 200,
        data: dates.map(d => statsMap.get(d)),
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
      const dates = this.analyticsService.enumerateLocalDateStrings(startDate, endDate);
      const start = dates[0] || startDate;
      const end = dates[dates.length - 1] || endDate;
      const { startDate: startTime } = this.analyticsService.getLocalDateRange(start);
      const { endDate: endTime } = this.analyticsService.getLocalDateRange(end);

      const statsMap = new Map<string, any>();
      dates.forEach(d => statsMap.set(d, {
        date: this.formatDate(d),
        newUsers: 0,
        nextDayRetention: null,
        dau: 0,
        avgWatchDuration: 0,
        newUserSource: '自然增长',
      }));

      const newUserRows = await this.userRepo.query(
        `SELECT DATE_FORMAT(DATE_ADD(created_at, INTERVAL 8 HOUR), '%Y-%m-%d') date, COUNT(*) newUsers
         FROM users
         WHERE created_at >= ? AND created_at <= ?
         GROUP BY DATE_FORMAT(DATE_ADD(created_at, INTERVAL 8 HOUR), '%Y-%m-%d')`,
        [startTime, endTime],
      ) as Array<{ date: string; newUsers: string }>;
      newUserRows.forEach(row => { const item = statsMap.get(row.date); if (item) item.newUsers = Number(row.newUsers || 0); });

      const dauRows = await this.onlineDailyRepo.query(
        `SELECT date, COUNT(DISTINCT user_id) dau
         FROM user_online_daily
         WHERE date >= ? AND date <= ? AND duration > 0
         GROUP BY date`,
        [start, end],
      ) as Array<{ date: string; dau: string }>;
      dauRows.forEach(row => { const item = statsMap.get(this.formatDateOnly(row.date)); if (item) item.dau = Number(row.dau || 0); });

      const avgWatchRows = await this.watchLogRepo.query(
        `SELECT DATE_FORMAT(watch_date, '%Y-%m-%d') date,
                SUM(watch_duration) / COUNT(DISTINCT user_id) avgWatchDuration
         FROM watch_logs
         WHERE watch_date >= ? AND watch_date <= ?
         GROUP BY DATE_FORMAT(watch_date, '%Y-%m-%d')`,
        [start, end],
      ) as Array<{ date: string; avgWatchDuration: string }>;
      avgWatchRows.forEach(row => { const item = statsMap.get(row.date); if (item) item.avgWatchDuration = Math.round(Number(row.avgWatchDuration || 0)); });

      const cohortRows = await this.userRepo.query(
        `SELECT DATE_FORMAT(DATE_ADD(created_at, INTERVAL 8 HOUR), '%Y-%m-%d') cohortDate, COUNT(*) cohortSize
         FROM users
         WHERE created_at >= ? AND created_at <= ?
         GROUP BY DATE_FORMAT(DATE_ADD(created_at, INTERVAL 8 HOUR), '%Y-%m-%d')`,
        [startTime, endTime],
      ) as Array<{ cohortDate: string; cohortSize: string }>;
      const retainedRows = await this.userRepo.query(
        `SELECT DATE_FORMAT(DATE_ADD(u.created_at, INTERVAL 8 HOUR), '%Y-%m-%d') cohortDate,
                COUNT(DISTINCT u.id) retainedUsers
         FROM users u
         INNER JOIN user_online_daily od
           ON od.user_id = u.id
          AND od.duration > 0
          AND od.date = DATE_FORMAT(DATE_ADD(DATE_ADD(u.created_at, INTERVAL 8 HOUR), INTERVAL 1 DAY), '%Y-%m-%d')
         WHERE u.created_at >= ? AND u.created_at <= ?
         GROUP BY DATE_FORMAT(DATE_ADD(u.created_at, INTERVAL 8 HOUR), '%Y-%m-%d')`,
        [startTime, endTime],
      ) as Array<{ cohortDate: string; retainedUsers: string }>;
      const cohortMap = new Map(cohortRows.map(r => [r.cohortDate, Number(r.cohortSize || 0)]));
      const retainedMap = new Map(retainedRows.map(r => [r.cohortDate, Number(r.retainedUsers || 0)]));
      const todayStr = this.analyticsService.getLocalDateStr(new Date());
      dates.forEach(d => {
        const item = statsMap.get(d);
        if (!item) return;
        if (d >= todayStr) { item.nextDayRetention = null; return; }
        const cohortSize = cohortMap.get(d) || 0;
        item.nextDayRetention = cohortSize > 0 ? Number(((retainedMap.get(d) || 0) / cohortSize).toFixed(4)) : 0;
      });

      return {
        code: 200,
        data: dates.map(d => statsMap.get(d)),
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
      const dates = this.analyticsService.enumerateLocalDateStrings(startDate, endDate);
      const start = dates[0] || startDate;
      const end = dates[dates.length - 1] || endDate;
      const { startDate: startTime } = this.analyticsService.getLocalDateRange(start);
      const { endDate: endTime } = this.analyticsService.getLocalDateRange(end);

      const seriesQuery = this.seriesRepo
        .createQueryBuilder('series')
        .leftJoinAndSelect('series.category', 'category')
        .leftJoinAndSelect('series.episodes', 'episodes');

      if (categoryId) {
        seriesQuery.where('series.category_id = :categoryId', { categoryId });
      }

      const seriesList = await seriesQuery.getMany();
      const seriesIds = seriesList.map(s => s.id);
      if (seriesIds.length === 0) {
        return { code: 200, message: 'success', timestamp: new Date().toISOString(), data: [] };
      }

      const seriesMap = new Map(seriesList.map(s => [s.id, s]));
      const resultMap = new Map<string, SeriesDetailData>();
      const ensureItem = (date: string, seriesId: number): SeriesDetailData | null => {
        const series = seriesMap.get(seriesId);
        if (!series) return null;
        const key = `${date}-${seriesId}`;
        const existing = resultMap.get(key);
        if (existing) return existing;
        const item: SeriesDetailData = {
          date,
          seriesId,
          seriesTitle: series.title,
          categoryName: series.category?.name || '未分类',
          episodeCount: series.episodes.length,
          playCount: 0,
          completionRate: 0,
          avgWatchDuration: 0,
          likeCount: 0,
          dislikeCount: 0,
          shareCount: 0,
          favoriteCount: 0,
          commentCount: 0,
        };
        resultMap.set(key, item);
        return item;
      };

      const watchRows = await this.watchLogRepo.query(
        `SELECT DATE_FORMAT(wl.watch_date, '%Y-%m-%d') date,
                ep.series_id seriesId,
                COUNT(*) playCount,
                AVG(wl.watch_duration) avgWatchDuration,
                SUM(CASE WHEN ep.duration > 0 AND wl.end_position >= ep.duration * 0.9 THEN 1 ELSE 0 END) completedCount,
                SUM(CASE WHEN ep.duration > 0 THEN 1 ELSE 0 END) completableCount
         FROM watch_logs wl
         INNER JOIN episodes ep ON ep.id = wl.episode_id
         WHERE wl.watch_date >= ? AND wl.watch_date <= ? AND ep.series_id IN (?)
         GROUP BY DATE_FORMAT(wl.watch_date, '%Y-%m-%d'), ep.series_id`,
        [start, end, seriesIds],
      ) as Array<{ date: string; seriesId: number; playCount: string; avgWatchDuration: string; completedCount: string; completableCount: string }>;

      watchRows.forEach(row => {
        const item = ensureItem(row.date, Number(row.seriesId));
        if (!item) return;
        const total = Number(row.completableCount || 0);
        item.playCount = Number(row.playCount || 0);
        item.avgWatchDuration = Math.round(Number(row.avgWatchDuration || 0));
        item.completionRate = total > 0 ? Number((Number(row.completedCount || 0) / total).toFixed(4)) : 0;
      });

      const reactionRows = await this.reactionRepo.query(
        `SELECT DATE_FORMAT(DATE_ADD(r.created_at, INTERVAL 8 HOUR), '%Y-%m-%d') date,
                ep.series_id seriesId,
                SUM(CASE WHEN r.reaction_type = 'like' THEN 1 ELSE 0 END) likeCount,
                SUM(CASE WHEN r.reaction_type = 'dislike' THEN 1 ELSE 0 END) dislikeCount
         FROM episode_reactions r
         INNER JOIN episodes ep ON ep.id = r.episode_id
         WHERE r.created_at >= ? AND r.created_at <= ? AND ep.series_id IN (?)
         GROUP BY DATE_FORMAT(DATE_ADD(r.created_at, INTERVAL 8 HOUR), '%Y-%m-%d'), ep.series_id`,
        [startTime, endTime, seriesIds],
      ) as Array<{ date: string; seriesId: number; likeCount: string; dislikeCount: string }>;

      reactionRows.forEach(row => {
        const item = ensureItem(row.date, Number(row.seriesId));
        if (!item) return;
        item.likeCount = Number(row.likeCount || 0);
        item.dislikeCount = Number(row.dislikeCount || 0);
      });

      const favoriteRows = await this.favoriteRepo.query(
        `SELECT DATE_FORMAT(DATE_ADD(created_at, INTERVAL 8 HOUR), '%Y-%m-%d') date,
                series_id seriesId,
                COUNT(*) favoriteCount
         FROM favorites
         WHERE created_at >= ? AND created_at <= ? AND series_id IN (?)
         GROUP BY DATE_FORMAT(DATE_ADD(created_at, INTERVAL 8 HOUR), '%Y-%m-%d'), series_id`,
        [startTime, endTime, seriesIds],
      ) as Array<{ date: string; seriesId: number; favoriteCount: string }>;

      favoriteRows.forEach(row => {
        const item = ensureItem(row.date, Number(row.seriesId));
        if (item) item.favoriteCount = Number(row.favoriteCount || 0);
      });

      const commentRows = await this.commentRepo.query(
        `SELECT DATE_FORMAT(DATE_ADD(c.created_at, INTERVAL 8 HOUR), '%Y-%m-%d') date,
                ep.series_id seriesId,
                COUNT(*) commentCount
         FROM comments c
         INNER JOIN episodes ep ON ep.short_id = c.episode_short_id
         WHERE c.created_at >= ? AND c.created_at <= ? AND ep.series_id IN (?)
         GROUP BY DATE_FORMAT(DATE_ADD(c.created_at, INTERVAL 8 HOUR), '%Y-%m-%d'), ep.series_id`,
        [startTime, endTime, seriesIds],
      ) as Array<{ date: string; seriesId: number; commentCount: string }>;

      commentRows.forEach(row => {
        const item = ensureItem(row.date, Number(row.seriesId));
        if (item) item.commentCount = Number(row.commentCount || 0);
      });

      const result = Array.from(resultMap.values()).sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return b.playCount - a.playCount;
      });

      return { code: 200, message: 'success', timestamp: new Date().toISOString(), data: result };
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
   * - avg_daily_duration / avg_daily_watch_sessions：依赖 watch_logs 表，无数据时返回 null
   */
  @Get('overview-stats')
  async getOverviewStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    try {
      const dates = this.analyticsService.enumerateLocalDateStrings(startDate, endDate);
      if (dates.length === 0) {
        return { code: 200, data: [] };
      }

      const start = dates[0] || startDate;
      const end = dates[dates.length - 1] || endDate;
      const { startDate: startTime } = this.analyticsService.getLocalDateRange(start);
      const { endDate: endTime } = this.analyticsService.getLocalDateRange(end);
      const todayStr = this.analyticsService.getLocalDateStr(new Date());

      const newUserRows = await this.userRepo.query(
        `SELECT DATE_FORMAT(DATE_ADD(created_at, INTERVAL 8 HOUR), '%Y-%m-%d') date, COUNT(*) cnt
         FROM users
         WHERE created_at >= ? AND created_at <= ?
         GROUP BY DATE_FORMAT(DATE_ADD(created_at, INTERVAL 8 HOUR), '%Y-%m-%d')`,
        [startTime, endTime],
      ) as Array<{ date: string; cnt: string }>;
      const newUserMap = new Map(newUserRows.map(r => [r.date, Number(r.cnt || 0)]));

      const beforeRows = await this.userRepo.query(
        'SELECT COUNT(*) cnt FROM users WHERE created_at < ?',
        [startTime],
      ) as Array<{ cnt: string }>;
      const totalUsersMap = new Map<string, number>();
      let totalUsers = Number(beforeRows[0]?.cnt || 0);
      dates.forEach(d => {
        totalUsers += newUserMap.get(d) || 0;
        totalUsersMap.set(d, totalUsers);
      });

      const activeRows = await this.onlineDailyRepo.query(
        `SELECT date, COUNT(DISTINCT user_id) activeUsers
         FROM user_online_daily
         WHERE date >= ? AND date <= ? AND duration > 0
         GROUP BY date`,
        [start, end],
      ) as Array<{ date: string; activeUsers: string }>;
      const activeUsersMap = new Map(activeRows.map(r => [this.formatDateOnly(r.date), Number(r.activeUsers || 0)]));

      const sessionRows = await this.watchLogRepo.query(
        `SELECT DATE_FORMAT(watch_date, '%Y-%m-%d') date,
                SUM(watch_duration) totalDuration,
                COUNT(*) totalSessions,
                COUNT(DISTINCT user_id) uniqueUsers
         FROM watch_logs
         WHERE watch_date >= ? AND watch_date <= ?
         GROUP BY DATE_FORMAT(watch_date, '%Y-%m-%d')`,
        [start, end],
      ) as Array<{ date: string; totalDuration: string; totalSessions: string; uniqueUsers: string }>;
      const sessionMap = new Map(sessionRows.map(r => [r.date, {
        totalDuration: Number(r.totalDuration || 0),
        totalSessions: Number(r.totalSessions || 0),
        uniqueUsers: Number(r.uniqueUsers || 0),
      }]));

      const cohortRows = await this.userRepo.query(
        `SELECT DATE_FORMAT(DATE_ADD(created_at, INTERVAL 8 HOUR), '%Y-%m-%d') cohortDate, COUNT(*) cohortSize
         FROM users
         WHERE created_at >= ? AND created_at <= ?
         GROUP BY DATE_FORMAT(DATE_ADD(created_at, INTERVAL 8 HOUR), '%Y-%m-%d')`,
        [startTime, endTime],
      ) as Array<{ cohortDate: string; cohortSize: string }>;
      const retainedRows = await this.userRepo.query(
        `SELECT DATE_FORMAT(DATE_ADD(u.created_at, INTERVAL 8 HOUR), '%Y-%m-%d') cohortDate,
                COUNT(DISTINCT u.id) retainedUsers
         FROM users u
         INNER JOIN user_online_daily od
           ON od.user_id = u.id
          AND od.duration > 0
          AND od.date = DATE_FORMAT(DATE_ADD(DATE_ADD(u.created_at, INTERVAL 8 HOUR), INTERVAL 1 DAY), '%Y-%m-%d')
         WHERE u.created_at >= ? AND u.created_at <= ?
         GROUP BY DATE_FORMAT(DATE_ADD(u.created_at, INTERVAL 8 HOUR), '%Y-%m-%d')`,
        [startTime, endTime],
      ) as Array<{ cohortDate: string; retainedUsers: string }>;
      const cohortMap = new Map(cohortRows.map(r => [r.cohortDate, Number(r.cohortSize || 0)]));
      const retainedMap = new Map(retainedRows.map(r => [r.cohortDate, Number(r.retainedUsers || 0)]));

      const result = dates.map(d => {
        const newUsers = newUserMap.get(d) || 0;
        const activeUsers = activeUsersMap.get(d) || 0;
        const session = sessionMap.get(d);
        const totalDuration = session?.totalDuration || 0;
        const totalSessions = session?.totalSessions || 0;
        const uniqueUsers = session?.uniqueUsers || 0;
        const cohortSize = cohortMap.get(d) || 0;
        const retention = d >= todayStr
          ? null
          : (cohortSize > 0 ? Number(((retainedMap.get(d) || 0) / cohortSize).toFixed(4)) : 0);

        return {
          date: d,
          new_users: newUsers,
          content_active_users: activeUsers,
          watch_progress_updates: totalSessions,
          total_users: totalUsersMap.get(d) || 0,
          new_user_ratio: activeUsers > 0 ? Number(Math.min(newUsers / activeUsers, 1).toFixed(4)) : 0,
          next_day_content_retention: retention,
          avg_session_duration: totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0,
          avg_daily_duration: uniqueUsers > 0 ? Math.round(totalDuration / uniqueUsers) : null,
          avg_daily_watch_sessions: uniqueUsers > 0 ? Number((totalSessions / uniqueUsers).toFixed(2)) : null,
        };
      }).reverse();

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
    const [, month, day] = dateStr.split('-').map(Number);
    return `${month}月${day}日`;
  }

  private formatDateOnly(value: string | Date): string {
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return String(value).slice(0, 10);
  }
}

