import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../video/entity/category.entity';

@Controller('admin/categories')
export class AdminCategoriesController {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  private normalize(raw: Record<string, unknown>): Partial<Category> {
    const payload: Partial<Category> = {};
    if (typeof raw.categoryId === 'string') payload.categoryId = raw.categoryId;
    if (typeof raw.name === 'string') payload.name = raw.name;
    if (typeof raw.routeName === 'string') payload.routeName = raw.routeName;
    if (raw.isEnabled !== undefined) {
      payload.isEnabled = raw.isEnabled === true || raw.isEnabled === 'true' || raw.isEnabled === 1 || raw.isEnabled === '1';
    }
    return payload;
  }

  @Get()
  async list(@Query('page') page = 1, @Query('size') size = 20) {
    const take = Math.max(Number(size) || 20, 1);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
    const [items, total] = await this.categoryRepo.findAndCount({ skip, take, order: { id: 'DESC' } });
    return { total, items, page: Number(page) || 1, size: take };
  }

  @Post()
  async create(@Body() body: Partial<Category>) {
    const entity = this.categoryRepo.create(this.normalize(body));
    return this.categoryRepo.save(entity);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.categoryRepo.delete({ id: Number(id) });
    return { success: true };
  }
}


