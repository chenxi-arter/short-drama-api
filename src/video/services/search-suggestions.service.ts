import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Series } from '../entity/series.entity';
import { CacheKeys } from '../utils/cache-keys.util';

/**
 * 搜索建议服务
 * 提供热门搜索词建议功能
 */
@Injectable()
export class SearchSuggestionsService {
  constructor(
    @InjectRepository(Series)
    private readonly seriesRepo: Repository<Series>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  /**
   * 获取热门搜索词（基于播放量和最近更新）
   * 用于搜索框展示，随机返回热门剧集标题
   * 
   * @param limit 返回数量，默认10条
   * @param categoryId 分类ID（可选，用于筛选特定分类）
   * @param daysRange 时间范围（天数），默认30天内，0表示不限时间
   */
  async getHotSearchSuggestions(
    limit: number = 10,
    categoryId?: number,
    daysRange: number = 30
  ): Promise<Array<{
    id: number;
    title: string;
    shortId: string;
    categoryName: string;
    playCount: number;
    score: string;
  }>> {
    const cacheKey = `hot_search:${limit}:${categoryId || 'all'}:${daysRange}`;
    
    // 尝试从缓存获取（缓存6小时）
    const cached = await this.cacheManager.get<any[]>(cacheKey);
    if (cached) {
      // 直接返回缓存数据（按热度排序）
      return cached.slice(0, limit);
    }

    try {
      let queryBuilder = this.seriesRepo
        .createQueryBuilder('series')
        .leftJoinAndSelect('series.category', 'category')
        .where('series.isActive = :isActive', { isActive: 1 });

      // 分类筛选
      if (categoryId) {
        queryBuilder = queryBuilder.andWhere('series.categoryId = :categoryId', { categoryId });
      }

      // 时间范围筛选（最近N天更新的剧集）
      if (daysRange > 0) {
        queryBuilder = queryBuilder.andWhere(
          'series.updatedAt >= DATE_SUB(NOW(), INTERVAL :days DAY)',
          { days: daysRange }
        );
      }

      // 按热度排序：播放量权重70% + 评分权重30%
      // 使用原生SQL计算综合热度
      queryBuilder = queryBuilder
        .addSelect('(series.playCount * 0.7 + CAST(series.score AS DECIMAL(10,2)) * 1000 * 0.3)', 'hotScore')
        .orderBy('hotScore', 'DESC')
        .addOrderBy('series.updatedAt', 'DESC')
        .limit(limit); // 直接按需获取

      const series = await queryBuilder.getMany();

      // 格式化数据
      const suggestions = series.map(s => ({
        id: s.id,
        title: s.title,
        shortId: s.shortId || '',
        categoryName: s.category?.name || '',
        playCount: s.playCount || 0,
        score: String(s.score || '0.0'),
      }));

      // 缓存结果（6小时）
      await this.cacheManager.set(cacheKey, suggestions, 21600000);

      // 直接返回（按热度排序）
      return suggestions;
    } catch (error) {
      console.error('获取热门搜索词失败:', error);
      return [];
    }
  }

  /**
   * 获取搜索历史热词（基于用户搜索频率）
   * 未来可扩展：统计用户搜索记录，返回热门搜索词
   */
  async getPopularSearchTerms(limit: number = 10): Promise<string[]> {
    // TODO: 实现基于用户搜索历史的热词统计
    // 需要创建 search_history 表记录用户搜索行为
    return [];
  }
}

