import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID, createHash } from 'crypto';

export interface R2UploadOptions {
  keyPrefix?: string;
  contentType?: string;
}

@Injectable()
export class R2StorageService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private s3: any;
  private bucketName!: string;
  private publicBaseUrl?: string;
  private endpointBucketBase!: string;
  private initialized = false;

  constructor() {
    // 不在构造函数中初始化，延迟到实际使用时
  }

  /**
   * 延迟初始化 R2 客户端
   * 只在第一次使用时检查环境变量并初始化
   */
  private ensureInitialized() {
    if (this.initialized) {
      return;
    }

    const endpoint = process.env.R2_ENDPOINT_URL;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME;
    const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL; // e.g. https://static.example.com

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucketName) {
      throw new Error(
        'R2 storage not configured. Required environment variables: ' +
        'R2_ENDPOINT_URL, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME'
      );
    }

    this.bucketName = bucketName;
    this.publicBaseUrl = publicBaseUrl;

    this.s3 = new S3Client({
      region: 'auto',
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });

    // 默认公开访问前缀（基于 Endpoint + Bucket），当未配置 R2_PUBLIC_BASE_URL 时使用
    this.endpointBucketBase = `${String(endpoint).replace(/\/$/, '')}/${this.bucketName}`;
    
    this.initialized = true;
    console.log('✅ R2 Storage initialized');
  }

  async uploadBuffer(buffer: Buffer, originalName?: string, opts?: R2UploadOptions): Promise<{ key: string; url?: string }> {
    // 延迟初始化：只在实际使用时才检查配置
    this.ensureInitialized();

    const keyPrefix = opts?.keyPrefix ?? 'uploads/';
    const safeExt = (originalName && originalName.includes('.')) ? originalName.split('.').pop() : undefined;
    const key = `${keyPrefix}${randomUUID()}${safeExt ? '.' + safeExt.toLowerCase() : ''}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: opts?.contentType,
      ACL: undefined,
    });
    await this.s3.send(command);

    const base = (this.publicBaseUrl ?? this.endpointBucketBase).replace(/\/$/, '');
    const url = `${base}/${key}`;
    return { key, url };
  }

  /**
   * 生成预签名上传 URL
   * @param fileKey 文件路径（如: banners/123/image_uuid.jpg）
   * @param contentType 文件 MIME 类型
   * @param expiresIn 有效期（秒），默认 3600 秒（1小时）
   * @returns 预签名 URL
   */
  async generatePresignedUploadUrl(
    fileKey: string,
    contentType: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    this.ensureInitialized();

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
      ContentType: contentType,
    });

    return await getSignedUrl(this.s3, command, { expiresIn });
  }

  /**
   * 获取文件的公开访问 URL
   * @param fileKey 文件路径
   * @returns 公开访问 URL
   */
  getPublicUrl(fileKey: string): string {
    const base = (this.publicBaseUrl ?? this.endpointBucketBase).replace(/\/$/, '');
    return `${base}/${fileKey}`;
  }

  /**
   * 生成媒体路径（与爬取脚本逻辑一致）
   * 使用 MD5 + Base64 编码生成短路径
   * @param id 媒体ID或剧集ID
   * @returns 11位的短路径
   */
  private generateShortPath(id: number | string): string {
    const padding = 'zpxw';
    const hash = createHash('md5')
      .update(String(id) + padding)
      .digest();
    return hash.toString('base64url').substring(0, 11);
  }

  /**
   * 生成视频文件的存储路径（Admin 后台上传）
   * 使用 MD5 + Base64 编码生成短路径，确保路径安全性
   * @param seriesId 系列ID
   * @param episodeId 剧集ID
   * @param quality 清晰度（如 480p, 720p, 1080p）
   * @param filename 文件名（如 video.mp4, chunklist.m3u8）
   * @param type 媒体类型，默认 't1' (短剧)
   * @returns 完整的存储路径
   */
  generateVideoPath(
    seriesId: number,
    episodeId: number,
    quality: string,
    filename: string,
    type: string = 't1'
  ): string {
    const mePath = this.generateShortPath(seriesId);
    const epPath = this.generateShortPath(episodeId);
    
    // 清理文件名：移除特殊字符，保留扩展名
    const sanitizedFilename = this.sanitizeFilename(filename);
    
    // Admin 后台上传路径格式: admin.v1.0.0.t1/{me_path}/{ep_path}/{quality}/{filename}
    return `admin.v1.0.0.${type}/${mePath}/${epPath}/${quality}/${sanitizedFilename}`;
  }

  /**
   * 清理文件名，确保安全性
   * @param filename 原始文件名
   * @returns 清理后的文件名
   */
  private sanitizeFilename(filename: string): string {
    // 提取扩展名
    const parts = filename.split('.');
    const extension = parts.length > 1 ? parts.pop()?.toLowerCase() : '';
    
    // 移除扩展名后的文件名
    let basename = parts.join('.');
    
    // 如果文件名为空或只有特殊字符，使用默认名称
    if (!basename || basename.trim() === '') {
      basename = 'video';
    }
    
    // 移除或替换不安全的字符
    // 保留：字母、数字、下划线、连字符、点
    basename = basename
      .replace(/[^\w\-\.]/g, '_')  // 替换特殊字符为下划线
      .replace(/_{2,}/g, '_')       // 多个下划线合并为一个
      .replace(/^_+|_+$/g, '')      // 移除首尾下划线
      .substring(0, 100);           // 限制长度
    
    // 如果清理后为空，使用默认名称
    if (!basename) {
      basename = 'video';
    }
    
    return extension ? `${basename}.${extension}` : basename;
  }

  /**
   * 生成视频的公开访问 URL（Admin 后台上传）
   * @param seriesId 系列ID
   * @param episodeId 剧集ID
   * @param quality 清晰度
   * @param filename 文件名
   * @param type 媒体类型
   * @returns 完整的公开访问 URL
   */
  getVideoUrl(
    seriesId: number,
    episodeId: number,
    quality: string,
    filename: string = 'video.mp4',
    type: string = 't1'
  ): string {
    const path = this.generateVideoPath(seriesId, episodeId, quality, filename, type);
    return this.getPublicUrl(path);
  }
}


