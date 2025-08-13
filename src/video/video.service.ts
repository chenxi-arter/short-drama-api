import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Category } from './entity/category.entity';
import { Series } from './entity/series.entity';
import { Episode } from './entity/episode.entity';
import { ShortVideo } from "./entity/short-video.entity";
// import { FilterType } from './entity/filter-type.entity';
// import { FilterOption } from './entity/filter-option.entity';
import { ContentBlock, VideoItem } from './dto/home-videos.dto';
import { FilterTagsResponse } from './dto/filter-tags.dto';
import { FilterDataResponse } from './dto/filter-data.dto';
import { ConditionFilterDto, ConditionFilterResponse } from './dto/condition-filter.dto';
import { EpisodeListResponse, EpisodeBasicInfo } from './dto/episode-list.dto';
import { WatchProgressService } from './services/watch-progress.service';
import { CommentService } from './services/comment.service';
import { EpisodeService } from './services/episode.service';
import { CategoryService } from './services/category.service';

import { FilterService } from './services/filter.service';
import { SeriesService } from './services/series.service';
import { BannerService } from './services/banner.service';
import { BrowseHistoryService } from './services/browse-history.service';
import { CacheKeys } from './utils/cache-keys.util';

@Injectable()
export class VideoService {
  constructor(
    @InjectRepository(Category) private readonly catRepo: Repository<Category>,
    @InjectRepository(Series)  private readonly seriesRepo: Repository<Series>,
    @InjectRepository(ShortVideo) private readonly shortRepo: Repository<ShortVideo>,
    @InjectRepository(Episode) private readonly epRepo: Repository<Episode>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly watchProgressService: WatchProgressService,
    private readonly commentService: CommentService,
    private readonly episodeService: EpisodeService,
    private readonly categoryService: CategoryService,

    private readonly filterService: FilterService,
    private readonly seriesService: SeriesService,
    private readonly bannerService: BannerService,
    private readonly browseHistoryService: BrowseHistoryService,
  ) {}
   /* 列出所有分类 */
  async listCategories() {
    return this.categoryService.getAllCategories();
  }

  /* 根据分类 id 查短剧（电视剧）列表 */
  async listSeriesByCategory(categoryId: number) {
    const result = await this.seriesService.getSeriesByCategory(categoryId);
    return result.series;
  }

  /* 根据短剧 id 查详情（含所有剧集） */
  async getSeriesDetail(seriesId: number) {
    return this.seriesService.getSeriesDetail(seriesId);
  }

  /* 断点：写/读 */
  async saveProgress(userId: number, episodeId: number, stopAtSecond: number) {
    const result = await this.watchProgressService.updateWatchProgress(userId, episodeId, stopAtSecond);
    
    // 清除视频详情缓存 - 观看进度更新后需要更新详情中的进度信息
    await this.cacheManager.del(`video_details_${episodeId}`);
    
    return result;
  }

  /**
   * 获取用户观看进度
   */
  async getProgress(userId: number, episodeId: number) {
    const progressList = await this.watchProgressService.getUserWatchProgress(userId, episodeId);
    const progress = progressList.length > 0 ? progressList[0] : null;
    return { stopAtSecond: progress?.stopAtSecond || 0 };
  }

  /**
   * 获取用户在某个系列下的总体播放进度
   */
  async getUserSeriesProgress(userId: number, seriesId: number) {
    try {
      // 获取该系列下的所有剧集
      const episodes = await this.epRepo.find({
        where: { series: { id: seriesId } },
        order: { episodeNumber: 'ASC' },
        relations: ['series']
      });

      if (episodes.length === 0) {
        return null;
      }

      // 获取用户在该系列下的所有播放进度
      const episodeIds = episodes.map(ep => ep.id);
      const progressList = await this.watchProgressService.getUserWatchProgressByEpisodeIds(userId, episodeIds);
      
      // 计算总体播放进度
      let totalWatchTime = 0;
      let currentEpisode = 0;
      let currentEpisodeShortId = '';
      let watchProgress = 0;
      let watchPercentage = 0;
      let lastWatchTime = new Date(0);
      let completedEpisodes = 0;

      progressList.forEach(progress => {
        const episode = episodes.find(ep => ep.id === progress.episodeId);
        if (episode) {
          totalWatchTime += progress.stopAtSecond;
          
          // 更新最后观看时间
          if (progress.updatedAt > lastWatchTime) {
            lastWatchTime = progress.updatedAt;
            currentEpisode = episode.episodeNumber;
            currentEpisodeShortId = episode.shortId;
            watchProgress = progress.stopAtSecond;
            
            // 计算当前集的观看百分比
            if (episode.duration > 0) {
              watchPercentage = Math.round((progress.stopAtSecond / episode.duration) * 100);
            }
          }
          
          // 统计已完成的剧集（观看90%以上）
          if (episode.duration > 0 && (progress.stopAtSecond / episode.duration) >= 0.9) {
            completedEpisodes++;
          }
        }
      });

      return {
        currentEpisode,
        currentEpisodeShortId,
        watchProgress,
        watchPercentage,
        totalWatchTime,
        lastWatchTime: lastWatchTime.toISOString(),
        isCompleted: completedEpisodes >= episodes.length
      };
    } catch (error) {
      console.error('获取用户系列播放进度失败:', error);
      return null;
    }
  }

