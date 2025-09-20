import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Category } from './category.entity';
import { Series } from './series.entity';

/**
 * 轮播图实体
 */
@Entity('banners')
export class Banner {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * 轮播图标题
   */
  @Column({ 
    length: 255
  })
  title: string;

  /**
   * 轮播图图片URL
   */
  @Column({ length: 500, name: 'image_url' })
  imageUrl: string;

  /**
   * 关联的视频系列ID（可选）
   */
  @Column({ nullable: true, name: 'series_id' })
  seriesId?: number;

  /**
   * 关联的分类ID
   */
  @Column({ name: 'category_id' })
  categoryId: number;

  /**
   * 跳转链接（如果不关联视频系列）
   */
  @Column({ length: 500, nullable: true, name: 'link_url' })
  linkUrl?: string;

  /**
   * 排序权重（数字越大越靠前）
   */
  @Column({ default: 0 })
  weight: number;

  /**
   * 是否启用
   */
  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  /**
   * 是否为广告（true=广告，false=自有内容）
   */
  @Column({ default: false, name: 'is_ad' })
  isAd: boolean;

  /**
   * 开始展示时间
   */
  @Column({ nullable: true, name: 'start_time' })
  startTime?: Date;

  /**
   * 结束展示时间
   */
  @Column({ nullable: true, name: 'end_time' })
  endTime?: Date;

  /**
   * 描述信息
   */
  @Column({ 
    type: 'text', 
    nullable: true
  })
  description?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * 展示次数（曝光）
   */
  @Column({ type: 'int', default: 0, name: 'impressions' })
  impressions: number;

  /**
   * 点击次数
   */
  @Column({ type: 'int', default: 0, name: 'clicks' })
  clicks: number;

  // 关联关系
  @ManyToOne(() => Category, { eager: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @ManyToOne(() => Series, { nullable: true })
  @JoinColumn({ name: 'series_id' })
  series?: Series;
}