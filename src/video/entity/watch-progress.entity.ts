// src/video/entity/watch-progress.entity.ts
import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entity/user.entity';
import { Episode } from './episode.entity';

@Entity('watch_progress')
export class WatchProgress {
  /** 用户 id（联合主键） */
  @PrimaryColumn({ name: 'user_id' })
  userId: number;

  /** 剧集 id（联合主键） */
  @PrimaryColumn({ name: 'episode_id' })
  episodeId: number;

  /** 观看到第几秒（断点续播） */
  @Column({ type: 'int', default: 0, name: 'stop_at_second' })
  stopAtSecond: number;

  /** 记录更新时间 */
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'updated_at' })
  updatedAt: Date;

  /** 多对一：用户 */
  @ManyToOne(() => User, u => u.watchProgresses)
  @JoinColumn({ name: 'user_id' })
  user: User;

  /** 多对一：剧集 */
  @ManyToOne(() => Episode, ep => ep.watchProgresses)
  @JoinColumn({ name: 'episode_id' })
  episode: Episode;
}