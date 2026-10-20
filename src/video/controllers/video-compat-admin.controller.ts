/**
 * 播放地址写入控制器（兼容旧接口，仅管理员）
 *
 * 安全审计 XG-04：
 * 旧实现里 POST /api/video/episode-url 位于 VideoController（类级 JwtAuthGuard，用户级），
 * 任何登录用户都能给任意 episodeId 写入任意 ossUrl/cdnUrl（含 http、恶意 m3u8），
 * 配合泄露的 JWT_SECRET 等同匿名可写 → 全站视频流劫持。
 *
 * 修复要点：
 * 1. 从用户级控制器中拆出，改挂 AdminJwtAuthGuard（校验 typ=admin，且用独立的 ADMIN_JWT_SECRET）；
 * 2. 写入前强制 HTTPS 校验，杜绝 javascript:/data:/http 等来源；
 * 3. 路径仍为 POST /api/video/episode-url，调用方只需换成管理员 token。
 */
import { Body, Controller, Post, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminJwtAuthGuard } from '../../admin/guards/admin-jwt-auth.guard';
import { VideoService } from '../video.service';
import { BaseController } from './base.controller';

@ApiTags('播放地址（管理员）')
@Controller('video')
@UseGuards(AdminJwtAuthGuard)
@ApiBearerAuth()
export class VideoCompatAdminController extends BaseController {
  constructor(private readonly videoService: VideoService) {
    super();
  }

  private validateHttpsUrl(value: string, fieldName: string): string {
    let parsed: URL;
    try {
      parsed = new URL(value.trim());
    } catch {
      throw new BadRequestException(`${fieldName}格式不正确`);
    }

    if (parsed.protocol !== 'https:') {
      throw new BadRequestException(`${fieldName}必须是 HTTPS URL`);
    }

    return parsed.toString();
  }

  /**
   * 创建剧集播放地址（兼容旧API）
   * @deprecated 请使用 /api/video/url/episode POST
   */
  @Post('episode-url')
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

      const safeOssUrl = this.validateHttpsUrl(ossUrl, 'OSS地址');
      const safeCdnUrl = this.validateHttpsUrl(cdnUrl, 'CDN地址');
      const safeSubtitleUrl = subtitleUrl?.trim()
        ? this.validateHttpsUrl(subtitleUrl, '字幕地址')
        : undefined;

      const result = await this.videoService.createEpisodeUrl(
        episodeId,
        quality.trim(),
        safeOssUrl,
        safeCdnUrl,
        safeSubtitleUrl,
      );

      return this.success(result, '播放地址创建成功');
    } catch (error) {
      return this.handleServiceError(error, '创建播放地址失败');
    }
  }
}
