import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Series } from '../../video/entity/series.entity';
import { VideoService } from '../../video/video.service';

@Controller('admin/series')
export class AdminSeriesController {
  constructor(
    @InjectRepository(Series)
    private readonly seriesRepo: Repository<Series>,
    private readonly videoService: VideoService,
  ) {}

  private normalize(raw: Record<string, unknown>): Partial<Series> {
    const toInt = (v: unknown): number | undefined => (typeof v === 'string' || typeof v === 'number') ? Number(v) : undefined;
    const toFloat = (v: unknown): number | undefined => (typeof v === 'string' || typeof v === 'number') ? Number(v) : undefined;
    const toBoolNum = (v: unknown): 0 | 1 | undefined =>
      v === undefined ? undefined : ((v === true || v === 'true' || v === 1 || v === '1') ? 1 : 0);
    const toDate = (v: unknown): Date | undefined => (typeof v === 'string' || v instanceof Date) ? new Date(v as any) : undefined;

    const payload: Partial<Series> = {};
    // strings
    if (typeof raw.title === 'string') payload.title = raw.title;
    if (typeof raw.description === 'string') payload.description = raw.description;
    if (typeof raw.coverUrl === 'string') payload.coverUrl = raw.coverUrl;
    if (typeof raw.externalId === 'string') payload.externalId = raw.externalId;
    if (typeof raw.starring === 'string') payload.starring = raw.starring;
    if (typeof raw.actor === 'string') payload.actor = raw.actor;
    if (typeof raw.director === 'string') payload.director = raw.director;
    if (typeof raw.upStatus === 'string') payload.upStatus = raw.upStatus;

    // numbers
    const categoryId = toInt(raw.categoryId); if (categoryId !== undefined) payload.categoryId = categoryId;
    const score = toFloat(raw.score); if (score !== undefined) payload.score = score;
    const playCount = toInt(raw.playCount); if (playCount !== undefined) payload.playCount = playCount;
    const upCount = toInt(raw.upCount); if (upCount !== undefined) payload.upCount = upCount;
    const regionOptionId = toInt(raw.regionOptionId); if (regionOptionId !== undefined) payload.regionOptionId = regionOptionId;
    const languageOptionId = toInt(raw.languageOptionId); if (languageOptionId !== undefined) payload.languageOptionId = languageOptionId;
    const statusOptionId = toInt(raw.statusOptionId); if (statusOptionId !== undefined) payload.statusOptionId = statusOptionId;
    const yearOptionId = toInt(raw.yearOptionId); if (yearOptionId !== undefined) payload.yearOptionId = yearOptionId;
    const deletedBy = toInt(raw.deletedBy); if (deletedBy !== undefined) payload.deletedBy = deletedBy;

    // booleans / dates
    const isCompleted = (raw.isCompleted === true || raw.isCompleted === 'true' || raw.isCompleted === 1 || raw.isCompleted === '1');
    if (raw.isCompleted !== undefined) payload.isCompleted = isCompleted;
    const isActive = toBoolNum(raw.isActive); if (isActive !== undefined) payload.isActive = isActive;
    const releaseDate = toDate(raw.releaseDate); if (releaseDate !== undefined) payload.releaseDate = releaseDate;

    return payload;
  }

  @Get()
  async list(@Query('page') page = 1, @Query('size') size = 20, @Query('includeDeleted') includeDeleted?: string) {
    const take = Math.max(Number(size) || 20, 1);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
    
    const where = includeDeleted === 'true' ? {} : { isActive: 1 };
    const [items, total] = await this.seriesRepo.findAndCount({ 
      skip, 
      take, 
      order: { id: 'DESC' },
      where
    });
    return { total, items, page: Number(page) || 1, size: take };
  }

  @Get('deleted')
  async getDeleted(@Query('page') page = 1, @Query('size') size = 20) {
    const take = Math.max(Number(size) || 20, 1);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
    const [items, total] = await this.seriesRepo.findAndCount({ 
      skip, 
      take, 
      order: { deletedAt: 'DESC' },
      where: { isActive: 0 }
    });
    return { total, items, page: Number(page) || 1, size: take };
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.seriesRepo.findOne({ where: { id: Number(id) } });
  }

  @Post()
  async create(@Body() body: Partial<Series>) {
    const entity = this.seriesRepo.create(this.normalize(body));
    return this.seriesRepo.save(entity);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: Partial<Series>) {
    const payload = this.normalize(body);
    await this.seriesRepo.update({ id: Number(id) }, payload);
    return this.seriesRepo.findOne({ where: { id: Number(id) } });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    // 使用软删除而不是硬删除
    const result = await this.videoService.softDeleteSeries(Number(id));
    return result;
  }

  @Post(':id/restore')
  async restore(@Param('id') id: string) {
    const result = await this.videoService.restoreSeries(Number(id));
    return result;
  }
}


