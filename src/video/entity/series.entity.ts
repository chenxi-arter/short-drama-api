// src/video/entity/series.entity.ts
/**
 * 剧集系列实体类
 * 表示一个完整的电视剧或系列，包含多个剧集
 */
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Episode } from './episode.entity';
import { Category } from './category.entity';

@Entity('series')
export class Series {
  /** 
   * 电视剧/系列主键ID 
   * 自动生成的唯一标识符
   */
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  /** 
   * 电视剧标题 
   * 系列的名称，最大长度255字符
   */
  @Column({ length: 255, name: 'title' })
  title: string;

  /** 
   * 简介/描述
   * 系列的详细介绍，可以为空
   */
  @Column({ type: 'text', nullable: true, name: 'description' })
  description: string;

  /** 
   * 封面图OSS地址
   * 系列的封面图片URL，可以为空
   */
  @Column({ length: 255, nullable: true, name: 'cover_url' })
  coverUrl: string;

  /** 
   * 总集数
   * 冗余字段，方便统计，默认为0
   */
  @Column({ default: 0, name: 'total_episodes' })
  totalEpisodes: number;

  /** 
   * 创建时间 
   * 记录系列创建的时间戳
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /** 
   * 一对多关系：该系列下的所有剧集 
   * 一个系列可以包含多个剧集
   */
  @OneToMany(() => Episode, ep => ep.series)
  episodes: Episode[];

  /** 
   * 多对一关系：所属分类
   * 一个系列属于一个分类，可以为空
   */
  @ManyToOne(() => Category, c => c.series, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  /** 
   * 评分
   * 系列的平均评分，默认为0
   */
  @Column({ type: 'float', default: 0 })
  score: number;

  /** 
   * 播放次数
   * 记录系列的总播放次数，默认为0
   */
  @Column({ type: 'int', default: 0 })
  playCount: number;

  /** 
   * 状态
   * 系列的当前状态，如：on-going（连载中）、completed（已完结）等
   */
  @Column({ default: 'on-going' })
  status: string;
  
  /**
   * 更新状态
   * 显示给用户的更新状态，如：更新到第10集、全集
   */
  @Column({ length: 50, nullable: true, name: 'up_status' })
  upStatus: string;
  
  /** 
   * 更新次数
   * 记录系列更新的次数
   */
  @Column({ type: 'int', default: 0, name: 'up_count' })
  upCount: number;

  /** 
   * 主演名单
   * 系列的主要演员列表，多个演员用逗号分隔
   */
  @Column({ type: 'text', nullable: true, name: 'starring' })
  starring: string;

  /** 
   * 演员名单
   * 系列的完整演员列表，多个演员用逗号分隔
   */
  @Column({ type: 'text', nullable: true, name: 'actor' })
  actor: string;

  /** 
   * 导演
   * 系列的导演信息，多个导演用逗号分隔
   */
  @Column({ length: 255, nullable: true, name: 'director' })
  director: string;

  /** 
   * 地区
   * 系列的制作地区，如：中国大陆、香港、台湾等
   */
  @Column({ length: 50, nullable: true, name: 'region' })
  region: string;

  /** 
   * 语言
   * 系列的主要语言，如：中文、英文等
   */
  @Column({ length: 50, nullable: true, name: 'language' })
  language: string;

  /** 
   * 发布日期
   * 系列的首播或发布日期
   */
  @Column({ type: 'date', nullable: true, name: 'release_date' })
  releaseDate: Date;

  /** 
   * 是否完结
   * 标识系列是否已经完结
   */
  @Column({ type: 'boolean', default: false, name: 'is_completed' })
  isCompleted: boolean;

  /** 
   * 更新时间
   * 记录系列最后更新的时间
   */
  @Column({ type: 'timestamp', nullable: true, name: 'updated_at' })
  updatedAt: Date;

  /**
   * 分类ID
   * 关联到category表的外键
   */
  @Column({ type: 'varchar', nullable: true, name: 'category_id' })
  categoryId: string;
}
