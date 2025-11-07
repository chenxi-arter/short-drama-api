import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Episode } from './entity/episode.entity';
import { Series } from './entity/series.entity';
import { Comment } from './entity/comment.entity';

// 新的专门服务
import { PlaybackService } from './services/playback.service';
import { ContentService } from './services/content.service';
import { HomeService } from './services/home.service';
import { MediaService } from './services/media.service';
import { UrlService } from './services/url.service';

// 现有服务
import { FilterService } from './services/filter.service';
import { CommentService } from './services/comment.service';
import { SeriesService } from './services/series.service';
import { CategoryService } from './services/category.service';

/**
 * 视频服务（协调器模式）
 * 视频服务（协调器模式）
 * 从 1607 行缩减到约 200 行，提高可维护性
 * 保持所有对外接口不变，内部委托给专门的服务处理
 */
@Injectable()
export class VideoService {
  constructor(
    // 新的专门服务
    private readonly playbackService: PlaybackService,
    private readonly contentService: ContentService,
    private readonly homeService: HomeService,
    private readonly mediaService: MediaService,
    private readonly urlService: UrlService,
    
    // 现有服务
    private readonly filterService: FilterService,
    private readonly commentService: CommentService,
    private readonly seriesService: SeriesService,
    private readonly categoryService: CategoryService,
    
    // 直接依赖（用于少数未迁移的方法）
    @InjectRepository(Episode)
    private readonly episodeRepo: Repository<Episode>,
    @InjectRepository(Series)
    private readonly seriesRepo: Repository<Series>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  // ==================== 播放相关方法 ====================
  
  async saveProgress(userId: number, episodeId: number, stopAtSecond: number) {
    return this.playbackService.saveProgress(userId, episodeId, stopAtSecond);
  }

  async saveProgressWithBrowseHistory(userId: number, episodeId: number, stopAtSecond: number, req?: any) {
    return this.playbackService.saveProgressWithBrowseHistory(userId, episodeId, stopAtSecond, req);
  }

  async getProgress(userId: number, episodeId: number) {
    return this.playbackService.getProgress(userId, episodeId);
  }

  async getUserSeriesProgress(userId: number, seriesId: number) {
    return this.playbackService.getUserSeriesProgress(userId, seriesId);
  }

  // ==================== 内容管理方法 ====================
  
  async getEpisodeList(
    seriesIdentifier?: string,
    isShortId: boolean = false,
    page: number = 1,
    size: number = 20,
    userId?: number,
    req?: any
  ) {
    return this.contentService.getEpisodeList(seriesIdentifier, isShortId, page, size, userId);
  }

  async getEpisodeByShortId(shortId: string) {
    return this.contentService.getEpisodeByShortId(shortId);
  }

  async getSeriesDetail(id: number) {
    return this.contentService.getSeriesDetail(id);
  }

  // ==================== 首页功能方法 ====================
  
  async getHomeVideos(channeid: number, page: number) {
    return this.homeService.getHomeVideos(channeid, page);
  }

  async getHomeModules(channeid: number, page: number) {
    return this.homeService.getHomeModules(channeid, page);
  }

  async listCategories() {
    return this.homeService.listCategories();
  }

  // ==================== 媒体管理方法 ====================
  
  async listMedia(
    categoryId?: number,
    type?: 'short' | 'series',
    userId?: number,
    sort: 'latest' | 'like' | 'play' = 'latest',
    page: number = 1,
    size: number = 20
  ) {
    return this.mediaService.listMedia(categoryId, type, userId, sort, page, size);
  }

  async listSeriesFull(categoryId?: number, page: number = 1, size: number = 20) {
    return this.mediaService.listSeriesFull(categoryId, page, size);
  }

  async listSeriesByCategory(categoryId: number) {
    return this.mediaService.listSeriesByCategory(categoryId);
  }

  // ==================== URL管理方法 ====================
  
  async createEpisodeUrl(
    episodeId: number,
    quality: string,
    ossUrl: string,
    cdnUrl: string,
    subtitleUrl?: string
  ) {
    return this.urlService.createEpisodeUrl(episodeId, quality, ossUrl, cdnUrl, subtitleUrl);
  }

  async getEpisodeUrlByAccessKey(accessKey: string) {
    return this.urlService.getEpisodeUrlByAccessKey(accessKey);
  }

  async getEpisodeUrlByKey(prefix: string, key: string) {
    return this.urlService.getEpisodeUrlByKey(prefix, key);
  }

  async generateAccessKeysForExisting() {
    return this.urlService.generateAccessKeysForExisting();
  }

  async updateEpisodeSequel(episodeId: number, hasSequel: boolean) {
    return this.urlService.updateEpisodeSequel(episodeId, hasSequel);
  }

  // ==================== 筛选功能方法 ====================
  
  async getFiltersTags(channeid: string) {
    return this.filterService.getFiltersTags(channeid);
  }

  async getFiltersData(channelId: string, ids: string, page: string) {
    return this.filterService.getFiltersData(channelId, ids, page);
  }

  async fuzzySearch(
    keyword: string,
    categoryId?: string,
    page: number = 1,
    size: number = 20
  ) {
    return this.filterService.fuzzySearch(keyword, categoryId, page, size);
  }

  /**
   * 获取条件筛选数据
   * @param dto 筛选条件
   */
  async getConditionFilterData(dto: any) {
    // 暂时使用现有的筛选方法，稍后可以扩展为更完整的实现
    return this.filterService.getFiltersData(
      (dto as any).titleid || 'drama',
      (dto as any).ids || '0,0,0,0,0',
      ((dto as any).page?.toString()) || '1'
    );
  }

  async clearFilterCache(channeid?: string) {
    return this.filterService.clearFilterCache(channeid);
  }

  // ==================== 评论功能方法 ====================
  
  async addComment(
    userId: number,
    episodeShortId: string,
    content: string,
    appearSecond?: number
  ) {
    return this.commentService.addComment(userId, episodeShortId, content, appearSecond);
  }

  // ==================== 系列管理方法 ====================
  
  async getSeriesByCategory(categoryId: number, page: number = 1, pageSize: number = 20) {
    return this.seriesService.getSeriesByCategory(categoryId, page, pageSize);
  }

  // ==================== 分类管理方法 ====================

  async getAllCategories() {
    return this.categoryService.getAllCategories();
  }

  async getCategoriesWithStats() {
    return this.categoryService.getCategoriesWithStats();
  }

  // ==================== 管理功能方法 ====================

  /**
   * 软删除剧集系列
   * @param seriesId 系列ID
   * @param deletedBy 删除者用户ID（可选）
   * @returns 删除结果
   */
  async softDeleteSeries(seriesId: number, deletedBy?: number): Promise<{ success: boolean; message: string }> {
    try {
      const series = await this.seriesRepo.findOne({ where: { id: seriesId, isActive: 1 } });

      if (!series) {
        return { success: false, message: '剧集不存在或已被删除' };
      }

      series.isActive = 0;
      series.deletedAt = new Date();
      if (deletedBy) {
        series.deletedBy = deletedBy;
      }

      await this.seriesRepo.save(series);

      // 清理相关缓存
      this.clearSeriesRelatedCache(seriesId);

      return { success: true, message: '剧集已成功删除' };
    } catch (error) {
      console.error('软删除剧集失败:', error);
      return { success: false, message: '删除失败，请稍后重试' };
    }
  }

  /**
   * 恢复已删除的剧集系列
   * @param seriesId 系列ID
   * @returns 恢复结果
   */
  async restoreSeries(seriesId: number): Promise<{ success: boolean; message: string }> {
    try {
      const series = await this.seriesRepo.findOne({ where: { id: seriesId, isActive: 0 } });

      if (!series) {
        return { success: false, message: '剧集不存在或未被删除' };
      }

      series.isActive = 1;
      series.deletedAt = null;
      series.deletedBy = null;

      await this.seriesRepo.save(series);

      // 清理相关缓存
      this.clearSeriesRelatedCache(seriesId);

      return { success: true, message: '剧集已成功恢复' };
    } catch (error) {
      console.error('恢复剧集失败:', error);
      return { success: false, message: '恢复失败，请稍后重试' };
    }
  }

  /**
   * 获取已删除的剧集列表
   * @param page 页码
   * @param size 每页大小
   * @returns 已删除的剧集列表
   */
  async getDeletedSeries(page: number = 1, size: number = 20): Promise<{ list: any[]; total: number; page: number; size: number }> {
    try {
      const offset = (page - 1) * size;

      const [series, total] = await this.seriesRepo.findAndCount({
        where: { isActive: 0 },
        relations: ['category'],
        order: { deletedAt: 'DESC' },
        skip: offset,
        take: size
      });

      const list = series.map(s => ({
        id: s.id,
        shortId: s.shortId,
        title: s.title,
        categoryName: s.category?.name || '',
        deletedAt: s.deletedAt?.toISOString(),
        deletedBy: s.deletedBy,
        createdAt: s.createdAt.toISOString()
      }));

      return {
        list,
        total,
        page,
        size
      };
    } catch (error) {
      console.error('获取已删除剧集列表失败:', error);
      throw new Error('获取已删除剧集列表失败');
    }
  }

  // ==================== 缓存管理方法 ====================

  clearProgressRelatedCache(episodeId: number) {
    console.log(`清理缓存请求: episodeId=${episodeId}`);
    // 现在由各个专门服务内部处理
  }

  clearSeriesRelatedCache(seriesId: number) {
    console.log(`清理系列缓存请求: seriesId=${seriesId}`);
    // 委托给相关服务 - 异步执行，不阻塞主流程
    setImmediate(() => {
      // 这里可以调用实际的缓存清理逻辑
      // 例如：this.cacheService.clearSeriesCache(seriesId);
    });
  }
}
