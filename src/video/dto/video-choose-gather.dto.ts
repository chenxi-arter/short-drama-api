import { IsOptional, IsString } from 'class-validator';

/**
 * 视频选集查询DTO
 */
export class VideoChooseGatherDto {
  @IsString()
  @IsOptional()
  mediaKey?: string;

  @IsString()
  @IsOptional()
  System?: string;

  @IsString()
  @IsOptional()
  AppVersion?: string;

  @IsString()
  @IsOptional()
  SystemVersion?: string;

  @IsString()
  @IsOptional()
  version?: string;

  @IsString()
  @IsOptional()
  DeviceId?: string;

  @IsString()
  @IsOptional()
  i18n?: string;

  @IsString()
  @IsOptional()
  pub?: string;

  @IsString()
  @IsOptional()
  vv?: string;
}

/**
 * 视频选集响应接口
 */
export interface VideoChooseGatherResponse {
  code: number;
  msg: string | null;
  data: {
    videoInfo: {
      id: number;
      title: string;
      coverUrl: string;
      description: string;
      score: string;
      playCount: number;
      totalEpisodes: number;
      upStatus: string;
      upCount: number;
      starring: string;
      director: string;
      region: string;
      language: string;
      category: string;
    };
    episodes: Array<{
      episodeId: number;
      episodeNumber: number;
      title: string;
      episodeTitle: string;
      duration: number;
      isVip: boolean;
      isLocked: boolean;
      isCurrent: boolean;
      playCount: number;
      hasSequel: boolean;
      mediaKey: string;
      accessKey: string;
    }>;
    currentEpisode: {
      episodeId: number;
      episodeNumber: number;
      title: string;
      mediaKey: string;
      accessKey: string;
    };
    relatedVideos: Array<{
      id: number;
      title: string;
      coverUrl: string;
      score: string;
      playCount: number;
      category: string;
    }>;
  };
}