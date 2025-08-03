import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { EnhancedStringLength } from '../../common/validators/enhanced-validation.decorator';

/**
 * 首页视频列表请求DTO
 */
export class HomeVideosDto {
  /**
   * 频道唯一标识
   */
  @IsOptional()
  @IsString({ message: '频道ID必须是字符串' })
  @EnhancedStringLength(1, 50, { message: '频道ID长度必须在1到50个字符之间' })
  channeid?: string;

  /**
   * 页数
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '页码必须是数字' })
  @Min(1, { message: '页码必须大于等于1' })
  @Transform(({ value }) => Math.max(1, Number(value) || 1))
  page?: number = 1;
}

/**
 * 轮播图项目
 */
export interface BannerItem {
  showURL: string;  // 图片的URL地址
  title: string;    // 视频的标题
  id: number;       // 视频的唯一标识符
  channeID: number; // 频道分类ID
  url: string;      // 视频详情页path
}

/**
 * 过滤器项目
 */
export interface FilterItem {
  channeID: number; // 频道分类ID
  name: string;     // 频道名称
  title: string;    // 过滤器标题
  ids: string;      // 过滤器ID组合
}

/**
 * 视频项目
 */
export interface VideoItem {
  id: number;       // 视频ID
  coverUrl: string; // 封面图URL
  title: string;    // 视频标题
  score: string;    // 视频评分
  playCount: number;// 播放次数
  url: string;      // 视频详情path
  type: string;     // 分类映射
  isSerial: boolean;// 是否是系列剧集
  upStatus: string; // 更新状态
  upCount: number;  // 更新次数
}

/**
 * 内容板块
 */
export interface ContentBlock {
  type: number;           // 板块类型: 0-轮播图, 1001-搜索, -1-广告, 3-视频
  name: string;           // 板块名称
  filters?: FilterItem[]; // 过滤器列表
  banners?: BannerItem[]; // 轮播列表
  list?: VideoItem[];     // 视频列表
}

/**
 * 首页视频列表响应
 */
export interface HomeVideosResponse {
  data: {
    list: ContentBlock[];
  };
  code: number;
  msg: string | null;
}