import { ArrayMinSize, IsArray, IsBoolean, IsDateString, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class EpisodeUrlInputDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['360p', '480p', '720p', '1080p', '4K'])
  quality: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  ossUrl?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  cdnUrl: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  subtitleUrl?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  originUrl: string;
}

export class EpisodeInputDto {
  @IsInt()
  @Min(1)
  episodeNumber: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsInt()
  @Min(1)
  duration: number;

  @IsString()
  @IsIn(['published', 'hidden', 'draft'])
  status: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => EpisodeUrlInputDto)
  urls: EpisodeUrlInputDto[];
}

export class IngestSeriesDto {
  // 外部唯一ID（强烈推荐，用于稳定 upsert 与 key 生成）
  @IsString()
  @IsNotEmpty()
  externalId: string;
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  coverUrl: string;

  @IsInt()
  @Min(1)
  categoryId: number;

  @IsString()
  @IsIn(['on-going', 'completed'])
  status: string;

  @IsDateString()
  releaseDate: string;

  @IsBoolean()
  isCompleted: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  score?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  playCount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  upStatus?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  upCount?: number;

  @IsOptional()
  @IsString()
  starring?: string; // 主演（逗号分隔）

  @IsOptional()
  @IsString()
  actor?: string; // 全演员（逗号分隔）

  @IsOptional()
  @IsString()
  @MaxLength(255)
  director?: string;

  // 过滤/分类选项（均为外键ID，需预先存在）
  @IsInt()
  @Min(1)
  regionOptionId: number;

  @IsInt()
  @Min(1)
  languageOptionId: number;

  @IsInt()
  @Min(1)
  statusOptionId: number;

  @IsInt()
  @Min(1)
  yearOptionId: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => EpisodeInputDto)
  episodes: EpisodeInputDto[];
}


