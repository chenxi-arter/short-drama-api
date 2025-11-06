import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EpisodeReaction } from '../../video/entity/episode-reaction.entity';

/**
 * 用户点赞剧集服务
 * 提供获取用户点赞剧集列表的功能（按系列聚合）
 */
@Injectable()
export class LikedEpisodesService {
  constructor(
    @InjectRepository(EpisodeReaction)
    private readonly reactionRepo: Repository<EpisodeReaction>,
  ) {}

  /**
   * 获取用户点赞的剧集列表（按系列聚合显示）
   * 类似收藏列表，但基于点赞数据
   * 
   * @param userId 用户ID
   * @param page 页码
   * @param size 每页大小
   * @param categoryId 分类ID（可选，用于筛选特定分类）
   */
  async getUserLikedEpisodes(userId: number, page: number = 1, size: number = 20, categoryId?: number) {
    const skip = (page - 1) * size;

    // 添加分类筛选条件
    const categoryFilter = categoryId ? `AND s.category_id = ${categoryId}` : '';

    // 使用原生 SQL 进行复杂的聚合查询
    // 按系列聚合，返回用户点赞该系列的剧集数量
    const query = `
      SELECT 
        s.id as seriesId,
        s.short_id as seriesShortId,
        s.title as seriesTitle,
        s.cover_url as seriesCoverUrl,
        s.description,
        s.score,
        s.play_count as playCount,
        s.is_completed as isCompleted,
        c.name as categoryName,
        COUNT(DISTINCT er.episode_id) as likedEpisodeCount,
        MAX(er.created_at) as latestLikeTime,
        (SELECT COUNT(*) FROM episodes WHERE series_id = s.id AND status = 'published') as totalEpisodeCount,
        (SELECT COUNT(*) FROM episodes WHERE series_id = s.id AND status = 'published' AND DATE(created_at) = CURDATE()) as upCount
      FROM episode_reactions er
      INNER JOIN episodes e ON er.episode_id = e.id
      INNER JOIN series s ON e.series_id = s.id
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE er.user_id = ? 
        AND er.reaction_type = 'like'
        ${categoryFilter}
      GROUP BY s.id
      ORDER BY latestLikeTime DESC
      LIMIT ? OFFSET ?
    `;

    // 获取总数（带分类筛选）
    let totalQuery = this.reactionRepo
      .createQueryBuilder('er')
      .innerJoin('er.episode', 'e')
      .innerJoin('e.series', 's')
      .where('er.userId = :userId', { userId })
      .andWhere('er.reactionType = :reactionType', { reactionType: 'like' })
      .select('COUNT(DISTINCT s.id)', 'total');

    if (categoryId) {
      totalQuery = totalQuery.andWhere('s.categoryId = :categoryId', { categoryId });
    }

    const totalCount = await totalQuery.getRawOne<{ total: string }>();
    const total = parseInt(totalCount?.total || '0', 10);

    // 执行主查询
    const seriesList: Array<{
      seriesId: number;
      seriesShortId: string;
      seriesTitle: string;
      seriesCoverUrl: string;
      description: string;
      score: string;
      playCount: number;
      isCompleted: boolean;
      categoryName: string;
      likedEpisodeCount: number;
      latestLikeTime: Date;
      totalEpisodeCount: number;
      upCount: number;
    }> = await this.reactionRepo.query(query, [userId, size, skip]);

    // 组合数据
    const list = seriesList.map(series => ({
      seriesId: series.seriesId,
      seriesShortId: series.seriesShortId || '',
      seriesTitle: series.seriesTitle || '',
      seriesCoverUrl: series.seriesCoverUrl || '',
      categoryName: series.categoryName || '',
      description: series.description || '',
      score: series.score || '0.0',
      playCount: series.playCount || 0,
      totalEpisodeCount: series.totalEpisodeCount || 0,
      likedEpisodeCount: series.likedEpisodeCount || 0, // 用户点赞了该系列的多少集
      upCount: series.upCount || 0, // 当天新增集数（用于角标）
      isCompleted: series.isCompleted || false,
      likeTime: new Date(series.latestLikeTime).toISOString().replace('T', ' ').substring(0, 16),
    }));

    return {
      list,
      total,
      page,
      size,
      hasMore: total > page * size,
    };
  }

  /**
   * 获取用户点赞统计
   */
  async getUserLikedStats(userId: number) {
    const stats = await this.reactionRepo
      .createQueryBuilder('er')
      .select('COUNT(*)', 'total')
      .addSelect('COUNT(DISTINCT e.seriesId)', 'seriesCount')
      .innerJoin('er.episode', 'e')
      .where('er.userId = :userId', { userId })
      .andWhere('er.reactionType = :reactionType', { reactionType: 'like' })
      .getRawOne<{ total: string; seriesCount: string }>();

    return {
      totalLikedEpisodes: parseInt(stats?.total || '0', 10),
      likedSeriesCount: parseInt(stats?.seriesCount || '0', 10),
    };
  }
}

