import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import { BannerService } from '../services/banner.service';
import { CreateBannerDto, UpdateBannerDto, BannerQueryDto, BannerResponseDto } from '../dto/banner.dto';

@Controller('banners')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Post()
  async createBanner(
    @Body(ValidationPipe) createBannerDto: CreateBannerDto,
  ): Promise<{
    code: number;
    msg: string;
    data: BannerResponseDto;
  }> {
    const banner = await this.bannerService.createBanner(createBannerDto);
    return {
      code: 200,
      msg: '创建成功',
      data: banner,
    };
  }

  @Put(':id')
  async updateBanner(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateBannerDto: UpdateBannerDto,
  ): Promise<{
    code: number;
    msg: string;
    data: BannerResponseDto;
  }> {
    const banner = await this.bannerService.updateBanner(id, updateBannerDto);
    return {
      code: 200,
      msg: '更新成功',
      data: banner,
    };
  }

  @Delete(':id')
  async deleteBanner(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{
    code: number;
    msg: string;
  }> {
    await this.bannerService.deleteBanner(id);
    return {
      code: 200,
      msg: '删除成功',
    };
  }

  @Get(':id')
  async getBannerById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{
    code: number;
    msg: string;
    data: BannerResponseDto;
  }> {
    const banner = await this.bannerService.getBannerById(id);
    return {
      code: 200,
      msg: '获取成功',
      data: banner,
    };
  }

  @Get()
  async getBanners(
    @Query(ValidationPipe) queryDto: BannerQueryDto,
  ): Promise<{
    code: number;
    msg: string;
    data: {
      data: BannerResponseDto[];
      total: number;
      page: number;
      size: number;
    };
  }> {
    const result = await this.bannerService.getBanners(queryDto);
    return {
      code: 200,
      msg: '获取成功',
      data: result,
    };
  }

  @Put(':id/status')
  async toggleBannerStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('isActive') isActive: boolean,
  ): Promise<{
    code: number;
    msg: string;
    data: BannerResponseDto;
  }> {
    const banner = await this.bannerService.toggleBannerStatus(id, isActive);
    return {
      code: 200,
      msg: '操作成功',
      data: banner,
    };
  }

  @Put('weights')
  async updateBannerWeights(
    @Body('updates') updates: { id: number; weight: number }[],
  ): Promise<{
    code: number;
    msg: string;
  }> {
    await this.bannerService.updateBannerWeights(updates);
    return {
      code: 200,
      msg: '更新成功',
    };
  }

  @Get('active/list')
  async getActiveBanners(
    @Query('categoryId') categoryId?: number,
    @Query('limit') limit: number = 5,
  ): Promise<{
    code: number;
    msg: string;
    data: any[];
  }> {
    const banners = await this.bannerService.getActiveBanners(categoryId, limit);
    return {
      code: 200,
      msg: '获取成功',
      data: banners,
    };
  }
}