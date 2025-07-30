import { IsNotEmpty, IsString } from 'class-validator';

/**
 * 视频详情请求DTO
 */
export class VideoDetailsDto {
  @IsNotEmpty()
  @IsString()
  id: string; // 视频的唯一标识符
}

/**
 * 剧集信息
 */
export interface EpisodeInfo {
  channeID: number;      // 频道ID
  episodeId: number;     // 集数ID
  title: string;         // 视频标题
  resolutionDes: string; // 分辨率描述
  resolution: string;    // 分辨率
  isVip: boolean;        // 是否VIP
  isLast: boolean;       // 是否为最后一集
  episodeTitle: string;  // 集数标题
  opSecond: number;      // 开头广告时长
  epSecond: number;      // 集数总时长（秒）
}

/**
 * 语言信息
 */
export interface LanguageInfo {
  name: string; // 语言名称
}

/**
 * 点赞/踩/收藏信息
 */
export interface InteractionInfo {
  count: number;   // 数量
  selected: boolean; // 是否已选择
}

/**
 * 视频详情信息
 */
export interface VideoDetailInfo {
  starring: string;        // 主演名单
  id: number;             // 视频的唯一ID
  channeName: string;     // 频道名称
  channeID: number;       // 频道ID
  title: string;          // 视频标题
  coverUrl: string;       // 视频封面图片URL
  mediaUrl: string;       // 视频播放地址
  fileName: string;       // 视频文件名
  mediaId: string;        // 媒体ID
  postTime: string;       // 发布时间
  contentType: string;    // 内容类型
  actor: string;          // 演员名单
  shareCount: number;     // 分享次数
  director: string;       // 导演
  description: string;    // 视频简介
  comments: number;       // 评论数量
  updateStatus: string;   // 更新状态
  watch_progress: number; // 用户观看时长(秒)
  playCount: number;      // 播放次数
  isHot: boolean;         // 是否热门
  isVip: boolean;         // 是否为VIP视频
  episodes: EpisodeInfo[]; // 视频的所有集数信息
  score: string;          // 当前视频的评分
  adGold: number;         // 广告金
  cidMapper: string;      // 视频分类标签
  regional: string;       // 视频地区
  playRecordUrl: string;  // 播放记录URL
  labels: any[];          // 标签
  isShow: boolean;        // 是否显示
  charge: number;         // 收费标识
  isLive: boolean;        // 是否为直播视频
  serialCount: number;    // 总集数
}

/**
 * 视频详情响应
 */
export interface VideoDetailsResponse {
  code: number;
  data: {
    detailInfo: VideoDetailInfo;
    userInfo: any;              // 上传者信息
    adsPlayer: any;             // 广告播放器配置
    adsSuspension: any;         // 广告悬浮配置
    focusStatus: boolean;       // 是否已关注
    isBlackList: boolean;       // 是否在黑名单中
    like: InteractionInfo;      // 点赞信息
    disLike: InteractionInfo;   // 踩信息
    favorites: InteractionInfo; // 收藏信息
    languageList: LanguageInfo[]; // 语言列表
    skipadshow: boolean;        // 是否跳过广告
  };
  msg: string;
}