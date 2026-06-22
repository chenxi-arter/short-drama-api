/**
 * 内容查询服务 - 系列详情/剧集信息/关联数据
 */
import { Injectable, Inject, BadRequestException, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { DateUtil } from '../../common/utils/date.util';
import { Series } from '../entity/series.entity';
import { Episode } from '../entity/episode.entity';
import { EpisodeUrl } from '../entity/episode-url.entity';
import { Category } from '../entity/category.entity';
import { WatchProgressService } from './watch-progress.service';
import { EpisodeInteractionService } from './episode-interaction.service';
import { FavoriteService } from '../../user/services/favorite.service';
import { CommentService } from './comment.service';
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
    private readonly episodeInteractionService: EpisodeInteractionService,
    @Inject(forwardRef(() => FavoriteService))
    private readonly favoriteService: FavoriteService,
    private readonly commentService: CommentService,
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
    userId?: number
  ): Promise<EpisodeListResponse> {
    
    // 构建缓存键
    const idType = isShortId ? 'shortId' : 'id';
    const cacheKey = CacheKeys.episodeList(seriesIdentifier || 'all', idType, page, size, userId);
    
    // 尝试从缓存获取（仅对公开数据生效，用户个性化数据不缓存）
    if (!userId) {
      const cached = await this.cacheManager.get<EpisodeListResponse>(cacheKey);
      if (cached) {
        console.log(`💾 剧集列表缓存命中: ${cacheKey}`);
        return cached;
      }
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
          postTime: DateUtil.formatDateTime(series.createdAt),
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
        
        // ✅ 修复：基于实际观看进度（watch_progress表）计算当前集数
        // 这样可以准确反映用户实际观看到哪一集，而不是仅仅浏览过的集数
        console.log(`[DEBUG] 用户观看进度: currentEpisode=${userProgress?.currentEpisode}, currentEpisodeShortId=${userProgress?.currentEpisodeShortId}`);
      } else {
        // 默认用户进度
        userProgress = {
          currentEpisode: 1,
          currentEpisodeShortId: episodes.length > 0 ? episodes[0].shortId : '',
          watchProgress: 0,
          watchPercentage: 0,
          totalWatchTime: 0,
          lastWatchTime: DateUtil.formatDateTime(new Date()),
          isCompleted: false
        };
      }

      // 获取系列标签
      let tags: string[] = [];
      if (series) {
        tags = await this.getSeriesTags(series);
      }

      // 获取用户对所有剧集的观看进度（批量查询）
      type EpisodeProgressMapValue = {
        watchProgress: number;
        watchPercentage: number;
        isWatched: boolean;
        lastWatchTime: string;
      };
      const episodeProgressMap: Record<number, EpisodeProgressMapValue> = {};
      let latestUpdatedAt: Date = new Date(0);
      if (userId && episodes.length > 0) {
        const episodeIds = episodes.map(ep => ep.id);
        const progressList = await this.watchProgressService.getUserWatchProgressByEpisodeIds(userId, episodeIds);

        progressList.forEach(progress => {
          const episode = episodes.find((ep: Episode) => ep.id === progress.episodeId);
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
              lastWatchTime: DateUtil.formatDateTime(progress.updatedAt)
            };

            if (progress.updatedAt > latestUpdatedAt) {
              latestUpdatedAt = progress.updatedAt;
            }
          }
        });
      }

      // 获取用户交互状态（只在用户登录时查询）
      const userInteractions: Record<number, {
        liked: boolean;
        disliked: boolean;
        favorited: boolean;
      }> = {};

      if (userId && episodes.length > 0) {
        // 批量查询用户的点赞/点踩状态
        const episodeReactionsMap = await this.episodeInteractionService.getUserReactions(
          userId, 
          episodes.map(ep => ep.id)
        );

        // 批量查询用户的收藏状态（收藏是针对系列的）
        const favoritedEpisodesSet = await this.favoriteService.getUserFavoritedEpisodes(
          userId, 
          episodes.map(ep => ep.id),
          episodes.map(ep => ep.seriesId)
        );

        // 组装用户交互状态
        episodes.forEach(ep => {
          const userReaction = episodeReactionsMap.get(ep.id) || null;
          userInteractions[ep.id] = {
            liked: userReaction === 'like',
            disliked: userReaction === 'dislike',
            favorited: favoritedEpisodesSet.has(ep.id),
          };
        });
      }

      // 批量获取评论数（包括假评论）
      const episodeShortIds = episodes.map(ep => ep.shortId);
      const commentCountMap = await this.commentService.getCommentCountsByShortIds(episodeShortIds);

      // 构建剧集列表
      const episodeList = episodes.map((ep: Episode) => {
        const progress: EpisodeProgressMapValue = episodeProgressMap[ep.id] || {
          watchProgress: 0,
          watchPercentage: 0,
          isWatched: false,
          lastWatchTime: ''
        };

        // 基础剧集信息（不含用户状态）
        const baseEpisode = {
          id: ep.id,
          shortId: ep.shortId,
          episodeNumber: ep.episodeNumber,
          episodeTitle: String(ep.episodeNumber).padStart(2, '0'),
          title: ep.title,
          duration: ep.duration,
          status: ep.status,
          isVertical: Boolean(ep.isVertical),
          createdAt: DateUtil.formatDateTime(ep.createdAt),
          updatedAt: DateUtil.formatDateTime(ep.updatedAt),
          seriesId: ep.seriesId,
          seriesTitle: ep.series?.title || '',
          seriesShortId: ep.series?.shortId || '',
          seriesScore: ep.series?.score || 0,
          likeCount: ep.likeCount || 0,
          dislikeCount: ep.dislikeCount || 0,
          favoriteCount: ep.favoriteCount || 0,
          commentCount: commentCountMap.get(ep.shortId) || 0,
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

        // 如果用户已登录，添加用户交互状态
        if (userId && userInteractions[ep.id]) {
          return {
            ...baseEpisode,
            userInteraction: userInteractions[ep.id],
          };
        }

        return baseEpisode;
      });

      // 不再记录 browse_history（播放/浏览相关一律依赖 watch_progress）
      
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
      
      // 仅缓存公开数据；用户个性化数据不缓存，避免 userProgress 过期
      if (!userId) {
        const cacheTTL = 1800; // 公开数据缓存30分钟
        await this.cacheManager.set(cacheKey, response, cacheTTL);
        console.log(`💾 剧集列表已缓存: ${cacheKey}, TTL: ${cacheTTL}s`);
      }
      
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
          createdAt: DateUtil.formatDateTime(series.createdAt)
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
      type RawTag = { name?: string };
      const genreTags: RawTag[] = await this.seriesRepo
        .createQueryBuilder('s')
        .leftJoin('series_genre_options', 'sgo', 'sgo.series_id = s.id')
        .leftJoin('filter_options', 'fo', 'fo.id = sgo.option_id')
        .select('fo.name', 'name')
        .where('s.id = :seriesId', { seriesId: series.id })
        .andWhere('fo.filter_type_id = 2')
        .andWhere('fo.is_active = 1')
        .orderBy('fo.display_order', 'ASC')
        .getRawMany();
      
      genreTags.forEach((tag: RawTag) => {
        if (tag.name) tags.push(tag.name);
      });
      
      // 去重并限制最多5个标签
      const deduped = Array.from(new Set(tags));
      return deduped.slice(0, 5);
    } catch (error) {
      console.error('获取系列标签失败:', error);
    }
    
    // 出错时返回空数组
    return [];
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

      // 忽略极小的“误触发”进度（可通过环境变量调整）
      const MIN_VALID_PROGRESS_SECONDS = Number(process.env.PROGRESS_MIN_SECONDS ?? '2');
      const MIN_VALID_PROGRESS_PERCENT = Number(process.env.PROGRESS_MIN_PERCENT ?? '0.01'); // 1%
      let lastValidWatchTime = new Date(0);
      let validEpisodeNumber = 0;
      let validEpisodeShortId = '';
      let validWatchProgress = 0;
      let validWatchPercentage = 0;

      progressList.forEach(progress => {
        const episode = episodes.find(ep => ep.id === progress.episodeId);
        if (episode) {
          totalWatchTime += progress.stopAtSecond;
          
          // 记录“任意进度”的最新（兜底）
          if (progress.updatedAt > lastWatchTime) {
            lastWatchTime = progress.updatedAt;
            currentEpisode = episode.episodeNumber;
            currentEpisodeShortId = episode.shortId;
            watchProgress = progress.stopAtSecond;
            if (episode.duration > 0) {
              watchPercentage = Math.round((progress.stopAtSecond / episode.duration) * 100);
            }
          }

          // 记录“有效进度”的最新（用于避免被 1 秒等误触发覆盖）
          const meetsSeconds = progress.stopAtSecond >= MIN_VALID_PROGRESS_SECONDS;
          const meetsPercent = episode.duration > 0 && (progress.stopAtSecond / episode.duration) >= MIN_VALID_PROGRESS_PERCENT;
          if (meetsSeconds || meetsPercent) {
            if (progress.updatedAt > lastValidWatchTime) {
              lastValidWatchTime = progress.updatedAt;
              validEpisodeNumber = episode.episodeNumber;
              validEpisodeShortId = episode.shortId;
              validWatchProgress = progress.stopAtSecond;
              if (episode.duration > 0) {
                validWatchPercentage = Math.round((progress.stopAtSecond / episode.duration) * 100);
              }
            }
          }
          
          if (episode.duration > 0 && (progress.stopAtSecond / episode.duration) >= 0.9) {
            completedEpisodes++;
          }
        }
      });

      // 若存在“有效进度”，优先使用有效进度作为当前集，避免被 1 秒更新覆盖
      const useValid = lastValidWatchTime.getTime() > 0;
      return {
        currentEpisode: useValid ? validEpisodeNumber : (currentEpisode > 0 ? currentEpisode : 1),
        currentEpisodeShortId: useValid ? validEpisodeShortId : (currentEpisodeShortId || (episodes.length > 0 ? episodes[0].shortId : '')),
        watchProgress: useValid ? validWatchProgress : watchProgress,
        watchPercentage: useValid ? validWatchPercentage : watchPercentage,
        totalWatchTime,
        lastWatchTime: DateUtil.formatDateTime(useValid ? lastValidWatchTime : (lastWatchTime.getTime() > 0 ? lastWatchTime : new Date())),
        isCompleted: completedEpisodes === episodes.length && episodes.length > 0
      };
    } catch (error) {
      console.error('获取用户系列播放进度失败:', error);
      return null;
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
