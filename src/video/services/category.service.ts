import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Category } from '../entity/category.entity';
import { Series } from '../entity/series.entity';
import { CacheKeys } from '../utils/cache-keys.util';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { QueryOptimizer } from '../../common/utils/query-optimizer.util';

@Injectable()
export class CategoryService {
  private readonly logger: AppLoggerService;

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Series)
    private readonly seriesRepo: Repository<Series>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.createChildLogger('CategoryService');
  }

  /**
   * 获取所有分类
   */
  async getAllCategories(): Promise<Category[]> {
    const cacheKey = CacheKeys.categories();
    const startTime = Date.now();
    
    try {
      // 尝试从缓存获取
      const cached = await this.cacheManager.get<Category[]>(cacheKey);
      if (cached) {
        this.logger.logCacheOperation('GET', cacheKey, true);
        return cached;
      }
      this.logger.logCacheOperation('GET', cacheKey, false);

      // 从数据库查询
      const queryBuilder = this.categoryRepo.createQueryBuilder('category');
      QueryOptimizer.addSorting(queryBuilder, 'category.name', 'ASC');
      
      const categories = await queryBuilder.getMany();
      const duration = Date.now() - startTime;
      
      this.logger.logDatabaseOperation('SELECT', 'category', { count: categories.length }, duration);

      // 存入缓存
      await this.cacheManager.set(cacheKey, categories, CacheKeys.TTL.VERY_LONG);
      this.logger.logCacheOperation('SET', cacheKey, undefined, CacheKeys.TTL.VERY_LONG);
      
      return categories;
    } catch (error) {
      this.logger.error('获取分类列表失败', error.stack);
      throw new Error('获取分类列表失败');
    }
  }

  /**
   * 根据ID获取分类
   */
  async getCategoryById(id: number): Promise<Category | null> {
    const cacheKey = `${CacheKeys.categories()}_detail_${id}`;
    const startTime = Date.now();
    
    try {
      // 尝试从缓存获取
      const cached = await this.cacheManager.get<Category>(cacheKey);
      if (cached) {
        this.logger.logCacheOperation('GET', cacheKey, true);
        return cached;
      }
      this.logger.logCacheOperation('GET', cacheKey, false);

      // 从数据库查询
      const category = await this.categoryRepo.findOne({
        where: { id },
      });
      
      const duration = Date.now() - startTime;
      this.logger.logDatabaseOperation('SELECT', 'category', { id, found: !!category }, duration);

      if (category) {
        // 存入缓存
        await this.cacheManager.set(cacheKey, category, CacheKeys.TTL.LONG);
        this.logger.logCacheOperation('SET', cacheKey, undefined, CacheKeys.TTL.LONG);
      }
      
      return category;
    } catch (error) {
      this.logger.error(`获取分类详情失败: ${id}`, error.stack);
      throw new Error('获取分类详情失败');
    }
  }

  /**
   * 获取分类下的剧集数量
   */
  async getCategorySeriesCount(categoryId: number) {
    const cacheKey = `${CacheKeys.categories()}_stats_${categoryId}`;
    
    // 尝试从缓存获取
    let count = await this.cacheManager.get(cacheKey);
    if (count !== undefined) {
      return count;
    }

    try {
      // 从数据库获取
      count = await this.seriesRepo.count({
        where: { category: { id: categoryId } },
      });

      // 缓存结果
      await this.cacheManager.set(cacheKey, count, CacheKeys.TTL.MEDIUM);
      
      return count;
    } catch (error) {
      console.error('获取分类剧集数量失败:', error instanceof Error ? error.stack : error);
      return 0;
    }
  }

  /**
   * 获取分类统计信息
   */
  async getCategoriesWithStats() {
    const cacheKey = 'categories:with_stats';
    
    // 尝试从缓存获取
    const result = await this.cacheManager.get(cacheKey);
    if (result) {
      return result;
    }

    // 获取所有分类
    const categories = await this.categoryRepo.find({
      order: { name: 'ASC' },
    });

    // 为每个分类获取统计信息
    const categoriesWithStats = await Promise.all(
      categories.map(async (category) => {
        const seriesCount = await this.getCategorySeriesCount(category.id);
        return {
          ...category,
          seriesCount: typeof seriesCount === 'number' ? seriesCount : 0,
        };
      })
    );

    // 缓存结果（缓存30分钟）
    await this.cacheManager.set(cacheKey, categoriesWithStats, 1800000);
    
    return categoriesWithStats;
  }

  /**
   * 创建新分类
   */
  async createCategory(name: string) {
    // 检查分类名是否已存在
    const existingCategory = await this.categoryRepo.findOne({
      where: { name },
    });

    if (existingCategory) {
      throw new Error('分类名称已存在');
    }

    // 创建新分类
    const category = this.categoryRepo.create({
      name,
    });

    const savedCategory = await this.categoryRepo.save(category);

    // 清除相关缓存
    await this.clearCategoryCache();

    return savedCategory;
  }

  /**
   * 更新分类
   */
  async updateCategory(id: number, name: string) {
    const category = await this.categoryRepo.findOne({
      where: { id },
    });

    if (!category) {
      throw new Error('分类不存在');
    }

    // 如果要更新名称，检查是否与其他分类重名
    if (name && name !== category.name) {
      const existingCategory = await this.categoryRepo.findOne({
        where: { name },
      });

      if (existingCategory) {
        throw new Error('分类名称已存在');
      }
    }

    // 更新分类信息
    if (name) category.name = name;

    const updatedCategory = await this.categoryRepo.save(category);

    // 清除相关缓存
    await this.clearCategoryCache();
    await this.cacheManager.del(`category:${id}`);

    return updatedCategory;
  }

  /**
   * 删除分类
   */
  async deleteCategory(id: number) {
    const category = await this.categoryRepo.findOne({
      where: { id },
    });

    if (!category) {
      throw new Error('分类不存在');
    }

    // 检查是否有剧集使用此分类
    const seriesCount = await this.getCategorySeriesCount(id);
    if (typeof seriesCount === 'number' && seriesCount > 0) {
      throw new Error('该分类下还有剧集，无法删除');
    }

    // 删除分类
    await this.categoryRepo.remove(category);

    // 清除相关缓存
    await this.clearCategoryCache();
    await this.cacheManager.del(`category:${id}`);
    await this.cacheManager.del(`category:${id}:series_count`);

    return { ok: true };
  }

  /**
   * 清除分类相关缓存
   */
  private async clearCategoryCache() {
    await this.cacheManager.del('categories:all');
    await this.cacheManager.del('categories:with_stats');
  }

  /**
   * 获取热门分类（按剧集数量排序）
   */
  async getPopularCategories(limit: number = 10) {
    const cacheKey = `categories:popular:${limit}`;
    
    // 尝试从缓存获取
    const result = await this.cacheManager.get(cacheKey);
    if (result) {
      return result;
    }

    // 获取分类统计信息
    const categoriesWithStats = await this.getCategoriesWithStats();

    // 按剧集数量排序并限制数量
    const popularCategories = (categoriesWithStats as any[])
      .sort((a, b) => b.seriesCount - a.seriesCount)
      .slice(0, limit);

    // 缓存结果（缓存1小时）
    await this.cacheManager.set(cacheKey, popularCategories, 3600000);
    
    return popularCategories;
  }

  /**
   * 获取分类列表（用于前端接口）
   * 返回格式化的分类列表数据
   */
  async getCategoryList(versionNo?: number) {
    const cacheKey = CacheKeys.categories() + ':list';
    const startTime = Date.now();
    
    try {
      // 尝试从缓存获取
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        this.logger.logCacheOperation('GET', cacheKey, true);
        return cached;
      }
      this.logger.logCacheOperation('GET', cacheKey, false);

      // 从数据库查询启用的分类
      const categories = await this.categoryRepo.find({
        where: { isEnabled: true },
        order: { categoryId: 'ASC' }
      });
      
      const duration = Date.now() - startTime;
      this.logger.logDatabaseOperation('SELECT', 'category', { count: categories.length }, duration);

      // 格式化数据
      const formattedList = categories.map(category => ({
        catid: category.categoryId,
        name: category.name,
        routeName: category.routeName
      }));

      const result = {
        ret: 200,
        data: {
          versionNo: versionNo || 20240112,
          list: formattedList
        },
        msg: null
      };

      // 存入缓存（缓存1小时）
      await this.cacheManager.set(cacheKey, result, CacheKeys.TTL.LONG);
      this.logger.logCacheOperation('SET', cacheKey, undefined, CacheKeys.TTL.LONG);
      
      return result;
    } catch (error) {
      this.logger.error('获取分类列表失败', error.stack);
      throw new Error('获取分类列表失败');
    }
  }
}