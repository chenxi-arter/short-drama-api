import { Controller, Post, Body, Get, Query, UseGuards, Req, Param } from '@nestjs/common';
import { VideoService } from './video.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MediaQueryDto } from './dto/media-query.dto';
import { VideoDetailsDto } from './dto/video-details.dto';

@UseGuards(JwtAuthGuard)
@Controller('/api/video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}
  /* 记录/更新断点 */
  @Post('progress')
  async saveProgress(
    @Req() req,
    @Body('episodeId') episodeId: number,
    @Body('stopAtSecond') stopAtSecond: number,
  ) {
    return this.videoService.saveProgress(req.user.userId, episodeId, stopAtSecond);
  }

  /* 拉取断点 */
  @Get('progress')
  async getProgress(@Req() req, @Query('episodeId') episodeId: number) {
    return this.videoService.getProgress(req.user.userId, episodeId);
  }

  /* 发弹幕/评论 */
  @Post('comment')
  async addComment(
    @Req() req,
    @Body('episodeId') episodeId: number,
    @Body('content') content: string,
    @Body('appearSecond') appearSecond?: number,
  ) {
    return this.videoService.addComment(req.user.userId, episodeId, content, appearSecond);
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
  return this.videoService.getVideoDetails(dto.id);
}
}