import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { VideoService } from '../video.service';
import { MediaQueryDto } from '../dto/media-query.dto';
import { EpisodeListDto } from '../dto/episode-list.dto';
import { BaseController } from './base.controller';

/**
 * 内容控制器
 * 处理内容列表和媒体相关的所有API
 */
@Controller('video')
export class ContentController extends BaseController {
  constructor(private readonly videoService: VideoService) {
    super();
  }

  /**
   * 获取用户媒体列表（需要登录）
   */
  @UseGuards(JwtAuthGuard)
  @Get('media')
  async listMediaUser(
    @Req() req,
    @Query() dto: MediaQueryDto,
  ) {
    try {
      const { page, size } = this.normalizePagination(dto.page, dto.size, 50);

      const result = await this.videoService.listMedia(
        dto.categoryId,
        dto.type,
        req.user.userId,
        dto.sort || 'latest',
        page,
        size
      );

      return this.success(result, '获取媒体列表成功', 200);
    } catch (error) {
      return this.handleServiceError(error, '获取媒体列表失败');
    }
  }

  /**
   * 获取剧集列表
   * 支持公开访问和登录用户个性化推荐
   */
  @Get('episodes')
  async getEpisodeList(@Query() dto: EpisodeListDto, @Req() req) {
    try {
      const { page, size } = this.normalizePagination(dto.page, dto.size, 200);

      // 优先使用shortId，如果没有则使用ID
      if (dto.seriesShortId) {
        const result = await this.videoService.getEpisodeList(
          dto.seriesShortId,
          true,
          page,
          size,
          req.user?.userId
        );
        return this.success(result, '获取剧集列表成功', 200);
      } else if (dto.seriesId) {
        const result = await this.videoService.getEpisodeList(
          dto.seriesId,
          false,
          page,
          size,
          req.user?.userId
        );
        return this.success(result, '获取剧集列表成功', 200);
      } else {
        // 如果都没有提供，返回所有剧集
        const result = await this.videoService.getEpisodeList(
          undefined,
          false,
          page,
          size,
          req.user?.userId
        );
        return this.success(result, '获取剧集列表成功', 200);
      }
    } catch (error) {
      return this.handleServiceError(error, '获取剧集列表失败');
    }
  }
}