  /* 通过UUID获取剧集信息 */
  async getEpisodeByShortId(episodeShortId: string) {
    return this.episodeService.getEpisodeByShortId(episodeShortId);
  }

  /* 清除视频相关缓存 */
  private async clearVideoRelatedCache(videoId: string, categoryId?: number) {
    try {
      // 清除视频详情缓存
      await this.cacheManager.del(CacheKeys.videoDetails(videoId));
      
      // 清除首页视频缓存
      for (let page = 1; page <= 3; page++) {
        await this.cacheManager.del(CacheKeys.homeVideos(1, page));
      }
      
      // 清除筛选器相关缓存
      await this.filterService.clearFilterCache();
      
      // 使用categoryId参数避免未使用警告
      if (categoryId) {
        console.log('Clearing cache for category:', categoryId);
      }
    } catch (error) {
      console.error('清除缓存失败:', error);
    }
  }

  /* 清除所有首页和筛选器缓存 */
  private async clearAllListCache() {
    try {
      // 清除首页缓存
      for (let page = 1; page <= 3; page++) {
        await this.cacheManager.del(CacheKeys.homeVideos(1, page));
      }
      
      // 清除筛选器缓存
      await this.filterService.clearFilterCache();
    } catch (error) {
      console.error('清除列表缓存失败:', error);
    }
  }

  /* 发弹幕/评论 */
  async addComment(userId: number, episodeId: number, content: string, appearSecond?: number) {
    const result = await this.commentService.addComment(userId, episodeId, content, appearSecond);
    
    // 清除相关缓存 - 评论更新后清除视频详情缓存
    await this.clearVideoRelatedCache(episodeId.toString());
    
    return result;
  }

  /* 创建剧集播放地址 */
  async createEpisodeUrl(episodeId: number, quality: string, ossUrl: string, cdnUrl: string, subtitleUrl?: string) {
    const result = await this.episodeService.createEpisodeUrl(episodeId, quality, ossUrl, cdnUrl, subtitleUrl);
    
    // 清除相关缓存
    await this.clearVideoRelatedCache(episodeId.toString());
    
    return result;
  }

  /* 通过访问密钥获取播放地址 */
  async getEpisodeUrlByAccessKey(accessKey: string) {
    return this.episodeService.getEpisodeUrlByAccessKey(accessKey);
  }

  /* 更新剧集续集状态 */
  async updateEpisodeSequel(episodeId: number, hasSequel: boolean) {
    await this.epRepo.update(episodeId, { hasSequel });
    
    // 清除相关缓存
    await this.clearVideoRelatedCache(episodeId.toString());
    
    return { ok: true };
  }

