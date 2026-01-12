import { Controller, Post, Body, Get, Query, UseGuards, Req, Param, BadRequestException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VideoService } from './video.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MediaQueryDto } from './dto/media-query.dto';
import { EpisodeListDto } from './dto/episode-list.dto';
import { BaseController } from './controllers/base.controller';
import { User } from '../user/entity/user.entity';

/**
 * 视频控制器（兼容层）
 *
 * ⚠️ 重要说明：
 * 此控制器保留所有原始API路径以确保向后兼容
 * 新的控制器已拆分到专门的文件中：
 * - ProgressController: /api/video/progress/*
 * - CommentController: /api/video/comment
 * - UrlController: /api/video/url/*
 * - ContentController: /api/video/*
 *
 * 建议新项目直接使用新的控制器
 */
@UseGuards(JwtAuthGuard)
@Controller('video')
export class VideoController extends BaseController {
  constructor(
    private readonly videoService: VideoService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {
    super();
  }

  // ==================== 向后兼容的API ====================

  /**
   * 保存观看进度（兼容旧API）
   * @deprecated 请使用 /api/video/progress POST
   */
  @Post('progress')
  async saveProgress(
    @Req() req,
    @Body('episodeIdentifier') episodeIdentifier: string | number,
    @Body('stopAtSecond') stopAtSecond: number,
  ) {
    try {
      if (!episodeIdentifier) {
        return this.error('剧集标识符不能为空', 400);
      }

      if (!stopAtSecond || stopAtSecond < 0) {
        return this.error('观看进度必须大于等于0', 400);
      }

      // 自动识别是shortId还是ID
      const isShortId = typeof episodeIdentifier === 'string' &&
        episodeIdentifier.length === 11 &&
        !/^\d+$/.test(episodeIdentifier);

      if (isShortId) {
        const episode = await this.videoService.getEpisodeByShortId(episodeIdentifier);
        if (!episode) {
          return this.error('剧集不存在', 404);
        }
        const result = await this.videoService.saveProgressWithBrowseHistory(
          req.user.userId,
          episode.id,
          stopAtSecond,
          req
        );
        return this.success(result, '观看进度保存成功');
      } else {
        const result = await this.videoService.saveProgressWithBrowseHistory(
          req.user.userId,
          Number(episodeIdentifier),
          stopAtSecond,
          req
        );
        return this.success(result, '观看进度保存成功');
      }
    } catch (error) {
      return this.handleServiceError(error, '保存观看进度失败');
    }
  }

  /**
   * 获取观看进度（兼容旧API）
   * @deprecated 请使用 /api/video/progress GET
   */
  @Get('progress')
  async getProgress(@Req() req, @Query('episodeIdentifier') episodeIdentifier: string) {
    try {
      if (!episodeIdentifier) {
        return this.error('剧集标识符不能为空', 400);
      }

      const isShortId = episodeIdentifier.length === 11 && !/^\d+$/.test(episodeIdentifier);

      if (isShortId) {
        const episode = await this.videoService.getEpisodeByShortId(episodeIdentifier);
        if (!episode) {
          return this.error('剧集不存在', 404);
        }
        const result = await this.videoService.getProgress(req.user.userId, episode.id);
        return this.success(result, '获取观看进度成功');
      } else {
        const result = await this.videoService.getProgress(req.user.userId, Number(episodeIdentifier));
        return this.success(result, '获取观看进度成功');
      }
    } catch (error) {
      return this.handleServiceError(error, '获取观看进度失败');
    }
  }

  /**
   * 添加评论（兼容旧API）
   * @deprecated 请使用 /api/video/comment POST
   */
  @Post('comment')
  async addComment(
    @Req() req,
    @Body('episodeIdentifier') episodeIdentifier: string | number,
    @Body('content') content: string,
    @Body('appearSecond') appearSecond?: number,
  ) {
    try {
      // 检查是否为游客用户
      const user = await this.userRepo.findOne({ where: { id: req.user.userId } });
      if (!user) {
        return this.error('用户不存在', 404, HttpStatus.NOT_FOUND);
      }
      
      // 游客检查（兼容tinyint类型：1=true，0=false）
      if (Boolean(user.isGuest)) {
        return this.error('游客用户暂不支持发表评论，请先注册成为正式用户', 403, HttpStatus.FORBIDDEN);
      }

      if (!episodeIdentifier) {
        return this.error('剧集标识符不能为空', 400);
      }

      if (!content || content.trim().length === 0) {
        return this.error('评论内容不能为空', 400);
      }

      if (content.length > 500) {
        return this.error('评论内容不能超过500个字符', 400);
      }

      const isShortId = typeof episodeIdentifier === 'string' &&
        episodeIdentifier.length === 11 &&
        !/^\d+$/.test(episodeIdentifier);

      // 获取episode并验证存在性
      const episode = await this.videoService.getEpisodeByShortId(
        isShortId ? episodeIdentifier : String(episodeIdentifier)
      );
      if (!episode) {
        return this.error('剧集不存在', 404);
      }

      // 使用 shortId 存储评论
      const result = await this.videoService.addComment(
        req.user.userId,
        episode.shortId,
        content.trim(),
        appearSecond
      );
      return this.success(result, '评论发表成功');
    } catch (error) {
      return this.handleServiceError(error, '发表评论失败');
    }
  }

  /**
   * 获取用户媒体列表（兼容旧API）
   * @deprecated 请使用 /api/video/media GET
   */
  @Get('media')
  async listMediaUser(@Req() req, @Query() dto: MediaQueryDto) {
    try {
      const { page, size } = this.normalizePagination(dto.page, dto.size, 200);

      const result = await this.videoService.listMedia(
        dto.categoryId,
        dto.type,
        req.user.userId,
        dto.sort || 'latest',
        page,
        size
      );

      return this.success(result, '获取媒体列表成功');
    } catch (error) {
      return this.handleServiceError(error, '获取媒体列表失败');
    }
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

      const result = await this.videoService.createEpisodeUrl(
        episodeId,
        quality.trim(),
        ossUrl.trim(),
        cdnUrl.trim(),
        subtitleUrl?.trim()
      );

      return this.success(result, '播放地址创建成功');
    } catch (error) {
      return this.handleServiceError(error, '创建播放地址失败');
    }
  }

