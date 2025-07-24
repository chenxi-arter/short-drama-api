import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Series } from './series.entity';
import { EpisodeUrl } from './episode-url.entity';
import { WatchProgress } from './watch-progress.entity';
import { Comment } from './comment.entity';

@Entity('episodes')
export class Episode {
  @PrimaryGeneratedColumn() id: number;
  @Column() seriesId: number;
  @Column() episodeNumber: number; // 第几集
  @Column({ length: 255 }) title: string;
  @Column({ type: 'int' }) duration: number; // 秒
  @Column({ default: 'published' }) status: string;

  @ManyToOne(() => Series, s => s.episodes) series: Series;
  @OneToMany(() => EpisodeUrl, url => url.episode) urls: EpisodeUrl[];
  @OneToMany(() => WatchProgress, wp => wp.episode) watchProgresses: WatchProgress[];
  @OneToMany(() => Comment, c => c.episode) comments: Comment[];
}