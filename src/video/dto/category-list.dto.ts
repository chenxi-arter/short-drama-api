// src/video/dto/category-list.dto.ts
/**
 * 分类列表相关的数据传输对象
 */
import { IsOptional, IsNumber, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * 分类列表请求DTO
 */
export class CategoryListDto {
  /**
   * 版本号（可选）
   * 用于客户端缓存控制
   */
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  versionNo?: number;
}

/**
 * 分类项接口
 */
export interface CategoryItem {
  /**
   * 分类ID
   */
  categoryId: string | number;

  /**
   * 分类名称
   */
  name: string;

  /**
   * 分类类型
   * 0: 首页, 1: 视频分类, 2: 短视频分类, 6: 片单等
   */
  type: number;

  /**
   * 排序索引
   */
  index: number;

  /**
   * 路由名称
   */
  routeName: string;

  /**
   * 样式类型（可选）
   */
  styleType?: number;
}

/**
 * 分类列表响应数据结构
 */
export interface CategoryListData {
  /**
   * 版本号
   */
  versionNo: number;

  /**
   * 分类列表
   */
  list: CategoryItem[];
}

/**
 * 分类列表响应DTO
 */
export interface CategoryListResponse {
  /**
   * 响应状态码
   */
  ret: number;

  /**
   * 响应数据
   */
  data: CategoryListData;

  /**
   * 响应消息
   */
  msg: string | null;
}