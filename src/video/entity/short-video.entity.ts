// src/video/entity/short-video.entity.ts
/**
 * 短视频实体类
 * 表示独立的短视频内容，不属于任何系列
 */
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, BeforeInsert } from 'typeorm';
import { Category } from './category.entity';
import { ShortIdUtil } from '../../shared/utils/short-id.util';

@Entity('short_videos')
export class ShortVideo {
  /** 
   * 短视频主键ID 
   * 自动生成的唯一标识符
   */
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  /** 
   * 短ID标识符（防枚举攻击）
   * 用于外部API访问的安全标识符，11位类似base64编码
   */
  @Column({ type: 'varchar', length: 11, unique: true, nullable: true, name: 'short_id' })
  shortId: string;

  /** 
   * 短视频标题 
   * 视频的名称，最大长度255字符
   */
  @Column({ length: 255, name: 'title' })
  title: string;

  /** 
   * 简介/描述 
   * 视频的详细介绍，可以为空
   */
  @Column({ type: 'text', nullable: true, name: 'description' })
  description: string;

  /** 
   * 竖屏封面OSS地址 
   * 短视频的封面图片URL
   */
  @Column({ length: 255, name: 'cover_url' })
  coverUrl: string;

  /** 
   * 竖屏mp4/hls播放地址 
   * 短视频的实际播放地址
   */
  @Column({ length: 255, name: 'video_url' })
  videoUrl: string;

  /** 
   * 时长 
   * 视频的播放时长，以秒为单位，默认为0
   */
  @Column({ type: 'int', default: 0, name: 'duration' })
  duration: number;

  /** 
   * 播放次数 
   * 记录视频的总播放次数，默认为0
   */
  @Column({ type: 'int', default: 0, name: 'play_count' })
  playCount: number;

  /** 
   * 点赞次数 
   * 记录视频获得的点赞数量，默认为0
   */
  @Column({ type: 'int', default: 0, name: 'like_count' })
  likeCount: number;

  /** 
   * 发布平台名称 
   * 视频的来源平台，默认为"官方平台"
   */
  @Column({ length: 50, default: '官方平台', name: 'platform_name' })
  platformName: string;

  /** 
   * 所属分类ID 
   * 外键，关联到categories表的id字段
   */
  @Column({ name: 'category_id' })
  categoryId: number;

  /** 
   * 多对一关系：所属分类 
   * 一个短视频属于一个分类，不可为空
   */
  @ManyToOne(() => Category, c => c.shortVideos, { nullable: false })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  /** 
   * 创建时间 
   * 记录短视频创建的时间戳
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
  
  /**
   * 在插入前自动生成短ID
   */
  @BeforeInsert()
  generateShortId() {
    if (!this.shortId) {
      this.shortId = ShortIdUtil.generate();
    }
  }
}