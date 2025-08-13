import { Controller, Get } from '@nestjs/common';
import { VideoService } from './video.service';
import { BaseModuleController } from './base-module.controller';

/**
 * 首页相关控制器
 */
@Controller('/api/home')
export class HomeController extends BaseModuleController {
  constructor(videoService: VideoService) {
    super(videoService);
  }

  /**
   * 获取首页模块的默认频道ID
   */
  protected getDefaultChannelId(): number {
    return 1;
  }

  /**
   * 获取首页视频列表的服务方法
   */
  protected getModuleVideosMethod() {
    return (channeid: number, page: number) => this.videoService.getHomeVideos(channeid, page);
  }

  /**
   * 获取所有分类列表
   * @returns 所有可用的视频分类
   */
  @Get('categories')
  async getCategories() {
    return this.videoService.listCategories();
  }
}