import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, LessThanOrEqual, MoreThanOrEqual, Between } from 'typeorm';
import { Episode } from '../../video/entity/episode.entity';
import { EpisodeUrl } from '../../video/entity/episode-url.entity';

@Controller('admin/episodes')
export class AdminEpisodesController {
  constructor(
    @InjectRepository(Episode)
    private readonly episodeRepo: Repository<Episode>,
    @InjectRepository(EpisodeUrl)
    private readonly episodeUrlRepo: Repository<EpisodeUrl>,
  ) {}

  private normalize(raw: Record<string, unknown>): Partial<Episode> {
    const toInt = (v: unknown): number | undefined => (typeof v === 'string' || typeof v === 'number') ? Number(v) : undefined;
    const toStr = (v: unknown): string | undefined => (typeof v === 'string') ? v : undefined;
    const toBool = (v: unknown): boolean | undefined => {
      if (v === undefined || v === null) return undefined;
      if (typeof v === 'boolean') return v;
      if (v === 'true' || v === '1' || v === 1) return true;
      if (v === 'false' || v === '0' || v === 0) return false;
      return undefined;
    };
    const payload: Partial<Episode> = {};
    const seriesId = toInt(raw.seriesId); if (seriesId !== undefined) payload.seriesId = seriesId;
    const episodeNumber = toInt(raw.episodeNumber); if (episodeNumber !== undefined) payload.episodeNumber = episodeNumber;
    const duration = toInt(raw.duration); if (duration !== undefined) payload.duration = duration;
    const status = toStr(raw.status); if (status !== undefined) payload.status = status;
    const title = toStr(raw.title); if (title !== undefined) payload.title = title;
    const isVertical = toBool(raw.isVertical); if (isVertical !== undefined) payload.isVertical = isVertical;
    const playCount = toInt(raw.playCount); if (playCount !== undefined) payload.playCount = playCount;
    const likeCount = toInt(raw.likeCount); if (likeCount !== undefined) payload.likeCount = likeCount;
    const dislikeCount = toInt(raw.dislikeCount); if (dislikeCount !== undefined) payload.dislikeCount = dislikeCount;
    const favoriteCount = toInt(raw.favoriteCount); if (favoriteCount !== undefined) payload.favoriteCount = favoriteCount;
    return payload;
  }

  @Get()
  async list(
    @Query('page') page = 1, 
    @Query('size') size = 20, 
    @Query('seriesId') seriesId?: string,
    @Query('minDuration') minDuration?: string,
    @Query('maxDuration') maxDuration?: string
  ) {
    const take = Math.min(200, Math.max(Number(size) || 20, 1));
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
    
    // 构建查询条件
    const whereClause: FindOptionsWhere<Episode> = {};
    
    // 系列ID筛选
    if (seriesId) {
      whereClause.seriesId = Number(seriesId);
    }
    
    // 时长筛选
    const minDur = minDuration ? Number(minDuration) : undefined;
    const maxDur = maxDuration ? Number(maxDuration) : undefined;
    
    if (minDur !== undefined && !isNaN(minDur) && maxDur !== undefined && !isNaN(maxDur)) {
      // 同时指定最小和最大时长，使用Between
      whereClause.duration = Between(minDur, maxDur);
    } else if (minDur !== undefined && !isNaN(minDur)) {
      // 只指定最小时长，返回大于等于该时长的剧集
      whereClause.duration = MoreThanOrEqual(minDur);
    } else if (maxDur !== undefined && !isNaN(maxDur)) {
      // 只指定最大时长，返回小于等于该时长的剧集
      whereClause.duration = LessThanOrEqual(maxDur);
    }
    
    const [items, total] = await this.episodeRepo.findAndCount({
      skip,
      take,
      order: { id: 'DESC' },
      relations: ['series'],
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
    });
    return { total, items, page: Number(page) || 1, size: take };
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.episodeRepo.findOne({ where: { id: Number(id) }, relations: ['series', 'urls'] });
  }

  @Post()
  async create(@Body() body: Partial<Episode>) {
    const entity = this.episodeRepo.create(this.normalize(body));
    return this.episodeRepo.save(entity);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: Partial<Episode>) {
    const payload = this.normalize(body);
    await this.episodeRepo.update({ id: Number(id) }, payload);
    return this.episodeRepo.findOne({ where: { id: Number(id) }, relations: ['series', 'urls'] });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.episodeRepo.delete({ id: Number(id) });
    return { success: true };
  }

  /**
   * 获取剧集下载地址
   * 返回指定剧集的所有清晰度播放地址，用于下载
   */
  @Get(':id/download-urls')
  async getDownloadUrls(@Param('id') id: string) {
    const episode = await this.episodeRepo.findOne({ 
      where: { id: Number(id) }, 
      relations: ['series', 'urls'] 
    });
    
    if (!episode) {
      return { success: false, message: '剧集不存在' };
    }

    const downloadUrls = episode.urls?.map(url => ({
      id: url.id,
      quality: url.quality,
      cdnUrl: url.cdnUrl,
      ossUrl: url.ossUrl,
      originUrl: url.originUrl,
      subtitleUrl: url.subtitleUrl,
      accessKey: url.accessKey,
    })) || [];

    return {
      success: true,
      episodeId: episode.id,
      episodeShortId: episode.shortId,
      episodeTitle: episode.title,
      episodeNumber: episode.episodeNumber,
      seriesId: episode.seriesId,
      seriesTitle: episode.series?.title || '',
      duration: episode.duration,
      downloadUrls
    };
  }
}


