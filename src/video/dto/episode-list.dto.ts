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
 * 剧集基本信息（包含播放链接）
 */
export interface EpisodeBasicInfo {
  id: number;                    // 剧集ID
  shortId: string;               // 剧集shortId
  episodeNumber: number;         // 集数
  episodeTitle: string;          // 集数标题（格式：01, 02, 03...）
  title: string;                 // 剧集标题
  duration: number;              // 时长（秒）
  status: string;                // 状态
  createdAt: string;             // 创建时间
  updatedAt: string;             // 更新时间
  seriesId: number;              // 所属剧集ID
  seriesTitle: string;           // 所属剧集标题
  seriesShortId: string;         // 所属剧集shortId
  episodeAccessKey?: string;     // 剧集级访问密钥（用于 /api/video/episode-url/:accessKey）
  likeCount?: number;            // 点赞数
  dislikeCount?: number;         // 点踩数
  favoriteCount?: number;        // 收藏数
  // 播放进度相关字段（仅在有用户token时返回）
  watchProgress?: number;        // 观看进度（秒）
  watchPercentage?: number;      // 观看百分比（0-100）
  isWatched?: boolean;           // 是否已观看
  lastWatchTime?: string;        // 最后观看时间
  // 播放地址相关字段
  urls?: EpisodeUrlInfo[];       // 播放地址列表
  tags?: string[];               // 系列筛选标签（如["偶像","大陆","国语","2025年","连载中"]）
}

/**
 * 剧集播放地址信息
 */
export interface EpisodeUrlInfo {
  quality: string;               // 清晰度（如：720p, 1080p）
  accessKey: string;             // 访问密钥
  cdnUrl?: string;               // CDN播放地址（认证接口返回）
  ossUrl?: string;               // OSS源地址（认证接口返回）
  subtitleUrl?: string | null;   // 字幕地址（认证接口返回）
}

/**
 * 用户播放进度信息
 */
export interface UserWatchProgress {
  currentEpisode: number;        // 当前观看的集数
  currentEpisodeShortId: string; // 当前观看剧集的ShortID
  watchProgress: number;         // 当前集观看进度（秒）
  watchPercentage: number;       // 当前集观看百分比（0-100）
  totalWatchTime: number;        // 总观看时长（秒）
  lastWatchTime: string;         // 最后观看时间
  isCompleted: boolean;          // 是否已看完整个系列
}

/**
 * 系列基本信息
 */
export interface SeriesBasicInfo {
  starring: string;              // 主演
  id: number;                    // 系列ID
  channeName: string;            // 频道名称
  channeID: number;              // 频道ID
  title: string;                 // 系列标题
  coverUrl: string;              // 封面图URL
  mediaUrl: string;              // 媒体URL
  fileName: string;              // 文件名
  mediaId: string;               // 媒体ID
  postTime: string;              // 发布时间
  contentType: string;           // 内容类型
  actor: string;                 // 演员
  shareCount: number;            // 分享次数
  director: string;              // 导演
  description: string;           // 描述
  comments: number;              // 评论数
  updateStatus: string;          // 更新状态
  watch_progress: number;        // 观看进度
  playCount: number;             // 播放次数
  isHot: boolean;                // 是否热门
  isVip: boolean;                // 是否VIP
  tags?: string[];               // 系列标签（类型/地区/语言/年份/状态）
}

/**
 * 剧集列表响应
 */
export interface EpisodeListResponse {
  code: number;
  data: {
    seriesInfo?: SeriesBasicInfo | null;  // 系列基本信息（可选）
    userProgress?: UserWatchProgress | null; // 用户播放进度（仅在有token时返回）
    list: EpisodeBasicInfo[];     // 剧集列表
    total: number;                // 总数量
    page: number;                 // 当前页码
    size: number;                 // 每页数量
    hasMore: boolean;             // 是否有更多数据
    tags?: string[];              // 系列标签（类型/地区/语言/年份/状态）
    currentEpisode?: string;      // 当前观看到的集数字符串（与episodeTitle一致，如"01"；无记录则为"01"）
  };
  msg: string | null;
}