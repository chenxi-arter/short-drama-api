import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseInterceptors, UploadedFile, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Series } from '../../video/entity/series.entity';
import { FilterOption } from '../../video/entity/filter-option.entity';
import { VideoService } from '../../video/video.service';
import { R2StorageService } from '../../core/storage/r2-storage.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetPresignedUrlDto, UploadCompleteDto } from '../dto/presigned-upload.dto';
import { randomUUID } from 'crypto';
import axios from 'axios';
import * as https from 'https';

@Controller('admin/series')
export class AdminSeriesController {
  constructor(
    @InjectRepository(Series)
    private readonly seriesRepo: Repository<Series>,
    @InjectRepository(FilterOption)
    private readonly filterOptionRepo: Repository<FilterOption>,
    private readonly videoService: VideoService,
    private readonly storage: R2StorageService,
  ) {}

  /**
   * 根据中文名称查找 FilterOption ID
   * @param name 选项名称（如"大陆"、"国语"等）
   * @param typeCode 筛选器类型代码（如"region"、"language"等）
   */
  private async findFilterOptionIdByName(name: string, typeCode: string): Promise<number | undefined> {
    if (!name) return undefined;
    const option = await this.filterOptionRepo
      .createQueryBuilder('option')
      .innerJoin('option.filterType', 'filterType')
      .where('option.name = :name', { name })
      .andWhere('filterType.code = :typeCode', { typeCode })
      .getOne();
    return option?.id;
  }

  /**
   * 异步解析中文分类字段
   */
  private async resolveChineseFilters(raw: Record<string, unknown>): Promise<Partial<Series>> {
    const result: Partial<Series> = {};
    
    // 地区：支持中文名称或ID
    if (typeof raw.region === 'string') {
      const id = await this.findFilterOptionIdByName(raw.region, 'region');
      if (id) result.regionOptionId = id;
    }
    
    // 语言：支持中文名称或ID
    if (typeof raw.language === 'string') {
      const id = await this.findFilterOptionIdByName(raw.language, 'language');
      if (id) result.languageOptionId = id;
    }
    
    // 状态：支持中文名称或ID
    if (typeof raw.status === 'string') {
      const id = await this.findFilterOptionIdByName(raw.status, 'status');
      if (id) result.statusOptionId = id;
    }
    
    // 年份：支持中文名称或ID
    if (typeof raw.year === 'string') {
      const id = await this.findFilterOptionIdByName(raw.year, 'year');
      if (id) result.yearOptionId = id;
    }
    
    return result;
  }

