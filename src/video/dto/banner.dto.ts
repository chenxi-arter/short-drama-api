import { IsString, IsNumber, IsOptional, IsBoolean, IsDateString, IsUrl, Length, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { EnhancedStringLength } from '../../common/validators/enhanced-validation.decorator';

/**
 * 创建轮播图DTO
 */
export class CreateBannerDto {
  /**
   * 轮播图标题
   */
  @IsString({ message: '标题必须是字符串' })
  @EnhancedStringLength(1, 255, { message: '标题长度必须在1到255个字符之间' })
  title: string;

  /**
   * 轮播图图片URL
   */
  @IsString({ message: '图片URL必须是字符串' })
  @IsUrl({}, { message: '图片URL格式不正确' })
  @EnhancedStringLength(1, 500, { message: '图片URL长度必须在1到500个字符之间' })
  imageUrl: string;

  /**
   * 关联的视频系列ID（可选）
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '系列ID必须是数字' })
  @Min(1, { message: '系列ID必须大于0' })
  seriesId?: number;

  /**
   * 关联的分类ID
   */
  @Type(() => Number)
  @IsNumber({}, { message: '分类ID必须是数字' })
  @Min(1, { message: '分类ID必须大于0' })
  categoryId: number;

  /**
   * 跳转链接（如果不关联视频系列）
   */
  @IsOptional()
  @IsString({ message: '跳转链接必须是字符串' })
  @EnhancedStringLength(1, 500, { message: '跳转链接长度必须在1到500个字符之间' })
  linkUrl?: string;

  /**
   * 排序权重（数字越大越靠前）
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '权重必须是数字' })
  weight?: number = 0;

  /**
   * 是否启用
   */
  @IsOptional()
  @IsBoolean({ message: '启用状态必须是布尔值' })
  isActive?: boolean = true;

  /**
   * 是否为广告（true=广告，false=自有内容）
   */
  @IsOptional()
  @IsBoolean({ message: '广告标记必须是布尔值' })
  isAd?: boolean = false;

  /**
   * 开始展示时间
   */
  @IsOptional()
  @IsDateString({}, { message: '开始时间格式不正确' })
  startTime?: string;

  /**
   * 结束展示时间
   */
  @IsOptional()
  @IsDateString({}, { message: '结束时间格式不正确' })
  endTime?: string;

  /**
   * 描述信息
   */
  @IsOptional()
  @IsString({ message: '描述必须是字符串' })
  @Length(0, 1000, { message: '描述长度不能超过1000个字符' })
  description?: string;
}

/**
 * 更新轮播图DTO
 */
export class UpdateBannerDto {
  /**
   * 轮播图标题
   */
  @IsOptional()
  @IsString({ message: '标题必须是字符串' })
  @EnhancedStringLength(1, 255, { message: '标题长度必须在1到255个字符之间' })
  title?: string;

  /**
   * 轮播图图片URL
   */
  @IsOptional()
  @IsString({ message: '图片URL必须是字符串' })
  @IsUrl({}, { message: '图片URL格式不正确' })
  @EnhancedStringLength(1, 500, { message: '图片URL长度必须在1到500个字符之间' })
  imageUrl?: string;

  /**
   * 关联的视频系列ID（可选）
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '系列ID必须是数字' })
  @Min(1, { message: '系列ID必须大于0' })
  seriesId?: number;

  /**
   * 关联的分类ID
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '分类ID必须是数字' })
  @Min(1, { message: '分类ID必须大于0' })
  categoryId?: number;

  /**
   * 跳转链接（如果不关联视频系列）
   */
  @IsOptional()
  @IsString({ message: '跳转链接必须是字符串' })
  @EnhancedStringLength(1, 500, { message: '跳转链接长度必须在1到500个字符之间' })
  linkUrl?: string;

  /**
   * 排序权重（数字越大越靠前）
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '权重必须是数字' })
  weight?: number;

  /**
   * 是否启用
   */
  @IsOptional()
  @IsBoolean({ message: '启用状态必须是布尔值' })
  isActive?: boolean;

  /**
   * 是否为广告（true=广告，false=自有内容）
   */
  @IsOptional()
  @IsBoolean({ message: '广告标记必须是布尔值' })
  isAd?: boolean;

  /**
   * 开始展示时间
   */
  @IsOptional()
  @IsDateString({}, { message: '开始时间格式不正确' })
  startTime?: string;

  /**
   * 结束展示时间
   */
  @IsOptional()
  @IsDateString({}, { message: '结束时间格式不正确' })
  endTime?: string;

  /**
   * 描述信息
   */
  @IsOptional()
  @IsString({ message: '描述必须是字符串' })
  @Length(0, 1000, { message: '描述长度不能超过1000个字符' })
  description?: string;
}

/**
 * 轮播图查询DTO
 */
export class BannerQueryDto {
  /**
   * 分类ID
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '分类ID必须是数字' })
  @Min(1, { message: '分类ID必须大于0' })
  categoryId?: number;

  /**
   * 是否启用
   */
  @IsOptional()
  @IsBoolean({ message: '启用状态必须是布尔值' })
  isActive?: boolean;

  /**
   * 页码
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '页码必须是数字' })
  @Min(1, { message: '页码必须大于等于1' })
  page?: number = 1;

  /**
   * 每页数量
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '每页数量必须是数字' })
  @Min(1, { message: '每页数量必须大于0' })
  size?: number = 10;
}

/**
 * 轮播图响应DTO
 */
export interface BannerResponseDto {
  id: number;
  title: string;
  imageUrl: string;
  seriesId?: number;
  categoryId: number;
  linkUrl?: string;
  weight: number;
  isActive: boolean;
  isAd: boolean;
  startTime?: Date;
  endTime?: Date;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  category?: {
    id: number;
    name: string;
  };
  series?: {
    id: number;
    title: string;
    shortId?: string;
  };
}