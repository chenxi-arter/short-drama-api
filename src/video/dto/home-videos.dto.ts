import { IsOptional, IsNumber, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { IsValidChannelExists } from '../validators/channel-exists.validator';

/**
 * 首页视频列表请求DTO
 */
export class HomeVideosDto {
  /**
   * 频道ID（对应categories表的id字段）
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '频道ID必须是数字' })
  @Min(1, { message: '频道ID必须大于0' })
  @IsValidChannelExists({ message: '频道ID不存在' })
  channeid?: number;

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
  shortId: string | null; // 视频ShortID（11位Base64字符，找不到则为null）
  channeID: number; // 频道分类ID
  url: string;      // 视频详情页path
  isAd: boolean;    // 是否为广告（true=广告；false=我方系列）
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
  shortId: string;  // 视频ShortID（11位Base64字符，防枚举攻击）
  coverUrl: string; // 封面图URL
  title: string;    // 视频标题
  score: string;    // 视频评分（格式如"9.2"，范围0-10分）
  playCount: number;// 播放次数
  url: string;      // 视频详情path
  type: string;     // 视频类型（如"短剧"、"电影"、"综艺"等）
  isSerial: boolean;// 是否是系列剧集
  upStatus: string; // 更新状态
  upCount: number;  // 更新次数
  author: string;   // 作者/主演信息
  description: string; // 视频描述
  cidMapper: string;   // 分类映射
  isRecommend: boolean;// 是否推荐
  createdAt: string;   // 创建时间
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