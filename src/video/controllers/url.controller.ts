import { Controller, Post, Body, Get, Param, BadRequestException } from '@nestjs/common';
import { VideoService } from '../video.service';
import { BaseController } from './base.controller';

/**
 * 播放地址控制器
 * 处理播放地址和访问密钥相关的所有API
 */
@Controller('video/url')
export class UrlController extends BaseController {
  constructor(private readonly videoService: VideoService) {
    super();
  }

  /**
   * 创建剧集播放地址
   */
  @Post('episode')
  async createEpisodeUrl(
    @Body('episodeId') episodeId: number,
    @Body('quality') quality: string,
    @Body('ossUrl') ossUrl: string,
    @Body('cdnUrl') cdnUrl: string,
    @Body('subtitleUrl') subtitleUrl?: string,
  ) {
    try {
      if (!episodeId || episodeId <= 0) {
        return this.error('剧集ID无效', 400);
      }

      if (!quality || quality.trim().length === 0) {
        return this.error('清晰度不能为空', 400);
      }

      if (!ossUrl || ossUrl.trim().length === 0) {
        return this.error('OSS地址不能为空', 400);
      }

      if (!cdnUrl || cdnUrl.trim().length === 0) {
        return this.error('CDN地址不能为空', 400);
      }

      const result = await this.videoService.createEpisodeUrl(
        episodeId,
        quality.trim(),
        ossUrl.trim(),
        cdnUrl.trim(),
        subtitleUrl?.trim()
      );

      return this.success(result, '播放地址创建成功', 200);
    } catch (error) {
      return this.handleServiceError(error, '创建播放地址失败');
    }
  }

  /**
   * 通过访问密钥获取播放地址
   */
  @Get('access/:accessKey')
  async getEpisodeUrlByAccessKey(@Param('accessKey') accessKey: string) {
    try {
      if (!accessKey || accessKey.trim().length === 0) {
        return this.error('访问密钥不能为空', 400);
      }

      const result = await this.videoService.getEpisodeUrlByAccessKey(accessKey.trim());
      return this.success(result, '获取播放地址成功', 200);
    } catch (error) {
      return this.handleServiceError(error, '获取播放地址失败');
    }
  }

  /**
   * 通过POST获取播放地址
   * 支持新格式和兼容旧格式
   */
  @Post('query')
  async getEpisodeUrlByKey(@Body() body: any) {
    try {
      const { type, accessKey, key } = body || {};

      if (type && accessKey) {
        const normalized = String(type).toLowerCase();
        if (normalized !== 'episode' && normalized !== 'url') {
          return this.error("type仅支持'episode'或'url'", 400);
        }
        const prefix = normalized === 'episode' ? 'ep' : 'url';
        const result = await this.videoService.getEpisodeUrlByKey(prefix, String(accessKey));
        return this.success(result, '获取播放地址成功', 200);
      }

      if (key && typeof key === 'string' && key.includes(':')) {
        const [prefix, raw] = key.split(':', 2);
        const result = await this.videoService.getEpisodeUrlByKey(prefix, raw);
        return this.success(result, '获取播放地址成功', 200);
      }

      return this.error("请求体应包含{type:'episode'|'url', accessKey}，或兼容的{key:'ep:<accessKey>'}格式", 400);
    } catch (error) {
      return this.handleServiceError(error, '获取播放地址失败');
    }
  }

  /**
   * 更新剧集续集状态
   */
  @Post('episode/sequel')
  async updateEpisodeSequel(
    @Body('episodeId') episodeId: number,
    @Body('hasSequel') hasSequel: boolean,
  ) {
    try {
      if (!episodeId || episodeId <= 0) {
        return this.error('剧集ID无效', 400);
      }

      if (typeof hasSequel !== 'boolean') {
        return this.error('续集状态必须是布尔值', 400);
      }

      const result = await this.videoService.updateEpisodeSequel(episodeId, hasSequel);
      return this.success(result, '续集状态更新成功', 200);
    } catch (error) {
      return this.handleServiceError(error, '更新续集状态失败');
    }
  }

  /**
   * 批量生成访问密钥
   */
  @Post('generate-keys')
  async generateAccessKeysForExisting() {
    try {
      const result = await this.videoService.generateAccessKeysForExisting();
      return this.success(result, '访问密钥生成完成', 200);
    } catch (error) {
      return this.handleServiceError(error, '生成访问密钥失败');
    }
  }
}
