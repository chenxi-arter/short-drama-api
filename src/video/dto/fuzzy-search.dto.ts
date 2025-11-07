import { IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { Transform, Type } from 'class-transformer';

/**
 * 模糊搜索请求DTO
 * 用于根据标题进行模糊搜索
 */
export class FuzzySearchDto {
  @IsNotEmpty({ message: '搜索关键词不能为空' })
  @IsString({ message: '搜索关键词必须是字符串' })
  keyword: string; // 搜索关键词，必填

  @IsOptional()
  categoryId?: string; // 可选，分类ID，不传则搜索全部

  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => {
    const parsed = parseInt(value);
    return isNaN(parsed) ? 1 : parsed;
  })
  page?: number; // 页码，默认1

  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => {
    const parsed = parseInt(value);
    return isNaN(parsed) ? 20 : parsed;
  })
  size?: number; // 每页大小，默认20
}

/**
 * 模糊搜索结果项
 * 与 FilterDataItem 保持一致，增加 channeid 字段
 */
export interface FuzzySearchItem {
  id: number;
  shortId: string;     // 系列shortId
  coverUrl: string;    // 封面图URL
  title: string;       // 视频标题
  score: string;       // 视频评分
  playCount: number;   // 播放次数
  url: string;         // 访问URL
  type: string;        // 类型
  isSerial: boolean;   // 是否是系列剧集
  upStatus: string;    // 更新状态
  upCount: number;     // 更新次数
  author: string;      // 作者/主演
  description: string; // 描述
  cidMapper: string;   // 分类映射
  isRecommend: boolean; // 是否推荐
  createdAt: string;   // 创建时间
  channeid: number;    // 频道ID标识
}

/**
 * 模糊搜索响应
 */
export interface FuzzySearchResponse {
  code: number;
  data: {
    list: FuzzySearchItem[];
    total: number;      // 总数
    page: number;       // 当前页
    size: number;       // 每页大小
    hasMore: boolean;   // 是否有更多
  };
  msg: string | null;
}

