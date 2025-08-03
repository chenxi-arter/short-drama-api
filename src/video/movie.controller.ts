import { Controller } from '@nestjs/common';
import { VideoService } from './video.service';
import { BaseModuleController } from './base-module.controller';

/**
 * 电影相关控制器
 */
@Controller('/api/movie')
export class MovieController extends BaseModuleController {
  constructor(videoService: VideoService) {
    super(videoService);
  }

  /**
   * 获取电影模块的默认频道ID
   */
  protected getDefaultChannelId(): string {
    return '2';
  }

  /**
   * 获取电影视频列表的服务方法
   */
  protected getModuleVideosMethod() {
    return this.videoService.getMovieVideos;
  }
}