  private normalize(raw: Record<string, unknown>): Partial<Series> {
    const toInt = (v: unknown): number | undefined => (typeof v === 'string' || typeof v === 'number') ? Number(v) : undefined;
    const toFloat = (v: unknown): number | undefined => (typeof v === 'string' || typeof v === 'number') ? Number(v) : undefined;
    const toBoolNum = (v: unknown): 0 | 1 | undefined =>
      v === undefined ? undefined : ((v === true || v === 'true' || v === 1 || v === '1') ? 1 : 0);
    const toBool = (v: unknown): boolean | undefined => {
      if (v === undefined || v === null) return undefined;
      if (typeof v === 'boolean') return v;
      if (v === 'true' || v === '1' || v === 1) return true;
      if (v === 'false' || v === '0' || v === 0) return false;
      return undefined;
    };
    const toDate = (v: unknown): Date | undefined => (typeof v === 'string' || v instanceof Date) ? new Date(v as any) : undefined;

    const payload: Partial<Series> = {};
    
    // 字符串字段 - 所有可编辑的文本字段
    if (typeof raw.title === 'string') payload.title = raw.title;
    if (typeof raw.description === 'string') payload.description = raw.description;
    if (typeof raw.coverUrl === 'string') payload.coverUrl = raw.coverUrl;
    if (typeof raw.starring === 'string') payload.starring = raw.starring;
    if (typeof raw.actor === 'string') payload.actor = raw.actor;
    if (typeof raw.director === 'string') payload.director = raw.director;
    if (typeof raw.upStatus === 'string') payload.upStatus = raw.upStatus;
    // externalId 和 shortId 为只读字段，不允许编辑

    // 数字字段 - 可编辑的数值字段
    const categoryId = toInt(raw.categoryId); if (categoryId !== undefined) payload.categoryId = categoryId;
    const score = toFloat(raw.score); if (score !== undefined) payload.score = score; // 可编辑
    const upCount = toInt(raw.upCount); if (upCount !== undefined) payload.upCount = upCount;
    const regionOptionId = toInt(raw.regionOptionId); if (regionOptionId !== undefined) payload.regionOptionId = regionOptionId;
    const languageOptionId = toInt(raw.languageOptionId); if (languageOptionId !== undefined) payload.languageOptionId = languageOptionId;
    const statusOptionId = toInt(raw.statusOptionId); if (statusOptionId !== undefined) payload.statusOptionId = statusOptionId;
    const yearOptionId = toInt(raw.yearOptionId); if (yearOptionId !== undefined) payload.yearOptionId = yearOptionId;
    // playCount, totalEpisodes, deletedBy 为只读字段，不允许编辑

    // 布尔值和日期字段
    const isCompleted = toBool(raw.isCompleted);
    if (isCompleted !== undefined) payload.isCompleted = isCompleted;
    const isActive = toBoolNum(raw.isActive); // 可编辑
    if (isActive !== undefined) payload.isActive = isActive;
    const releaseDate = toDate(raw.releaseDate); 
    if (releaseDate !== undefined) payload.releaseDate = releaseDate;
    // deletedAt 为只读字段，不允许编辑

    return payload;
  }

  @Get()
  async list(@Query('page') page = 1, @Query('size') size = 20, @Query('includeDeleted') includeDeleted?: string) {
    const take = Math.max(Number(size) || 20, 1);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
    
    const where = includeDeleted === 'true' ? {} : { isActive: 1 };
    const [items, total] = await this.seriesRepo.findAndCount({ 
      skip, 
      take, 
      order: { id: 'DESC' },
      where
    });
    return { total, items, page: Number(page) || 1, size: take };
  }

  @Get('deleted')
  async getDeleted(@Query('page') page = 1, @Query('size') size = 20) {
    const take = Math.max(Number(size) || 20, 1);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
    const [items, total] = await this.seriesRepo.findAndCount({ 
      skip, 
      take, 
      order: { deletedAt: 'DESC' },
      where: { isActive: 0 }
    });
    return { total, items, page: Number(page) || 1, size: take };
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.seriesRepo.findOne({ where: { id: Number(id) } });
  }

