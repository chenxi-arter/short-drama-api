import { Controller, Get, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../user/entity/user.entity';
import { RefreshToken } from '../../auth/entity/refresh-token.entity';
import { Series } from '../../video/entity/series.entity';
import { Episode } from '../../video/entity/episode.entity';
import { Banner } from '../../video/entity/banner.entity';
import { Comment } from '../../video/entity/comment.entity';
import { WatchProgress } from '../../video/entity/watch-progress.entity';
import { BrowseHistory } from '../../video/entity/browse-history.entity';
import { AnalyticsService } from '../services/analytics.service';

function toDateStart(d?: string): Date | undefined {
  if (!d) return undefined;
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return undefined;
  dt.setHours(0, 0, 0, 0);
  return dt;
}

function toDateEnd(d?: string): Date | undefined {
  if (!d) return undefined;
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return undefined;
  dt.setHours(23, 59, 59, 999);
  return dt;
}

@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(RefreshToken) private readonly rtRepo: Repository<RefreshToken>,
    @InjectRepository(Series) private readonly seriesRepo: Repository<Series>,
    @InjectRepository(Episode) private readonly episodeRepo: Repository<Episode>,
    @InjectRepository(Banner) private readonly bannerRepo: Repository<Banner>,
    @InjectRepository(Comment) private readonly commentRepo: Repository<Comment>,
    @InjectRepository(WatchProgress) private readonly wpRepo: Repository<WatchProgress>,
    @InjectRepository(BrowseHistory) private readonly bhRepo: Repository<BrowseHistory>,
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Get('overview')
  async overview(@Query('from') from?: string, @Query('to') to?: string) {
    const start = toDateStart(from);
    const end = toDateEnd(to);
    const now = new Date();
    const dayAgo = new Date(Date.now() - 24 * 3600 * 1000);

    // 基础计数
    const [usersTotal, seriesTotal, episodesTotal, bannersTotal, commentsTotal] = await Promise.all([
      this.userRepo.count(),
      this.seriesRepo.count(),
      this.episodeRepo.count(),
      this.bannerRepo.count(),
      this.commentRepo.count(),
    ]);

    // 最新登录 & 活跃会话数
    const latestRt = await this.rtRepo.createQueryBuilder('rt')
      .orderBy('rt.created_at', 'DESC')
      .limit(1)
      .getOne();
    const activeLogins = await this.rtRepo
      .createQueryBuilder('rt')
      .where('rt.is_revoked = 0')
      .andWhere('rt.expires_at > :now', { now })
      .getCount();

    // 24h 新增和活跃
    const newUsers24h = await this.userRepo
      .createQueryBuilder('u')
      .where('u.created_at > :dayAgo', { dayAgo })
      .getCount();

    const comments24h = await this.commentRepo
      .createQueryBuilder('c')
      .where('c.created_at > :dayAgo', { dayAgo })
      .getCount();

    const visits24h = await this.bhRepo
      .createQueryBuilder('bh')
      .where('bh.updated_at > :dayAgo', { dayAgo })
      .getCount();

    // 播放总量（按 episode.playCount 汇总）
    const playSumRaw = await this.episodeRepo
      .createQueryBuilder('ep')
      .select('COALESCE(SUM(ep.play_count), 0)', 'sum')
      .getRawOne<{ sum: string }>();
    const totalPlayCount = Number(playSumRaw?.sum ?? 0);

    // 区间内的筛选数据（可用于同比/环比，先返回 count 供前端使用）
    let range: { usersInRange: number; visitsInRange: number; playActiveInRange: number } | undefined;
    if (start && end) {
      const [usersInRange, visitsInRange, playActiveInRange] = await Promise.all([
        this.userRepo
          .createQueryBuilder('u')
          .where('u.created_at BETWEEN :start AND :end', { start, end })
          .getCount(),
        this.bhRepo
          .createQueryBuilder('bh')
          .where('bh.updated_at BETWEEN :start AND :end', { start, end })
          .getCount(),
        this.wpRepo
          .createQueryBuilder('wp')
          .where('wp.updated_at BETWEEN :start AND :end', { start, end })
          .getCount(),
      ]);
      range = { usersInRange, visitsInRange, playActiveInRange };
    }

    return {
      users: {
        total: usersTotal,
        new24h: newUsers24h,
        activeLogins,
        lastLoginAtLatest: latestRt?.createdAt ?? null,
      },
      series: { total: seriesTotal },
      episodes: { total: episodesTotal },
      banners: { total: bannersTotal },
      comments: { total: commentsTotal, new24h: comments24h },
      plays: { totalPlayCount, last24hVisits: visits24h },
      range,
    };
  }

  @Get('timeseries')
  async timeseries(
    @Query('from') from?: string,
    @Query('to') to?: string,
    // @Query('granularity') granularity: 'day' | 'week' = 'day', // TODO: 未来可支持按周聚合
  ) {
    const start = toDateStart(from) ?? new Date(Date.now() - 14 * 24 * 3600 * 1000);
    const end = toDateEnd(to) ?? new Date();

    // helper: group by DATE for simplicity
    const newUsers = await this.userRepo
      .createQueryBuilder('u')
      .select("DATE_FORMAT(u.created_at, '%Y-%m-%d')", 'date')
      .addSelect('COUNT(1)', 'value')
      .where('u.created_at BETWEEN :start AND :end', { start, end })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string; value: string }>();

    const visits = await this.bhRepo
      .createQueryBuilder('bh')
      .select("DATE_FORMAT(bh.updated_at, '%Y-%m-%d')", 'date')
      .addSelect('COUNT(1)', 'value')
      .where('bh.updated_at BETWEEN :start AND :end', { start, end })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string; value: string }>();

    const playActive = await this.wpRepo
      .createQueryBuilder('wp')
      .select("DATE_FORMAT(wp.updated_at, '%Y-%m-%d')", 'date')
      .addSelect('COUNT(1)', 'value')
      .where('wp.updated_at BETWEEN :start AND :end', { start, end })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string; value: string }>();

    return {
      series: this.mergeSeries(['newUsers', 'visits', 'playActive'], [newUsers, visits, playActive]),
    };
  }

  private mergeSeries(names: string[], seriesArr: Array<Array<{ date: string; value: string }>>) {
    const map = new Map<string, Record<string, any>>();
    seriesArr.forEach((arr, idx) => {
      const name = names[idx];
      for (const row of arr) {
        const d = row.date;
        if (!map.has(d)) map.set(d, { date: d });
        const item = map.get(d)!;
        item[name] = Number(row.value);
      }
    });
    return Array.from(map.values()).sort((a, b) => (a.date < b.date ? -1 : 1));
  }

  @Get('top')
  async top(@Query('metric') metric: 'series_play' | 'series_visit' = 'series_play', @Query('limit') limit = 10, @Query('from') from?: string, @Query('to') to?: string) {
    const start = toDateStart(from);
    const end = toDateEnd(to);
    const take = Math.max(Number(limit) || 10, 1);

    if (metric === 'series_visit') {
      const qb = this.bhRepo
        .createQueryBuilder('bh')
        .select('bh.series_id', 'seriesId')
        .addSelect('COUNT(1)', 'visitCount')
        .groupBy('bh.series_id')
        .orderBy('visitCount', 'DESC')
        .limit(take);
      if (start && end) qb.where('bh.updated_at BETWEEN :start AND :end', { start, end });
      const rows = await qb.getRawMany<{ seriesId: number; visitCount: string }>();
      const ids = rows.map(r => r.seriesId);
      const series = ids.length ? await this.seriesRepo.findByIds(ids) : [];
      const dict = new Map(series.map(s => [s.id, s]));
      return { items: rows.map(r => ({ seriesId: r.seriesId, title: dict.get(r.seriesId)?.title || '', visitCount: Number(r.visitCount) })) };
    }

    // series_play by sum of episode.play_count grouped by series
    const rows = await this.episodeRepo
      .createQueryBuilder('ep')
      .select('ep.series_id', 'seriesId')
      .addSelect('COALESCE(SUM(ep.play_count),0)', 'playCount')
      .groupBy('ep.series_id')
      .orderBy('playCount', 'DESC')
      .limit(take)
      .getRawMany<{ seriesId: number; playCount: string }>();
    const ids = rows.map(r => r.seriesId);
    const series = ids.length ? await this.seriesRepo.findByIds(ids) : [];
    const dict = new Map(series.map(s => [s.id, s]));
    return { items: rows.map(r => ({ seriesId: r.seriesId, title: dict.get(r.seriesId)?.title || '', playCount: Number(r.playCount) })) };
  }

  @Get('recent-activities')
  async recent(@Query('limit') limit = 10) {
    const take = Math.max(Number(limit) || 10, 1);
    const [users, series, episodes, comments] = await Promise.all([
      this.userRepo.find({ order: { created_at: 'DESC' }, take }),
      this.seriesRepo.find({ order: { id: 'DESC' }, take }),
      this.episodeRepo.find({ order: { id: 'DESC' }, take }),
      this.commentRepo.find({ order: { createdAt: 'DESC' }, take }),
    ]);
    return { users, series, episodes, comments };
  }

  /**
   * 获取综合数据统计
   * GET /api/admin/dashboard/stats
   * 
   * 返回：
   * - 活跃用户数（DAU/WAU/MAU）
   * - 留存率（1日/7日）
   * - 内容播放量/完播率
   * - 平均观影时长
   * - 新增注册数
   */
  @Get('stats')
  async getStats() {
    try {
      const stats = await this.analyticsService.getComprehensiveStats();
      return {
        code: 200,
        data: stats,
        message: '数据统计获取成功',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        code: 500,
        data: null,
        message: `获取统计数据失败: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取活跃用户统计（DAU/WAU/MAU）
   * GET /api/admin/dashboard/active-users
   */
  @Get('active-users')
  async getActiveUsers() {
    try {
      const stats = await this.analyticsService.getActiveUsersStats();
      return {
        code: 200,
        data: stats,
        message: '活跃用户统计获取成功',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        code: 500,
        data: null,
        message: `获取活跃用户统计失败: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取用户留存率
   * GET /api/admin/dashboard/retention?retentionDays=1&cohortDate=2025-11-01
   * 
   * 参数：
   * - retentionDays: 留存天数（1=次日留存，7=7日留存），默认1
   * - cohortDate: 队列日期（该日注册的用户），默认昨天
   */
  @Get('retention')
  async getRetention(
    @Query('retentionDays') retentionDays?: string,
    @Query('cohortDate') cohortDate?: string,
  ) {
    try {
      const days = parseInt(retentionDays || '1', 10);
      const date = cohortDate ? new Date(cohortDate) : undefined;
      
      const stats = await this.analyticsService.getRetentionRate(days, date);
      return {
        code: 200,
        data: stats,
        message: '留存率统计获取成功',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        code: 500,
        data: null,
        message: `获取留存率失败: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取留存率趋势（最近N天）
   * GET /api/admin/dashboard/retention-trend?days=7&retentionDays=1
   * 
   * 参数：
   * - days: 统计最近N天，默认7
   * - retentionDays: 留存天数（1=次日留存，7=7日留存），默认1
   */
  @Get('retention-trend')
  async getRetentionTrend(
    @Query('days') days?: string,
    @Query('retentionDays') retentionDays?: string,
  ) {
    try {
      const daysNum = parseInt(days || '7', 10);
      const retentionDaysNum = parseInt(retentionDays || '1', 10);
      
      const stats = await this.analyticsService.getRetentionTrend(daysNum, retentionDaysNum);
      return {
        code: 200,
        data: stats,
        message: '留存率趋势获取成功',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        code: 500,
        data: null,
        message: `获取留存率趋势失败: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取内容播放统计
   * GET /api/admin/dashboard/content-stats
   */
  @Get('content-stats')
  async getContentStats() {
    try {
      const stats = await this.analyticsService.getContentPlayStats();
      return {
        code: 200,
        data: stats,
        message: '内容播放统计获取成功',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        code: 500,
        data: null,
        message: `获取内容播放统计失败: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取完播率和平均观影时长
   * GET /api/admin/dashboard/watch-stats
   */
  @Get('watch-stats')
  async getWatchStats() {
    try {
      const [duration, completion] = await Promise.all([
        this.analyticsService.getAverageWatchDuration(),
        this.analyticsService.getCompletionRate(),
      ]);

      return {
        code: 200,
        data: {
          ...duration,
          ...completion,
        },
        message: '观看统计获取成功',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        code: 500,
        data: null,
        message: `获取观看统计失败: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString(),
      };
    }
  }
}


