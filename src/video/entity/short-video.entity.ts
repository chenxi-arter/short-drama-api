// src/video/entity/short-video.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Category } from './category.entity';


@Entity('short_videos')
export class ShortVideo {
  @PrimaryGeneratedColumn() id: number;

  @Column({ length: 255 }) title: string;
  @Column({ type: 'text', nullable: true }) description: string;

  @Column({ length: 255 }) coverUrl: string;   // 竖屏封面
  @Column({ length: 255 }) videoUrl: string;  // 竖屏 mp4 / hls
  @Column({ type: 'int', default: 0 }) duration: number; // 秒

  @Column({ type: 'int', default: 0 }) playCount: number;
  @Column({ type: 'int', default: 0 }) likeCount: number;

  @Column({ length: 50, default: '官方平台' }) platformName: string; // 👈 平台名

  @ManyToOne(() => Category, c => c.shortVideos, { nullable: false }) category: Category;
  @CreateDateColumn() createdAt: Date;
}