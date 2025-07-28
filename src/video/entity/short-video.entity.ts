// src/video/entity/short-video.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Category } from './category.entity';

@Entity('short_videos')
export class ShortVideo {
  /** 短视频主键 */
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  /** 短视频标题 */
  @Column({ length: 255, name: 'title' })
  title: string;

  /** 简介/描述（可空） */
  @Column({ type: 'text', nullable: true, name: 'description' })
  description: string;

  /** 竖屏封面 OSS 地址 */
  @Column({ length: 255, name: 'cover_url' })
  coverUrl: string;

  /** 竖屏 mp4/hls 播放地址 */
  @Column({ length: 255, name: 'video_url' })
  videoUrl: string;

  /** 时长（秒） */
  @Column({ type: 'int', default: 0, name: 'duration' })
  duration: number;

  /** 播放次数 */
  @Column({ type: 'int', default: 0, name: 'play_count' })
  playCount: number;

  /** 点赞次数 */
  @Column({ type: 'int', default: 0, name: 'like_count' })
  likeCount: number;

  /** 发布平台名称（默认“官方平台”） */
  @Column({ length: 50, default: '官方平台', name: 'platform_name' })
  platformName: string;

  /** 外键列：所属分类 id */
  @Column({ name: 'category_id' })
  categoryId: number;

  /** 多对一：所属分类（不可空） */
  @ManyToOne(() => Category, c => c.shortVideos, { nullable: false })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  /** 创建时间 */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}