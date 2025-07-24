// src/video/public-video.controller.ts
import { Controller, Get, Query, Param } from '@nestjs/common';
import { VideoService } from './video.service';

@Controller('public/video')   // 统一 /public 前缀，语义清晰
export class PublicVideoController {
  constructor(private readonly videoService: VideoService) {}

  @Get('categories')
  async listCategories() {
    return this.videoService.listCategories();
  }

  @Get('series')
  async listSeriesByCategory(@Query('categoryId') categoryId: number) {
    return this.videoService.listSeriesByCategory(categoryId);
  }

  @Get('series/:id')
  async getSeriesDetail(@Param('id') id: number) {
    return this.videoService.getSeriesDetail(id);
  }
}