import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { PlatformService } from '../services';
import { CreatePlatformDto, UpdatePlatformDto, UpdatePlatformStatusDto, UpdatePlatformSortDto, PlatformResponseDto } from '../dto';

@Controller('admin/advertising/platforms')
export class AdminPlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Get()
  async findAll(@Query('enabled') enabled?: string): Promise<{ code: number; message: string; data: PlatformResponseDto[] }> {
    const enabledFilter = enabled !== undefined ? enabled === 'true' : undefined;
    const platforms = await this.platformService.findAll(enabledFilter);
    
    return {
      code: 200,
      message: 'success',
      data: platforms.map(platform => ({
        id: platform.id,
        name: platform.name,
        code: platform.code,
        description: platform.description,
        iconUrl: platform.iconUrl,
        color: platform.color,
        isEnabled: platform.isEnabled,
        sortOrder: platform.sortOrder,
        config: platform.config,
        createdAt: platform.createdAt,
        updatedAt: platform.updatedAt,
      })),
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<{ code: number; message: string; data: PlatformResponseDto }> {
    const platform = await this.platformService.findOne(id);
    
    return {
      code: 200,
      message: 'success',
      data: {
        id: platform.id,
        name: platform.name,
        code: platform.code,
        description: platform.description,
        iconUrl: platform.iconUrl,
        color: platform.color,
        isEnabled: platform.isEnabled,
        sortOrder: platform.sortOrder,
        config: platform.config,
        createdAt: platform.createdAt,
        updatedAt: platform.updatedAt,
      },
    };
  }

  @Post()
  async create(@Body() createPlatformDto: CreatePlatformDto): Promise<{ code: number; message: string; data: PlatformResponseDto }> {
    const platform = await this.platformService.create(createPlatformDto, 'admin'); // TODO: 获取当前用户
    
    return {
      code: 200,
      message: 'Platform created successfully',
      data: {
        id: platform.id,
        name: platform.name,
        code: platform.code,
        description: platform.description,
        iconUrl: platform.iconUrl,
        color: platform.color,
        isEnabled: platform.isEnabled,
        sortOrder: platform.sortOrder,
        config: platform.config,
        createdAt: platform.createdAt,
        updatedAt: platform.updatedAt,
      },
    };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePlatformDto: UpdatePlatformDto
  ): Promise<{ code: number; message: string; data: PlatformResponseDto }> {
    const platform = await this.platformService.update(id, updatePlatformDto);
    
    return {
      code: 200,
      message: 'Platform updated successfully',
      data: {
        id: platform.id,
        name: platform.name,
        code: platform.code,
        description: platform.description,
        iconUrl: platform.iconUrl,
        color: platform.color,
        isEnabled: platform.isEnabled,
        sortOrder: platform.sortOrder,
        config: platform.config,
        createdAt: platform.createdAt,
        updatedAt: platform.updatedAt,
      },
    };
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdatePlatformStatusDto
  ): Promise<{ code: number; message: string; data: PlatformResponseDto }> {
    const platform = await this.platformService.updateStatus(id, updateStatusDto);
    
    return {
      code: 200,
      message: 'Platform status updated successfully',
      data: {
        id: platform.id,
        name: platform.name,
        code: platform.code,
        description: platform.description,
        iconUrl: platform.iconUrl,
        color: platform.color,
        isEnabled: platform.isEnabled,
        sortOrder: platform.sortOrder,
        config: platform.config,
        createdAt: platform.createdAt,
        updatedAt: platform.updatedAt,
      },
    };
  }

  @Put('sort')
  async updateSort(@Body() updateSortDto: UpdatePlatformSortDto): Promise<{ code: number; message: string }> {
    await this.platformService.updateSort(updateSortDto);
    
    return {
      code: 200,
      message: 'Platform sort order updated successfully',
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ code: number; message: string }> {
    await this.platformService.remove(id);
    
    return {
      code: 200,
      message: 'Platform deleted successfully',
    };
  }
}
