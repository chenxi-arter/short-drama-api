import { Injectable, Inject } from '@nestjs/common';
import { DateUtil } from '../../common/utils/date.util';
import { DebugUtil } from '../../common/utils/debug.util';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Series } from '../entity/series.entity';
import { Category } from '../entity/category.entity';
import { FilterService } from './filter.service';
import { BannerService } from './banner.service';
import { CacheKeys } from '../utils/cache-keys.util';

/**
 * 首页服务
 * 专门处理首页相关的业务逻辑
 */
@Injectable()
export class HomeService {
  constructor(
    @InjectRepository(Series)
    private readonly seriesRepo: Repository<Series>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    private readonly filterService: FilterService,
    private readonly bannerService: BannerService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  /**
   * 获取首页视频模块
   * @param channeid 频道ID
   * @param page 页码
   */
  async getHomeVideos(channeid: number, page: number) {
    const cacheKey = CacheKeys.homeVideos(channeid, page);
    
    // 尝试从缓存获取
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      DebugUtil.cache('首页视频缓存命中', cacheKey);
      return cached;
    }

    try {
      const result = await this.getHomeModules(channeid, page);
      
      // 缓存结果（5分钟）
      await this.cacheManager.set(cacheKey, result, 300000);
      DebugUtil.cache('首页视频已缓存', cacheKey);
      
      return result;
    } catch (error) {
      DebugUtil.error('获取首页视频失败', error as Error);
      throw new Error('获取首页视频失败');
    }
  }

  /**
   * 获取首页模块数据
   * @param channeid 频道ID
   * @param page 页码
   */
  async getHomeModules(channeid: number, page: number) {
    try {
      const contentBlocks: any[] = []; // ✅ 修复类型错误

      // 第一页返回完整数据结构
      if (page === 1) {
        // 1. 轮播图模块
        const banners = await this.bannerService.getActiveBanners(channeid, 5);
        if (banners.length > 0) {
          contentBlocks.push({
            type: 0,
            name: "轮播图",
            filters: [],
            banners: banners,
            list: []
          });
        }

        // 2. 搜索过滤器模块
        const filterTags = await this.filterService.getFiltersTags(channeid.toString());
        contentBlocks.push({
          type: 1001,
          name: "搜索过滤器",
          filters: filterTags.data?.list || [],
          banners: [],
          list: []
        });

        // 3. 广告模块（预留）
        contentBlocks.push({
          type: -1,
          name: "广告",
          filters: [],
          banners: [],
          list: []
        });
      }

      // 4. 视频列表模块（所有页都包含）
      const videoList = await this.getVideoList(channeid, page, 20);
      contentBlocks.push({
        type: 3,
        name: "视频列表",
        filters: [],
        banners: [],
        list: videoList
      });

      return {
        code: 200,
        msg: "success",
        data: {
          list: contentBlocks
        }
      };
    } catch (error) {
      DebugUtil.error('获取首页模块失败', error as Error);
      throw new Error('获取首页模块失败');
    }
  }

  /**
   * 获取分类列表
   */
  async listCategories() {
    const cacheKey = CacheKeys.categories();
    
    // 尝试从缓存获取
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      DebugUtil.cache('分类列表缓存命中', cacheKey);
      return cached;
    }

    try {
      const categories = await this.categoryRepo.find({
        where: { isEnabled: true },
        order: { id: 'ASC' }
      });

      const result = {
        ret: 200,
        data: {
          versionNo: Math.floor(Date.now() / 1000),
          list: categories.map(cat => ({
            channeid: cat.id,
            name: cat.name,
            routeName: cat.routeName || cat.name.toLowerCase()
          }))
        },
        msg: null
      };

      // 缓存结果（1小时）
      await this.cacheManager.set(cacheKey, result, 3600000);
      DebugUtil.cache('分类列表已缓存', cacheKey);
      
      return result;
    } catch (error) {
      DebugUtil.error('获取分类列表失败', error as Error);
      throw new Error('获取分类列表失败');
    }
  }

  /**
   * 获取视频列表
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
        .orderBy('series.updatedAt', 'DESC')
        .addOrderBy('series.createdAt', 'DESC')
        .addOrderBy('series.id', 'DESC')
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
        upCount: 0,
        author: s.starring || '',
        description: s.description || '',
        cidMapper: s.categoryId?.toString() || '',
        isRecommend: s.score >= 8.0,
        createdAt: DateUtil.formatDateTime(s.createdAt)
      }));
    } catch (error) {
      DebugUtil.error('获取视频列表失败', error as Error);
      return [];
    }
  }

  /**
   * ✅ 新增：格式化日期时间为用户友好的格式（支持时区转换）
   * @param date 日期对象
   * @returns 格式化后的日期字符串，如 "2024-01-15 16:30"
   */
  private formatDateTime(date: Date): string {
    if (!date) return '';
    
    // ✅ 修复：确保时区正确处理
    // 将UTC时间转换为北京时间 (UTC+8)
    const beijingTime = new Date(date.getTime() + (date.getTimezoneOffset() * 60000) + (8 * 3600000));
    
    const year = beijingTime.getFullYear();
    const month = String(beijingTime.getMonth() + 1).padStart(2, '0');
    const day = String(beijingTime.getDate()).padStart(2, '0');
    const hours = String(beijingTime.getHours()).padStart(2, '0');
    const minutes = String(beijingTime.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
}
