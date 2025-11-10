import { Controller, Get, Post, Put, Delete, Param, Body, Query, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, LessThanOrEqual, MoreThanOrEqual, Between } from 'typeorm';
import { Episode } from '../../video/entity/episode.entity';
import { EpisodeUrl } from '../../video/entity/episode-url.entity';
import { R2StorageService } from '../../core/storage/r2-storage.service';
import { GetVideoPresignedUrlDto, VideoUploadCompleteDto } from '../dto/presigned-upload.dto';
import { randomUUID } from 'crypto';

@Controller('admin/episodes')
export class AdminEpisodesController {
  constructor(
    @InjectRepository(Episode)
    private readonly episodeRepo: Repository<Episode>,
    @InjectRepository(EpisodeUrl)
    private readonly episodeUrlRepo: Repository<EpisodeUrl>,
    private readonly storage: R2StorageService,
  ) {}

  private normalize(raw: Record<string, unknown>): Partial<Episode> {
    const toInt = (v: unknown): number | undefined => (typeof v === 'string' || typeof v === 'number') ? Number(v) : undefined;
    const toStr = (v: unknown): string | undefined => (typeof v === 'string') ? v : undefined;
    const toBool = (v: unknown): boolean | undefined => {
      if (v === undefined || v === null) return undefined;
      if (typeof v === 'boolean') return v;
      if (v === 'true' || v === '1' || v === 1) return true;
      if (v === 'false' || v === '0' || v === 0) return false;
      return undefined;
    };
    const payload: Partial<Episode> = {};
    
    // 字符串字段 - 可编辑的文本字段
    const title = toStr(raw.title); if (title !== undefined) payload.title = title;
    const status = toStr(raw.status); if (status !== undefined) payload.status = status;
    // shortId 和 accessKey 为只读字段，不允许编辑
    
    // 数字字段 - 可编辑的数值字段
    const seriesId = toInt(raw.seriesId); if (seriesId !== undefined) payload.seriesId = seriesId;
    const episodeNumber = toInt(raw.episodeNumber); if (episodeNumber !== undefined) payload.episodeNumber = episodeNumber;
    const duration = toInt(raw.duration); if (duration !== undefined) payload.duration = duration;
    // playCount, likeCount, dislikeCount, favoriteCount 为只读字段，不允许编辑
    
    // 布尔值字段
    const isVertical = toBool(raw.isVertical); if (isVertical !== undefined) payload.isVertical = isVertical;
    const hasSequel = toBool(raw.hasSequel); if (hasSequel !== undefined) payload.hasSequel = hasSequel;
    
    return payload;
  }

  @Get()
  async list(
    @Query('page') page = 1, 
    @Query('size') size = 20, 
    @Query('seriesId') seriesId?: string,
    @Query('minDuration') minDuration?: string,
    @Query('maxDuration') maxDuration?: string
  ) {
    const take = Math.min(200, Math.max(Number(size) || 20, 1));
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
    
    // 构建查询条件
    const whereClause: FindOptionsWhere<Episode> = {};
    
    // 系列ID筛选
    if (seriesId) {
      whereClause.seriesId = Number(seriesId);
    }
    
    // 时长筛选
    const minDur = minDuration ? Number(minDuration) : undefined;
    const maxDur = maxDuration ? Number(maxDuration) : undefined;
    
    if (minDur !== undefined && !isNaN(minDur) && maxDur !== undefined && !isNaN(maxDur)) {
      // 同时指定最小和最大时长，使用Between
      whereClause.duration = Between(minDur, maxDur);
    } else if (minDur !== undefined && !isNaN(minDur)) {
      // 只指定最小时长，返回大于等于该时长的剧集
      whereClause.duration = MoreThanOrEqual(minDur);
    } else if (maxDur !== undefined && !isNaN(maxDur)) {
      // 只指定最大时长，返回小于等于该时长的剧集
      whereClause.duration = LessThanOrEqual(maxDur);
    }
    
    const [items, total] = await this.episodeRepo.findAndCount({
      skip,
      take,
      order: { id: 'DESC' },
      relations: ['series'],
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
    });
    
    // 映射数据，添加 seriesTitle 字段以便前端直接访问
    const mappedItems = items.map(item => ({
      ...item,
      seriesTitle: item.series?.title || '',
    }));
    
    return { total, items: mappedItems, page: Number(page) || 1, size: take };
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.episodeRepo.findOne({ where: { id: Number(id) }, relations: ['series', 'urls'] });
  }

  @Post()
  async create(@Body() body: Partial<Episode>) {
    const entity = this.episodeRepo.create(this.normalize(body));
    return this.episodeRepo.save(entity);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: Partial<Episode>) {
    const payload = this.normalize(body);
    await this.episodeRepo.update({ id: Number(id) }, payload);
    return this.episodeRepo.findOne({ where: { id: Number(id) }, relations: ['series', 'urls'] });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.episodeRepo.delete({ id: Number(id) });
    return { success: true };
  }

