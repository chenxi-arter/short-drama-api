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

  @Get()
  async list(@Query('page') page = 1, @Query('size') size = 20, @Query('seriesId') seriesId?: string) {
    const take = Math.max(Number(size) || 20, 1);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
    const where = seriesId ? { seriesId: Number(seriesId) } : {} as any;
    const [items, total] = await this.episodeRepo.findAndCount({
      skip,
      take,
      order: { id: 'DESC' },
      relations: ['series'],
      where,
    });
    return { total, items, page: Number(page) || 1, size: take };
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.episodeRepo.findOne({ where: { id: Number(id) }, relations: ['series', 'urls'] });
  }

  @Post()
  async create(@Body() body: Partial<Episode>) {
    const entity = this.episodeRepo.create(body);
    return this.episodeRepo.save(entity);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: Partial<Episode>) {
    await this.episodeRepo.update({ id: Number(id) }, body);
    return this.episodeRepo.findOne({ where: { id: Number(id) }, relations: ['series', 'urls'] });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.episodeRepo.delete({ id: Number(id) });
    return { success: true };
  }
}


