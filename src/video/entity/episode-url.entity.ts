import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Episode } from './episode.entity';

@Entity('episode_urls')
export class EpisodeUrl {
  @PrimaryGeneratedColumn() id: number;
  @Column() episodeId: number;
  @Column({ length: 50 }) quality: string; // 720p / 1080p
  @Column({ length: 255 }) ossUrl: string; // 阿里云 OSS 原地址
  @Column({ length: 255 }) cdnUrl: string; // CDN 加速地址
  @Column({ length: 255, nullable: true }) subtitleUrl: string; // 字幕

  @ManyToOne(() => Episode, ep => ep.urls) episode: Episode;
}