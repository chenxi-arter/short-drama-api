import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    const payload: Partial<Episode> = {};
    const seriesId = toInt(raw.seriesId); if (seriesId !== undefined) payload.seriesId = seriesId;
    const episodeNumber = toInt(raw.episodeNumber); if (episodeNumber !== undefined) payload.episodeNumber = episodeNumber;
    const duration = toInt(raw.duration); if (duration !== undefined) payload.duration = duration;
    const status = toStr(raw.status); if (status !== undefined) payload.status = status;
    const title = toStr(raw.title); if (title !== undefined) payload.title = title;
    const playCount = toInt(raw.playCount); if (playCount !== undefined) payload.playCount = playCount;
    const likeCount = toInt(raw.likeCount); if (likeCount !== undefined) payload.likeCount = likeCount;
    const dislikeCount = toInt(raw.dislikeCount); if (dislikeCount !== undefined) payload.dislikeCount = dislikeCount;
    const favoriteCount = toInt(raw.favoriteCount); if (favoriteCount !== undefined) payload.favoriteCount = favoriteCount;
    return payload;
  }

  @Get()
  async list(@Query('page') page = 1, @Query('size') size = 20, @Query('seriesId') seriesId?: string) {
    const take = Math.max(Number(size) || 20, 1);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
    const whereClause = seriesId ? { seriesId: Number(seriesId) } : undefined;
    const [items, total] = await this.episodeRepo.findAndCount({
      skip,
      take,
      order: { id: 'DESC' },
      relations: ['series'],
      where: whereClause,
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
}


