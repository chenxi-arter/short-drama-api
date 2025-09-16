import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { DebugUtil } from '../../common/utils/debug.util';
import { Series } from '../entity/series.entity';
import { Episode } from '../entity/episode.entity';
import { Category } from '../entity/category.entity';
import { CacheKeys } from '../utils/cache-keys.util';

/**
 * 系列服务
 * 专门处理系列相关的业务逻辑
 */
@Injectable()
export class SeriesService {
  constructor(
    @InjectRepository(Series)
    private readonly seriesRepo: Repository<Series>,
    @InjectRepository(Episode)
    private readonly episodeRepo: Repository<Episode>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  /**
   * 根据分类获取系列列表
   * @param categoryId 分类ID
   * @param page 页码
   * @param pageSize 每页数量
   */
  async getSeriesByCategory(
    categoryId: number,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ series: Series[]; total: number }> {
    const cacheKey = `${CacheKeys.categories()}_series_${categoryId}_${page}_${pageSize}`;
    
    // 尝试从缓存获取
    const cached = await this.cacheManager.get<{ series: Series[]; total: number }>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const offset = (page - 1) * pageSize;
      
      const [series, total] = await this.seriesRepo.findAndCount({
        where: { category: { id: categoryId } },
        relations: ['category', 'episodes'],
        order: { createdAt: 'DESC' },
        skip: offset,
        take: pageSize,
      });

      const result = { series, total };

      // 缓存结果（10分钟）
      await this.cacheManager.set(cacheKey, result, CacheKeys.TTL.MEDIUM);
      
      return result;
    } catch (error) {
      DebugUtil.error('根据分类获取系列列表失败', error as Error);
      throw new Error('根据分类获取系列列表失败');
    }
  }

