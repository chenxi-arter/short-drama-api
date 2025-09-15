import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WatchProgress } from '../entity/watch-progress.entity';
import { Episode } from '../entity/episode.entity';
import { Series } from '../entity/series.entity';
import { BaseController } from './base.controller';
import { DateUtil } from '../../common/utils/date.util';

// 仅使用到 userId，不强依赖 express 类型
interface RequestWithUser {
  user?: { userId?: number };
}

@UseGuards(JwtAuthGuard)
@Controller('video/browse-history')
export class CompatBrowseHistoryController extends BaseController {
  constructor(
    @InjectRepository(WatchProgress)
    private readonly watchProgressRepo: Repository<WatchProgress>,
    @InjectRepository(Episode)
    private readonly episodeRepo: Repository<Episode>,
    @InjectRepository(Series)
    private readonly seriesRepo: Repository<Series>,
  ) {
    super();
  }

  @Get()
  async getUserBrowseHistory(
    @Req() req: RequestWithUser,
    @Query('page') page: string = '1',
    @Query('size') size: string = '10',
  ) {
    const pageNum = Math.max(parseInt(page || '1', 10), 1);
    const sizeNum = Math.max(parseInt(size || '10', 10), 1);

    const userId = Number(req.user?.userId);

    // 获取用户的所有观看进度，带上剧集和系列信息
    const progresses = await this.watchProgressRepo.find({
      where: { userId },
      relations: ['episode', 'episode.series', 'episode.series.category'],
      order: { updatedAt: 'DESC' },
    });

    // 按系列聚合：最后一次观看时间、最后观看的集数、访问次数、该集的观看时长
    interface SeriesAggregate {
      seriesId: number;
      seriesTitle: string;
      seriesShortId: string;
      seriesCoverUrl: string;
      categoryName: string;
      lastEpisodeNumber: number;
      lastVisitTime: Date;
      visitCount: number;
      __episodeIds: Set<number>;
      __finalDurationSeconds?: number;
    }

    const seriesMap = new Map<number, SeriesAggregate>();
    for (const p of progresses) {
      const ep: Episode | undefined = p.episode;
      if (!ep || !ep.series) continue;
      const s: Series = ep.series;
      const key = s.id;
      const current = seriesMap.get(key) || {
        seriesId: s.id,
        seriesTitle: s.title || `系列${s.id}`,
        seriesShortId: s.shortId || '',
        seriesCoverUrl: s.coverUrl || '',
        categoryName: s.category?.name || '',
        lastEpisodeNumber: 0,
        lastVisitTime: new Date(0),
        visitCount: 0,
        __episodeIds: new Set<number>()
      };

      // 以“有进度的剧集条数”近似访问次数：只对该系列第一次出现的episodeId计数
      if (!current.__episodeIds.has(ep.id)) {
        current.__episodeIds.add(ep.id);
        current.visitCount += 1;
      }

      // 以更新时间为准，选择最新一条记录作为“展示的这一集”
      if (p.updatedAt > current.lastVisitTime) {
        current.lastVisitTime = p.updatedAt;
        current.lastEpisodeNumber = ep.episodeNumber;
        // 对应该集的观看时长（按剧集时长封顶）
        const capped = Math.max(0, Math.min(p.stopAtSecond || 0, ep.duration || 0));
        current.__finalDurationSeconds = capped;
      }

      seriesMap.set(key, current);
    }

    const listAll = Array.from(seriesMap.values())
      .sort((a, b) => b.lastVisitTime.getTime() - a.lastVisitTime.getTime())
      .map((item: SeriesAggregate) => ({
        id: item.seriesId, // 兼容旧字段：使用seriesId占位
        seriesId: item.seriesId,
        seriesTitle: item.seriesTitle,
        seriesShortId: item.seriesShortId,
        seriesCoverUrl: item.seriesCoverUrl,
        categoryName: item.categoryName,
        browseType: 'episode_watch',
        browseTypeDesc: '观看剧集',
        lastEpisodeNumber: item.lastEpisodeNumber,
        lastEpisodeTitle: item.lastEpisodeNumber ? `第${item.lastEpisodeNumber}集` : null,
        visitCount: item.visitCount,
        durationSeconds: item.__finalDurationSeconds || 0,
        lastVisitTime: DateUtil.formatDateTime(item.lastVisitTime),
        watchStatus: item.lastEpisodeNumber ? `观看至第${item.lastEpisodeNumber}集` : '浏览中'
      }));

    const total = listAll.length;
    const offset = (pageNum - 1) * sizeNum;
    const pageList = listAll.slice(offset, offset + sizeNum);

    return this.success({
      list: pageList,
      total,
      page: pageNum,
      size: sizeNum,
      hasMore: total > pageNum * sizeNum,
    }, '获取浏览记录成功');
  }
}


