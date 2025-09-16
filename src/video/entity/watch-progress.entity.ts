// src/video/entity/watch-progress.entity.ts
/**
 * 观看进度实体类
 * 记录用户观看剧集的进度信息，用于断点续播功能
 */
import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entity/user.entity';
import { Episode } from './episode.entity';

@Entity('watch_progress')
export class WatchProgress {
  /** 
   * 用户ID（联合主键的一部分） 
   * 外键，关联到users表的id字段
   */
  @PrimaryColumn({ name: 'user_id' })
  userId: number;

  /** 
   * 剧集ID（联合主键的一部分） 
   * 外键，关联到episodes表的id字段
   */
  @PrimaryColumn({ name: 'episode_id' })
  episodeId: number;

  /** 
   * 观看进度 
   * 记录用户观看到视频的第几秒，用于断点续播功能
   */
  @Column({ type: 'int', default: 0, name: 'stop_at_second' })
  stopAtSecond: number;

  /** 
   * 更新时间 
   * 记录观看进度最后更新的时间戳
   */
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', name: 'updated_at' })
  updatedAt: Date;

  /** 
   * 多对一关系：用户 
   * 关联到进度记录所属的用户
   */
  @ManyToOne(() => User, u => u.watchProgresses)
  @JoinColumn({ name: 'user_id' })
  user: User;

  /** 
   * 多对一关系：剧集 
   * 关联到进度记录所属的剧集
   */
  @ManyToOne(() => Episode, ep => ep.watchProgresses)
  @JoinColumn({ name: 'episode_id' })
  episode: Episode;
}