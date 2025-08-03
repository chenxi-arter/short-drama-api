import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Tag } from '../entity/tag.entity';
import { Series } from '../entity/series.entity';
import { CacheKeys } from '../utils/cache-keys.util';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { QueryOptimizer } from '../../common/utils/query-optimizer.util';

@Injectable()
export class TagService {
  private readonly logger: AppLoggerService;

  constructor(
    @InjectRepository(Tag)
    private readonly tagRepo: Repository<Tag>,
    @InjectRepository(Series)
    private readonly seriesRepo: Repository<Series>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.createChildLogger('TagService');
  }

  /**
   * 获取所有标签
   */
  async getAllTags(): Promise<Tag[]> {
    const cacheKey = CacheKeys.tags();
    const startTime = Date.now();
    
    try {
      // 尝试从缓存获取
      const cached = await this.cacheManager.get<Tag[]>(cacheKey);
      if (cached) {
        this.logger.logCacheOperation('GET', cacheKey, true);
        return cached;
      }
      this.logger.logCacheOperation('GET', cacheKey, false);

      // 从数据库查询
      const queryBuilder = this.tagRepo.createQueryBuilder('tag');
      QueryOptimizer.addSorting(queryBuilder, 'tag.name', 'ASC');
      
      const tags = await queryBuilder.getMany();
      const duration = Date.now() - startTime;
      
      this.logger.logDatabaseOperation('SELECT', 'tag', { count: tags.length }, duration);

      // 存入缓存
      await this.cacheManager.set(cacheKey, tags, CacheKeys.TTL.VERY_LONG);
      this.logger.logCacheOperation('SET', cacheKey, undefined, CacheKeys.TTL.VERY_LONG);
      
      return tags;
    } catch (error) {
      this.logger.error('获取标签列表失败', error.stack);
      throw new Error('获取标签列表失败');
    }
  }

  /**
   * 根据ID获取标签
   */
  async getTagById(id: number): Promise<Tag | null> {
    const cacheKey = `${CacheKeys.tags()}_detail_${id}`;
    const startTime = Date.now();
    
    try {
      // 尝试从缓存获取
      const cached = await this.cacheManager.get<Tag>(cacheKey);
      if (cached) {
        this.logger.logCacheOperation('GET', cacheKey, true);
        return cached;
      }
      this.logger.logCacheOperation('GET', cacheKey, false);

      // 从数据库查询
      const tag = await this.tagRepo.findOne({
        where: { id },
      });
      
      const duration = Date.now() - startTime;
      this.logger.logDatabaseOperation('SELECT', 'tag', { id, found: !!tag }, duration);

      if (tag) {
        // 存入缓存
        await this.cacheManager.set(cacheKey, tag, CacheKeys.TTL.LONG);
        this.logger.logCacheOperation('SET', cacheKey, undefined, CacheKeys.TTL.LONG);
      }
      
      return tag;
    } catch (error) {
      this.logger.error(`获取标签详情失败: ${id}`, error.stack);
      throw new Error('获取标签详情失败');
    }
  }

  /**
   * 根据名称获取标签
   */
  async getTagByName(name: string): Promise<Tag | null> {
    const cacheKey = `${CacheKeys.tags()}_name_${name}`;
    const startTime = Date.now();
    
    try {
      // 尝试从缓存获取
      const cached = await this.cacheManager.get<Tag>(cacheKey);
      if (cached) {
        this.logger.logCacheOperation('GET', cacheKey, true);
        return cached;
      }
      this.logger.logCacheOperation('GET', cacheKey, false);

      // 从数据库查询
      const tag = await this.tagRepo.findOne({
        where: { name },
      });
      
      const duration = Date.now() - startTime;
      this.logger.logDatabaseOperation('SELECT', 'tag', { name, found: !!tag }, duration);

      if (tag) {
        // 存入缓存
        await this.cacheManager.set(cacheKey, tag, CacheKeys.TTL.LONG);
        this.logger.logCacheOperation('SET', cacheKey, undefined, CacheKeys.TTL.LONG);
      }
      
      return tag;
    } catch (error) {
      this.logger.error(`根据名称获取标签失败: ${name}`, error.stack);
      throw new Error('根据名称获取标签失败');
    }
  }

  /**
   * 获取标签下的剧集数量
   */
  async getTagSeriesCount(tagId: number) {
    const cacheKey = `tag:${tagId}:series_count`;
    
    // 尝试从缓存获取
    let count = await this.cacheManager.get(cacheKey);
    if (count !== undefined) {
      return count;
    }

    // 从数据库获取
    count = await this.seriesRepo
      .createQueryBuilder('series')
      .innerJoin('series.tags', 'tag')
      .where('tag.id = :tagId', { tagId })
      .getCount();

    // 缓存结果（缓存30分钟）
    await this.cacheManager.set(cacheKey, count, 1800000);
    
    return count;
  }

