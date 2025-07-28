// src/video/entity/series.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Episode } from './episode.entity';
import { Category } from './category.entity';

@Entity('series')
export class Series {
  /** 电视剧/系列主键 */
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  /** 电视剧标题 */
  @Column({ length: 255, name: 'title' })
  title: string;

  /** 简介/描述（可空） */
  @Column({ type: 'text', nullable: true, name: 'description' })
  description: string;

  /** 封面图 OSS 地址（可空） */
  @Column({ length: 255, nullable: true, name: 'cover_url' })
  coverUrl: string;

  /** 总集数（冗余字段，方便统计） */
  @Column({ default: 0, name: 'total_episodes' })
  totalEpisodes: number;

  /** 创建时间 */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /** 一对多：该系列下的所有剧集 */
  @OneToMany(() => Episode, ep => ep.series)
  episodes: Episode[];

  /** 多对一：所属分类（可空） */
  @ManyToOne(() => Category, c => c.series, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;
}