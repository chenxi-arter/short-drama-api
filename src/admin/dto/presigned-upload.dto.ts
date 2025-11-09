import { IsString, IsNotEmpty, IsOptional, IsIn, IsNumber } from 'class-validator';

/**
 * 获取预签名 URL 的查询参数
 */
export class GetPresignedUrlDto {
  @IsString()
  @IsNotEmpty()
  filename: string;

  @IsString()
  @IsNotEmpty()
  contentType: string;
}

/**
 * 获取视频预签名 URL 的查询参数（包含清晰度）
 */
export class GetVideoPresignedUrlDto extends GetPresignedUrlDto {
  @IsOptional()
  @IsString()
  @IsIn(['360p', '480p', '720p', '1080p', '1440p', '2160p'])
  quality?: string;
}

/**
 * 上传完成通知的请求体
 */
export class UploadCompleteDto {
  @IsString()
  @IsNotEmpty()
  fileKey: string;

  @IsString()
  @IsNotEmpty()
  publicUrl: string;

  @IsOptional()
  @IsNumber()
  fileSize?: number;
}

/**
 * 视频上传完成通知的请求体（包含清晰度）
 */
export class VideoUploadCompleteDto extends UploadCompleteDto {
  @IsOptional()
  @IsString()
  @IsIn(['360p', '480p', '720p', '1080p', '1440p', '2160p'])
  quality?: string;
}

