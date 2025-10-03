import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from '../entity/favorite.entity';

@Injectable()
export class FavoriteService {
  constructor(
    @InjectRepository(Favorite)
    private readonly favoriteRepo: Repository<Favorite>,
  ) {}

  /**
   * 添加收藏（如果已存在则不重复添加）
   * 使用 QueryBuilder 实现，提供更好的类型安全
   */
  async addFavorite(userId: number, seriesId: number, episodeId?: number): Promise<Favorite> {
    // 使用 QueryBuilder 检查是否已收藏
    const queryBuilder = this.favoriteRepo
      .createQueryBuilder('f')
      .where('f.userId = :userId', { userId })
      .andWhere('f.seriesId = :seriesId', { seriesId });

    if (episodeId) {
      queryBuilder.andWhere('f.episodeId = :episodeId', { episodeId });
    } else {
      queryBuilder.andWhere('f.episodeId IS NULL');
    }

    const existing = await queryBuilder.getOne();

    if (existing) {
      return existing;
    }

    // 创建新收藏
    const favorite = this.favoriteRepo.create({
      userId,
      seriesId,
      episodeId,
      favoriteType: episodeId ? 'episode' : 'series',
    });

    return this.favoriteRepo.save(favorite);
  }

  /**
   * 取消收藏
   * 使用 QueryBuilder 删除，更灵活
   */
  async removeFavorite(userId: number, seriesId: number, episodeId?: number): Promise<boolean> {
    const queryBuilder = this.favoriteRepo
      .createQueryBuilder()
      .delete()
      .from(Favorite)
      .where('userId = :userId', { userId })
      .andWhere('seriesId = :seriesId', { seriesId });

    if (episodeId) {
      queryBuilder.andWhere('episodeId = :episodeId', { episodeId });
    } else {
      queryBuilder.andWhere('episodeId IS NULL');
    }

    const result = await queryBuilder.execute();
    return (result.affected ?? 0) > 0;
  }

  /**
   * 检查是否已收藏
   * 使用 QueryBuilder，避免不必要的数据加载
   */
  async isFavorited(userId: number, seriesId: number, episodeId?: number): Promise<boolean> {
    const queryBuilder = this.favoriteRepo
      .createQueryBuilder('f')
      .where('f.userId = :userId', { userId })
      .andWhere('f.seriesId = :seriesId', { seriesId });

    if (episodeId) {
      queryBuilder.andWhere('f.episodeId = :episodeId', { episodeId });
    } else {
      queryBuilder.andWhere('f.episodeId IS NULL');
    }

    const count = await queryBuilder.getCount();
    return count > 0;
  }

  /**
   * 获取用户的收藏列表（按系列聚合显示）
   * 即使用户收藏了同一系列的多集，也只显示一个系列条目
   * 
   * 注意：由于需要复杂的聚合查询和子查询（upCount），这里使用原生 SQL
   * 优点：性能更好，查询更灵活
   * 缺点：类型安全性较弱，需要手动维护
   * 
   * 如果将来需要更好的类型安全，可以考虑：
   * 1. 使用 TypeORM QueryBuilder（但子查询支持有限）
   * 2. 将 upCount 计算移到应用层（但会影响性能）
   * 3. 创建数据库视图（但增加了数据库复杂度）
   */
  async getUserFavorites(userId: number, page: number = 1, size: number = 20) {
    const skip = (page - 1) * size;

    // 使用原生 SQL 进行复杂的聚合查询
    // 这里的子查询（upCount）在 TypeORM QueryBuilder 中很难实现
    const query = `
      SELECT 
        f.series_id as seriesId,
        MAX(f.created_at) as latestFavoriteTime,
        COUNT(DISTINCT f.episode_id) as favoritedEpisodeCount,
        s.short_id as seriesShortId,
        s.title as seriesTitle,
        s.cover_url as seriesCoverUrl,
        s.description,
        s.score,
        s.play_count as playCount,
        s.is_completed as isCompleted,
        c.name as categoryName,
        (SELECT COUNT(*) FROM episodes WHERE series_id = s.id AND status = 'published') as totalEpisodeCount,
        (SELECT COUNT(*) FROM episodes WHERE series_id = s.id AND status = 'published' AND DATE(created_at) = CURDATE()) as upCount
      FROM favorites f
      INNER JOIN series s ON f.series_id = s.id
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE f.user_id = ?
      GROUP BY f.series_id
      ORDER BY latestFavoriteTime DESC
      LIMIT ? OFFSET ?
    `;

    // 获取总数（这个可以用 QueryBuilder 优化）
    const totalCount = await this.favoriteRepo
      .createQueryBuilder('f')
      .where('f.userId = :userId', { userId })
      .select('COUNT(DISTINCT f.seriesId)', 'total')
      .getRawOne();

    const total = totalCount?.total || 0;

    // 执行主查询
    const seriesList = await this.favoriteRepo.query(query, [userId, size, skip]) as Array<{
      seriesId: number;
      latestFavoriteTime: Date;
      favoritedEpisodeCount: number;
      seriesShortId: string;
      seriesTitle: string;
      seriesCoverUrl: string;
      description: string;
      score: string;
      playCount: number;
      isCompleted: boolean;
      categoryName: string;
      totalEpisodeCount: number;
      upCount: number;
    }>;

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
      favoritedEpisodeCount: series.favoritedEpisodeCount || 0, // 用户收藏了该系列的多少集
      upCount: series.upCount || 0, // 当天新增集数（用于角标）
      isCompleted: series.isCompleted || false,
      favoriteTime: new Date(series.latestFavoriteTime).toISOString().replace('T', ' ').substring(0, 16),
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
   * 获取用户收藏统计
   * 优化：使用一次查询获取所有统计数据，避免多次数据库往返
   */
  async getUserFavoriteStats(userId: number) {
    // 使用单个聚合查询获取所有统计数据
    const stats = await this.favoriteRepo
      .createQueryBuilder('f')
      .select('COUNT(*)', 'total')
      .addSelect(
        'SUM(CASE WHEN f.favoriteType = :seriesType THEN 1 ELSE 0 END)',
        'seriesCount',
      )
      .addSelect(
        'SUM(CASE WHEN f.favoriteType = :episodeType THEN 1 ELSE 0 END)',
        'episodeCount',
      )
      .where('f.userId = :userId', { userId })
      .setParameters({
        seriesType: 'series',
        episodeType: 'episode',
      })
      .getRawOne();

    return {
      total: parseInt(stats?.total || '0', 10),
      seriesCount: parseInt(stats?.seriesCount || '0', 10),
      episodeCount: parseInt(stats?.episodeCount || '0', 10),
    };
  }
}