  /**
   * 获取系列详情
   * @param seriesId 系列ID
   */
  async getSeriesDetail(seriesId: number): Promise<Series | null> {
    const cacheKey = CacheKeys.seriesDetail(seriesId);
    
    // 尝试从缓存获取
    const cached = await this.cacheManager.get<Series>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const series = await this.seriesRepo.findOne({
        where: { id: seriesId },
        relations: ['category', 'episodes', 'episodes.urls'],
      });

      if (series) {
        // 缓存结果（1小时）
        await this.cacheManager.set(cacheKey, series, CacheKeys.TTL.LONG);
      }
      
      return series;
    } catch (error) {
      DebugUtil.error('获取系列详情失败', error as Error);
      return null;
    }
  }

  /**
   * 获取热门系列
   * @param limit 限制数量
   * @param categoryId 可选，指定分类
   */
  async getPopularSeries(limit: number = 20, categoryId?: number): Promise<Series[]> {
    const cacheKey = categoryId 
      ? `${CacheKeys.topSeries(limit)}_category_${categoryId}`
      : CacheKeys.topSeries(limit);
    
    // 尝试从缓存获取
    const cached = await this.cacheManager.get<Series[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const queryBuilder = this.seriesRepo
        .createQueryBuilder('series')
        .leftJoinAndSelect('series.category', 'category')
        .leftJoinAndSelect('series.episodes', 'episodes')
        .orderBy('series.playCount', 'DESC')
        .addOrderBy('series.score', 'DESC')
        .limit(limit);

      if (categoryId) {
        queryBuilder.where('series.categoryId = :categoryId', { categoryId });
      }

      const series = await queryBuilder.getMany();

      // 缓存结果（30分钟）
      await this.cacheManager.set(cacheKey, series, CacheKeys.TTL.MEDIUM);
      
      return series;
    } catch (error) {
      DebugUtil.error('获取热门系列失败', error as Error);
      throw new Error('获取热门系列失败');
    }
  }

  /**
   * 获取最新系列
   * @param limit 限制数量
   * @param categoryId 可选，指定分类
   */
  async getLatestSeries(limit: number = 20, categoryId?: number): Promise<Series[]> {
    const cacheKey = categoryId 
      ? `latest_series_${limit}_category_${categoryId}`
      : `latest_series_${limit}`;
    
    // 尝试从缓存获取
    const cached = await this.cacheManager.get<Series[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const queryBuilder = this.seriesRepo
        .createQueryBuilder('series')
        .leftJoinAndSelect('series.category', 'category')
        .leftJoinAndSelect('series.episodes', 'episodes')
        .orderBy('series.updatedAt', 'DESC')
        .addOrderBy('series.createdAt', 'DESC')
        .addOrderBy('series.id', 'DESC')
        .limit(limit);

      if (categoryId) {
        queryBuilder.where('series.categoryId = :categoryId', { categoryId });
      }

      const series = await queryBuilder.getMany();

      // 缓存结果（10分钟）
      await this.cacheManager.set(cacheKey, series, CacheKeys.TTL.MEDIUM);
      
      return series;
    } catch (error) {
      DebugUtil.error('获取最新系列失败', error as Error);
      throw new Error('获取最新系列失败');
    }
  }

  /**
   * 搜索系列
   * @param keyword 关键词
   * @param page 页码
   * @param pageSize 每页数量
   * @param categoryId 可选，指定分类
   */
  async searchSeries(
    keyword: string,
    page: number = 1,
    pageSize: number = 20,
    categoryId?: number
  ): Promise<{ series: Series[]; total: number }> {
    try {
      const offset = (page - 1) * pageSize;
      
      const queryBuilder = this.seriesRepo
        .createQueryBuilder('series')
        .leftJoinAndSelect('series.category', 'category')
        .leftJoinAndSelect('series.episodes', 'episodes')
        .where('series.title LIKE :keyword OR series.description LIKE :keyword', {
          keyword: `%${keyword}%`
        })
        .orderBy('series.playCount', 'DESC')
        .skip(offset)
        .take(pageSize);

      if (categoryId) {
        queryBuilder.andWhere('series.categoryId = :categoryId', { categoryId });
      }

      const [series, total] = await queryBuilder.getManyAndCount();
      
      return { series, total };
    } catch (error) {
      DebugUtil.error('搜索系列失败', error as Error);
      throw new Error('搜索系列失败');
    }
  }

  /**
   * 获取推荐系列（基于用户观看历史或热门程度）
   * @param userId 可选，用户ID
   * @param limit 限制数量
   */
  async getRecommendedSeries(userId?: number, limit: number = 10): Promise<Series[]> {
    const cacheKey = userId 
      ? `recommended_series_${userId}_${limit}`
      : `recommended_series_${limit}`;
    
    // 尝试从缓存获取
    const cached = await this.cacheManager.get<Series[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // 简单的推荐逻辑：返回高评分且播放量较高的系列
      // 实际项目中可以根据用户行为数据进行个性化推荐
      const series = await this.seriesRepo
        .createQueryBuilder('series')
        .leftJoinAndSelect('series.category', 'category')
        .leftJoinAndSelect('series.episodes', 'episodes')
        .where('series.score >= :minScore', { minScore: 7.0 })
        .orderBy('series.score', 'DESC')
        .addOrderBy('series.playCount', 'DESC')
        .limit(limit)
        .getMany();

      // 缓存结果（30分钟）
      await this.cacheManager.set(cacheKey, series, CacheKeys.TTL.MEDIUM);
      
      return series;
    } catch (error) {
      DebugUtil.error('获取推荐系列失败', error as Error);
      throw new Error('获取推荐系列失败');
    }
  }

  /**
   * 增加系列播放次数
   * @param seriesId 系列ID
   */
  async incrementPlayCount(seriesId: number): Promise<void> {
    try {
      await this.seriesRepo.increment({ id: seriesId }, 'playCount', 1);
      
      // 清除相关缓存
      await this.clearSeriesCache(seriesId);
    } catch (error) {
      DebugUtil.error('增加播放次数失败', error as Error);
    }
  }

  /**
   * 更新系列评分
   * @param seriesId 系列ID
   * @param score 新评分
   */
  async updateSeriesScore(seriesId: number, score: number): Promise<void> {
    try {
      await this.seriesRepo.update(seriesId, { score });
      
      // 清除相关缓存
      await this.clearSeriesCache(seriesId);
    } catch (error) {
      DebugUtil.error('更新系列评分失败', error as Error);
      throw new Error('更新系列评分失败');
    }
  }

  /**
   * 创建新系列
   * @param seriesData 系列数据
   */
  async createSeries(seriesData: Partial<Series>): Promise<Series> {
    try {
      const series = this.seriesRepo.create(seriesData);
      const savedSeries = await this.seriesRepo.save(series);
      
      // 清除相关缓存
      await this.clearSeriesCache();
      
      return savedSeries;
    } catch (error) {
      DebugUtil.error('创建系列失败', error as Error);
      throw new Error('创建系列失败');
    }
  }

  /**
   * 更新系列
   * @param seriesId 系列ID
   * @param updateData 更新数据
   */
  async updateSeries(seriesId: number, updateData: Partial<Series>): Promise<Series> {
    try {
      await this.seriesRepo.update(seriesId, updateData);
      const updatedSeries = await this.getSeriesDetail(seriesId);
      
      if (!updatedSeries) {
        throw new Error('系列不存在');
      }
      
      // 清除相关缓存
      await this.clearSeriesCache(seriesId);
      
      return updatedSeries;
    } catch (error) {
      DebugUtil.error('更新系列失败', error as Error);
      throw new Error('更新系列失败');
    }
  }

  /**
   * 删除系列
   * @param seriesId 系列ID
   */
  async deleteSeries(seriesId: number): Promise<void> {
    try {
      // 检查是否有关联的剧集
      const episodeCount = await this.episodeRepo.count({
        where: { series: { id: seriesId } },
      });
      
      if (episodeCount > 0) {
        throw new Error('该系列下还有剧集，无法删除');
      }
      
      await this.seriesRepo.delete(seriesId);
      
      // 清除相关缓存
      await this.clearSeriesCache(seriesId);
    } catch (error) {
      DebugUtil.error('删除系列失败', error as Error);
      throw new Error('删除系列失败');
    }
  }

  /**
   * 清除系列相关缓存
   * @param seriesId 可选，指定系列ID
   */
  async clearSeriesCache(seriesId?: number): Promise<void> {
    try {
      if (seriesId) {
        // 清除指定系列的缓存
        const patterns = [
          CacheKeys.seriesDetail(seriesId),
          `latest_series_*`,
          `recommended_series_*`,
          `${CacheKeys.topSeries(20)}*`
        ];
        
        for (const pattern of patterns) {
          await this.cacheManager.del(pattern);
        }
      } else {
        // 清除所有系列缓存
        const patterns = CacheKeys.getPatternKeys('series_all');
        for (const pattern of patterns) {
          await this.cacheManager.del(pattern);
        }
      }
    } catch (error) {
      DebugUtil.error('清除系列缓存失败', error as Error);
    }
  }
}