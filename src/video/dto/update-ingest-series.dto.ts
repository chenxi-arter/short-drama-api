import { ArrayMinSize, IsArray, IsBoolean, IsDateString, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class EpisodeUrlUpdateDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['360p', '480p', '720p', '1080p', '4K'])
  quality: string; // 用于定位 URL

  @IsOptional()
  @IsString()
  @MaxLength(255)
  ossUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  cdnUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  subtitleUrl?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  originUrl: string;
}

export class EpisodeUpdateDto {
  @IsInt()
  @Min(1)
  episodeNumber: number; // 用于定位剧集

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @IsOptional()
  @IsString()
  @IsIn(['published', 'hidden', 'draft'])
  status?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => EpisodeUrlUpdateDto)
  urls?: EpisodeUrlUpdateDto[];
}

export class UpdateIngestSeriesDto {
  @IsString()
  @IsNotEmpty()
  externalId: string; // 必填，作为定位键

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  coverUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  categoryId?: number;

  @IsOptional()
  @IsString()
  @IsIn(['on-going', 'completed'])
  status?: string;

  @IsOptional()
  @IsDateString()
  releaseDate?: string;

  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;

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
  starring?: string;

  @IsOptional()
  @IsString()
  actor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  director?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  regionOptionId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  languageOptionId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  statusOptionId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  yearOptionId?: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => EpisodeUpdateDto)
  episodes?: EpisodeUpdateDto[];

  @IsOptional()
  @IsBoolean()
  removeMissingEpisodes?: boolean;

  @IsOptional()
  @IsBoolean()
  removeMissingUrls?: boolean;
}


