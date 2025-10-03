import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

export interface R2UploadOptions {
  keyPrefix?: string;
  contentType?: string;
}

@Injectable()
export class R2StorageService {
  private readonly s3: any;
  private readonly bucketName: string;
  private readonly publicBaseUrl?: string;
  private readonly endpointBucketBase: string;

  constructor() {
    const endpoint = process.env.R2_ENDPOINT_URL;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME;
    const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL; // e.g. https://static.example.com

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucketName) {
      // 延迟到运行期报错，以便在未使用上传功能时不影响其他功能
      throw new Error('R2 storage env missing. Required: R2_ENDPOINT_URL, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME');
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
  }

  async uploadBuffer(buffer: Buffer, originalName?: string, opts?: R2UploadOptions): Promise<{ key: string; url?: string }> {
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
}