  /* 批量为现有播放地址生成访问密钥 */
  async generateAccessKeysForExisting() {
    return this.episodeService.generateAccessKeysForExisting();
  }
 
async listMedia(
  categoryId?: number,
  type?: 'short' | 'series',
  userId?: number,
  sort: 'latest' | 'like' | 'play' = 'latest',
  page = 1,
  size = 20,
) {
  const skip = (page - 1) * size;

// 1. 短视频
if (type === 'short') {
  const qb = this.shortRepo
    .createQueryBuilder('sv')
    .leftJoinAndSelect('sv.category', 'c')
    .orderBy({
      'sv.likeCount': sort === 'like' ? 'DESC' : sort === 'play' ? 'DESC' : 'ASC',
      'sv.createdAt': 'DESC',
    })
    .skip(skip)
    .take(size);

  if (categoryId) {
    qb.where('sv.category_id = :categoryId', { categoryId }); // ✅ 这里改成数据库列名
  }

  return qb.getManyAndCount();
}

// 2. Series
const qb = this.seriesRepo
  .createQueryBuilder('s')
  .leftJoinAndSelect('s.category', 'c')
  .leftJoinAndSelect('s.episodes', 'ep')
  .orderBy({
    's.createdAt': 'DESC',
  })
  .skip(skip)
  .take(size);

if (categoryId) {
  qb.where('s.category_id = :categoryId', { categoryId }); // ✅ 同样改这里
}


  const [rows, total] = await qb.getManyAndCount();
  return {
    list: rows.map(r => ({
      id: r.id,
      title: r.title,
      coverUrl: r.coverUrl,
      totalEpisodes: r.totalEpisodes,
      categoryName: r.category?.name || '',
      latestEpisode: r.episodes?.[0]?.episodeNumber || 0,
    })),
    total,
    page,
    size,
  };
}
async listSeriesFull(
  categoryId?: number,
  page = 1,
  size = 20,
) {
  console.log(1121212);
  
  const skip = (page - 1) * size;
  const qb = this.seriesRepo
    .createQueryBuilder('s')
    .leftJoinAndSelect('s.category', 'c')
    .leftJoinAndSelect('s.episodes', 'ep')
    .orderBy('s.createdAt', 'DESC')
    .addOrderBy('ep.episodeNumber', 'ASC')
    .skip(skip)
    .take(size);
  

  if (categoryId) {
    qb.where('s.category_id = :categoryId', { categoryId });
  }

  const [rows, total] = await qb.getManyAndCount();

  // 组装成干净结构
  return {
    list: rows.map(series => ({
      id: series.id,
      title: series.title,
      description: series.description,
      coverUrl: series.coverUrl,
      totalEpisodes: series.totalEpisodes,
      categoryName: series.category?.name || '',
      createdAt: series.createdAt,
      episodes: series.episodes.map(ep => ({
        id: ep.id,
        episodeNumber: ep.episodeNumber,
        title: ep.title,
        duration: ep.duration,
        status: ep.status,
      })),
    })),
    total,
    page,
    size,
  };
}
  /**
   * 获取首页视频列表 - 重构版本（通俗易懂）
   * 
   * 功能说明：
   * 1. 根据频道ID(channeid)获取对应分类的视频内容
   * 2. 第一页返回完整内容：轮播图 + 搜索过滤器 + 广告位 + 视频列表
   * 3. 后续页面只返回视频列表（性能优化）
   * 
   * @param channeid 频道ID（对应categories表的id字段）
   * @param page 页码，从1开始
   * @returns 首页视频数据，包含轮播图、过滤器、视频列表等
   */
  async getHomeVideos(channeid?: number, page: number = 1): Promise<any> {
    // 每页显示的视频数量
    const pageSize = 20;
    
    // 第一步：生成缓存键，提高接口响应速度
    const cacheKey = `home_videos_${channeid || 'all'}_page_${page}`;
    
    // 第二步：尝试从缓存中获取数据
    const cachedResult = await this.cacheManager.get(cacheKey);
    if (cachedResult) {
      console.log(`从缓存获取首页数据: ${cacheKey}`);
      return cachedResult;
    }
    
    // 第三步：根据channeid查找对应的分类信息
     const categoryInfo = await this.findCategoryInfo(channeid);
    
    // 第四步：构建返回的数据块列表
    const dataBlocks: ContentBlock[] = [];
    
    // 第五步：如果是第一页，添加轮播图、搜索过滤器、广告等完整内容
    if (page === 1) {
      // 添加轮播图板块
      const bannerBlock = await this.createBannerBlock(categoryInfo.numericId);
      dataBlocks.push(bannerBlock);
      
      // 添加搜索过滤器板块
      const filterBlock = this.createSearchFilterBlock();
      dataBlocks.push(filterBlock);
      
      // 添加广告板块
      const adBlock = this.createAdvertisementBlock();
      dataBlocks.push(adBlock);
    }
    
    // 第六步：添加视频列表板块（所有页面都需要）
    const videoBlock = await this.createVideoListBlock(
      categoryInfo.numericId, 
      categoryInfo.name, 
      page, 
      pageSize
    );
    
    // 检查视频列表是否为空，如果为空则返回 data = null
    if (!videoBlock.list || videoBlock.list.length === 0) {
      const finalResult = {
        data: null,
        code: 200,
        msg: null,
      };
      
      // 将结果存入缓存（缓存5分钟）
      await this.cacheManager.set(cacheKey, finalResult, 5 * 60 * 1000);
      console.log(`首页数据已缓存（无数据）: ${cacheKey}`);
      
      return finalResult;
    }
    
    dataBlocks.push(videoBlock);
    
    // 第七步：构建最终返回结果
    const finalResult = {
      data: {
        list: dataBlocks,
      },
      code: 200,
      msg: null,
    };
    
    // 第八步：将结果存入缓存（缓存5分钟）
    await this.cacheManager.set(cacheKey, finalResult, 5 * 60 * 1000);
    console.log(`首页数据已缓存: ${cacheKey}`);
    
    return finalResult;
  }
  
