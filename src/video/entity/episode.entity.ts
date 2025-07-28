// src/video/entity/episode.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Series } from './series.entity';
import { EpisodeUrl } from './episode-url.entity';
import { WatchProgress } from './watch-progress.entity';
import { Comment } from './comment.entity';

@Entity('episodes')
export class Episode {
  /** 剧集主键 */
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  /** 所属电视剧 id（外键 → series.id） */
  @Column({ name: 'series_id' })
  seriesId: number;

  /** 第几集 */
  @Column({ name: 'episode_number' })
  episodeNumber: number;

  /** 本集标题 */
  @Column({ length: 255, name: 'title' })
  title: string;

  /** 时长（秒） */
  @Column({ type: 'int', name: 'duration' })
  duration: number;

  /** 状态：published / hidden / draft …… */
  @Column({ default: 'published', name: 'status' })
  status: string;

  /** 多对一：所属电视剧 */
  @ManyToOne(() => Series, s => s.episodes)
  @JoinColumn({ name: 'series_id' })
  series: Series;

  /** 一对多：该集的所有播放地址 */
  @OneToMany(() => EpisodeUrl, url => url.episode)
  urls: EpisodeUrl[];

  /** 一对多：所有用户的观看进度 */
  @OneToMany(() => WatchProgress, wp => wp.episode)
  watchProgresses: WatchProgress[];

  /** 一对多：该集的所有评论/弹幕 */
  @OneToMany(() => Comment, c => c.episode)
  comments: Comment[];
}