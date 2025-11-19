import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WatchProgress } from '../../video/entity/watch-progress.entity';
import { User } from '../../user/entity/user.entity';
import { EpisodeReaction } from '../../video/entity/episode-reaction.entity';
import { Favorite } from '../../user/entity/favorite.entity';
import { Comment } from '../../video/entity/comment.entity';

/**
 * 导出优化服务
 * 使用原生SQL优化查询性能
 */
@Injectable()
export class ExportOptimizationService {
  constructor(
    @InjectRepository(WatchProgress)
    private readonly wpRepo: Repository<WatchProgress>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(EpisodeReaction)
    private readonly reactionRepo: Repository<EpisodeReaction>,
    @InjectRepository(Favorite)
    private readonly favoriteRepo: Repository<Favorite>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
  ) {}

  /**
   * 优化后的播放统计查询
   * 使用单个SQL查询代替多次查询
   */
  async getPlayStatsOptimized(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // 使用原生SQL一次性查询所有数据
    const query = `
      SELECT 
        DATE_FORMAT(date_val, '%Y-%m-%d') as date,
        COALESCE(SUM(play_count), 0) as playCount,
        COALESCE(AVG(avg_duration), 0) as avgWatchDuration,
        COALESCE(AVG(completion_rate), 0) as completionRate,
        COALESCE(SUM(like_count), 0) as likeCount,
        COALESCE(SUM(favorite_count), 0) as favoriteCount
      FROM (
        -- 生成日期序列
        SELECT DATE_ADD(?, INTERVAL seq DAY) as date_val
        FROM (
          SELECT 0 as seq UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL 
          SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL 
          SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL 
          SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL 
          SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL 
          SELECT 15 UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL 
          SELECT 18 UNION ALL SELECT 19 UNION ALL SELECT 20 UNION ALL 
          SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23 UNION ALL 
          SELECT 24 UNION ALL SELECT 25 UNION ALL SELECT 26 UNION ALL 
          SELECT 27 UNION ALL SELECT 28 UNION ALL SELECT 29 UNION ALL SELECT 30
        ) seq_table
        WHERE DATE_ADD(?, INTERVAL seq DAY) <= ?
      ) dates
      LEFT JOIN (
        SELECT 
          DATE(wp.updated_at) as wp_date,
          COUNT(*) as play_count,
          AVG(wp.stop_at_second) as avg_duration,
          AVG(CASE WHEN wp.stop_at_second >= e.duration * 0.9 THEN 1 ELSE 0 END) as completion_rate
        FROM watch_progress wp
        INNER JOIN episodes e ON wp.episode_id = e.id
        WHERE wp.updated_at BETWEEN ? AND ?
          AND e.duration > 0
        GROUP BY DATE(wp.updated_at)
      ) wp_stats ON dates.date_val = wp_stats.wp_date
      LEFT JOIN (
        SELECT 
          DATE(created_at) as reaction_date,
          COUNT(*) as like_count
        FROM episode_reactions
        WHERE created_at BETWEEN ? AND ?
          AND reaction_type = 'like'
        GROUP BY DATE(created_at)
      ) reaction_stats ON dates.date_val = reaction_stats.reaction_date
      LEFT JOIN (
        SELECT 
          DATE(created_at) as favorite_date,
          COUNT(*) as favorite_count
        FROM favorites
        WHERE created_at BETWEEN ? AND ?
        GROUP BY DATE(created_at)
      ) favorite_stats ON dates.date_val = favorite_stats.favorite_date
      GROUP BY date
      ORDER BY date ASC
    `;

    const results = await this.wpRepo.query(query, [
      start, start, end,  // 日期序列参数
      start, end,          // watch_progress参数
      start, end,          // episode_reactions参数
      start, end           // favorites参数
    ]);

    return results.map((row: any) => ({
      date: this.formatDate(row.date),
      playCount: parseInt(row.playCount) || 0,
      avgWatchDuration: Math.round(parseFloat(row.avgWatchDuration) || 0),
      completionRate: parseFloat(parseFloat(row.completionRate || 0).toFixed(4)),
      likeCount: parseInt(row.likeCount) || 0,
      shareCount: 0,
      favoriteCount: parseInt(row.favoriteCount) || 0,
    }));
  }