  /**
   * 根据频道ID查找分类信息
   * @param channeid 频道ID（对应categories表的id字段）
   * @returns 分类信息对象
   */
  private async findCategoryInfo(channeid?: number): Promise<{name: string, numericId?: number}> {
    if (!channeid) {
      return { name: "全部", numericId: undefined };
    }
    
    // 直接通过 id 字段查询 categories 表
     const category = await this.catRepo.findOne({ 
       where: { id: channeid, isEnabled: true } 
     });
     
     if (category) {
       return {
         name: category.name,
         numericId: category.id
       };
     }
     
     // 如果找不到，抛出异常
     throw new Error(`频道ID ${channeid} 不存在或已禁用`);
  }
  
  /**
   * 创建轮播图数据块
   * @param categoryId 分类数字ID
   * @returns 轮播图数据块
   */
  private async createBannerBlock(categoryId?: number): Promise<ContentBlock> {
    const banners = await this.bannerService.getActiveBanners(categoryId, 5);
    
    return {
      type: 0,
      name: "轮播图",
      filters: [],
      banners: banners || [],
      list: [],
    };
  }
  
  /**
   * 创建搜索过滤器数据块
   * @returns 搜索过滤器数据块
   */
  private createSearchFilterBlock(): ContentBlock {
    return {
      type: 1001,
      name: "搜索过滤器",
      filters: [
        { channeID: 1, name: "短剧", title: "全部", ids: "0,0,0,0,0" },
        { channeID: 1, name: "短剧", title: "最新上传", ids: "0,0,0,0,0" },
        { channeID: 1, name: "短剧", title: "人气高", ids: "1,0,0,0,0" },
        { channeID: 1, name: "短剧", title: "评分高", ids: "2,0,0,0,0" },
        { channeID: 1, name: "短剧", title: "最新更新", ids: "3,0,0,0,0" },
      ],
      banners: [],
      list: [],
    };
  }
  
  /**
   * 创建广告数据块
   * @returns 广告数据块
   */
  private createAdvertisementBlock(): ContentBlock {
    return {
      type: -1,
      name: "广告",
      filters: [],
      banners: [],
      list: [],
    };
  }
  
  /**
   * 创建视频列表数据块
   * @param categoryId 分类数字ID
   * @param categoryName 分类名称
   * @param page 页码
   * @param pageSize 每页数量
   * @returns 视频列表数据块
   */
  private async createVideoListBlock(
    categoryId: number | undefined, 
    categoryName: string, 
    page: number, 
    pageSize: number
  ): Promise<ContentBlock> {
    const videoList = await this.getVideoList(categoryId, page, pageSize);
    
    return {
      type: 3,
      name: categoryName,
      filters: [],
      banners: [],
      list: videoList,
    };
  }
  
  /**
   * 获取电影首页视频列表
   * @param catid 分类ID
   * @param page 页码
   * @returns 电影首页视频列表数据
   */
  async getMovieVideos(catid?: string, page: number = 1): Promise<any> {
    const categoryId = catid ? parseInt(catid, 10) : 2; // 默认电影分类ID为2
    return this.getModuleVideos('movie', categoryId, page);
  }

  /**
   * 获取短剧首页视频列表
   * @param catid 分类ID
   * @param page 页码
   * @returns 短剧首页视频列表数据
   */
  async getDramaVideos(catid?: string, page: number = 1): Promise<any> {
    const categoryId = catid ? parseInt(catid, 10) : 1; // 默认短剧分类ID为1
    return this.getModuleVideos('drama', categoryId, page);
  }

  /**
   * 获取综艺首页视频列表
   * @param catid 分类ID
   * @param page 页码
   * @returns 综艺首页视频列表数据
   */
  async getVarietyVideos(catid?: string, page: number = 1): Promise<any> {
    const categoryId = catid ? parseInt(catid, 10) : 3; // 默认综艺分类ID为3
    return this.getModuleVideos('variety', categoryId, page);
  }

