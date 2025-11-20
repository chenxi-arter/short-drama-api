import { Controller, Get, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FilterOption } from '../../video/entity/filter-option.entity';

@Controller('admin/options')
export class AdminOptionsController {
  constructor(
    @InjectRepository(FilterOption)
    private readonly filterOptionRepo: Repository<FilterOption>,
  ) {}

  /**
   * 调试接口：查看所有选项（包括禁用的）
   * GET /api/admin/options/debug?type=year
   * 注意：必须放在 @Get() 之前，否则会被通配路由拦截
   */
  @Get('debug')
  async debugOptions(@Query('type') type: string) {
    if (!type) {
      return { error: 'type parameter is required' };
    }

    const options = await this.filterOptionRepo
      .createQueryBuilder('option')
      .innerJoin('option.filterType', 'filterType')
      .where('filterType.code = :typeCode', { typeCode: type })
      .orderBy('option.id', 'ASC')
      .select([
        'option.id',
        'option.name',
        'option.value',
        'option.isActive',
        'option.isDefault',
        'option.sortOrder',
        'filterType.id',
        'filterType.code',
      ])
      .getMany();

    return {
      type,
      total: options.length,
      options: options.map(opt => ({
        id: opt.id,
        name: opt.name,
        value: opt.value,
        isActive: opt.isActive,
        isDefault: opt.isDefault,
        sortOrder: opt.sortOrder,
        filterTypeId: opt.filterType?.id,
        filterTypeCode: opt.filterType?.code,
      })),
    };
  }

  @Get()
  async getOptions(@Query('types') types: string) {
    if (!types) {
      return {};
    }

    const typeList = types.split(',').map(t => t.trim());
    const result: Record<string, any[]> = {};

    for (const typeCode of typeList) {
      const options = await this.filterOptionRepo
        .createQueryBuilder('option')
        .innerJoin('option.filterType', 'filterType')
        .where('filterType.code = :typeCode', { typeCode })
        .andWhere('option.isActive = 1')
        .andWhere('option.isDefault = 0') // 排除"全部XX"等默认选项
        .orderBy('option.sortOrder', 'ASC')
        .select([
          'option.id',
          'option.name',
          'option.value',
          'option.sortOrder',
        ])
        .getMany();

      result[typeCode] = options.map(opt => ({
        id: opt.id,
        name: opt.name,
        value: opt.value,
        sortOrder: opt.sortOrder,
      }));
    }

    return result;
  }
}
