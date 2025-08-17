import { Controller, Post, Body, Get, Query, UseGuards, Req, Param, BadRequestException } from '@nestjs/common';
import { VideoService } from './video.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MediaQueryDto } from './dto/media-query.dto';
import { EpisodeListDto } from './dto/episode-list.dto';

@UseGuards(JwtAuthGuard)
@Controller('/api/video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}
  /* 记录/更新断点（支持ID或ShortID自动识别） */
  @Post('progress')
  async saveProgress(
    @Req() req,
    @Body('episodeIdentifier') episodeIdentifier: string | number,
    @Body('stopAtSecond') stopAtSecond: number,
  ) {
    // 自动识别是shortId还是ID
    const isShortId = typeof episodeIdentifier === 'string' && episodeIdentifier.length === 11 && !/^\d+$/.test(episodeIdentifier);
    if (isShortId) {
      // 通过shortId找到episode ID
      const episode = await this.videoService.getEpisodeByShortId(episodeIdentifier as string);
      if (!episode) {
        throw new BadRequestException('剧集不存在');
      }
      return this.videoService.saveProgress(req.user.userId, episode.id, stopAtSecond);
    } else {
      return this.videoService.saveProgress(req.user.userId, Number(episodeIdentifier), stopAtSecond);
    }
  }

  /* 拉取断点（支持ID或shortId自动识别） */
  @Get('progress')
  async getProgress(@Req() req, @Query('episodeIdentifier') episodeIdentifier: string) {
    // 自动识别是shortId还是ID（shortId长度为11，不包含连字符）
    const isShortId = episodeIdentifier.length === 11 && !/^\d+$/.test(episodeIdentifier);
    if (isShortId) {
      // 通过shortId找到episode ID
      const episode = await this.videoService.getEpisodeByShortId(episodeIdentifier);
      if (!episode) {
        throw new BadRequestException('剧集不存在');
      }
      return this.videoService.getProgress(req.user.userId, episode.id);
    } else {
      return this.videoService.getProgress(req.user.userId, Number(episodeIdentifier));
    }
  }

  /* 发弹幕/评论（支持ID或ShortID自动识别） */
  @Post('comment')
  async addComment(
    @Req() req,
    @Body('episodeIdentifier') episodeIdentifier: string | number,
    @Body('content') content: string,
    @Body('appearSecond') appearSecond?: number,
  ) {
    // 自动识别是shortId还是ID
    const isShortId = typeof episodeIdentifier === 'string' && episodeIdentifier.length === 11 && !/^\d+$/.test(episodeIdentifier);
    if (isShortId) {
      // 通过shortId找到episode ID
      const episode = await this.videoService.getEpisodeByShortId(episodeIdentifier as string);
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

/* 通过POST获取播放地址
 * 推荐：Body { type: 'episode' | 'url', accessKey: string }
 * 兼容：Body { key: 'ep:<accessKey>' | 'url:<accessKey>' }
 */
@Post('episode-url/query')
async postEpisodeUrlByKey(@Body() body: any) {
  const { type, accessKey, key } = body || {};
  if (type && accessKey) {
    const normalized = String(type).toLowerCase();
    if (normalized !== 'episode' && normalized !== 'url') {
      throw new BadRequestException("type 仅支持 'episode' 或 'url'");
    }
    const prefix = normalized === 'episode' ? 'ep' : 'url';
    return this.videoService.getEpisodeUrlByKey(prefix, String(accessKey));
  }
  if (key && typeof key === 'string' && key.includes(':')) {
    const [prefix, raw] = key.split(':', 2);
    return this.videoService.getEpisodeUrlByKey(prefix, raw);
  }
  throw new BadRequestException("请求体应包含 { type: 'episode'|'url', accessKey }，或兼容的 { key: 'ep:<accessKey>' } 格式");
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

/* 获取剧集列表（不包含播放链接） */
@Get('episodes')
async getEpisodeList(@Query() dto: EpisodeListDto, @Req() req) {
  const page = parseInt(dto.page || '1', 10);
  const size = parseInt(dto.size || '20', 10);
  
  // 优先使用shortId，如果没有则使用ID
  if (dto.seriesShortId) {
    return this.videoService.getEpisodeList(dto.seriesShortId, true, page, size, req.user?.userId, req);
  } else if (dto.seriesId) {
    return this.videoService.getEpisodeList(dto.seriesId, false, page, size, req.user?.userId, req);
  } else {
    // 如果都没有提供，返回所有剧集
    return this.videoService.getEpisodeList(undefined, false, page, size, req.user?.userId, req);
  }
}
}