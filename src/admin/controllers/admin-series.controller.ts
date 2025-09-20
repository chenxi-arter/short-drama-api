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
    const entity = this.seriesRepo.create(body);
    return this.seriesRepo.save(entity);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: Partial<Series>) {
    await this.seriesRepo.update({ id: Number(id) }, body);
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