  /**
   * 通过访问密钥获取播放地址（兼容旧API）
   * @deprecated 请使用 /api/video/url/access/:accessKey GET
   */
  @Get('episode-url/:accessKey')
  async getEpisodeUrlByAccessKey(@Param('accessKey') accessKey: string) {
    try {
      if (!accessKey || accessKey.trim().length === 0) {
        return this.error('访问密钥不能为空', 400);
      }

      const result = await this.videoService.getEpisodeUrlByAccessKey(accessKey.trim());
      return this.success(result, '获取播放地址成功');
    } catch (error) {
      return this.handleServiceError(error, '获取播放地址失败');
    }
  }

  /**
   * 通过POST获取播放地址（兼容旧API）
   * @deprecated 请使用 /api/video/url/query POST
   */
  @Post('episode-url/query')
  async postEpisodeUrlByKey(@Body() body: any) {
    try {
      const { type, accessKey, key } = body || {};

      if (type && accessKey) {
        const normalized = String(type).toLowerCase();
        if (normalized !== 'episode' && normalized !== 'url') {
          return this.error("type仅支持'episode'或'url'", 400);
        }
        const prefix = normalized === 'episode' ? 'ep' : 'url';
        const result = await this.videoService.getEpisodeUrlByKey(prefix, String(accessKey));
        return this.success(result, '获取播放地址成功');
      }

      if (key && typeof key === 'string' && key.includes(':')) {
        const [prefix, raw] = key.split(':', 2);
        const result = await this.videoService.getEpisodeUrlByKey(prefix, raw);
        return this.success(result, '获取播放地址成功');
      }

      return this.error("请求体应包含{type:'episode'|'url', accessKey}，或兼容的{key:'ep:<accessKey>'}格式", 400);
    } catch (error) {
      return this.handleServiceError(error, '获取播放地址失败');
    }
  }

  /**
   * 更新剧集续集状态（兼容旧API）
   * @deprecated 请使用 /api/video/url/episode/sequel POST
   */
  @Post('episode-sequel')
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
      return this.success(result, '续集状态更新成功');
    } catch (error) {
      return this.handleServiceError(error, '更新续集状态失败');
    }
  }

  /**
   * 批量生成访问密钥（兼容旧API）
   * @deprecated 请使用 /api/video/url/generate-keys POST
   */
  @Post('generate-access-keys')
  async generateAccessKeysForExisting() {
    try {
      const result = await this.videoService.generateAccessKeysForExisting();
      return this.success(result, '访问密钥生成完成');
    } catch (error) {
      return this.handleServiceError(error, '生成访问密钥失败');
    }
  }

  /**
   * 获取剧集列表（兼容旧API）
   * @deprecated 请使用 /api/video/episodes GET
   */
  @Get('episodes')
  async getEpisodeList(@Query() dto: EpisodeListDto, @Req() req) {
    try {
      const { page, size } = this.normalizePagination(dto.page, dto.size, 200);

      if (dto.seriesShortId) {
        const result = await this.videoService.getEpisodeList(
          dto.seriesShortId,
          true,
          page,
          size,
          req.user?.userId
        );
        return result;
      } else if (dto.seriesId) {
        const result = await this.videoService.getEpisodeList(
          dto.seriesId,
          false,
          page,
          size,
          req.user?.userId
        );
        return result;
      } else {
        const result = await this.videoService.getEpisodeList(
          undefined,
          false,
          page,
          size,
          req.user?.userId
        );
        return result;
      }
    } catch (error) {
      return this.handleServiceError(error, '获取剧集列表失败');
    }
  }
}