  /**
   * 获取标签统计信息
   */
  async getTagsWithStats() {
    const cacheKey = 'tags:with_stats';
    
    // 尝试从缓存获取
    let result = await this.cacheManager.get(cacheKey);
    if (result) {
      return result;
    }

    // 获取所有标签
    const tags = await this.tagRepo.find({
      order: { name: 'ASC' },
    });

    // 为每个标签获取统计信息
    const tagsWithStats = await Promise.all(
      tags.map(async (tag) => {
        const seriesCount = await this.getTagSeriesCount(tag.id);
        return {
          ...tag,
          seriesCount: typeof seriesCount === 'number' ? seriesCount : 0,
        };
      })
    );

    // 缓存结果（缓存30分钟）
    await this.cacheManager.set(cacheKey, tagsWithStats, 1800000);
    
    return tagsWithStats;
  }

  /**
   * 创建新标签
   */
  async createTag(name: string) {
    // 检查标签名是否已存在
    const existingTag = await this.tagRepo.findOne({
      where: { name },
    });

    if (existingTag) {
      throw new Error('标签名称已存在');
    }

    // 创建新标签
    const tag = this.tagRepo.create({
      name,
    });

    const savedTag = await this.tagRepo.save(tag);

    // 清除相关缓存
    await this.clearTagCache();

    return savedTag;
  }

  /**
   * 更新标签
   */
  async updateTag(id: number, name: string) {
    const tag = await this.tagRepo.findOne({
      where: { id },
    });

    if (!tag) {
      throw new Error('标签不存在');
    }

    // 如果要更新名称，检查是否与其他标签重名
    if (name && name !== tag.name) {
      const existingTag = await this.tagRepo.findOne({
        where: { name },
      });

      if (existingTag) {
        throw new Error('标签名称已存在');
      }
    }

    // 更新标签信息
    if (name) tag.name = name;

    const updatedTag = await this.tagRepo.save(tag);

    // 清除相关缓存
    await this.clearTagCache();
    await this.cacheManager.del(`tag:${id}`);
    await this.cacheManager.del(`tag:name:${tag.name}`);

    return updatedTag;
  }

  /**
   * 删除标签
   */
  async deleteTag(id: number) {
    const tag = await this.tagRepo.findOne({
      where: { id },
    });

    if (!tag) {
      throw new Error('标签不存在');
    }

    // 检查是否有剧集使用此标签
    const seriesCount = await this.getTagSeriesCount(id);
    if (typeof seriesCount === 'number' && seriesCount > 0) {
      throw new Error('该标签下还有剧集，无法删除');
    }

    // 删除标签
    await this.tagRepo.remove(tag);

    // 清除相关缓存
    await this.clearTagCache();
    await this.cacheManager.del(`tag:${id}`);
    await this.cacheManager.del(`tag:name:${tag.name}`);
    await this.cacheManager.del(`tag:${id}:series_count`);

    return { ok: true };
  }

  /**
   * 批量创建标签
   */
  async createTagsBatch(names: string[]) {
    const results: any[] = [];
    const errors: any[] = [];

    for (const name of names) {
      try {
        // 检查标签是否已存在
        const existingTag = await this.getTagByName(name);
        if (existingTag) {
          results.push(existingTag);
          continue;
        }

        // 创建新标签
        const tag = await this.createTag(name);
        results.push(tag);
      } catch (error: any) {
        errors.push({ name, error: error.message });
      }
    }

    return {
      success: results,
      errors,
      total: names.length,
      successCount: results.length,
      errorCount: errors.length,
    };
  }

  /**
   * 获取热门标签（按剧集数量排序）
   */
  async getPopularTags(limit: number = 20) {
    const cacheKey = `tags:popular:${limit}`;
    
    // 尝试从缓存获取
    let result = await this.cacheManager.get(cacheKey);
    if (result) {
      return result;
    }

    // 获取标签统计信息
    const tagsWithStats = await this.getTagsWithStats();

    // 按剧集数量排序并限制数量
    const popularTags = (tagsWithStats as any[])
      .sort((a, b) => b.seriesCount - a.seriesCount)
      .slice(0, limit);

    // 缓存结果（缓存1小时）
    await this.cacheManager.set(cacheKey, popularTags, 3600000);
    
    return popularTags;
  }

  /**
   * 搜索标签
   */
  async searchTags(keyword: string, limit: number = 10) {
    const cacheKey = `tags:search:${keyword}:${limit}`;
    
    // 尝试从缓存获取
    let result = await this.cacheManager.get(cacheKey);
    if (result) {
      return result;
    }

    // 从数据库搜索
    const tags = await this.tagRepo
      .createQueryBuilder('tag')
      .where('tag.name LIKE :keyword', { keyword: `%${keyword}%` })
      .orderBy('tag.name', 'ASC')
      .limit(limit)
      .getMany();

    // 缓存结果（缓存30分钟）
    await this.cacheManager.set(cacheKey, tags, 1800000);
    
    return tags;
  }

  /**
   * 清除标签相关缓存
   */
  private async clearTagCache() {
    await this.cacheManager.del('tags:all');
    await this.cacheManager.del('tags:with_stats');
    
    // 清除热门标签缓存（简化实现）
    for (let i = 1; i <= 50; i++) {
      await this.cacheManager.del(`tags:popular:${i}`);
    }
  }
}