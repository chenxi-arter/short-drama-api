// src/video/entity/watch-log.entity.ts
/**
 * 观看日志实体类
 * 记录用户每次观看剧集的详细日志，用于准确统计观看时长
 * 
 * 与 watch_progress 的区别：
 * - watch_progress：记录观看进度（断点续播用），每个用户-剧集只有一条记录
 * - watch_log：记录观看历史（统计分析用），每次观看都会新增一条记录
 */
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { User } from '../../user/entity/user.entity';
import { Episode } from './episode.entity';

@Entity('watch_logs')
@Index(['userId', 'watchDate']) // 用于按用户和日期查询
@Index(['episodeId', 'watchDate']) // 用于按剧集和日期查询
@Index(['watchDate']) // 用于按日期统计
export class WatchLog {
  /** 
   * 观看日志主键ID 
   * 自动生成的唯一标识符
   */
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  /** 
   * 用户ID 
   * 外键，关联到users表的id字段
   */
  @Column({ name: 'user_id' })
  userId: number;

  /** 
   * 剧集ID 
   * 外键，关联到episodes表的id字段
   */
  @Column({ name: 'episode_id' })
  episodeId: number;

  /** 
   * 观看时长（秒）
   * 记录本次观看的实际时长
   * 例如：用户从第10秒看到第50秒，观看时长为40秒
   */
  @Column({ type: 'int', default: 0, name: 'watch_duration' })
  watchDuration: number;

  /** 
   * 开始观看位置（秒）
   * 记录用户从视频的第几秒开始观看
   */
  @Column({ type: 'int', default: 0, name: 'start_position' })
  startPosition: number;

  /** 
   * 结束观看位置（秒）
   * 记录用户观看到视频的第几秒
   */
  @Column({ type: 'int', default: 0, name: 'end_position' })
  endPosition: number;

  /** 
   * 观看日期
   * 记录观看行为发生的日期（用于按日统计）
   * 格式：YYYY-MM-DD
   */
  @Column({ type: 'date', name: 'watch_date' })
  watchDate: Date;

  /** 
   * 创建时间 
   * 记录日志创建的精确时间戳
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /** 
   * 多对一关系：用户 
   * 关联到观看日志所属的用户
   */
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  /** 
   * 多对一关系：剧集 
   * 关联到观看日志所属的剧集
   */
  @ManyToOne(() => Episode)
  @JoinColumn({ name: 'episode_id' })
  episode: Episode;
}
