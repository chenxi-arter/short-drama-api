import { Controller, Get, Query } from '@nestjs/common';
import { VideoService } from './video.service';
import { HomeVideosDto } from './dto/home-videos.dto';

/**
 * 首页相关控制器
 */
@Controller('/api/home')
export class HomeController {
  constructor(private readonly videoService: VideoService) {}

  /**
   * 获取首页视频列表
   * @param dto 请求参数
   * @returns 首页视频列表数据
   */
  @Get('getvideos')
  async getVideos(@Query() dto: HomeVideosDto) {
    return this.videoService.getHomeVideos(dto.channeid, dto.page || 1);
  }
}