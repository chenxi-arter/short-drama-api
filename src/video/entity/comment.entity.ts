// src/video/entity/comment.entity.ts
/**
 * 评论/弹幕实体类
 * 用于存储用户对剧集的评论或弹幕信息
 */
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../../user/entity/user.entity';

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
   * 评论所属的剧集 ShortID
   * 使用 ShortID 避免剧集删除后评论对应关系错误
   */
  @Column({ name: 'episode_short_id', type: 'varchar', length: 20 })
  episodeShortId: string;

  /** 
   * 父评论ID（盖楼功能）
   * null: 主楼评论
   * 非null: 回复某条评论
   */
  @Column({ name: 'parent_id', type: 'int', nullable: true })
  parentId?: number;

  /** 
   * 根评论ID（主楼ID）
   * null: 自己是主楼
   * 非null: 属于某个主楼的回复
   */
  @Column({ name: 'root_id', type: 'int', nullable: true })
  rootId?: number;

  /** 
   * 回复目标用户ID
   * 用于@提醒功能
   */
  @Column({ name: 'reply_to_user_id', type: 'bigint', nullable: true })
  replyToUserId?: number;

  /** 
   * 楼层号
   * 同一主楼下的序号，主楼为0
   */
  @Column({ name: 'floor_number', type: 'int', default: 0 })
  floorNumber: number;

  /** 
   * 回复数量
   * 仅主楼统计，子回复为0
   */
  @Column({ name: 'reply_count', type: 'int', default: 0 })
  replyCount: number;

  /** 
   * 点赞数量
   * 记录该评论获得的点赞总数
   */
  @Column({ name: 'like_count', type: 'int', default: 0 })
  likeCount: number;

  /** 
   * 是否已读（针对回复消息）
   * true: 被回复者已查看
   * false: 未查看
   */
  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead: boolean;

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
}