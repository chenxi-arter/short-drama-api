import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Episode } from '../entity/episode.entity';
import { EpisodeUrl } from '../entity/episode-url.entity';
import { Comment } from '../entity/comment.entity';
import { Series } from '../entity/series.entity';
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
  categoryName: string;
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
    @InjectRepository(Series)
    private readonly seriesRepo: Repository<Series>,
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
      
      // 增强随机性策略：
      // 1. 先随机选择一批候选集（随机池大小 = size * 10，确保有足够的随机性）
      // 2. 在候选集中计算推荐分数并排序
      // 3. 最后在结果中再次随机打乱，确保每次刷新都不同
      
      const randomPoolSize = Math.max(size * 10, 200); // 至少200条候选，确保随机性
      
      // 第一步：随机选择候选集（使用 RAND() 完全随机）
      const candidateQuery = `
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
          c.name as categoryName
        FROM episodes e
        INNER JOIN series s ON e.series_id = s.id
        LEFT JOIN categories c ON s.category_id = c.id
        WHERE e.status = 'published'
          AND e.episode_number = 1
          AND s.is_active = 1
          AND s.category_id = 1
        ORDER BY RAND()
        LIMIT ?
      `;

      const candidates: RecommendQueryResult[] = await this.episodeRepo.query(candidateQuery, [randomPoolSize]);

      if (candidates.length === 0) {
        return {
          list: [],
          page,
          size,
          hasMore: false,
        };
      }

      // 第二步：在候选集中计算推荐分数（增强随机因子）
      // 大幅增加随机因子权重，让随机性占主导
      const scoredCandidates = candidates.map(candidate => {
        const likeWeight = (candidate.likeCount || 0) * 2;
        const favoriteWeight = (candidate.favoriteCount || 0) * 4;
        const interactionScore = likeWeight + favoriteWeight;
        
        // 大幅增强随机性：随机权重范围扩大到 0.3-2.0，随机因子扩大到 0-800
        const randomWeight = 0.3 + Math.random() * 1.7; // 0.3-2.0
        const randomFactor = Math.floor(Math.random() * 800); // 0-800
        
        // 计算新鲜度分数
        const createdAt = new Date(candidate.createdAt);
        const daysDiff = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        let freshnessScore = 120; // 默认基础分
        if (daysDiff <= 3) {
          freshnessScore = Math.max(0, 800 - daysDiff * 267);
        } else if (daysDiff <= 14) {
          freshnessScore = Math.max(0, 600 - (daysDiff - 3) * 54);
        } else if (daysDiff <= 30) {
          freshnessScore = Math.max(0, 300 - (daysDiff - 14) * 19);
        }
        
        const recommendScore = interactionScore * randomWeight + randomFactor + freshnessScore;
        
        return {
          ...candidate,
          recommendScore: recommendScore.toString(),
        };
      });

      // 第三步：按推荐分数排序，取前 size + 1 条（用于判断hasMore）
      scoredCandidates.sort((a, b) => parseFloat(b.recommendScore) - parseFloat(a.recommendScore));
      const topCandidates = scoredCandidates.slice(0, size + 1);

      // 第四步：再次随机打乱结果，确保每次刷新都不同（这是关键！）
      // 使用 Fisher-Yates 洗牌算法
      for (let i = topCandidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [topCandidates[i], topCandidates[j]] = [topCandidates[j], topCandidates[i]];
      }

      const episodes: RecommendQueryResult[] = topCandidates;

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

      // 批量获取系列标签
      const seriesIds = Array.from(new Set(list.map(ep => ep.seriesId)));
      const seriesTagsMap = await this.getSeriesTagsBatch(seriesIds);

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
            contentType: episode.categoryName || '',
            tags: seriesTagsMap.get(episode.seriesId) || [],
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

  /**
   * 批量获取系列标签（题材 + 地区 + 语言 + 年份 + 状态）
   * @param seriesIds 系列ID数组
   * @returns Map<seriesId, tags[]>
   */
  private async getSeriesTagsBatch(seriesIds: number[]): Promise<Map<number, string[]>> {
    const tagsMap = new Map<number, string[]>();
    
    if (seriesIds.length === 0) {
      return tagsMap;
    }

    try {
      // 先为每个系列初始化空数组，保证没有题材时也能有地区/语言/年份/状态标签
      seriesIds.forEach(id => tagsMap.set(id, []));

      // 1. 批量查询题材标签（从中间表获取）
      type RawTag = { series_id: number; name?: string };
      const genreTags: RawTag[] = await this.seriesRepo
        .createQueryBuilder('s')
        .leftJoin('series_genre_options', 'sgo', 'sgo.series_id = s.id')
        .leftJoin('filter_options', 'fo', 'fo.id = sgo.option_id')
        .select('s.id', 'series_id')
        .addSelect('fo.name', 'name')
        .where('s.id IN (:...seriesIds)', { seriesIds })
        .andWhere('fo.filter_type_id = 2') // 题材类型
        .andWhere('fo.is_active = 1')
        .orderBy('s.id', 'ASC')
        .addOrderBy('fo.display_order', 'ASC')
        .getRawMany();
      
      genreTags.forEach((tag: RawTag) => {
        if (tag.name && tag.series_id) {
          const tags = tagsMap.get(tag.series_id)!;
          if (tags && !tags.includes(tag.name)) {
            tags.push(tag.name);
          }
        }
      });

      // 2. 批量查询地区、语言、年份、状态选项名称并合并到 tags
      type RawOption = { series_id: number; region_name?: string; lang_name?: string; year_name?: string; status_name?: string };
      const optionRows: RawOption[] = await this.seriesRepo
        .createQueryBuilder('s')
        .leftJoin('filter_options', 'fo_region', 's.region_option_id = fo_region.id AND fo_region.is_active = 1')
        .leftJoin('filter_options', 'fo_lang', 's.language_option_id = fo_lang.id AND fo_lang.is_active = 1')
        .leftJoin('filter_options', 'fo_year', 's.year_option_id = fo_year.id AND fo_year.is_active = 1')
        .leftJoin('filter_options', 'fo_status', 's.status_option_id = fo_status.id AND fo_status.is_active = 1')
        .select('s.id', 'series_id')
        .addSelect('fo_region.name', 'region_name')
        .addSelect('fo_lang.name', 'lang_name')
        .addSelect('fo_year.name', 'year_name')
        .addSelect('fo_status.name', 'status_name')
        .where('s.id IN (:...seriesIds)', { seriesIds })
        .getRawMany();
      
      optionRows.forEach((row: RawOption) => {
        if (!row.series_id) return;
        const tags = tagsMap.get(row.series_id);
        if (!tags) return;
        [row.region_name, row.lang_name, row.year_name, row.status_name]
          .filter((name): name is string => Boolean(name))
          .forEach(name => {
            if (!tags.includes(name)) tags.push(name);
          });
      });
      
      // 去重并限制每个系列最多 10 个标签
      tagsMap.forEach((tags, seriesId) => {
        tagsMap.set(seriesId, Array.from(new Set(tags)).slice(0, 10));
      });
      
    } catch (error) {
      console.error('批量获取系列标签失败:', error);
    }
    
    return tagsMap;
  }
}
