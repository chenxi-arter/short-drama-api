// src/video/public-video.controller.ts
import { Controller, Get, Query, Param } from '@nestjs/common';
import { VideoService } from './video.service';
import { MediaQueryDto } from './dto/media-query.dto';
import { EpisodeListDto } from './dto/episode-list.dto'; 

@Controller('public/video')   // 统一 /public 前缀，语义清晰
export class PublicVideoController {
  constructor(private readonly videoService: VideoService) {}

@Get('/series/list')
async listSeriesFull(@Query() dto: MediaQueryDto) {
  return this.videoService.listSeriesFull(dto.categoryId, dto.page, dto.size);
}
  @Get('series')
  async listSeriesByCategory(@Query('categoryId') categoryId: number) {
    return this.videoService.listSeriesByCategory(categoryId);
  }

  @Get('series/:id')
  async getSeriesDetail(@Param('id') id: number) {
    return this.videoService.getSeriesDetail(id);
  }
@Get('media')
async listMedia(@Query() dto: MediaQueryDto) {
  const { categoryId, type, sort, page, size } = dto;
  return this.videoService.listMedia(categoryId, type, undefined, sort, page, size);
}

@Get('episodes')
async getPublicEpisodeList(@Query() dto: EpisodeListDto) {
  const page = Math.max(1, parseInt(dto.page || '1', 10));
  const size = Math.min(200, Math.max(1, parseInt(dto.size || '20', 10)));
  
  // 优先使用shortId，如果没有则使用ID
  if (dto.seriesShortId) {
    return this.videoService.getEpisodeList(dto.seriesShortId, true, page, size, undefined);
  } else if (dto.seriesId) {
    return this.videoService.getEpisodeList(dto.seriesId, false, page, size, undefined);
  } else {
    // 如果都没有提供，返回所有剧集
    return this.videoService.getEpisodeList(undefined, false, page, size, undefined);
  }
}

}