import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Tag } from '../entity/tag.entity';
import { Series } from '../entity/series.entity';

@Injectable()
export class TagService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepo: Repository<Tag>,
    @InjectRepository(Series)
    private readonly seriesRepo: Repository<Series>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  /**
   * 获取所有标签
   */
  async getAllTags() {
    const cacheKey = 'tags:all';
    
    // 尝试从缓存获取
    let tags = await this.cacheManager.get(cacheKey);
    if (tags) {
      return tags;
    }

    // 从数据库获取
    tags = await this.tagRepo.find({
      order: { name: 'ASC' },
    });

    // 缓存结果（缓存1小时）
    await this.cacheManager.set(cacheKey, tags, 3600000);
    
    return tags;
  }

  /**
   * 根据ID获取标签
   */
  async getTagById(id: number) {
    const cacheKey = `tag:${id}`;
    
    // 尝试从缓存获取
    let tag = await this.cacheManager.get(cacheKey);
    if (tag) {
      return tag;
    }

    // 从数据库获取
    tag = await this.tagRepo.findOne({
      where: { id },
    });

    if (tag) {
      // 缓存结果（缓存1小时）
      await this.cacheManager.set(cacheKey, tag, 3600000);
    }
    
    return tag;
  }

  /**
   * 根据名称获取标签
   */
  async getTagByName(name: string) {
    const cacheKey = `tag:name:${name}`;
    
    // 尝试从缓存获取
    let tag = await this.cacheManager.get(cacheKey);
    if (tag) {
      return tag;
    }

    // 从数据库获取
    tag = await this.tagRepo.findOne({
      where: { name },
    });

    if (tag) {
      // 缓存结果（缓存1小时）
      await this.cacheManager.set(cacheKey, tag, 3600000);
    }
    
    return tag;
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