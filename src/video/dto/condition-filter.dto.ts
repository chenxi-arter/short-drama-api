import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Transform, Type } from 'class-transformer';

/**
 * 条件筛选请求DTO
 * 对应 getconditionfilterdata 接口
 */
export class ConditionFilterDto {
  @IsOptional()
  @IsString()
  titleid?: string; // 标题ID，如 'drama', 'movie', 'variety'

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value || '0,0,0,0,0')
  ids?: string; // 筛选标识，默认为0,0,0,0,0

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Transform(({ value }) => parseInt(value) || 1)
  page?: number; // 页数，默认为1

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Transform(({ value }) => parseInt(value) || 21)
  size?: number; // 每页大小，默认为21

  @IsOptional()
  @IsString()
  System?: string; // 系统类型，如 'h5'

  @IsOptional()
  @IsString()
  AppVersion?: string; // 应用版本

  @IsOptional()
  @IsString()
  SystemVersion?: string; // 系统版本

  @IsOptional()
  @IsString()
  version?: string; // 版本号

  @IsOptional()
  @IsString()
  DeviceId?: string; // 设备ID

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  i18n?: number; // 国际化标识

  @IsOptional()
  @IsString()
  pub?: string; // 发布标识

  @IsOptional()
  @IsString()
  vv?: string; // 版本验证
}

/**
 * 条件筛选数据项
 */
export interface ConditionFilterItem {
  id: number;          // 视频ID
  shortId?: string;    // ShortID标识符（11位Base64字符）
  coverUrl: string;    // 封面图URL
  title: string;       // 视频标题
  description?: string; // 视频描述
  score: string;       // 视频评分
  playCount: number;   // 播放次数
  totalEpisodes?: number; // 总集数
  isSerial: boolean;   // 是否是系列剧集
  upStatus: string;    // 更新状态
  upCount: number;     // 更新次数
  status?: string;     // 系列状态
  starring?: string;   // 主演
  actor?: string;      // 演员
  director?: string;   // 导演
  region?: string;     // 地区
  language?: string;   // 语言
  releaseDate?: string; // 发布日期
  isCompleted?: boolean; // 是否完结
  cidMapper: string;   // 分类映射
  categoryName?: string; // 分类名称
  isRecommend: boolean; // 是否推荐
  duration?: string;   // 时长
  createdAt?: string;  // 创建时间
  updateTime?: string; // 更新时间
  episodeCount?: number; // 剧集数量
  tags?: string[];     // 标签
}

/**
 * 条件筛选响应
 */
export interface ConditionFilterResponse {
  code: number;
  data: {
    list: ConditionFilterItem[];
    total?: number;      // 总数
    page?: number;       // 当前页
    size?: number;       // 每页大小
    hasMore?: boolean;   // 是否有更多
  };
  msg: string | null;
}