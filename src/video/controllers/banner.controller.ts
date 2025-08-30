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
import { AdminResponseUtil } from '../../common/utils/admin-response.util';
import { CreateBannerDto, UpdateBannerDto, BannerQueryDto, BannerResponseDto } from '../dto/banner.dto';

@Controller('banners')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Post()
  async createBanner(
    @Body(ValidationPipe) createBannerDto: CreateBannerDto,
  ): Promise<{ code: number; msg: string; data: BannerResponseDto; success: boolean; timestamp: number; }> {
    const banner = await this.bannerService.createBanner(createBannerDto);
    const resp = AdminResponseUtil.success(banner, '创建成功');
    return { code: resp.code, msg: '创建成功', data: resp.data, success: resp.success, timestamp: resp.timestamp };
  }

  @Put(':id')
  async updateBanner(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateBannerDto: UpdateBannerDto,
  ): Promise<{ code: number; msg: string; data: BannerResponseDto; success: boolean; timestamp: number; }> {
    const banner = await this.bannerService.updateBanner(id, updateBannerDto);
    const resp = AdminResponseUtil.success(banner, '更新成功');
    return { code: resp.code, msg: '更新成功', data: resp.data, success: resp.success, timestamp: resp.timestamp };
  }

  @Delete(':id')
  async deleteBanner(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ code: number; msg: string; success: boolean; timestamp: number; }> {
    await this.bannerService.deleteBanner(id);
    const resp = AdminResponseUtil.success(null as any, '删除成功');
    return { code: resp.code, msg: '删除成功', success: resp.success, timestamp: resp.timestamp };
  }

  @Get(':id')
  async getBannerById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ code: number; msg: string; data: BannerResponseDto; success: boolean; timestamp: number; }> {
    const banner = await this.bannerService.getBannerById(id);
    const resp = AdminResponseUtil.success(banner, '获取成功');
    return { code: resp.code, msg: '获取成功', data: resp.data, success: resp.success, timestamp: resp.timestamp };
  }

  @Get()
  async getBanners(
    @Query(ValidationPipe) queryDto: BannerQueryDto,
  ): Promise<{ code: number; msg: string; data: { data: BannerResponseDto[]; total: number; page: number; size: number; }; success: boolean; timestamp: number; }> {
    const result = await this.bannerService.getBanners(queryDto);
    const resp = AdminResponseUtil.success(result, '获取成功');
    return { code: resp.code, msg: '获取成功', data: resp.data, success: resp.success, timestamp: resp.timestamp };
  }

  @Put(':id/status')
  async toggleBannerStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('isActive') isActive: boolean,
  ): Promise<{ code: number; msg: string; data: BannerResponseDto; success: boolean; timestamp: number; }> {
    const banner = await this.bannerService.toggleBannerStatus(id, isActive);
    const resp = AdminResponseUtil.success(banner, '操作成功');
    return { code: resp.code, msg: '操作成功', data: resp.data, success: resp.success, timestamp: resp.timestamp };
  }

  @Put('weights')
  async updateBannerWeights(
    @Body('updates') updates: { id: number; weight: number }[],
  ): Promise<{ code: number; msg: string; success: boolean; timestamp: number; }> {
    await this.bannerService.updateBannerWeights(updates);
    const resp = AdminResponseUtil.success(null as any, '更新成功');
    return { code: resp.code, msg: '更新成功', success: resp.success, timestamp: resp.timestamp };
  }

  @Get('active/list')
  async getActiveBanners(
    @Query('categoryId') categoryId?: number,
    @Query('limit') limit: number = 5,
  ): Promise<{ code: number; msg: string; data: any[]; success: boolean; timestamp: number; }> {
    const banners = await this.bannerService.getActiveBanners(categoryId, limit);
    const resp = AdminResponseUtil.success(banners, '获取成功');
    return { code: resp.code, msg: '获取成功', data: resp.data, success: resp.success, timestamp: resp.timestamp };
  }
}