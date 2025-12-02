import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Episode } from '../entity/episode.entity';
import { EpisodeUrl } from '../entity/episode-url.entity';
import { Comment } from '../entity/comment.entity';
import { DateUtil } from '../../common/utils/date.util';
import { RecommendEpisodeItem } from '../dto/recommend.dto';
import { EpisodeInteractionService } from './episode-interaction.service';
import { FavoriteService } from '../../user/services/favorite.service';
import { CommentService } from './comment.service';

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
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly episodeInteractionService: EpisodeInteractionService,
    @Inject(forwardRef(() => FavoriteService))
    private readonly favoriteService: FavoriteService,
    private readonly commentService: CommentService,
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
      
      // 注意：推荐接口不使用缓存，保证每次刷新都是真随机
      // 类似抖音的推荐流，每次刷新都有新内容

      // 构建推荐查询（性能优化版 + 真随机）
      // 推荐分数 = (点赞数 × 2 + 收藏数 × 4) × 随机权重(0.8-1.5) + 大随机因子(0-400) + 新鲜度分数
      // 新鲜度分数（强化时间权重，优先推荐新内容）：
      //   - 3天内：800分递减（每天-267分），极度优先最新内容
      //   - 3-14天：600分递减（每天-54分），优先较新内容
      //   - 14-30天：300分递减（每天-19分），适度推荐
      //   - 30天后：保持120分基础分
      // 权重平衡：新鲜度占主导（最高800分），点赞/收藏有明显作用（高互动内容可获200-500分加成）
      // 性能优化：
      //   1. 使用索引友好的 WHERE 条件顺序
      //   2. 限制 OFFSET 最大值，避免深度分页
      //   3. 使用 RAND() 实现真随机推荐（类似抖音刷新）
      // 筛选条件：只推荐短剧（category_id=1）的第一集
      
      // 限制最大偏移量，避免深度分页导致的性能问题
      const maxOffset = 1000;
      const safeOffset = Math.min(offset, maxOffset);
      
      // 优化：只查询需要的字段 + 1条（用于判断hasMore）
      const queryLimit = size + 1;
      
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
            (e.like_count * 2 + e.favorite_count * 4) * (0.8 + RAND() * 0.7) +
            FLOOR(RAND() * 400) +
            CASE 
              WHEN DATEDIFF(NOW(), e.created_at) <= 3 THEN GREATEST(0, 800 - DATEDIFF(NOW(), e.created_at) * 267)
              WHEN DATEDIFF(NOW(), e.created_at) <= 14 THEN GREATEST(0, 600 - (DATEDIFF(NOW(), e.created_at) - 3) * 54)
              WHEN DATEDIFF(NOW(), e.created_at) <= 30 THEN GREATEST(0, 300 - (DATEDIFF(NOW(), e.created_at) - 14) * 19)
              ELSE 120
            END
          ) as recommendScore
        FROM episodes e
        INNER JOIN series s ON e.series_id = s.id
        WHERE e.status = 'published'
          AND e.episode_number = 1
          AND s.is_active = 1
          AND s.category_id = 1
        ORDER BY recommendScore DESC
        LIMIT ? OFFSET ?
      `;

      const episodes: RecommendQueryResult[] = await this.episodeRepo.query(query, [queryLimit, safeOffset]);

      // 判断是否还有更多数据
      const hasMore = episodes.length > size;
      const list = hasMore ? episodes.slice(0, size) : episodes;

      // 获取用户交互状态（只在用户登录时查询）
      const userInteractions: Record<number, {
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

      // 批量查询评论数（包括假评论）
      const shortIds = list.map(ep => ep.shortId);
      const commentCountMap = await this.commentService.getCommentCountsByShortIds(shortIds);

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
            commentCount: commentCountMap.get(episode.shortId) || 0,
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

      return {
        list: enrichedList,
        page,
        size,
        hasMore,
      };
    } catch (error) {
      console.error('获取推荐列表失败:', error);
      throw new Error('获取推荐列表失败');
    }
  }
}
