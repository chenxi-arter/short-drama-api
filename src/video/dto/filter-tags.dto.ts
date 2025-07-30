import { IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * 筛选器标签请求DTO
 */
export class FilterTagsDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value || '1')
  channeid?: string; // 频道的唯一标识符，默认为1
}

/**
 * 筛选器标签项
 */
export interface FilterTagItem {
  index: number;           // 标签索引
  classifyId: number;      // 分类ID
  classifyName: string;    // 分类名称
  isDefaultSelect: boolean; // 是否默认选中
}

/**
 * 筛选器标签组
 */
export interface FilterTagGroup {
  name: string;            // 标签组名称
  list: FilterTagItem[];   // 标签列表
}

/**
 * 筛选器标签响应
 */
export interface FilterTagsResponse {
  list: FilterTagGroup[];
}