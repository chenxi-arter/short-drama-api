import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Episode } from '../entity/episode.entity';
import { EpisodeUrl } from '../entity/episode-url.entity';
import { DateUtil } from '../../common/utils/date.util';
import { RecommendEpisodeItem } from '../dto/recommend.dto';

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
  ) {}

  /**
   * 获取推荐剧集列表
   * @param page 页码
   * @param size 每页数量
   */
  async getRecommendList(
    page: number = 1,
    size: number = 20,
  ): Promise<{
    list: RecommendEpisodeItem[];
    page: number;
    size: number;
    hasMore: boolean;
  }> {
    try {
      const offset = (page - 1) * size;

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
          s.short_id as seriesShortId,
          s.title as seriesTitle,
          s.cover_url as seriesCoverUrl,
          s.description as seriesDescription,
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

      const episodes = await this.episodeRepo.query(query, [size + 1, offset]);

      // 判断是否还有更多数据
      const hasMore = episodes.length > size;
      const list = hasMore ? episodes.slice(0, size) : episodes;

      // 获取每个剧集的播放地址
      const enrichedList = await Promise.all(
        list.map(async (episode) => {
          // 获取剧集的播放地址
          const urls = await this.episodeUrlRepo.find({
            where: { episodeId: episode.id },
            select: ['quality', 'accessKey'],
          });

          // 格式化创建时间
          const createdAt = DateUtil.formatDateTime(new Date(episode.createdAt));

          return {
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
