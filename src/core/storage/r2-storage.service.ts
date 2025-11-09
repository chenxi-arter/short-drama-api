import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

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
}


