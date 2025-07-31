import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Category } from '../entity/category.entity';
import { Series } from '../entity/series.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Series)
    private readonly seriesRepo: Repository<Series>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  /**
   * 获取所有分类
   */
  async getAllCategories() {
    const cacheKey = 'categories:all';
    
    // 尝试从缓存获取
    let categories = await this.cacheManager.get(cacheKey);
    if (categories) {
      return categories;
    }

    // 从数据库获取
    categories = await this.categoryRepo.find({
      order: { name: 'ASC' },
    });

    // 缓存结果（缓存1小时）
    await this.cacheManager.set(cacheKey, categories, 3600000);
    
    return categories;
  }

  /**
   * 根据ID获取分类
   */
  async getCategoryById(id: number) {
    const cacheKey = `category:${id}`;
    
    // 尝试从缓存获取
    let category = await this.cacheManager.get(cacheKey);
    if (category) {
      return category;
    }

    // 从数据库获取
    category = await this.categoryRepo.findOne({
      where: { id },
    });

    if (category) {
      // 缓存结果（缓存1小时）
      await this.cacheManager.set(cacheKey, category, 3600000);
    }
    
    return category;
  }

  /**
   * 获取分类下的剧集数量
   */
  async getCategorySeriesCount(categoryId: number) {
    const cacheKey = `category:${categoryId}:series_count`;
    
    // 尝试从缓存获取
    let count = await this.cacheManager.get(cacheKey);
    if (count !== undefined) {
      return count;
    }

    // 从数据库获取
    count = await this.seriesRepo.count({
      where: { category: { id: categoryId } },
    });

    // 缓存结果（缓存30分钟）
    await this.cacheManager.set(cacheKey, count, 1800000);
    
    return count;
  }

  /**
   * 获取分类统计信息
   */
  async getCategoriesWithStats() {
    const cacheKey = 'categories:with_stats';
    
    // 尝试从缓存获取
    let result = await this.cacheManager.get(cacheKey);
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
    let result = await this.cacheManager.get(cacheKey);
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
}