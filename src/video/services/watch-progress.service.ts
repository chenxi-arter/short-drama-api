import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WatchProgress } from '../entity/watch-progress.entity';
import { Episode } from '../entity/episode.entity';

@Injectable()
export class WatchProgressService {
  constructor(
    @InjectRepository(WatchProgress)
    private readonly watchProgressRepo: Repository<WatchProgress>,
    @InjectRepository(Episode)
    private readonly episodeRepo: Repository<Episode>,
  ) {}

  /**
   * 更新观看进度
   */
  async updateWatchProgress(
    userId: number,
    episodeId: number,
    stopAtSecond: number,
  ) {
    // 检查剧集是否存在
    const episode = await this.episodeRepo.findOne({
      where: { id: episodeId },
    });
    
    if (!episode) {
      throw new Error('剧集不存在');
    }

    // 查找现有的观看进度记录
    let watchProgress = await this.watchProgressRepo.findOne({
      where: {
        userId,
        episodeId,
      },
    });

    if (watchProgress) {
      // 更新现有记录
      watchProgress.stopAtSecond = stopAtSecond;
      watchProgress.updatedAt = new Date();
    } else {
      // 创建新记录
      watchProgress = this.watchProgressRepo.create({
        userId,
        episodeId,
        stopAtSecond,
        updatedAt: new Date(),
      });
    }

    await this.watchProgressRepo.save(watchProgress);
    return { ok: true };
  }

  /**
   * 获取用户的观看进度
   */
  async getUserWatchProgress(userId: number, episodeId?: number) {
    const whereCondition: any = { userId };
    if (episodeId) {
      whereCondition.episodeId = episodeId;
    }

    const progressList = await this.watchProgressRepo.find({
      where: whereCondition,
      relations: ['episode', 'episode.series'],
      order: { updatedAt: 'DESC' },
    });

    return progressList.map(progress => ({
      userId: progress.userId,
      episodeId: progress.episodeId,
      stopAtSecond: progress.stopAtSecond,
      updatedAt: progress.updatedAt,
      episode: {
        id: progress.episode.id,
        title: progress.episode.title,
        episodeNumber: progress.episode.episodeNumber,
        series: {
          id: progress.episode.series.id,
          title: progress.episode.series.title,
          coverUrl: progress.episode.series.coverUrl,
        },
      },
    }));
  }

  /**
   * 获取用户最近观看的剧集
   */
  async getRecentWatchedEpisodes(userId: number, limit: number = 10) {
    const progressList = await this.watchProgressRepo.find({
      where: { userId },
      relations: ['episode', 'episode.series'],
      order: { updatedAt: 'DESC' },
      take: limit,
    });

    return progressList.map(progress => ({
      episodeId: progress.episodeId,
      stopAtSecond: progress.stopAtSecond,
      updatedAt: progress.updatedAt,
      episode: {
        id: progress.episode.id,
        title: progress.episode.title,
        episodeNumber: progress.episode.episodeNumber,
        series: {
          id: progress.episode.series.id,
          title: progress.episode.series.title,
          coverUrl: progress.episode.series.coverUrl,
        },
      },
    }));
  }

  /**
   * 删除观看进度记录
   */
  async deleteWatchProgress(userId: number, episodeId: number) {
    const result = await this.watchProgressRepo.delete({
      userId,
      episodeId,
    });

    return { ok: (result.affected || 0) > 0 };
  }

  /**
   * 清除用户所有观看进度
   */
  async clearAllWatchProgress(userId: number) {
    const result = await this.watchProgressRepo.delete({ userId });
    return { ok: true, deletedCount: result.affected || 0 };
  }

  /**
   * 获取剧集的观看统计
   */
  async getEpisodeWatchStats(episodeId: number) {
    const totalWatchers = await this.watchProgressRepo.count({
      where: { episodeId },
    });

    const completedWatchers = await this.watchProgressRepo
      .createQueryBuilder('wp')
      .where('wp.episodeId = :episodeId', { episodeId })
      .andWhere('wp.stopAtSecond >= :threshold', { threshold: 0 }) // 有观看记录即可
      .getCount();

    return {
      totalWatchers,
      completedWatchers,
      completionRate: totalWatchers > 0 ? (completedWatchers / totalWatchers) * 100 : 0,
    };
  }
}