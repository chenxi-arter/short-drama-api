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
    const entity = this.bannerRepo.create(body);
    return this.bannerRepo.save(entity);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: Partial<Banner>) {
    await this.bannerRepo.update({ id: Number(id) }, body);
    return this.bannerRepo.findOne({ where: { id: Number(id) } });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.bannerRepo.delete({ id: Number(id) });
    return { success: true };
  }
}


