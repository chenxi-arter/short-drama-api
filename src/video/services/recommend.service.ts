import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Episode } from '../entity/episode.entity';
import { EpisodeUrl } from '../entity/episode-url.entity';
import { DateUtil } from '../../common/utils/date.util';
import { RecommendEpisodeItem } from '../dto/recommend.dto';
import { EpisodeInteractionService } from './episode-interaction.service';
import { FavoriteService } from '../../user/services/favorite.service';

// 定义查询结果的类型
interface RecommendQueryResult {
  id: number;
  shortId: string;
  episodeNumber: number;
  title: string;
  duration: number;
  status: string;
  isVertical: boolean;
  createdAt: string;
  playCount: number;
  likeCount: number;
  dislikeCount: number;
  favoriteCount: number;
  episodeAccessKey: string;
  seriesId: number;
  seriesShortId: string;
  seriesTitle: string;
  seriesCoverUrl: string;
  seriesDescription: string;
  seriesScore: string;
  seriesStarring: string;
  seriesActor: string;
  seriesUpStatus: string;
  recommendScore: string;
}

/**
 * 推荐服务
 * 实现类似抖音的随机推荐功能
 */
@Injectable()
export class RecommendService {
  constructor(
    @InjectRepository(Episode)
    private readonly episodeRepo: Repository<Episode>,
    @InjectRepository(EpisodeUrl)
    private readonly episodeUrlRepo: Repository<EpisodeUrl>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly episodeInteractionService: EpisodeInteractionService,
    @Inject(forwardRef(() => FavoriteService))
    private readonly favoriteService: FavoriteService,
  ) {}

  /**
   * 获取推荐剧集列表
   * @param page 页码
   * @param size 每页数量
   * @param userId 用户ID（可选，登录用户传入）
   */
  async getRecommendList(
    page: number = 1,
    size: number = 20,
    userId?: number,
  ): Promise<{
    list: RecommendEpisodeItem[];
    page: number;
    size: number;
    hasMore: boolean;
  }> {
    try {
      const offset = (page - 1) * size;
      
      // 生成缓存键（公开数据使用缓存，用户个性化数据不缓存）
      const cacheKey = `recommend:list:${page}:${size}`;
      
      // 仅对未登录用户使用缓存
      if (!userId) {
        const cachedData = await this.cacheManager.get<{
          list: RecommendEpisodeItem[];
          page: number;
          size: number;
          hasMore: boolean;
        }>(cacheKey);
        
        if (cachedData) {
          return cachedData;
        }
      }

      // 构建推荐查询
      // 推荐分数 = (点赞数 × 3 + 收藏数 × 5 + 评论数 × 2) + 随机因子(0-100)
      const query = `
        SELECT 
          e.id,
          e.short_id as shortId,
          e.episode_number as episodeNumber,
          e.title,
          e.duration,
          e.status,
          e.is_vertical as isVertical,
          e.created_at as createdAt,
          e.play_count as playCount,
          e.like_count as likeCount,
          e.dislike_count as dislikeCount,
          e.favorite_count as favoriteCount,
          e.access_key as episodeAccessKey,
          e.series_id as seriesId,
          s.short_id as seriesShortId,
          s.title as seriesTitle,
          s.cover_url as seriesCoverUrl,
          s.description as seriesDescription,
          s.score as seriesScore,
          s.starring as seriesStarring,
          s.actor as seriesActor,
          s.up_status as seriesUpStatus,
          (
            COALESCE(e.like_count, 0) * 3 + 
            COALESCE(e.favorite_count, 0) * 5 +
            FLOOR(RAND() * 100)
          ) as recommendScore
        FROM episodes e
        INNER JOIN series s ON e.series_id = s.id
        WHERE e.status = 'published'
          AND s.is_active = 1
        ORDER BY recommendScore DESC, RAND()
        LIMIT ? OFFSET ?
      `;

      const episodes: RecommendQueryResult[] = await this.episodeRepo.query(query, [size + 1, offset]);

      // 判断是否还有更多数据
      const hasMore = episodes.length > size;
      const list = hasMore ? episodes.slice(0, size) : episodes;

      // 获取用户交互状态（只在用户登录时查询）
      let userInteractions: Record<number, {
        liked: boolean;
        disliked: boolean;
        favorited: boolean;
      }> = {};

      if (userId && list.length > 0) {
        const episodeIds = list.map(ep => ep.id);
        const seriesIds = Array.from(new Set(list.map(ep => ep.seriesId)));
        
        // 批量查询用户的点赞/点踩状态
        const episodeReactionsMap = await this.episodeInteractionService.getUserReactions(
          userId, 
          episodeIds
        );

        // 批量查询用户的收藏状态
        const favoritedEpisodesSet = await this.favoriteService.getUserFavoritedEpisodes(
          userId, 
          episodeIds,
          seriesIds
        );

        // 组装用户交互状态
        list.forEach(ep => {
          const userReaction = episodeReactionsMap.get(ep.id) || null;
          userInteractions[ep.id] = {
            liked: userReaction === 'like',
            disliked: userReaction === 'dislike',
            favorited: favoritedEpisodesSet.has(ep.id),
          };
        });
      }

      // 获取每个剧集的播放地址
      const enrichedList: RecommendEpisodeItem[] = await Promise.all(
        list.map(async (episode: RecommendQueryResult): Promise<RecommendEpisodeItem> => {
          // 获取剧集的播放地址
          const urls = await this.episodeUrlRepo.find({
            where: { episodeId: episode.id },
            select: ['quality', 'accessKey'],
          });

          // 格式化创建时间
          const createdAt = DateUtil.formatDateTime(episode.createdAt);

          const baseEpisode = {
            shortId: episode.shortId,
            episodeNumber: episode.episodeNumber,
            episodeTitle: String(episode.episodeNumber).padStart(2, '0'), // 格式化为 "01", "02" 等
            title: episode.title,
            duration: episode.duration,
            status: episode.status,
            isVertical: Boolean(episode.isVertical),
            createdAt,
            seriesShortId: episode.seriesShortId,
            seriesTitle: episode.seriesTitle,
            seriesCoverUrl: episode.seriesCoverUrl || '',
            seriesDescription: episode.seriesDescription || '',
            seriesScore: episode.seriesScore || '0.0',
            seriesStarring: episode.seriesStarring || '',
            seriesActor: episode.seriesActor || '',
            updateStatus: episode.seriesUpStatus || '',
            playCount: episode.playCount || 0,
            likeCount: episode.likeCount || 0,
            dislikeCount: episode.dislikeCount || 0,
            favoriteCount: episode.favoriteCount || 0,
            commentCount: 0, // 暂时返回0，避免性能问题
            episodeAccessKey: episode.episodeAccessKey,
            urls: urls.map(url => ({
              quality: url.quality,
              accessKey: url.accessKey,
            })),
            topComments: [], // 暂时返回空数组
            recommendScore: parseFloat(episode.recommendScore),
          };

          // 如果用户已登录，添加用户交互状态
          if (userId && episode.id in userInteractions) {
            return {
              ...baseEpisode,
              userInteraction: userInteractions[episode.id],
            };
          }

          return baseEpisode;
        })
      );

      const result = {
        list: enrichedList,
        page,
        size,
        hasMore,
      };
      
      // 仅缓存未登录用户的数据（公开数据），缓存5分钟
      if (!userId) {
        await this.cacheManager.set(cacheKey, result, 5 * 60 * 1000);
      }
      
      return result;
    } catch (error) {
      console.error('获取推荐列表失败:', error);
      throw new Error('获取推荐列表失败');
    }
  }
}
