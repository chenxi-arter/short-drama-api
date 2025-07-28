// src/video/entity/episode-url.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Episode } from './episode.entity';

@Entity('episode_urls')
export class EpisodeUrl {
  /** 播放地址主键 */
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  /** 所属剧集 id（外键 → episodes.id） */
  @Column({ name: 'episode_id' })
  episodeId: number;

  /** 清晰度：720p / 1080p / 4K …… */
  @Column({ length: 50, name: 'quality' })
  quality: string;

  /** OSS 原始地址 */
  @Column({ length: 255, name: 'oss_url' })
  ossUrl: string;

  /** CDN 加速播放地址 */
  @Column({ length: 255, name: 'cdn_url' })
  cdnUrl: string;

  /** 外挂字幕地址（可选） */
  @Column({ length: 255, nullable: true, name: 'subtitle_url' })
  subtitleUrl: string;

  /** 多对一：所属剧集 */
  @ManyToOne(() => Episode, ep => ep.urls)
  @JoinColumn({ name: 'episode_id' })
  episode: Episode;
}