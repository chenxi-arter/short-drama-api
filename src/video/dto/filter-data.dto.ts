import { IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * 筛选器数据请求DTO
 */
export class FilterDataDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value || '1')
  channeid?: string; // 频道的唯一标识符，默认为1

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value || '0,0,0,0,0')
  ids?: string; // 筛选标识，默认为0,0,0,0,0

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value || '1')
  page?: string; // 页数，默认为1
}

/**
 * 筛选器数据项
 */
export interface FilterDataItem {
  id: number;          // 视频ID
  coverUrl: string;    // 封面图URL
  title: string;       // 视频标题
  playCount: number;   // 播放次数
  upStatus: string;    // 更新状态
  upCount: number;     // 更新次数
  score: string;       // 视频评分
  isSerial: boolean;   // 是否是系列剧集
  cidMapper: string;   // 分类映射
  isRecommend: boolean; // 是否推荐
  createdAt: string;   // 创建时间
}

/**
 * 筛选器数据响应
 */
export interface FilterDataResponse {
  code: number;
  data: {
    list: FilterDataItem[];
  };
  msg: string | null;
}