import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Series } from '../entity/series.entity';
import { Category } from '../entity/category.entity';
import { CacheKeys } from '../utils/cache-keys.util';

/**
 * 媒体服务
 * 专门处理媒体内容管理相关的业务逻辑
 */
@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Series)
    private readonly seriesRepo: Repository<Series>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  /**
   * 获取媒体列表
   * @param categoryId 分类ID
   * @param type 类型
   * @param userId 用户ID（可选）
   * @param sort 排序方式
   * @param page 页码
   * @param size 每页大小
   */
  async listMedia(
    categoryId?: number,
    type?: 'short' | 'series',
    userId?: number,
    sort: 'latest' | 'like' | 'play' = 'latest',
    page: number = 1,
    size: number = 20
  ) {
    try {
      const offset = (page - 1) * size;
      
      const queryBuilder = this.seriesRepo.createQueryBuilder('series')
        .leftJoinAndSelect('series.category', 'category')
        .where('series.isActive = :isActive', { isActive: 1 });

      // 分类筛选
      if (categoryId && categoryId > 0) {
        queryBuilder.andWhere('series.categoryId = :categoryId', { categoryId });
      }

      // 类型筛选
      if (type) {
        // 这里可以根据业务需求添加类型筛选逻辑
        // 例如：短剧 vs 长剧的区分
      }

      // 排序
      switch (sort) {
        case 'latest':
          queryBuilder.orderBy('series.createdAt', 'DESC');
          break;
        case 'like':
          queryBuilder.orderBy('series.score', 'DESC');
          break;
        case 'play':
          queryBuilder.orderBy('series.playCount', 'DESC');
          break;
        default:
          queryBuilder.orderBy('series.createdAt', 'DESC');
      }

      const [series, total] = await queryBuilder
        .skip(offset)
        .take(size)
        .getManyAndCount();

      const list = series.map(s => ({
        id: s.id,
        shortId: s.shortId,
        title: s.title,
        description: s.description,
        coverUrl: s.coverUrl,
        type: s.category?.name || '',
        categoryId: s.categoryId,
        episodeCount: s.totalEpisodes,
        status: s.status,
        score: s.score,
        playCount: s.playCount,
        starring: s.starring,
        director: s.director,
        createdAt: s.createdAt.toISOString()
      }));

      return {
        code: 200,
        data: {
          list,
          total,
          page,
          size,
          hasMore: total > page * size
        },
        msg: null
      };
    } catch (error) {
      console.error('获取媒体列表失败:', error);
      throw new Error('获取媒体列表失败');
    }
  }

  /**
   * 获取系列列表（完整版）
   * @param categoryId 分类ID
   * @param page 页码
   * @param size 每页大小
   */
  async listSeriesFull(categoryId?: number, page: number = 1, size: number = 20) {
    const cacheKey = CacheKeys.seriesList(categoryId, page, size);
    
    // 尝试从缓存获取
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      console.log(`💾 系列列表缓存命中: ${cacheKey}`);
      return cached;
    }

    try {
      const offset = (page - 1) * size;
      
      const queryBuilder = this.seriesRepo.createQueryBuilder('series')
        .leftJoinAndSelect('series.category', 'category')
        .where('series.isActive = :isActive', { isActive: 1 })
        .orderBy('series.createdAt', 'DESC');

      if (categoryId && categoryId > 0) {
        queryBuilder.andWhere('series.categoryId = :categoryId', { categoryId });
      }

      const [series, total] = await queryBuilder
        .skip(offset)
        .take(size)
        .getManyAndCount();

      const result = {
        code: 200,
        data: {
          list: series.map(s => ({
            id: s.id,
            shortId: s.shortId,
            title: s.title,
            description: s.description,
            coverUrl: s.coverUrl,
            categoryId: s.categoryId,
            categoryName: s.category?.name || '',
            episodeCount: s.totalEpisodes,
            status: s.status,
            score: s.score,
            playCount: s.playCount,
            createdAt: s.createdAt.toISOString()
          })),
          total,
          page,
          size,
          hasMore: total > page * size
        },
        msg: null
      };

      // 缓存结果（30分钟）
      await this.cacheManager.set(cacheKey, result, 1800000);
      console.log(`💾 系列列表已缓存: ${cacheKey}`);
      
      return result;
    } catch (error) {
      console.error('获取系列列表失败:', error);
      throw new Error('获取系列列表失败');
    }
  }

  /**
   * 根据分类获取系列列表
   * @param categoryId 分类ID
   */
  async listSeriesByCategory(categoryId: number) {
    const cacheKey = CacheKeys.seriesByCategory(categoryId);
    
    // 尝试从缓存获取
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      console.log(`💾 分类系列缓存命中: ${cacheKey}`);
      return cached;
    }

    try {
      const series = await this.seriesRepo.find({
        where: { 
          categoryId,
          isActive: 1 
        },
        relations: ['category'],
        order: { createdAt: 'DESC' },
        take: 50 // 限制返回数量
      });

      const result = {
        code: 200,
        data: {
          list: series.map(s => ({
            id: s.id,
            shortId: s.shortId,
            title: s.title,
            description: s.description,
            coverUrl: s.coverUrl,
            categoryId: s.categoryId,
            episodeCount: s.totalEpisodes,
            status: s.status,
            createdAt: s.createdAt.toISOString()
          })),
          total: series.length,
          categoryName: series[0]?.category?.name || ''
        },
        msg: null
      };

      // 缓存结果（30分钟）
      await this.cacheManager.set(cacheKey, result, 1800000);
      console.log(`💾 分类系列已缓存: ${cacheKey}`);
      
      return result;
    } catch (error) {
      console.error('根据分类获取系列列表失败:', error);
      throw new Error('根据分类获取系列列表失败');
    }
  }

  /**
   * 获取视频列表（内部方法）
   * @param categoryId 分类ID
   * @param page 页码
   * @param size 每页大小
   */
  private async getVideoList(categoryId?: number, page: number = 1, size: number = 20) {
    try {
      const offset = (page - 1) * size;
      
      const queryBuilder = this.seriesRepo.createQueryBuilder('series')
        .leftJoinAndSelect('series.category', 'category')
        .where('series.isActive = :isActive', { isActive: 1 })
        .orderBy('series.createdAt', 'DESC')
        .skip(offset)
        .take(size);

      if (categoryId && categoryId > 0) {
        queryBuilder.andWhere('series.categoryId = :categoryId', { categoryId });
      }

      const series = await queryBuilder.getMany();

      return series.map(s => ({
        id: s.id,
        shortId: s.shortId,
        coverUrl: s.coverUrl || '',
        title: s.title,
        score: s.score ? s.score.toString() : '0',
        playCount: s.playCount || 0,
        url: s.shortId || s.id.toString(),
        type: s.category?.name || '',
        isSerial: true,
        upStatus: s.upStatus || '',
        upCount: s.upCount || 0,
        author: s.starring || '',
        description: s.description || '',
        cidMapper: s.categoryId?.toString() || '',
        isRecommend: s.score >= 8.0,
        createdAt: s.createdAt.toISOString()
      }));
    } catch (error) {
      console.error('获取视频列表失败:', error);
      return [];
    }
  }
}
