/**
 * 缓存键统一管理工具类
 * 提供标准化的缓存键生成方法，便于维护和管理
 */
export class CacheKeys {
  // 缓存键前缀
  private static readonly PREFIX = {
    HOME: 'home',
    FILTER: 'filter',
    VIDEO: 'video',
    CATEGORY: 'category',
    TAG: 'tag',
    SERIES: 'series'
  };

  // 缓存过期时间（秒）
  public static readonly TTL = {
    SHORT: 300,      // 5分钟
    MEDIUM: 1800,    // 30分钟
    LONG: 3600,      // 1小时
    VERY_LONG: 86400 // 24小时
  };

  /**
   * 首页视频缓存键
   * @param categoryId 分类ID
   * @param page 页码
   */
  static homeVideos(categoryId: number, page: number): string {
    return `${this.PREFIX.HOME}_videos_${categoryId}_${page}`;
  }

  /**
   * 筛选器数据缓存键
   * @param channelId 频道ID
   * @param ids 筛选条件ID组合
   * @param page 页码
   */
  static filterData(channelId: string, ids: string, page: string): string {
    return `${this.PREFIX.FILTER}_data_${channelId}_${ids}_${page}`;
  }

  /**
   * 筛选器标签缓存键
   * @param channelId 频道ID
   */
  static filterTags(channelId: string): string {
    return `${this.PREFIX.FILTER}_tags_${channelId}`;
  }

  /**
   * 视频详情缓存键
   * @param videoId 视频ID
   */
  static videoDetails(videoId: string | number): string {
    return `${this.PREFIX.VIDEO}_details_${videoId}`;
  }

  /**
   * 分类列表缓存键
   */
  static categories(): string {
    return `${this.PREFIX.CATEGORY}_list`;
  }

  /**
   * 标签列表缓存键
   */
  static tags(): string {
    return `${this.PREFIX.TAG}_list`;
  }

  /**
   * 系列详情缓存键
   * @param seriesId 系列ID
   */
  static seriesDetail(seriesId: number): string {
    return `${this.PREFIX.SERIES}_detail_${seriesId}`;
  }

  /**
   * 模块视频缓存键
   * @param moduleType 模块类型（drama, movie, variety）
   * @param categoryId 分类ID
   * @param page 页码
   */
  static moduleVideos(moduleType: string, categoryId: number, page: number): string {
    return `${moduleType}_videos_${categoryId}_${page}`;
  }

  /**
   * 热门系列缓存键
   * @param limit 数量限制
   */
  static topSeries(limit: number): string {
    return `${this.PREFIX.SERIES}_top_${limit}`;
  }

  /**
   * 清除指定模式的缓存键
   * @param pattern 缓存键模式
   */
  static getPatternKeys(pattern: string): string[] {
    // 这个方法用于批量清除缓存时的模式匹配
    const patterns = {
      'home_all': [`${this.PREFIX.HOME}_videos_*`],
      'filter_all': [`${this.PREFIX.FILTER}_*`],
      'video_all': [`${this.PREFIX.VIDEO}_*`],
      'category_all': [`${this.PREFIX.CATEGORY}_*`],
      'tag_all': [`${this.PREFIX.TAG}_*`],
      'series_all': [`${this.PREFIX.SERIES}_*`]
    };
    
    return patterns[pattern] || [];
  }

  /**
   * 获取所有缓存键模式
   */
  static getAllPatterns(): string[] {
    return [
      `${this.PREFIX.HOME}_*`,
      `${this.PREFIX.FILTER}_*`,
      `${this.PREFIX.VIDEO}_*`,
      `${this.PREFIX.CATEGORY}_*`,
      `${this.PREFIX.TAG}_*`,
      `${this.PREFIX.SERIES}_*`
    ];
  }

  /**
   * 获取缓存键模式，用于批量清除
   */
  static getKeyPattern(pattern: string): string {
    return `${pattern}*`;
  }

  /**
   * 获取所有首页视频缓存键模式
   */
  static getAllHomeVideosPattern(): string {
    return this.getKeyPattern(`${this.PREFIX.HOME}_videos`);
  }

  /**
   * 获取所有筛选器缓存键模式
   */
  static getAllFilterPattern(): string {
    return this.getKeyPattern(`${this.PREFIX.FILTER}`);
  }

  /**
   * 获取所有视频详情缓存键模式
   */
  static getAllVideoDetailsPattern(): string {
    return this.getKeyPattern(`${this.PREFIX.VIDEO}_details`);
  }

  /**
   * 获取所有分类缓存键模式
   */
  static getAllCategoriesPattern(): string {
    return this.getKeyPattern(`${this.PREFIX.CATEGORY}`);
  }

  /**
   * 获取所有标签缓存键模式
   */
  static getAllTagsPattern(): string {
    return this.getKeyPattern(`${this.PREFIX.TAG}`);
  }

  /**
   * 获取所有系列缓存键模式
   */
  static getAllSeriesPattern(): string {
    return this.getKeyPattern(`${this.PREFIX.SERIES}`);
  }

  /**
   * 生成带时间戳的缓存键（用于版本控制）
   */
  static withTimestamp(key: string): string {
    const timestamp = Math.floor(Date.now() / 1000);
    return `${key}_${timestamp}`;
  }

  /**
   * 生成用户相关的缓存键
   */
  static userRelated(userId: number, key: string): string {
    return `user_${userId}_${key}`;
  }

  /**
   * 生成临时缓存键（短期缓存）
   */
  static temporary(key: string): string {
    return `temp_${key}`;
  }
}