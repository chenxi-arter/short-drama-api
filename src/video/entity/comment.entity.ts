// src/video/entity/comment.entity.ts
/**
 * 评论/弹幕实体类
 * 用于存储用户对剧集的评论或弹幕信息
 */
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../../user/entity/user.entity';
import { Episode } from './episode.entity';

@Entity('comments')
export class Comment {
  /** 
   * 弹幕/评论主键ID 
   * 自动生成的唯一标识符
   */
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  /** 
   * 发表评论的用户ID 
   * 外键，关联到users表的id字段
   */
  @Column({ name: 'user_id' })
  userId: number;

  /** 
   * 评论所属的剧集ID 
   * 外键，关联到episodes表的id字段
   */
  @Column({ name: 'episode_id' })
  episodeId: number;

  /** 
   * 评论/弹幕文字内容 
   * 用户发表的评论或弹幕的具体内容
   */
  @Column({ type: 'text', name: 'content' })
  content: string;

  /** 
   * 弹幕出现时间 
   * 弹幕在视频中的出现秒数，普通评论可填0
   */
  @Column({ type: 'int', default: 0, name: 'appear_second' })
  appearSecond: number;

  /** 
   * 创建时间 
   * 记录评论创建的时间戳
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /** 
   * 多对一关系：评论作者 
   * 关联到发表评论的用户信息
   */
  @ManyToOne(() => User, u => u.comments)
  @JoinColumn({ name: 'user_id' })
  user: User;

  /** 
   * 多对一关系：所属剧集 
   * 关联到评论所属的剧集
   */
  @ManyToOne(() => Episode, ep => ep.comments)
  @JoinColumn({ name: 'episode_id' })
  episode: Episode;
}