  /**
   * 通用模块视频获取方法
   * @param moduleType 模块类型
   * @param categoryId 分类ID
   * @param page 页码
   * @returns 模块视频列表数据
   */
  private async getModuleVideos(moduleType: string, categoryId: number, page: number = 1): Promise<any> {
    const size = 20;
    
    // 生成缓存键
    const cacheKey = `${moduleType}_videos_${categoryId}_${page}`;
    
    // 尝试从缓存获取数据
    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    // 根据categoryId获取分类信息
    const category = await this.catRepo.findOne({ where: { id: categoryId } });
    const categoryName = category?.name || '未知分类';
    
    // 构建响应数据结构
    const blocks: ContentBlock[] = [];
    
    // 1. 添加轮播图板块
    const banners = await this.getTopSeries(5, categoryId);
    blocks.push({
      type: 0,
      name: "轮播图",
      filters: [],
      banners: banners.map(series => ({
        showURL: series.coverUrl || '',
        title: series.title,
        id: series.id,
        shortId: series.shortId,
        channeID: categoryId,
        url: `/video/details/${series.shortId || series.id}`,
      })),
      list: [],
    });
    
    // 2. 添加搜索过滤器板块
    blocks.push({
      type: 1001,
      name: "搜索过滤器",
      filters: [
        {
          channeID: categoryId,
          name: categoryName,
          title: "全部",
          ids: "0,0,0,0,0",
        },
        {
          channeID: categoryId,
          name: categoryName,
          title: "最新上传",
          ids: "0,0,0,0,0",
        },
        {
          channeID: categoryId,
          name: categoryName,
          title: "人气高",
          ids: "1,0,0,0,0",
        },
        {
          channeID: categoryId,
          name: categoryName,
          title: "评分高",
          ids: "2,0,0,0,0",
        },
        {
          channeID: categoryId,
          name: categoryName,
          title: "最新更新",
          ids: "3,0,0,0,0",
        },
      ],
      banners: [],
      list: [],
    });
    
    // 3. 添加广告板块
    blocks.push({
      type: -1,
      name: "广告",
      filters: [],
      banners: [],
      list: [],
    });
    
    // 4. 添加视频列表板块
    const videoList = await this.getVideoList(categoryId, page, size);
    blocks.push({
      type: 3,
      name: categoryName,
      filters: [],
      banners: [],
      list: videoList,
    });
    
    const result = {
      data: {
        list: blocks,
      },
      code: 200,
      msg: null,
    };
    
    // 将结果存入缓存，缓存5分钟
    await this.cacheManager.set(cacheKey, result, 300000);
    
    return result;
  }

  /**
   * 获取热门系列作为轮播图
   * @param limit 限制数量
   * @param categoryId 分类ID
   * @returns 热门系列列表
   */
  private async getTopSeries(limit: number = 5, categoryId?: number) {
    const queryBuilder = this.seriesRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.category', 'c')
      .orderBy('s.playCount', 'DESC')
      .addOrderBy('s.score', 'DESC')
      .take(limit);
    
    if (categoryId) {
      queryBuilder.where('s.category_id = :categoryId', { categoryId });
    }
    
    return queryBuilder.getMany();
  }
  
  /**
   * 获取视频列表
   * @param categoryId 分类ID
   * @param page 页码
   * @param size 每页数量
   * @returns 视频列表
   */
  private async getVideoList(categoryId?: number, page: number = 1, size: number = 20): Promise<VideoItem[]> {
    const skip = (page - 1) * size;
    
    // 获取系列剧集
    const seriesQb = this.seriesRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.category', 'c')
      .leftJoinAndSelect('s.episodes', 'ep')
      .orderBy('s.createdAt', 'DESC')
      .skip(skip)
      .take(size);
    
    if (categoryId) {
      seriesQb.where('s.category_id = :categoryId', { categoryId });
    }
    
    const series = await seriesQb.getMany();
    
    // 获取短视频
    const shortQb = this.shortRepo
      .createQueryBuilder('sv')
      .leftJoinAndSelect('sv.category', 'c')
      .orderBy('sv.createdAt', 'DESC')
      .skip(skip)
      .take(size);
    
    if (categoryId) {
      shortQb.where('sv.category_id = :categoryId', { categoryId });
    }
    
    const shorts = await shortQb.getMany();
    
    // 合并并转换为VideoItem格式
    const seriesItems: VideoItem[] = series.map((s) => ({
      id: s.id,
      shortId: s.shortId || `series_${s.id}`,
      coverUrl: s.coverUrl,
      title: s.title,
      score: s.score?.toString() || "0.0",
      playCount: s.playCount || 0,
      url: s.id.toString(),
      type: s.category?.name || "剧情",
      isSerial: true,
      upStatus: s.upStatus || (s.totalEpisodes ? `更新到${s.totalEpisodes}集` : "全集"),
      upCount: s.upCount || 0,
      author: s.starring || s.director || '未知',
      description: s.description || '暂无简介',
      cidMapper: s.category?.id?.toString() || '1',
      isRecommend: false,
      createdAt: s.createdAt?.toISOString() || new Date().toISOString(),
    }));
    
    const shortItems: VideoItem[] = shorts.map((sv) => ({
      id: sv.id,
      shortId: sv.shortId || `short_${sv.id}`,
      coverUrl: sv.coverUrl,
      title: sv.title,
      score: "0.0",
      playCount: sv.playCount || 0,
      url: sv.id.toString(),
      type: sv.category?.name || "短视频",
      isSerial: false,
      upStatus: "全集",
      upCount: 0,
      author: sv.platformName || '官方平台',
      description: sv.description || '暂无简介',
      cidMapper: sv.category?.id?.toString() || '1',
      isRecommend: false,
      createdAt: sv.createdAt?.toISOString() || new Date().toISOString(),
    }));
    
    // 合并结果并限制总数
    return [...seriesItems, ...shortItems].slice(0, size);
  }

