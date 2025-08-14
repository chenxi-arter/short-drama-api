/**
 * 🚀 缓存配置工具类
 * 统一管理所有接口的缓存策略和TTL配置
 */
export class CacheConfig {
  /**
   * 缓存时间配置（秒）
   */
  static readonly TTL = {
    // 短期缓存（5分钟）- 用户相关数据，变化频繁
    SHORT: 300,
    
    // 中期缓存（15分钟）- 系列详情等，变化较少
    MEDIUM: 900,
    
    // 长期缓存（30分钟）- 剧集列表等，变化中等
    LONG: 1800,
    
    // 超长期缓存（1小时）- 分类列表等，变化很少
    EXTENDED: 3600,
    
    // 永久缓存（24小时）- 静态数据，几乎不变
    PERMANENT: 86400
  };

  /**
   * 缓存键前缀
   */
  static readonly PREFIX = {
    // 剧集相关
    EPISODE_LIST: 'episode_list',
    EPISODE_DETAIL: 'episode_detail',
    
    // 系列相关
    SERIES_DETAIL: 'series_detail',
    SERIES_BY_CATEGORY: 'series_by_category',
    
    // 首页相关
    HOME_VIDEOS: 'home_videos',
    
    // 分类相关
    CATEGORIES: 'categories',
    
    // 筛选相关
    FILTER_TAGS: 'filter_tags',
    FILTER_DATA: 'filter_data',
    
    // 搜索相关
    FUZZY_SEARCH: 'fuzzy_search',
    
    // 轮播图相关
    BANNERS: 'banners'
  };

  /**
   * 缓存策略配置
   */
  static readonly STRATEGY = {
    // 剧集列表缓存策略
    EPISODE_LIST: {
      PUBLIC: CacheConfig.TTL.LONG,      // 公开数据：30分钟
      USER: CacheConfig.TTL.SHORT        // 用户数据：5分钟
    },
    
    // 系列详情缓存策略
    SERIES_DETAIL: {
      TTL: CacheConfig.TTL.MEDIUM       // 15分钟
    },
    
    // 首页数据缓存策略
    HOME_VIDEOS: {
      TTL: CacheConfig.TTL.SHORT        // 5分钟
    },
    
    // 分类列表缓存策略
    CATEGORIES: {
      TTL: CacheConfig.TTL.EXTENDED     // 1小时
    },
    
    // 筛选数据缓存策略
    FILTER_DATA: {
      TTL: CacheConfig.TTL.MEDIUM       // 15分钟
    },
    
    // 模糊搜索缓存策略
    FUZZY_SEARCH: {
      TTL: CacheConfig.TTL.SHORT        // 5分钟
    }
  };

  /**
   * 生成缓存键
   */
  static generateKey(prefix: string, ...params: (string | number)[]): string {
    return `${prefix}:${params.join(':')}`;
  }

  /**
   * 生成剧集列表缓存键
   */
  static episodeListKey(
    seriesIdentifier: string | undefined,
    isShortId: boolean,
    page: number,
    size: number,
    userId?: number
  ): string {
    const identifier = seriesIdentifier || 'all';
    const idType = isShortId ? 'shortId' : 'id';
    const user = userId || 'public';
    
    return this.generateKey(
      this.PREFIX.EPISODE_LIST,
      identifier,
      idType,
      page,
      size,
      user
    );
  }

  /**
   * 生成系列详情缓存键
   */
  static seriesDetailKey(seriesId: number): string {
    return this.generateKey(this.PREFIX.SERIES_DETAIL, seriesId);
  }

  /**
   * 生成分类系列缓存键
   */
  static seriesByCategoryKey(categoryId: number): string {
    return this.generateKey(this.PREFIX.SERIES_BY_CATEGORY, categoryId);
  }

  /**
   * 生成首页视频缓存键
   */
  static homeVideosKey(channeid?: number, page: number = 1): string {
    const channel = channeid || 'all';
    return this.generateKey(this.PREFIX.HOME_VIDEOS, channel, page);
  }

  /**
   * 生成分类列表缓存键
   */
  static categoriesKey(): string {
    return this.generateKey(this.PREFIX.CATEGORIES, 'all');
  }

  /**
   * 获取缓存TTL
   */
  static getTTL(type: keyof typeof CacheConfig.STRATEGY, subType?: string): number {
    const strategy = this.STRATEGY[type];
    
    if (subType && strategy[subType]) {
      return strategy[subType];
    }
    
    // 处理不同类型的策略对象
    if (typeof strategy === 'object') {
      if ('TTL' in strategy && typeof strategy.TTL === 'number') {
        return strategy.TTL;
      }
      // 对于有PUBLIC和USER属性的策略，返回默认值
      if ('PUBLIC' in strategy && 'USER' in strategy) {
        return this.TTL.MEDIUM; // 默认15分钟
      }
    }
    
    return this.TTL.MEDIUM; // 默认15分钟
  }
}
