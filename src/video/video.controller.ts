import { Controller, Post, Body, Get, Query, UseGuards, Req, Param, BadRequestException } from '@nestjs/common';
import { VideoService } from './video.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MediaQueryDto } from './dto/media-query.dto';
import { VideoDetailsDto } from './dto/video-details.dto';

@UseGuards(JwtAuthGuard)
@Controller('/api/video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}
  /* 记录/更新断点（支持ID或UUID自动识别） */
  @Post('progress')
  async saveProgress(
    @Req() req,
    @Body('episodeIdentifier') episodeIdentifier: string | number,
    @Body('stopAtSecond') stopAtSecond: number,
  ) {
    // 自动识别是UUID还是ID
    const isUuid = typeof episodeIdentifier === 'string' && episodeIdentifier.includes('-');
    if (isUuid) {
      // 通过UUID找到episode ID
      const episode = await this.videoService.getEpisodeByUuid(episodeIdentifier as string);
      if (!episode) {
        throw new BadRequestException('剧集不存在');
      }
      return this.videoService.saveProgress(req.user.userId, episode.id, stopAtSecond);
    } else {
      return this.videoService.saveProgress(req.user.userId, Number(episodeIdentifier), stopAtSecond);
    }
  }

  /* 拉取断点（支持ID或UUID自动识别） */
  @Get('progress')
  async getProgress(@Req() req, @Query('episodeIdentifier') episodeIdentifier: string) {
    // 自动识别是UUID还是ID
    const isUuid = episodeIdentifier.includes('-');
    if (isUuid) {
      // 通过UUID找到episode ID
      const episode = await this.videoService.getEpisodeByUuid(episodeIdentifier);
      if (!episode) {
        throw new BadRequestException('剧集不存在');
      }
      return this.videoService.getProgress(req.user.userId, episode.id);
    } else {
      return this.videoService.getProgress(req.user.userId, Number(episodeIdentifier));
    }
  }

  /* 发弹幕/评论（支持ID或UUID自动识别） */
  @Post('comment')
  async addComment(
    @Req() req,
    @Body('episodeIdentifier') episodeIdentifier: string | number,
    @Body('content') content: string,
    @Body('appearSecond') appearSecond?: number,
  ) {
    // 自动识别是UUID还是ID
    const isUuid = typeof episodeIdentifier === 'string' && episodeIdentifier.includes('-');
    if (isUuid) {
      // 通过UUID找到episode ID
      const episode = await this.videoService.getEpisodeByUuid(episodeIdentifier as string);
      if (!episode) {
        throw new BadRequestException('剧集不存在');
      }
      return this.videoService.addComment(req.user.userId, episode.id, content, appearSecond);
    } else {
      return this.videoService.addComment(req.user.userId, Number(episodeIdentifier), content, appearSecond);
    }
  }

@Get('media')
async listMediaUser(
  @Req() req,
  @Query() dto: MediaQueryDto,
) {
  return this.videoService.listMedia(dto.categoryId, dto.type, req.user.userId);
}

/* 获取视频详情 */
@Get('details')
async getVideoDetails(@Query() dto: VideoDetailsDto) {
  // 优先使用UUID，如果没有则使用ID（向后兼容）
  if (dto.uuid) {
    return this.videoService.getVideoDetails(dto.uuid, true);
  } else if (dto.id) {
    return this.videoService.getVideoDetails(dto.id, false);
  } else {
    throw new BadRequestException('必须提供uuid或id参数');
  }
}

/* 创建剧集播放地址 */
@Post('episode-url')
async createEpisodeUrl(
  @Body('episodeId') episodeId: number,
  @Body('quality') quality: string,
  @Body('ossUrl') ossUrl: string,
  @Body('cdnUrl') cdnUrl: string,
  @Body('subtitleUrl') subtitleUrl?: string,
) {
  return this.videoService.createEpisodeUrl(episodeId, quality, ossUrl, cdnUrl, subtitleUrl);
}

/* 通过访问密钥获取播放地址 */
@Get('episode-url/:accessKey')
async getEpisodeUrlByAccessKey(@Param('accessKey') accessKey: string) {
  return this.videoService.getEpisodeUrlByAccessKey(accessKey);
}

/* 更新剧集续集状态 */
@Post('episode-sequel')
async updateEpisodeSequel(
  @Body('episodeId') episodeId: number,
  @Body('hasSequel') hasSequel: boolean,
) {
  return this.videoService.updateEpisodeSequel(episodeId, hasSequel);
}

/* 批量生成访问密钥 */
@Post('generate-access-keys')
async generateAccessKeysForExisting() {
  return this.videoService.generateAccessKeysForExisting();
}
}