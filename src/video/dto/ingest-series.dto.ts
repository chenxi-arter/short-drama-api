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

  @IsOptional()
  @IsBoolean()
  isVertical?: boolean; // 是否竖屏播放（false=横屏，true=竖屏），默认 false

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

  @IsOptional()
  @IsString()
  @IsIn(['deleted'])
  status?: string;

  @IsDateString()
  releaseDate: string;

  @IsBoolean()
  isCompleted: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  seriesScore?: number;

  // 兼容旧字段名
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  score?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  playCount?: number;

  // upStatus / upCount 由后端基于剧集进度自动生成，无需传入

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
  @IsString()
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  regionOptionName: string;

  @IsString()
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  languageOptionName: string;

  @IsString()
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  statusOptionName: string;

  @IsString()
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  yearOptionName: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => EpisodeInputDto)
  episodes: EpisodeInputDto[];

  // 新增：题材/标签多选（名称优先）
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genreOptionNames?: string[];
}


