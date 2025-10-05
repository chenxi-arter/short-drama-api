import { IsOptional, IsNumberString } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * 推荐请求 DTO
 */
export class RecommendQueryDto {
  @IsOptional()
  @IsNumberString()
  @Transform(({ value }: { value: unknown }) => (value as string) || '1')
  page?: string; // 页码，默认为1

  @IsOptional()
  @IsNumberString()
  @Transform(({ value }: { value: unknown }) => (value as string) || '20')
  size?: string; // 每页数量，默认为20
}

/**
 * 推荐剧集项
 */
export interface RecommendEpisodeItem {
  // 剧集基本信息
  shortId: string;
  episodeNumber: number;
  episodeTitle: string;
  title: string;
  duration: number;
  status: string;
  isVertical: boolean;
  createdAt: string;
  
  // 系列信息
  seriesShortId: string;
  seriesTitle: string;
  seriesCoverUrl: string;
  seriesDescription: string;
  
  // 互动数据
  playCount: number;
  likeCount: number;
  dislikeCount: number;
  favoriteCount: number;
  commentCount: number;
  
  // 播放地址
  episodeAccessKey: string;
  urls: {
    quality: string;
    accessKey: string;
  }[];
  
  // 评论预览（最新3条）
  topComments: {
    id: number;
    shortId: string;
    content: string;
    username: string;
    avatar: string;
    createdAt: string;
    likeCount: number;
  }[];
  
  // 推荐分数（调试用）
  recommendScore?: number;
}

/**
 * 推荐响应
 */
export interface RecommendResponse {
  code: number;
  data: {
    list: RecommendEpisodeItem[];
    total: number;
    page: number;
    size: number;
    hasMore: boolean;
  };
  msg: string | null;
}
