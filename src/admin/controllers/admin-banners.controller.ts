import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseInterceptors, UploadedFile, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Banner } from '../../video/entity/banner.entity';
import { R2StorageService } from '../../core/storage/r2-storage.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetPresignedUrlDto, UploadCompleteDto } from '../dto/presigned-upload.dto';
import { randomUUID } from 'crypto';
import axios from 'axios';
import * as https from 'https';

@Controller('admin/banners')
export class AdminBannersController {
  constructor(
    @InjectRepository(Banner)
    private readonly bannerRepo: Repository<Banner>,
    private readonly storage: R2StorageService,
  ) {}

  private normalize(raw: Record<string, unknown>): Partial<Banner> {
    const toInt = (v: unknown): number | undefined => (typeof v === 'string' || typeof v === 'number') ? Number(v) : undefined;
    const toBool = (v: unknown): boolean | undefined =>
      v === undefined ? undefined : (v === true || v === 'true' || v === 1 || v === '1');
    const toDate = (v: unknown): Date | undefined => (typeof v === 'string' || v instanceof Date) ? new Date(v as any) : undefined;

    const payload: Partial<Banner> = {};
    // strings
    if (typeof raw.title === 'string') payload.title = raw.title;
    if (typeof raw.imageUrl === 'string') payload.imageUrl = raw.imageUrl;
    if (typeof raw.linkUrl === 'string') payload.linkUrl = raw.linkUrl;
    if (typeof raw.description === 'string') payload.description = raw.description;

    // numbers
    const seriesId = toInt(raw.seriesId); if (seriesId !== undefined) payload.seriesId = seriesId;
    const categoryId = toInt(raw.categoryId); if (categoryId !== undefined) payload.categoryId = categoryId;
    const weight = toInt(raw.weight); if (weight !== undefined) payload.weight = weight;
    const impressions = toInt(raw.impressions); if (impressions !== undefined) payload.impressions = impressions;
    const clicks = toInt(raw.clicks); if (clicks !== undefined) payload.clicks = clicks;

    // booleans / dates
    const isActive = toBool(raw.isActive); if (isActive !== undefined) payload.isActive = isActive;
    const isAd = toBool(raw.isAd); if (isAd !== undefined) payload.isAd = isAd;
    const startTime = toDate(raw.startTime); if (startTime !== undefined) payload.startTime = startTime;
    const endTime = toDate(raw.endTime); if (endTime !== undefined) payload.endTime = endTime;

    return payload;
  }

  @Get()
  async list(@Query('page') page = 1, @Query('size') size = 20) {
    const take = Math.max(Number(size) || 20, 1);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
    const [items, total] = await this.bannerRepo.findAndCount({ skip, take, order: { id: 'DESC' } });
    return { total, items, page: Number(page) || 1, size: take };
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.bannerRepo.findOne({ where: { id: Number(id) } });
  }

  @Post()
  async create(@Body() body: Partial<Banner>) {
    const entity = this.bannerRepo.create(this.normalize(body));
    return this.bannerRepo.save(entity);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: Partial<Banner>) {
    const payload = this.normalize(body);
    await this.bannerRepo.update({ id: Number(id) }, payload);
    return this.bannerRepo.findOne({ where: { id: Number(id) } });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.bannerRepo.delete({ id: Number(id) });
    return { success: true };
  }

  // 直传文件并更新对应 Banner 的图片
  @Post(':id/image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile() file?: { buffer?: Buffer; originalname?: string; mimetype?: string },
  ) {
    if (!file || !file.buffer) throw new BadRequestException('file is required');
    const { url, key } = await this.storage.uploadBuffer(file.buffer, file.originalname, {
      keyPrefix: 'banners/',
      contentType: file.mimetype,
    });
    const imageUrl = url ?? key;
    await this.bannerRepo.update({ id: Number(id) }, { imageUrl });
    return this.bannerRepo.findOne({ where: { id: Number(id) } });
  }

  // 从远程 URL 拉取并更新对应 Banner 的图片
  @Post(':id/image-from-url')
  async uploadImageFromUrl(
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
      keyPrefix: 'banners/',
      contentType,
    });
    const imageUrl = url ?? key;
    await this.bannerRepo.update({ id: Number(id) }, { imageUrl });
    return this.bannerRepo.findOne({ where: { id: Number(id) } });
  }

  /**
   * 获取预签名上传 URL（前端直传）
   * GET /api/admin/banners/:id/presigned-upload-url?filename=banner.jpg&contentType=image/jpeg
   */
  @Get(':id/presigned-upload-url')
  async getPresignedUploadUrl(
    @Param('id') id: string,
    @Query() query: GetPresignedUrlDto,
  ) {
    // 验证 Banner 是否存在
    const banner = await this.bannerRepo.findOne({ where: { id: Number(id) } });
    if (!banner) {
      throw new NotFoundException('Banner not found');
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
    const fileKey = `banners/${id}/image_${randomUUID()}.${extension}`;

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
   * POST /api/admin/banners/:id/upload-complete
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

    // 验证 Banner 是否存在
    const banner = await this.bannerRepo.findOne({ where: { id: Number(id) } });
    if (!banner) {
      throw new NotFoundException('Banner not found');
    }

    // 更新 Banner 的 imageUrl
    await this.bannerRepo.update(
      { id: Number(id) },
      { 
        imageUrl: publicUrl,
        updatedAt: new Date(),
      },
    );

    return {
      success: true,
      message: 'Image upload completed',
      imageUrl: publicUrl,
    };
  }
}


