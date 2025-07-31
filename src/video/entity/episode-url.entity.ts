// src/video/entity/episode-url.entity.ts
/**
 * 剧集播放地址实体类
 * 存储剧集的不同清晰度播放地址信息
 */
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Episode } from './episode.entity';

@Entity('episode_urls')
export class EpisodeUrl {
  /** 
   * 播放地址主键ID 
   * 自动生成的唯一标识符
   */
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  /** 
   * 所属剧集ID 
   * 外键，关联到episodes表的id字段
   */
  @Column({ name: 'episode_id' })
  episodeId: number;

  /** 
   * 视频清晰度 
   * 如：720p、1080p、4K等
   */
  @Column({ length: 50, name: 'quality' })
  quality: string;

  /** 
   * OSS原始地址 
   * 对象存储服务中的原始视频地址
   */
  @Column({ length: 255, name: 'oss_url' })
  ossUrl: string;

  /** 
   * CDN加速播放地址 
   * 内容分发网络加速后的视频播放地址
   */
  @Column({ length: 255, name: 'cdn_url' })
  cdnUrl: string;

  /** 
   * 外挂字幕地址 
   * 可选的外部字幕文件地址
   */
  @Column({ length: 255, nullable: true, name: 'subtitle_url' })
  subtitleUrl: string;

  /** 
   * 加密索引键 
   * 用于防止枚举攻击的随机加密字符串，替代直接使用ID访问
   */
  @Column({ length: 64, unique: true, name: 'access_key' })
  accessKey: string;

  /** 
   * 创建时间 
   * 记录播放地址创建的时间戳
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /** 
   * 更新时间 
   * 记录播放地址最后更新的时间戳
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /** 
   * 多对一关系：所属剧集 
   * 关联到该播放地址所属的剧集
   */
  @ManyToOne(() => Episode, ep => ep.urls)
  @JoinColumn({ name: 'episode_id' })
  episode: Episode;
}