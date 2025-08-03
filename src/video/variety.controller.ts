import { Controller } from '@nestjs/common';
import { VideoService } from './video.service';
import { BaseModuleController } from './base-module.controller';

/**
 * 综艺相关控制器
 */
@Controller('/api/variety')
export class VarietyController extends BaseModuleController {
  constructor(videoService: VideoService) {
    super(videoService);
  }

  /**
   * 获取综艺模块的默认频道ID
   */
  protected getDefaultChannelId(): string {
    return '3';
  }

  /**
   * 获取综艺视频列表的服务方法
   */
  protected getModuleVideosMethod() {
    return this.videoService.getVarietyVideos;
  }
}