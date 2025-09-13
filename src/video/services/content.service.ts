import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Series } from '../entity/series.entity';
import { Episode } from '../entity/episode.entity';
import { EpisodeUrl } from '../entity/episode-url.entity';
import { Category } from '../entity/category.entity';
import { WatchProgressService } from './watch-progress.service';
import { BrowseHistoryService } from './browse-history.service';
import { CacheKeys } from '../utils/cache-keys.util';
import { EpisodeListResponse, SeriesBasicInfo, UserWatchProgress } from '../dto/episode-list.dto';

/**
 * 内容服务
 * 专门处理内容管理相关的业务逻辑
 */
@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(Series)
    private readonly seriesRepo: Repository<Series>,
    @InjectRepository(Episode)
    private readonly episodeRepo: Repository<Episode>,
    @InjectRepository(EpisodeUrl)
    private readonly episodeUrlRepo: Repository<EpisodeUrl>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    private readonly watchProgressService: WatchProgressService,
    private readonly browseHistoryService: BrowseHistoryService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  /**
   * 获取剧集列表
   * @param seriesIdentifier 系列标识符（ID或ShortID）
   * @param isShortId 是否为ShortID
   * @param page 页码
   * @param size 每页大小
   * @param userId 用户ID（可选）
   * @param req 请求对象（可选）
   */
  async getEpisodeList(
    seriesIdentifier?: string,
    isShortId: boolean = false,
    page: number = 1,
    size: number = 20,
    userId?: number,
    req?: any
  ): Promise<EpisodeListResponse> {
    
    // 构建缓存键
    const idType = isShortId ? 'shortId' : 'id';
    const cacheKey = CacheKeys.episodeList(seriesIdentifier || 'all', idType, page, size, userId);
    
    // 尝试从缓存获取
    const cached = await this.cacheManager.get<EpisodeListResponse>(cacheKey);
    if (cached) {
      console.log(`💾 剧集列表缓存命中: ${cacheKey}`);
      return cached;
    }

    try {
      let series: Series | null = null;
      let episodes: Episode[] = [];
      let total = 0;

      // 查询条件构建
      const queryBuilder = this.episodeRepo.createQueryBuilder('episode')
        .leftJoinAndSelect('episode.series', 'series')
        .leftJoinAndSelect('series.category', 'category')
        .leftJoinAndSelect('episode.urls', 'urls')
        .where('episode.status != :status', { status: 'deleted' })
        .orderBy('episode.episodeNumber', 'ASC');

      if (seriesIdentifier) {
        if (isShortId) {
          queryBuilder.andWhere('series.shortId = :shortId', { shortId: seriesIdentifier });
        } else {
          queryBuilder.andWhere('series.id = :id', { id: parseInt(seriesIdentifier) });
        }
      }

      // 分页处理
      const offset = (page - 1) * size;
      const [episodeResults, totalCount] = await queryBuilder
        .skip(offset)
        .take(size)
        .getManyAndCount();

      episodes = episodeResults;
      total = totalCount;
      
      if (episodes.length > 0) {
        series = episodes[0].series;
      }

      // 获取系列基本信息
      let seriesInfo: SeriesBasicInfo | null = null;
      if (series) {
        // 获取系列标签
        const seriesTags = await this.getSeriesTags(series);

        seriesInfo = {
          starring: series.starring || '',
          id: series.id,
          channeName: series.category?.name || '',
          channeID: series.categoryId || 0,
          title: series.title,
          coverUrl: series.coverUrl || '',
          mediaUrl: '',
          fileName: '',
          mediaId: '',
          postTime: series.createdAt.toISOString(),
          contentType: series.category?.name || '',
          actor: series.actor || '',
          shareCount: 0,
          director: series.director || '',
          description: series.description || '',
          comments: 0,
          updateStatus: series.upStatus || '',
          watch_progress: 0,
          playCount: series.playCount || 0,
          isHot: false,
          isVip: false,
          tags: seriesTags
        };
      }

      // 获取用户播放进度
      let userProgress: UserWatchProgress | null = null;
      if (userId && series) {
        userProgress = await this.getUserSeriesProgress(userId, series.id);
      } else {
        // 默认用户进度
        userProgress = {
          currentEpisode: 1,
          currentEpisodeShortId: episodes.length > 0 ? episodes[0].shortId : '',
          watchProgress: 0,
          watchPercentage: 0,
          totalWatchTime: 0,
          lastWatchTime: new Date().toISOString(),
          isCompleted: false
        };
      }

      // 获取系列标签
      let tags: string[] = [];
      if (series) {
        tags = await this.getSeriesTags(series);
      }

      // 获取用户对所有剧集的观看进度（批量查询）
      const episodeProgressMap: Record<number, any> = {};
      if (userId && episodes.length > 0) {
        const episodeIds = episodes.map(ep => ep.id);
        const progressList = await this.watchProgressService.getUserWatchProgressByEpisodeIds(userId, episodeIds);

        progressList.forEach(progress => {
          const episode = episodes.find(ep => ep.id === progress.episodeId);
          if (episode) {
            let watchPercentage = 0;
            if (episode.duration > 0) {
              watchPercentage = Math.round((progress.stopAtSecond / episode.duration) * 100);
            }
            const isWatched = watchPercentage >= 90; // 90%以上算已观看

            episodeProgressMap[progress.episodeId] = {
              watchProgress: progress.stopAtSecond,
              watchPercentage,
              isWatched,
              lastWatchTime: progress.updatedAt.toISOString()
            };
          }
        });
      }

      // 构建剧集列表
      const episodeList = episodes.map(ep => {
        const progress = episodeProgressMap[ep.id] || {
          watchProgress: 0,
          watchPercentage: 0,
          isWatched: false,
          lastWatchTime: ''
        };

        return {
          id: ep.id,
          shortId: ep.shortId,
          episodeNumber: ep.episodeNumber,
          episodeTitle: String(ep.episodeNumber).padStart(2, '0'),
          title: ep.title,
          duration: ep.duration,
          status: ep.status,
          createdAt: ep.createdAt.toISOString(),
          updatedAt: ep.updatedAt.toISOString(),
          seriesId: ep.seriesId,
          seriesTitle: ep.series?.title || '',
          seriesShortId: ep.series?.shortId || '',
          likeCount: ep.likeCount || 0,
          dislikeCount: ep.dislikeCount || 0,
          favoriteCount: ep.favoriteCount || 0,
          watchProgress: progress.watchProgress,
          watchPercentage: progress.watchPercentage,
          isWatched: progress.isWatched,
          lastWatchTime: progress.lastWatchTime,
          episodeAccessKey: ep.accessKey,
          urls: ep.urls?.map(url => ({
            quality: url.quality,
            accessKey: url.accessKey
          })) || [],
        };
      });

      // 记录用户浏览历史（如果有用户ID）
      if (userId && episodes.length > 0) {
        const seriesId = episodes[0].series?.id;
        if (seriesId) {
          const lastEpisodeNumber = episodeList[episodeList.length - 1]?.episodeNumber;
          
          // 注意：现在只记录 episode_watch 类型，浏览剧集列表不再记录
          // this.browseHistoryService.recordBrowseHistory(
          //   userId,
          //   seriesId,
          //   'episode_list',
          //   lastEpisodeNumber,
          //   req
          // ).catch(error => {
          //   console.error('记录浏览历史失败:', error);
          // });
        }
      }
      
      const response = {
        code: 200,
        data: {
          seriesInfo,
          userProgress,
          list: episodeList,
          total,
          page,
          size,
          hasMore: total > page * size,
          tags: tags || [],
          currentEpisode: userProgress ? String(userProgress.currentEpisode).padStart(2, '0') : '01'
        },
        msg: null
      };
      
      // 缓存结果
      const cacheTTL = userId ? 300 : 1800; // 用户相关数据缓存5分钟，公开数据缓存30分钟
      await this.cacheManager.set(cacheKey, response, cacheTTL);
      console.log(`💾 剧集列表已缓存: ${cacheKey}, TTL: ${cacheTTL}s`);
      
      return response;
    } catch (error) {
      console.error('获取剧集列表失败:', error);
      throw new Error('获取剧集列表失败');
    }
  }

  /**
   * 通过ShortID获取剧集
   * @param shortId 剧集ShortID
   */
  async getEpisodeByShortId(shortId: string): Promise<Episode | null> {
    try {
      return await this.episodeRepo.findOne({
        where: { shortId },
        relations: ['series']
      });
    } catch (error) {
      console.error('通过ShortID获取剧集失败:', error);
      return null;
    }
  }

  /**
   * 获取系列详情
   * @param id 系列ID
   */
  async getSeriesDetail(id: number) {
    const cacheKey = CacheKeys.seriesDetail(id);
    
    // 尝试从缓存获取
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      console.log(`💾 系列详情缓存命中: ${cacheKey}`);
      return cached;
    }

    try {
      const series = await this.seriesRepo.findOne({
        where: { id },
        relations: ['category', 'episodes']
      });

      if (!series) {
        throw new BadRequestException('系列不存在');
      }

      const result = {
        code: 200,
        data: {
          id: series.id,
          shortId: series.shortId,
          title: series.title,
          description: series.description,
          coverUrl: series.coverUrl,
          categoryId: series.categoryId,
          categoryName: series.category?.name || '',
          episodeCount: series.episodes?.length || 0,
          totalEpisodes: series.totalEpisodes,
          status: series.upStatus || (series.statusOption?.name || ''),
          upStatus: series.upStatus,
          score: series.score,
          playCount: series.playCount,
          starring: series.starring,
          actor: series.actor,
          director: series.director,
          releaseDate: series.releaseDate,
          isCompleted: series.isCompleted,
          createdAt: series.createdAt.toISOString()
        },
        msg: null
      };

      // 缓存结果（15分钟）
      await this.cacheManager.set(cacheKey, result, 900000);
      console.log(`💾 系列详情已缓存: ${cacheKey}`);
      
      return result;
    } catch (error) {
      console.error('获取系列详情失败:', error);
      throw error;
    }
  }

  /**
   * 获取系列标签（优先题材，然后其他维度）
   * @param series 系列实体
   */
  private async getSeriesTags(series: Series): Promise<string[]> {
    const tags: string[] = [];
    
    try {
      // 优先添加题材标签（从中间表获取）
      const genreTags = await this.seriesRepo
        .createQueryBuilder('s')
        .leftJoin('series_genre_options', 'sgo', 'sgo.series_id = s.id')
        .leftJoin('filter_options', 'fo', 'fo.id = sgo.option_id')
        .select('fo.name', 'name')
        .where('s.id = :seriesId', { seriesId: series.id })
        .andWhere('fo.filter_type_id = 2')
        .andWhere('fo.is_active = 1')
        .orderBy('fo.display_order', 'ASC')
        .getRawMany();
      
      genreTags.forEach(tag => {
        if (tag.name) tags.push(tag.name);
      });
      
      // 添加地区标签
      if (series.regionOption?.name) {
        tags.push(series.regionOption.name);
      }
      
      // 添加语言标签
      if (series.languageOption?.name) {
        tags.push(series.languageOption.name);
      }
      
      // 添加年份标签
      if (series.yearOption?.name) {
        tags.push(series.yearOption.name);
      }
      
      // 添加状态标签
      if (series.statusOption?.name) {
        tags.push(series.statusOption.name);
      }
      
    } catch (error) {
      console.error('获取系列标签失败:', error);
    }
    
    return tags;
  }

  /**
   * 清理进度相关缓存
   * @param episodeId 剧集ID
   */
  private async clearProgressRelatedCache(episodeId: number): Promise<void> {
    try {
      const episode = await this.episodeRepo.findOne({
        where: { id: episodeId },
        relations: ['series']
      });
      
      if (episode && episode.series) {
        const seriesId = episode.series.id;
        const seriesShortId = episode.series.shortId;
        
        const patterns = [
          `episode_list:${seriesId}:*`,
          `episode_list:${seriesShortId}:*`,
        ];
        
        for (const pattern of patterns) {
          await this.cacheManager.del(pattern);
        }
        
        console.log(`🧹 清理内容相关缓存: episodeId=${episodeId}, seriesId=${seriesId}`);
      }
    } catch (error) {
      console.error('清理内容相关缓存失败:', error);
    }
  }

  /**
   * 获取用户在某个系列下的总体播放进度（从PlaybackService调用）
   */
  private async getUserSeriesProgress(userId: number, seriesId: number): Promise<UserWatchProgress | null> {
    try {
      const episodes = await this.episodeRepo.find({
        where: { series: { id: seriesId } },
        order: { episodeNumber: 'ASC' },
        relations: ['series']
      });

      if (episodes.length === 0) {
        return null;
      }

      const episodeIds = episodes.map(ep => ep.id);
      const progressList = await this.watchProgressService.getUserWatchProgressByEpisodeIds(userId, episodeIds);
      
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
          
          if (progress.updatedAt > lastWatchTime) {
            lastWatchTime = progress.updatedAt;
            currentEpisode = episode.episodeNumber;
            currentEpisodeShortId = episode.shortId;
            watchProgress = progress.stopAtSecond;
            
            if (episode.duration > 0) {
              watchPercentage = Math.round((progress.stopAtSecond / episode.duration) * 100);
            }
          }
          
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
        isCompleted: completedEpisodes === episodes.length && episodes.length > 0
      };
    } catch (error) {
      console.error('获取用户系列播放进度失败:', error);
      return null;
    }
  }
}
