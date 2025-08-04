import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Category } from './entity/category.entity';
import { Series } from './entity/series.entity';
import { Episode } from './entity/episode.entity';
import { ShortVideo } from "./entity/short-video.entity";
import { FilterType } from './entity/filter-type.entity';
import { FilterOption } from './entity/filter-option.entity';
import { ContentBlock, BannerItem, FilterItem, VideoItem } from './dto/home-videos.dto';
import { FilterTagsResponse, FilterTagGroup, FilterTagItem } from './dto/filter-tags.dto';
import { FilterDataResponse, FilterDataItem } from './dto/filter-data.dto';
import { VideoDetailsResponse, VideoDetailInfo, EpisodeInfo, InteractionInfo, LanguageInfo } from './dto/video-details.dto';
import { WatchProgressService } from './services/watch-progress.service';
import { CommentService } from './services/comment.service';
import { EpisodeService } from './services/episode.service';
import { CategoryService } from './services/category.service';

import { FilterService } from './services/filter.service';
import { SeriesService } from './services/series.service';
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

  async getProgress(userId: number, episodeId: number) {
    const progressList = await this.watchProgressService.getUserWatchProgress(userId, episodeId);
    const progress = progressList.length > 0 ? progressList[0] : null;
    return { stopAtSecond: progress?.stopAtSecond || 0 };
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
   * 获取首页视频列表
   * @param catid 频道唯一标识
   * @param page 页数
   * @returns 首页视频列表数据
   */
  async getHomeVideos(catid?: string, page: number = 1): Promise<any> {
    const categoryId = catid ? parseInt(catid, 10) : undefined;
    const size = 20;
    
    // 生成缓存键
    const cacheKey = `home_videos_${catid || 'all'}_${page}`;
    
    // 尝试从缓存获取数据
    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    // 构建响应数据结构
    const blocks: ContentBlock[] = [];
    
    // 1. 添加轮播图板块
    const banners = await this.getTopSeries(5);
    blocks.push({
      type: 0,
      name: "轮播图",
      filters: [],
      banners: banners.map(series => ({
        showURL: series.coverUrl,
        title: series.title,
        id: series.id,
        channeID: series.category?.id || 1,
        url: series.id.toString(),
      })),
      list: [],
    });
    
    // 2. 添加搜索过滤器板块
    const categories = await this.catRepo.find({ order: { id: 'ASC' } });
    blocks.push({
      type: 1001,
      name: "搜索过滤器",
      filters: [
        {
          channeID: 1,
          name: "短剧",
          title: "全部",
          ids: "0,0,0,0,0",
        },
        {
          channeID: 1,
          name: "短剧",
          title: "最新上传",
          ids: "0,0,0,0,0",
        },
        {
          channeID: 1,
          name: "短剧",
          title: "人气高",
          ids: "1,0,0,0,0",
        },
        {
          channeID: 1,
          name: "短剧",
          title: "评分高",
          ids: "2,0,0,0,0",
        },
        {
          channeID: 1,
          name: "短剧",
          title: "最新更新",
          ids: "3,0,0,0,0",
        },
      ],
      banners: [],
      list: [],
    });
    
    // 3. 添加广告板块（示例）
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
      name: "电影",
      filters: undefined,
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
    
    // 构建响应数据结构
    const blocks: ContentBlock[] = [];
    
    // 1. 添加轮播图板块
    const banners = await this.getTopSeries(5);
    blocks.push({
      type: 0,
      name: "轮播图",
      filters: [],
      banners: banners.map(series => ({
        showURL: series.coverUrl,
        title: series.title,
        id: series.id,
        channeID: categoryId,
        url: series.id.toString(),
      })),
      list: [],
    });
    
    // 2. 添加搜索过滤器板块
    const moduleNames = {
      movie: '电影',
      drama: '短剧',
      variety: '综艺'
    };
    
    blocks.push({
      type: 1001,
      name: "搜索过滤器",
      filters: [
        {
          channeID: categoryId,
          name: moduleNames[moduleType],
          title: "全部",
          ids: "0,0,0,0,0",
        },
        {
          channeID: categoryId,
          name: moduleNames[moduleType],
          title: "最新上传",
          ids: "0,0,0,0,0",
        },
        {
          channeID: categoryId,
          name: moduleNames[moduleType],
          title: "人气高",
          ids: "1,0,0,0,0",
        },
        {
          channeID: categoryId,
          name: moduleNames[moduleType],
          title: "评分高",
          ids: "2,0,0,0,0",
        },
        {
          channeID: categoryId,
          name: moduleNames[moduleType],
          title: "最新更新",
          ids: "3,0,0,0,0",
        },
      ],
      banners: [],
      list: [],
    });
    
    // 3. 添加广告板块（示例）
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
      name: moduleNames[moduleType],
      filters: undefined,
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
   * @returns 热门系列列表
   */
  private async getTopSeries(limit: number = 5) {
    return this.seriesRepo.find({
      relations: ['category'],
      order: {
        playCount: 'DESC',
        score: 'DESC',
      },
      take: limit,
    });
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
    const seriesItems: VideoItem[] = series.map(s => ({
      id: s.id,
      coverUrl: s.coverUrl,
      title: s.title,
      score: s.score?.toString() || "0.0",
      playCount: s.playCount || 0,
      url: s.id.toString(),
      type: s.category?.name || "剧情",
      isSerial: true,
      upStatus: s.upStatus || (s.totalEpisodes ? `更新到${s.totalEpisodes}集` : "全集"),
      upCount: s.upCount || 0,
    }));
    
    const shortItems: VideoItem[] = shorts.map(sv => ({
      id: sv.id,
      coverUrl: sv.coverUrl,
      title: sv.title,
      score: "0.0",
      playCount: sv.playCount || 0,
      url: sv.id.toString(),
      type: sv.category?.name || "短视频",
      isSerial: false,
      upStatus: "全集",
      upCount: 0,
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
   * 获取筛选器数据
   * @param channeid 频道ID
   * @param ids 筛选标识
   * @param page 页码
   * @returns 筛选后的视频列表
   */
  async getFiltersData(channeid: string, ids: string, page: string): Promise<FilterDataResponse> {
    return this.filterService.getFiltersData(channeid, ids, page);
  }

  /* 创建筛选器选项 */
  async createFilterOption(data: any) {
    // 委托给FilterService处理
    throw new Error('此功能已迁移到FilterService，请直接使用FilterService');
  }

  /* 更新筛选器选项 */
  async updateFilterOption(id: number, data: any) {
    // 委托给FilterService处理
    throw new Error('此功能已迁移到FilterService，请直接使用FilterService');
  }

  /* 删除筛选器选项 */
  async deleteFilterOption(id: number) {
    // 委托给FilterService处理
    throw new Error('此功能已迁移到FilterService，请直接使用FilterService');
  }

  /* 批量创建筛选器选项 */
  async batchCreateFilterOptions(options: any[]) {
    // 委托给FilterService处理
    throw new Error('此功能已迁移到FilterService，请直接使用FilterService');
  }

  /**
   * 获取视频详情
   * @param id 视频ID
   * @returns 视频详情信息
   */
  async getVideoDetails(id: string): Promise<VideoDetailsResponse> {
    const videoId = parseInt(id, 10);
    
    const cacheKey = `video_details_${id}`;
    
    // 尝试从缓存获取数据
    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData) {
      return cachedData as VideoDetailsResponse;
    }
    
    // 先尝试从系列中查找
    const series = await this.seriesRepo.findOne({
      where: { id: videoId },
      relations: ['category', 'episodes', 'episodes.urls']
    });
    
    if (series) {
      // 构建剧集信息
      const episodes: EpisodeInfo[] = series.episodes.map(ep => ({
        channeID: series.category?.id || 1,
        episodeId: ep.id,
        title: series.title,
        resolutionDes: "576P",
        resolution: "576",
        isVip: false,
        isLast: ep.episodeNumber === series.totalEpisodes,
        episodeTitle: ep.episodeNumber.toString().padStart(2, '0'),
        opSecond: 37, // 默认开头广告时长
        epSecond: ep.duration || 1086 // 默认时长
      }));
      
      const detailInfo: VideoDetailInfo = {
         starring: series.starring || "",
         id: series.id,
         channeName: series.category?.name || "电视剧",
         channeID: series.category?.id || 1,
         title: series.title,
         coverUrl: series.coverUrl,
         mediaUrl: "",
         fileName: `series-${series.id}`,
         mediaId: `${series.id}_0,1,4,146`,
         postTime: series.createdAt.toISOString(),
         contentType: series.category?.name || "剧情",
         actor: series.actor || "",
         shareCount: 0,
         director: series.director || "",
        description: series.description,
        comments: 0, // TODO: 从评论表统计
        updateStatus: series.upStatus || `更新到${series.totalEpisodes}集`,
        watch_progress: 0, // TODO: 根据用户ID获取观看进度
        playCount: series.playCount || 0,
        isHot: series.playCount > 50000,
        isVip: false,
        episodes: episodes,
        score: series.score?.toString() || "",
        adGold: 20,
        cidMapper: series.category?.name || "短剧·剧情",
        regional: "大陆",
        playRecordUrl: `https://w.anygate.vip/api/Counter/PlusOne?key=AddHitToMovie&id=${series.id}&cid=0,1,4,146&uid=0&title=${encodeURIComponent(series.title)}&imgpath=${encodeURIComponent(series.coverUrl)}`,
        labels: [],
        isShow: true,
        charge: 0,
        isLive: false,
        serialCount: series.totalEpisodes || 0
      };
      
      const result = {
        code: 200,
        data: {
          detailInfo,
          userInfo: {},
          adsPlayer: {},
          adsSuspension: {},
          focusStatus: false,
          isBlackList: false,
          like: { count: 0, selected: false },
          disLike: { count: 0, selected: false },
          favorites: { count: 0, selected: false },
          languageList: [{ name: "国语" }],
          skipadshow: false
        },
        msg: "1"
      };
      
      // 将结果存入缓存，缓存10分钟
      await this.cacheManager.set(cacheKey, result, 600000);
      
      return result;
    }
    
    // 如果不是系列，尝试从短视频中查找
    const shortVideo = await this.shortRepo.findOne({
      where: { id: videoId },
      relations: ['category']
    });
    
    if (shortVideo) {
      const detailInfo: VideoDetailInfo = {
        starring: "",
        id: shortVideo.id,
        channeName: shortVideo.category?.name || "短视频",
        channeID: shortVideo.category?.id || 1,
        title: shortVideo.title,
        coverUrl: shortVideo.coverUrl,
        mediaUrl: shortVideo.videoUrl,
        fileName: `short-${shortVideo.id}`,
        mediaId: `${shortVideo.id}_0,1,4,146`,
        postTime: shortVideo.createdAt.toISOString(),
        contentType: shortVideo.category?.name || "短视频",
        actor: "",
        shareCount: 0,
        director: "",
        description: shortVideo.description,
        comments: 0,
        updateStatus: "全集",
        watch_progress: 0,
        playCount: shortVideo.playCount || 0,
        isHot: shortVideo.playCount > 10000,
        isVip: false,
        episodes: [{
          channeID: shortVideo.category?.id || 1,
          episodeId: shortVideo.id,
          title: shortVideo.title,
          resolutionDes: "576P",
          resolution: "576",
          isVip: false,
          isLast: true,
          episodeTitle: "01",
          opSecond: 0,
          epSecond: shortVideo.duration || 300
        }],
        score: "",
        adGold: 20,
        cidMapper: shortVideo.category?.name || "短视频",
        regional: "大陆",
        playRecordUrl: `https://w.anygate.vip/api/Counter/PlusOne?key=AddHitToMovie&id=${shortVideo.id}&cid=0,1,4,146&uid=0&title=${encodeURIComponent(shortVideo.title)}&imgpath=${encodeURIComponent(shortVideo.coverUrl)}`,
        labels: [],
        isShow: true,
        charge: 0,
        isLive: false,
        serialCount: 1
      };
      
      const result = {
        code: 200,
        data: {
          detailInfo,
          userInfo: {},
          adsPlayer: {},
          adsSuspension: {},
          focusStatus: false,
          isBlackList: false,
          like: { count: shortVideo.likeCount || 0, selected: false },
          disLike: { count: 0, selected: false },
          favorites: { count: 0, selected: false },
          languageList: [{ name: "国语" }],
          skipadshow: false
        },
        msg: "1"
      };
      
      // 将结果存入缓存，缓存10分钟
      await this.cacheManager.set(cacheKey, result, 600000);
      
      return result;
    }
    
    // 如果都找不到，返回错误
    throw new Error('视频不存在');
  }
}