  @Post()
  async create(@Body() body: any) {
    // 先处理中文分类字段
    const chineseFilters = await this.resolveChineseFilters(body);
    // 再处理其他字段
    const normalized = this.normalize(body);
    // 合并结果，中文分类优先
    const payload = { ...normalized, ...chineseFilters };
    const entity = this.seriesRepo.create(payload);
    return this.seriesRepo.save(entity);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    // 先处理中文分类字段
    const chineseFilters = await this.resolveChineseFilters(body);
    // 再处理其他字段
    const normalized = this.normalize(body);
    // 合并结果，中文分类优先
    const payload = { ...normalized, ...chineseFilters };
    await this.seriesRepo.update({ id: Number(id) }, payload);
    return this.seriesRepo.findOne({ 
      where: { id: Number(id) },
      relations: ['category', 'regionOption', 'languageOption', 'statusOption', 'yearOption']
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    // 使用软删除而不是硬删除
    const result = await this.videoService.softDeleteSeries(Number(id));
    return result;
  }

  @Post(':id/restore')
  async restore(@Param('id') id: string) {
    const result = await this.videoService.restoreSeries(Number(id));
    return result;
  }

  // 直传文件并更新对应系列的封面
  @Post(':id/cover')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCover(
    @Param('id') id: string,
    @UploadedFile() file?: { buffer?: Buffer; originalname?: string; mimetype?: string },
  ) {
    if (!file || !file.buffer) throw new BadRequestException('file is required');
    const { url, key } = await this.storage.uploadBuffer(file.buffer, file.originalname, {
      keyPrefix: 'series/',
      contentType: file.mimetype,
    });
    const coverUrl = url ?? key;
    await this.seriesRepo.update({ id: Number(id) }, { coverUrl });
    return this.seriesRepo.findOne({ where: { id: Number(id) } });
  }

  // 从远程 URL 拉取并更新对应系列的封面
  @Post(':id/cover-from-url')
  async uploadCoverFromUrl(
    @Param('id') id: string,
    @Body('url') src?: string,
  ) {
    if (!src) throw new BadRequestException('url is required');
    const allowInsecure = process.env.ALLOW_INSECURE_EXTERNAL_FETCH === 'true';
    const httpsAgent = new https.Agent({ rejectUnauthorized: !allowInsecure });
    const resp = await axios.get(src, {
      responseType: 'arraybuffer' as const,
      httpsAgent,
      timeout: 15000,
    });
    const buffer = Buffer.from(resp.data);
    const contentType = resp.headers['content-type'] as string | undefined;
    const { url, key } = await this.storage.uploadBuffer(buffer, undefined, {
      keyPrefix: 'series/',
      contentType,
    });
    const coverUrl = url ?? key;
    await this.seriesRepo.update({ id: Number(id) }, { coverUrl });
    return this.seriesRepo.findOne({ where: { id: Number(id) } });
  }

  /**
   * 获取预签名上传 URL（前端直传）
   * GET /api/admin/series/:id/presigned-upload-url?filename=cover.jpg&contentType=image/jpeg
   */
  @Get(':id/presigned-upload-url')
  async getPresignedUploadUrl(
    @Param('id') id: string,
    @Query() query: GetPresignedUrlDto,
  ) {
    // 验证系列是否存在
    const series = await this.seriesRepo.findOne({ where: { id: Number(id) } });
    if (!series) {
      throw new NotFoundException('Series not found');
    }

    const { filename, contentType } = query;

    // 验证文件类型
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedImageTypes.includes(contentType)) {
      throw new BadRequestException('Invalid image type. Allowed: JPEG, PNG, WebP, GIF');
    }

    // 验证文件名安全性
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new BadRequestException('Invalid filename');
    }

    // 验证文件扩展名
    const extension = filename.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    if (!extension || !allowedExtensions.includes(extension)) {
      throw new BadRequestException('Invalid file extension');
    }

    // 生成唯一文件路径
    const fileKey = `series/${id}/cover_${randomUUID()}.${extension}`;

    // 生成预签名 URL（有效期 1 小时）
    const uploadUrl = await this.storage.generatePresignedUploadUrl(fileKey, contentType, 3600);
    
    // 获取公开访问 URL
    const publicUrl = this.storage.getPublicUrl(fileKey);

    return {
      uploadUrl,
      fileKey,
      publicUrl,
    };
  }

  /**
   * 通知后端上传完成
   * POST /api/admin/series/:id/upload-complete
   */
  @Post(':id/upload-complete')
  async uploadComplete(
    @Param('id') id: string,
    @Body() body: UploadCompleteDto,
  ) {
    const { fileKey, publicUrl } = body;

    // 验证参数
    if (!fileKey || !publicUrl) {
      throw new BadRequestException('fileKey and publicUrl are required');
    }

    // 验证系列是否存在
    const series = await this.seriesRepo.findOne({ where: { id: Number(id) } });
    if (!series) {
      throw new NotFoundException('Series not found');
    }

    // 更新系列的 coverUrl
    await this.seriesRepo.update(
      { id: Number(id) },
      { 
        coverUrl: publicUrl,
        updatedAt: new Date(),
      },
    );

    return {
      success: true,
      message: 'Cover upload completed',
      coverUrl: publicUrl,
    };
  }
}


