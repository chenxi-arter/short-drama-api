// src/video/entity/browse-history.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../user/entity/user.entity';
import { Series } from './series.entity';

@Entity('browse_history')
export class BrowseHistory {
  /** 
   * 浏览记录主键ID 
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
   * 剧集系列ID 
   * 外键，关联到series表的id字段
   */
  @Column({ name: 'series_id' })
  seriesId: number;

  /** 
   * 浏览类型 
   * 记录浏览的类型，目前只支持：'episode_watch'（观看剧集）
   */
  @Column({ type: 'varchar', length: 50, default: 'episode_watch', name: 'browse_type' })
  browseType: string;


  /** 
   * 最后访问的集数
   * 记录用户最后查看的集数编号
   */
  @Column({ type: 'int', nullable: true, name: 'last_episode_number' })
  lastEpisodeNumber: number | null;

  /** 
   * 访问次数
   * 记录用户访问该系列的总次数
   */
  @Column({ type: 'int', default: 1, name: 'visit_count' })
  visitCount: number;

  /** 
   * 用户代理
   * 记录用户的浏览器和设备信息
   */
  @Column({ type: 'varchar', length: 500, nullable: true, name: 'user_agent' })
  userAgent: string | null;

  /** 
   * IP地址
   * 记录用户的IP地址
   */
  @Column({ type: 'varchar', length: 45, nullable: true, name: 'ip_address' })
  ipAddress: string | null;

  /** 
   * 创建时间 
   * 记录首次访问的时间
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /** 
   * 更新时间 
   * 记录最后访问的时间
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /** 
   * 多对一关系：用户 
   * 关联到浏览记录所属的用户
   */
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  /** 
   * 多对一关系：剧集系列 
   * 关联到浏览记录所属的剧集系列
   */
  @ManyToOne(() => Series)
  @JoinColumn({ name: 'series_id' })
  series: Series;
}
