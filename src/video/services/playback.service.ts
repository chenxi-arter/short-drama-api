import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Episode } from '../entity/episode.entity';
import { WatchProgress } from '../entity/watch-progress.entity';
import { WatchProgressService } from './watch-progress.service';
import { BrowseHistoryService } from './browse-history.service';
import { CacheKeys } from '../utils/cache-keys.util';

/**
 * 播放服务
 * 专门处理用户播放相关的业务逻辑
 */
@Injectable()
export class PlaybackService {
  constructor(
    @InjectRepository(Episode)
    private readonly episodeRepo: Repository<Episode>,
    @InjectRepository(WatchProgress)
    private readonly watchProgressRepo: Repository<WatchProgress>,
    private readonly watchProgressService: WatchProgressService,
    private readonly browseHistoryService: BrowseHistoryService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  /**
   * 保存观看进度
   * @param userId 用户ID
   * @param episodeId 剧集ID
   * @param stopAtSecond 观看进度（秒）
   */
  async saveProgress(userId: number, episodeId: number, stopAtSecond: number) {
    const result = await this.watchProgressService.updateWatchProgress(userId, episodeId, stopAtSecond);
    
    // 清理相关缓存
    await this.clearProgressRelatedCache(episodeId);
    
    return result;
  }

  /**
   * 保存观看进度并自动记录浏览历史
   * @param userId 用户ID
   * @param episodeId 剧集ID
   * @param stopAtSecond 观看进度（秒）
   * @param req 请求对象
   */
  async saveProgressWithBrowseHistory(userId: number, episodeId: number, stopAtSecond: number, req?: any) {
    try {
      // 1. 保存观看进度
      const result = await this.watchProgressService.updateWatchProgress(userId, episodeId, stopAtSecond);
      
      // 2. 获取剧集信息以记录浏览历史
      const episode = await this.episodeRepo.findOne({
        where: { id: episodeId },
        relations: ['series']
      });
      
      if (episode && episode.series) {
        // 3. 自动记录浏览历史 - 记录观看的具体集数
        this.browseHistoryService.recordBrowseHistory(
          userId,
          episode.series.id,
          'episode_watch', // 新的浏览类型：具体集数观看
          episode.episodeNumber,
          req
        ).catch(error => {
          console.error('自动记录浏览历史失败:', error);
        });
        
        console.log(`[AUTO_RECORD] 用户${userId}观看了系列${episode.series.id}的第${episode.episodeNumber}集，进度：${stopAtSecond}秒`);
      }
      
      // 4. 清理相关缓存
      await this.clearProgressRelatedCache(episodeId);
      
      return result;
    } catch (error) {
      console.error('保存观看进度失败:', error);
      throw error;
    }
  }

  /**
   * 获取观看进度
   * @param userId 用户ID
   * @param episodeId 剧集ID
   */
  async getProgress(userId: number, episodeId: number) {
    const progressList = await this.watchProgressService.getUserWatchProgress(userId, episodeId);
    const progress = progressList.length > 0 ? progressList[0] : null;
    return { stopAtSecond: progress?.stopAtSecond || 0 };
  }

  /**
   * 获取用户在某个系列下的总体播放进度
   * @param userId 用户ID
   * @param seriesId 系列ID
   */
  async getUserSeriesProgress(userId: number, seriesId: number) {
    try {
      // 获取该系列下的所有剧集
      const episodes = await this.episodeRepo.find({
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
        isCompleted: completedEpisodes === episodes.length && episodes.length > 0
      };
    } catch (error) {
      console.error('获取用户系列播放进度失败:', error);
      return null;
    }
  }

  /**
   * 清理进度相关缓存
   * @param episodeId 剧集ID
   */
  private async clearProgressRelatedCache(episodeId: number): Promise<void> {
    try {
      // 获取剧集信息
      const episode = await this.episodeRepo.findOne({
        where: { id: episodeId },
        relations: ['series']
      });
      
      if (episode && episode.series) {
        const seriesId = episode.series.id;
        const seriesShortId = episode.series.shortId;
        
        // 清理剧集列表缓存
        const patterns = [
          `episode_list:${seriesId}:*`,
          `episode_list:${seriesShortId}:*`,
        ];
        
        for (const pattern of patterns) {
          await this.cacheManager.del(pattern);
        }
        
        console.log(`🧹 清理进度相关缓存: episodeId=${episodeId}, seriesId=${seriesId}`);
      }
    } catch (error) {
      console.error('清理进度相关缓存失败:', error);
    }
  }
}