  /**
   * 获取筛选器标签
   * @param channeid 频道ID
   * @returns 筛选器标签列表
   */
  async getFiltersTags(channeid: string): Promise<FilterTagsResponse> {
    return this.filterService.getFiltersTags(channeid);
  }

  /**
   * 清除筛选器缓存
   * @param channeid 可选，指定频道ID
   */
  async clearFilterCache(channeid?: string): Promise<void> {
    if (channeid) {
      await this.filterService.clearFilterCache(channeid);
    } else {
      await this.filterService.clearAllFilterTagsCache();
    }
  }

  /**
   * 获取筛选器数据
   * @param channeid 频道ID
   * @param ids 筛选标识
   * @param page 页码
   * @returns 筛选后的视频列表
   */
  async getFiltersData(channeid: string, ids: string, page: string): Promise<FilterDataResponse> {
    return this.filterService.getFiltersData(channeid, ids, page);
  }

  /**
   * 模糊搜索
   * @param keyword 搜索关键词
   * @param channeid 可选，频道ID，不传则搜索全部
   * @param page 页码
   * @param size 每页大小
   * @returns 模糊搜索结果
   */
  async fuzzySearch(
    keyword: string,
    channeid?: string,
    page: number = 1,
    size: number = 20
  ): Promise<any> {
    return this.filterService.fuzzySearch(keyword, channeid, page, size);
  }

  /**
   * 获取条件筛选数据
   * @param dto 筛选条件
   * @returns 筛选后的视频列表
   */
  async getConditionFilterData(dto: ConditionFilterDto): Promise<ConditionFilterResponse> {
    try {
      // 将 titleid 转换为实际的 category_id
      const categoryMap: Record<string, string> = {
        'drama': 'drama',     // 短剧
        'movie': 'movie',     // 电影
        'variety': 'variety', // 综艺
        'home': 'drama'       // 首页默认为短剧
      };
      
      const categoryId = categoryMap[dto.titleid || 'drama'] || 'movie';
      const ids = dto.ids || '0,0,0,0,0';
      const pageNum = dto.page || 1;
      const pageSize = dto.size || 21;
      const offset = (pageNum - 1) * pageSize;
      
      // 解析筛选条件
      const filterIds = this.parseFilterIds(ids);
      
      // 构建查询
      const queryBuilder = this.seriesRepo.createQueryBuilder('series')
        .leftJoinAndSelect('series.category', 'category')
        .leftJoinAndSelect('series.episodes', 'episodes')
        .where('category.category_id = :categoryId', { categoryId });
      
      // 应用排序
      this.applySorting(queryBuilder, filterIds.sortType);
      
      // 分页
      const [series, total] = await queryBuilder
        .skip(offset)
        .take(pageSize)
        .getManyAndCount();
      
      // 转换为响应格式
      const items = series.map((s) => ({
        id: s.id,
        shortId: s.shortId || '',
        coverUrl: s.coverUrl || '',
        title: s.title,
        description: s.description || '',
        score: s.score?.toString() || '0.0',
        playCount: s.playCount || 0,
        totalEpisodes: s.totalEpisodes || 0,
        isSerial: (s.episodes && s.episodes.length > 1) || false,
        upStatus: s.upStatus || '已完结',
        upCount: s.upCount || 0,
        status: s.status || 'on-going',
        starring: s.starring || '',
        actor: s.actor || '',
        director: s.director || '',
        region: s.region || '',
        language: s.language || '',
        releaseDate: s.releaseDate ? (s.releaseDate instanceof Date ? s.releaseDate.toISOString() : new Date(s.releaseDate).toISOString()) : undefined,
        isCompleted: s.isCompleted || false,
        cidMapper: s.category?.id?.toString() || '0',
        categoryName: s.category?.name || '',
        isRecommend: false,
        duration: '未知',
        createdAt: s.createdAt?.toISOString() || new Date().toISOString(),
        updateTime: s.updatedAt?.toISOString() || new Date().toISOString(),
        episodeCount: s.episodes?.length || 0,
        tags: []
      }));
      
      const response: ConditionFilterResponse = {
        code: 200,
        data: {
          list: items,
          total,
          page: pageNum,
          size: pageSize,
          hasMore: total > pageNum * pageSize
        },
        msg: null
      };
      
      return response;
    } catch (error) {
      console.error('获取条件筛选数据失败:', error);
      return {
        code: 500,
        data: {
          list: [],
          total: 0,
          page: dto.page || 1,
          size: dto.size || 21,
          hasMore: false
        },
        msg: '获取数据失败'
      };
    }
  }
  
