import { IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * 筛选器数据请求DTO
 */
export class FilterDataDto {
  @IsNotEmpty({ message: 'channeid不能为空' })
  @IsString()
  @Transform(({ value }) => (value as string) || '1')
  channeid: string; // 频道的唯一标识符，默认为1

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value as string) || '0,0,0,0,0')
  ids?: string; // 筛选标识，默认为0,0,0,0,0

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value as string) || '1')
  page?: string; // 页数，默认为1
}

/**
 * 筛选器数据项
 */
export interface FilterDataItem {
  id: number;          // 视频ID
  shortId: string;     // 系列shortId
  coverUrl: string;    // 封面图URL
  title: string;       // 视频标题
  score: string;       // 视频评分
  playCount: number;   // 播放次数
  url: string;         // 访问URL
  type: string;        // 类型
  contentType: string; // 内容类型
  isSerial: boolean;   // 是否是系列剧集
  upStatus: string;    // 更新状态
  upCount: number;     // 更新次数
  likeCount?: number;        // 点赞数（系列级聚合）
  dislikeCount?: number;     // 点踩数（系列级聚合）
  favoriteCount?: number;    // 收藏数（系列级聚合）
  author: string;      // 作者/主演
  description: string; // 描述
  cidMapper: string;   // 分类映射
  isRecommend: boolean; // 是否推荐
  createdAt: string;   // 创建时间
  tags: string[];      // 系列标签（题材/地区/语言/年份/状态）
}

/**
 * 筛选器数据响应
 */
export interface FilterDataResponse {
  code: number;
  data: {
    list: FilterDataItem[];
    total: number;
    page: number;
    size: number;
    hasMore: boolean;
  };
  msg: string | null;
}