  /**
   * 优化后的用户统计查询
   */
  async getUserStatsOptimized(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // 使用原生SQL优化查询
    const query = `
      SELECT 
        DATE_FORMAT(date_val, '%Y-%m-%d') as date,
        COALESCE(new_users, 0) as newUsers,
        COALESCE(dau, 0) as dau,
        COALESCE(avg_duration, 0) as avgWatchDuration,
        0 as nextDayRetention
      FROM (
        SELECT DATE_ADD(?, INTERVAL seq DAY) as date_val
        FROM (
          SELECT 0 as seq UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL 
          SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL 
          SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL 
          SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL 
          SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL 
          SELECT 15 UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL 
          SELECT 18 UNION ALL SELECT 19 UNION ALL SELECT 20 UNION ALL 
          SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23 UNION ALL 
          SELECT 24 UNION ALL SELECT 25 UNION ALL SELECT 26 UNION ALL 
          SELECT 27 UNION ALL SELECT 28 UNION ALL SELECT 29 UNION ALL SELECT 30
        ) seq_table
        WHERE DATE_ADD(?, INTERVAL seq DAY) <= ?
      ) dates
      LEFT JOIN (
        SELECT 
          DATE(created_at) as user_date,
          COUNT(*) as new_users
        FROM users
        WHERE created_at BETWEEN ? AND ?
        GROUP BY DATE(created_at)
      ) user_stats ON dates.date_val = user_stats.user_date
      LEFT JOIN (
        SELECT 
          DATE(updated_at) as wp_date,
          COUNT(DISTINCT user_id) as dau,
          AVG(stop_at_second) as avg_duration
        FROM watch_progress
        WHERE updated_at BETWEEN ? AND ?
        GROUP BY DATE(updated_at)
      ) wp_stats ON dates.date_val = wp_stats.wp_date
      ORDER BY date ASC
    `;

    const results = await this.userRepo.query(query, [
      start, start, end,  // 日期序列
      start, end,          // users
      start, end           // watch_progress
    ]);

    return results.map((row: any) => ({
      date: this.formatDate(row.date),
      newUsers: parseInt(row.newUsers) || 0,
      nextDayRetention: 0, // 次日留存需要单独计算，暂时返回0
      dau: parseInt(row.dau) || 0,
      avgWatchDuration: Math.round(parseFloat(row.avgWatchDuration) || 0),
      newUserSource: '自然增长',
    }));
  }

  /**
   * 优化后的系列明细查询
   * 使用分页避免一次性加载过多数据
   */
  async getSeriesDetailsOptimized(
    startDate: string,
    endDate: string,
    categoryId?: number,
    limit: number = 10000
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const categoryFilter = categoryId ? `AND s.category_id = ${categoryId}` : '';

    // 优化的SQL查询
    const query = `
      SELECT 
        DATE_FORMAT(wp.updated_at, '%Y-%m-%d') as date,
        s.id as seriesId,
        s.title as seriesTitle,
        COALESCE(c.name, '未分类') as categoryName,
        (SELECT COUNT(*) FROM episodes WHERE series_id = s.id) as episodeCount,
        COUNT(DISTINCT wp.id) as playCount,
        AVG(CASE WHEN wp.stop_at_second >= e.duration * 0.9 THEN 1 ELSE 0 END) as completionRate,
        AVG(wp.stop_at_second) as avgWatchDuration,
        COALESCE(SUM(CASE WHEN er.reaction_type = 'like' THEN 1 ELSE 0 END), 0) as likeCount,
        COALESCE(SUM(CASE WHEN er.reaction_type = 'dislike' THEN 1 ELSE 0 END), 0) as dislikeCount,
        0 as shareCount,
        COALESCE((
          SELECT COUNT(*) 
          FROM favorites f 
          WHERE f.series_id = s.id 
            AND DATE(f.created_at) = DATE(wp.updated_at)
        ), 0) as favoriteCount,
        COALESCE((
          SELECT COUNT(*) 
          FROM comments cm 
          WHERE cm.episode_short_id IN (
            SELECT short_id FROM episodes WHERE series_id = s.id
          )
          AND DATE(cm.created_at) = DATE(wp.updated_at)
        ), 0) as commentCount
      FROM watch_progress wp
      INNER JOIN episodes e ON wp.episode_id = e.id
      INNER JOIN series s ON e.series_id = s.id
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN episode_reactions er ON er.episode_id = e.id 
        AND DATE(er.created_at) = DATE(wp.updated_at)
      WHERE wp.updated_at BETWEEN ? AND ?
        ${categoryFilter}
        AND e.duration > 0
      GROUP BY DATE(wp.updated_at), s.id, s.title, c.name
      ORDER BY date DESC, playCount DESC
      LIMIT ?
    `;

    const results = await this.wpRepo.query(query, [start, end, limit]);

    return results.map((row: any) => ({
      date: row.date,
      seriesId: row.seriesId,
      seriesTitle: row.seriesTitle,
      categoryName: row.categoryName,
      episodeCount: parseInt(row.episodeCount) || 0,
      playCount: parseInt(row.playCount) || 0,
      completionRate: parseFloat(parseFloat(row.completionRate || 0).toFixed(4)),
      avgWatchDuration: Math.round(parseFloat(row.avgWatchDuration) || 0),
      likeCount: parseInt(row.likeCount) || 0,
      dislikeCount: parseInt(row.dislikeCount) || 0,
      shareCount: 0,
      favoriteCount: parseInt(row.favoriteCount) || 0,
      commentCount: parseInt(row.commentCount) || 0,
    }));
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  }
}
