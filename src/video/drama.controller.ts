import { Controller } from '@nestjs/common';
import { VideoService } from './video.service';
import { BaseModuleController } from './base-module.controller';

/**
 * 短剧相关控制器
 */
@Controller('/api/drama')
export class DramaController extends BaseModuleController {
  constructor(videoService: VideoService) {
    super(videoService);
  }

  /**
   * 获取短剧模块的默认频道ID
   */
  protected getDefaultChannelId(): string {
    return '1';
  }

  /**
   * 获取短剧视频列表的服务方法
   */
  protected getModuleVideosMethod() {
    return this.videoService.getDramaVideos;
  }
}