  /**
   * 解析筛选条件ID字符串
   */
  private parseFilterIds(ids: string): {
    sortType: number;
    categoryId: number;
    regionId: number;
    languageId: number;
    yearId: number;
    statusId: number;
  } {
    const parts = ids.split(',').map(id => parseInt(id) || 0);
    
    return {
      sortType: parts[0] || 0,
      categoryId: parts[1] || 0,
      regionId: parts[2] || 0,
      languageId: parts[3] || 0,
      yearId: parts[4] || 0,
      statusId: parts[5] || 0,
    };
  }
  
  /**
   * 应用排序条件
   */
  private applySorting(queryBuilder: any, sortType: number): void {
    switch (sortType) {
      case 1: // 最新
        queryBuilder.orderBy('series.createdAt', 'DESC');
        break;
      case 2: // 人气
        queryBuilder.orderBy('series.playCount', 'DESC');
        break;
      case 3: // 评分
        queryBuilder.orderBy('series.score', 'DESC');
        break;
      case 4: // 最近更新
        queryBuilder.orderBy('series.updatedAt', 'DESC');
        break;
      default:
        queryBuilder.orderBy('series.createdAt', 'DESC');
    }
  }

  async createFilterOption(data: any) {
    await Promise.resolve();
    console.log('Creating filter option:', data);
    return { success: true, data };
  }

  async updateFilterOption(id: number, data: any) {
    await Promise.resolve();
    console.log('Updating filter option:', id, data);
    return { success: true, id, data };
  }

  async deleteFilterOption(id: number) {
    await Promise.resolve();
    console.log('Deleting filter option:', id);
    return { success: true, id };
  }

  async batchCreateFilterOptions(options: any[]) {
    await Promise.resolve();
    console.log('Batch creating filter options:', options);
    return { success: true, count: options.length };
  }

