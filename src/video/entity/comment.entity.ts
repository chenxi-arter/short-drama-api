// src/video/entity/comment.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn,JoinColumn } from 'typeorm';
import { User } from '../../user/entity/user.entity';
import { Episode } from './episode.entity';

@Entity('comments')
export class Comment {
  /** 弹幕/评论主键 */
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  /** 发表评论的用户 id（外键 → users.id） */
  @Column({ name: 'user_id' })
  userId: number;

  /** 该条评论所属的剧集 id（外键 → episodes.id） */
  @Column({ name: 'episode_id' })
  episodeId: number;

  /** 评论/弹幕文字内容 */
  @Column({ type: 'text', name: 'content' })
  content: string;

  /** 弹幕在视频中的出现秒数（普通评论可填 0） */
  @Column({ type: 'int', default: 0, name: 'appear_second' })
  appearSecond: number;

  /** 评论创建时间 */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /** 多对一：作者信息 */
  @ManyToOne(() => User, u => u.comments)
  @JoinColumn({ name: 'user_id' })
  user: User;

  /** 多对一：所属剧集 */
  @ManyToOne(() => Episode, ep => ep.comments)
  @JoinColumn({ name: 'episode_id' })
  episode: Episode;
}