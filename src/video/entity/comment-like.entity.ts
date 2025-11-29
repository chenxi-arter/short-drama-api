import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index, Unique } from 'typeorm';
import { User } from '../../user/entity/user.entity';
import { Comment } from './comment.entity';

/**
 * 评论点赞记录实体
 * 记录用户对评论的点赞关系
 */
@Entity('comment_likes')
@Unique('idx_user_comment', ['userId', 'commentId'])
@Index(['commentId'])
@Index(['createdAt'])
export class CommentLike {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  /** 点赞用户ID */
  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  /** 评论ID */
  @Column({ name: 'comment_id', type: 'int' })
  commentId: number;

  /** 是否已读（针对被点赞者的通知） */
  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead: boolean;

  /** 点赞时间 */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /** 关联用户 */
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  /** 关联评论 */
  @ManyToOne(() => Comment)
  @JoinColumn({ name: 'comment_id' })
  comment: Comment;
}
