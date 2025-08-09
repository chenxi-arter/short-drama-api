import { IsOptional, IsString, IsNumberString } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * 剧集列表请求DTO
 */
export class EpisodeListDto {
  @IsOptional()
  @IsString()
  seriesShortId?: string; // 剧集shortId

  @IsOptional()
  @IsNumberString()
  seriesId?: string; // 剧集ID（向后兼容）

  @IsOptional()
  @IsNumberString()
  @Transform(({ value }) => value || '1')
  page?: string; // 页码，默认为1

  @IsOptional()
  @IsNumberString()
  @Transform(({ value }) => value || '20')
  size?: string; // 每页数量，默认为20
}

/**
 * 剧集基本信息（不包含播放链接）
 */
export interface EpisodeBasicInfo {
  id: number;                    // 剧集ID
  shortId: string;               // 剧集shortId
  episodeNumber: number;         // 集数
  title: string;                 // 剧集标题
  duration: number;              // 时长（秒）
  status: string;                // 状态
  createdAt: string;             // 创建时间
  updatedAt: string;             // 更新时间
  seriesId: number;              // 所属剧集ID
  seriesTitle: string;           // 所属剧集标题
  seriesShortId: string;         // 所属剧集shortId
}

/**
 * 剧集列表响应
 */
export interface EpisodeListResponse {
  code: number;
  data: {
    list: EpisodeBasicInfo[];
    total: number;
    page: number;
    size: number;
    hasMore: boolean;
  };
  msg: string | null;
}