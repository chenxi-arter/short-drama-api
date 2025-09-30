import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Banner } from '../../video/entity/banner.entity';

@Controller('admin/banners')
export class AdminBannersController {
  constructor(
    @InjectRepository(Banner)
    private readonly bannerRepo: Repository<Banner>,
  ) {}

  private normalize(raw: Record<string, unknown>): Partial<Banner> {
    const toInt = (v: unknown): number | undefined => (typeof v === 'string' || typeof v === 'number') ? Number(v) : undefined;
    const toBool = (v: unknown): boolean | undefined =>
      v === undefined ? undefined : (v === true || v === 'true' || v === 1 || v === '1');
    const toDate = (v: unknown): Date | undefined => (typeof v === 'string' || v instanceof Date) ? new Date(v as any) : undefined;

    const payload: Partial<Banner> = {};
    // strings
    if (typeof raw.title === 'string') payload.title = raw.title;
    if (typeof raw.imageUrl === 'string') payload.imageUrl = raw.imageUrl;
    if (typeof raw.linkUrl === 'string') payload.linkUrl = raw.linkUrl;
    if (typeof raw.description === 'string') payload.description = raw.description;

    // numbers
    const seriesId = toInt(raw.seriesId); if (seriesId !== undefined) payload.seriesId = seriesId;
    const categoryId = toInt(raw.categoryId); if (categoryId !== undefined) payload.categoryId = categoryId;
    const weight = toInt(raw.weight); if (weight !== undefined) payload.weight = weight;
    const impressions = toInt(raw.impressions); if (impressions !== undefined) payload.impressions = impressions;
    const clicks = toInt(raw.clicks); if (clicks !== undefined) payload.clicks = clicks;

    // booleans / dates
    const isActive = toBool(raw.isActive); if (isActive !== undefined) payload.isActive = isActive;
    const isAd = toBool(raw.isAd); if (isAd !== undefined) payload.isAd = isAd;
    const startTime = toDate(raw.startTime); if (startTime !== undefined) payload.startTime = startTime;
    const endTime = toDate(raw.endTime); if (endTime !== undefined) payload.endTime = endTime;

    return payload;
  }

  @Get()
  async list(@Query('page') page = 1, @Query('size') size = 20) {
    const take = Math.max(Number(size) || 20, 1);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
    const [items, total] = await this.bannerRepo.findAndCount({ skip, take, order: { id: 'DESC' } });
    return { total, items, page: Number(page) || 1, size: take };
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.bannerRepo.findOne({ where: { id: Number(id) } });
  }

  @Post()
  async create(@Body() body: Partial<Banner>) {
    const entity = this.bannerRepo.create(this.normalize(body));
    return this.bannerRepo.save(entity);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: Partial<Banner>) {
    const payload = this.normalize(body);
    await this.bannerRepo.update({ id: Number(id) }, payload);
    return this.bannerRepo.findOne({ where: { id: Number(id) } });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.bannerRepo.delete({ id: Number(id) });
    return { success: true };
  }
}