  /**
   * 获取剧集下载地址
   * 返回指定剧集的所有清晰度播放地址，用于下载
   */
  @Get(':id/download-urls')
  async getDownloadUrls(@Param('id') id: string) {
    const episode = await this.episodeRepo.findOne({ 
      where: { id: Number(id) }, 
      relations: ['series', 'urls'] 
    });
    
    if (!episode) {
      return { success: false, message: '剧集不存在' };
    }

    const downloadUrls = episode.urls?.map(url => ({
      id: url.id,
      quality: url.quality,
      cdnUrl: url.cdnUrl,
      ossUrl: url.ossUrl,
      originUrl: url.originUrl,
      subtitleUrl: url.subtitleUrl,
      accessKey: url.accessKey,
    })) || [];

    return {
      success: true,
      episodeId: episode.id,
      episodeShortId: episode.shortId,
      episodeTitle: episode.title,
      episodeNumber: episode.episodeNumber,
      seriesId: episode.seriesId,
      seriesTitle: episode.series?.title || '',
      duration: episode.duration,
      downloadUrls
    };
  }

  /**
   * 获取预签名上传 URL（前端直传视频）
   * GET /api/admin/episodes/:id/presigned-upload-url?filename=video.mp4&contentType=video/mp4&quality=720p
   */
  @Get(':id/presigned-upload-url')
  async getPresignedUploadUrl(
    @Param('id') id: string,
    @Query() query: GetVideoPresignedUrlDto,
  ) {
    // 验证 Episode 是否存在
    const episode = await this.episodeRepo.findOne({ where: { id: Number(id) } });
    if (!episode) {
      throw new NotFoundException('Episode not found');
    }

    const { filename, contentType, quality = '720p' } = query;

    // 验证文件类型
    const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    if (!allowedVideoTypes.includes(contentType)) {
      throw new BadRequestException('Invalid video type. Allowed: MP4, MPEG, MOV, AVI, WebM');
    }

    // 验证文件名安全性
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new BadRequestException('Invalid filename');
    }

    // 验证文件扩展名
    const extension = filename.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['mp4', 'mpeg', 'mpg', 'mov', 'avi', 'webm'];
    if (!extension || !allowedExtensions.includes(extension)) {
      throw new BadRequestException('Invalid file extension');
    }

    // 验证清晰度参数
    const allowedQualities = ['360p', '480p', '720p', '1080p', '1440p', '2160p'];
    if (quality && !allowedQualities.includes(quality)) {
      throw new BadRequestException('Invalid quality parameter');
    }

    // 生成唯一文件路径
    const fileKey = `episodes/${id}/video_${quality}_${randomUUID()}.${extension}`;

    // 生成预签名 URL（有效期 2 小时，视频文件上传时间较长）
    const uploadUrl = await this.storage.generatePresignedUploadUrl(fileKey, contentType, 7200);
    
    // 获取公开访问 URL
    const publicUrl = this.storage.getPublicUrl(fileKey);

    return {
      uploadUrl,
      fileKey,
      publicUrl,
      quality,
    };
  }

  /**
   * 通知后端视频上传完成
   * POST /api/admin/episodes/:id/upload-complete
   */
  @Post(':id/upload-complete')
  async uploadComplete(
    @Param('id') id: string,
    @Body() body: VideoUploadCompleteDto,
  ) {
    const { fileKey, publicUrl, quality, fileSize } = body;

    // 验证参数
    if (!fileKey || !publicUrl) {
      throw new BadRequestException('fileKey and publicUrl are required');
    }

    // 验证 Episode 是否存在
    const episode = await this.episodeRepo.findOne({ where: { id: Number(id) } });
    if (!episode) {
      throw new NotFoundException('Episode not found');
    }

    // 查找是否已存在相同清晰度的记录
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereCondition: any = {
      episodeId: Number(id),
      quality: quality || null,
    };
    
    const existingUrl = await this.episodeUrlRepo.findOne({
      where: whereCondition,
    });

    if (existingUrl) {
      // 更新现有记录
      await this.episodeUrlRepo.update(
        { id: existingUrl.id },
        {
          cdnUrl: publicUrl,
          ossUrl: publicUrl,
          originUrl: publicUrl,
          updatedAt: new Date(),
        },
      );
    } else {
      // 创建新记录
      const episodeUrl = this.episodeUrlRepo.create({
        episodeId: Number(id),
        quality: quality || undefined,
        cdnUrl: publicUrl,
        ossUrl: publicUrl,
        originUrl: publicUrl,
      });
      await this.episodeUrlRepo.save(episodeUrl);
    }

    return {
      success: true,
      message: 'Video upload completed',
      publicUrl,
      quality,
      fileSize,
    };
  }
}