  /**
   * 获取剧集列表
   * 
   * @param seriesIdentifier 剧集标识符（ShortID或ID）
   * @param isShortId 是否为ShortID
   * @param page 页码
   * @param size 每页数量
   * @param userId 用户ID（可选，用于记录浏览历史）
   * @param req 请求对象（可选，用于获取用户代理和IP地址）
   * @returns 剧集列表
   */
  async getEpisodeList(
    seriesIdentifier?: string,
    isShortId: boolean = false,
    page: number = 1,
    size: number = 20,
    userId?: number,
    req?: any
  ): Promise<EpisodeListResponse> {
    try {
      const offset = (page - 1) * size;
      
      let queryBuilder = this.epRepo.createQueryBuilder('episode')
        .leftJoinAndSelect('episode.series', 'series')
        .orderBy('episode.episodeNumber', 'ASC');
      
      // 如果提供了剧集标识符，则按剧集筛选
      if (seriesIdentifier) {
        if (isShortId) {
          queryBuilder = queryBuilder.where('series.shortId = :seriesShortId', { seriesShortId: seriesIdentifier });
        } else {
          const seriesId = parseInt(seriesIdentifier, 10);
          queryBuilder = queryBuilder.where('series.id = :seriesId', { seriesId });
        }
      }
      
      // 分页查询
      const [episodes, total] = await queryBuilder
        .skip(offset)
        .take(size)
        .getManyAndCount();
      
      // 获取系列信息（从第一集获取）
      let seriesInfo: any = null;
      if (episodes.length > 0 && episodes[0].series) {
        const series = episodes[0].series;
        seriesInfo = {
          starring: series.starring || '',
          id: series.id,
          channeName: series.category?.name || '',
          channeID: series.categoryId || 0,
          title: series.title,
          coverUrl: series.coverUrl || '',
          mediaUrl: '', // 默认空字符串
          fileName: `series-${series.id}`, // 根据ID生成文件名
          mediaId: `${series.id}_0,1,4,146`, // 根据ID生成媒体ID
          postTime: series.releaseDate?.toISOString() || series.createdAt?.toISOString() || new Date().toISOString(),
          contentType: series.category?.name || '电视剧',
          actor: series.actor || '',
          shareCount: 0, // 默认值
          director: series.director || '',
          description: series.description || '',
          comments: 0, // 默认值
          updateStatus: series.upStatus || '',
          watch_progress: 0, // 默认值
          playCount: series.playCount || 0,
          isHot: series.score > 8.5, // 根据评分判断是否热门
          isVip: false // 默认值
        };
      }
      
      // 获取用户播放进度信息（如果有用户ID）
      let userProgress: any = null;
      let episodeProgressMap = new Map<number, any>();
      
      if (userId && episodes.length > 0) {
        const seriesId = episodes[0].series?.id;
        if (seriesId) {
          try {
            // 获取用户在该系列下的所有播放进度
            const episodeIds = episodes.map(ep => ep.id);
            const progressList = await this.watchProgressService.getUserWatchProgressByEpisodeIds(userId, episodeIds);
            
            // 构建剧集进度映射
            progressList.forEach(progress => {
              episodeProgressMap.set(progress.episodeId, progress);
            });
            
            // 获取用户在该系列下的总体播放进度
            const seriesProgress = await this.getUserSeriesProgress(userId, seriesId);
            if (seriesProgress) {
              userProgress = {
                currentEpisode: seriesProgress.currentEpisode,
                currentEpisodeShortId: seriesProgress.currentEpisodeShortId,
                watchProgress: seriesProgress.watchProgress,
                watchPercentage: seriesProgress.watchPercentage,
                totalWatchTime: seriesProgress.totalWatchTime,
                lastWatchTime: seriesProgress.lastWatchTime,
                isCompleted: seriesProgress.isCompleted
              };
            }
          } catch (error) {
            console.error('获取用户播放进度失败:', error);
          }
        }
      }
      
      // 转换为响应格式
      const episodeList: EpisodeBasicInfo[] = episodes.map((ep) => {
        const progress = episodeProgressMap.get(ep.id);
        const watchProgress = progress?.stopAtSecond || 0;
        const duration = ep.duration || 0;
        const watchPercentage = duration > 0 ? Math.round((watchProgress / duration) * 100) : 0;
        
        return {
          id: ep.id,
          shortId: ep.shortId,
          episodeNumber: ep.episodeNumber,
          title: ep.title || `第${ep.episodeNumber}集`,
          duration: duration,
          status: ep.status || 'active',
          createdAt: ep.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: ep.updatedAt?.toISOString() || new Date().toISOString(),
          seriesId: ep.series?.id || 0,
          seriesTitle: ep.series?.title || '',
          seriesShortId: ep.series?.shortId || '',
          // 播放进度相关字段（仅在有用户token时返回）
          watchProgress: watchProgress,
          watchPercentage: watchPercentage,
          isWatched: watchPercentage >= 90, // 观看90%以上认为已观看
          lastWatchTime: progress?.updatedAt?.toISOString() || null
        };
      });

      // 记录用户浏览历史（如果有用户ID）
      if (userId && episodes.length > 0) {
        const seriesId = episodes[0].series?.id;
        if (seriesId) {
          // 获取最后访问的集数（取第一页的最后一集）
          const lastEpisodeNumber = episodeList[episodeList.length - 1]?.episodeNumber;
          
          // 异步记录浏览历史，不阻塞主要业务逻辑
          this.browseHistoryService.recordBrowseHistory(
            userId,
            seriesId,
            'episode_list',
            lastEpisodeNumber,
            req
          ).catch(error => {
            console.error('记录浏览历史失败:', error);
          });
        }
      }
      
      return {
        code: 200,
        data: {
          seriesInfo,
          userProgress,
          list: episodeList,
          total,
          page,
          size,
          hasMore: total > page * size
        },
        msg: null
      };
    } catch (error) {
      console.error('获取剧集列表失败:', error);
      return {
        code: 500,
        data: {
          seriesInfo: null,
          userProgress: null,
          list: [],
          total: 0,
          page,
          size,
          hasMore: false
        },
        msg: '获取剧集列表失败'
      };
    }
  }
}