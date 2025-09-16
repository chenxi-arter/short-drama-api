// src/video/entity/series.entity.ts
/**
 * 剧集系列实体类
 * 表示一个完整的电视剧或系列，包含多个剧集
 */
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, ManyToOne, JoinColumn, BeforeInsert, UpdateDateColumn } from 'typeorm';
import { Episode } from './episode.entity';
import { Category } from './category.entity';
// import { BrowseHistory } from './browse-history.entity';
import { ShortIdUtil } from '../../shared/utils/short-id.util';
import { FilterOption } from './filter-option.entity';

@Entity('series')
export class Series {
  /** 
   * 电视剧/系列主键ID 
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
   * 电视剧标题 
   * 系列的名称，最大长度255字符
   */
  @Column({ length: 255, name: 'title' })
  title: string;

  /**
   * 外部唯一ID（用于采集与幂等）
   */
  @Column({ type: 'varchar', length: 128, nullable: true, unique: true, name: 'external_id' })
  externalId: string | null;

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
   * 一对多关系：浏览记录 
   * 一个系列可以有多条浏览记录
   */
  // @OneToMany(() => BrowseHistory, bh => bh.series)
  // browseHistories: BrowseHistory[];

  /** 
   * 多对一关系：所属分类
   * 一个系列属于一个分类，可以为空
   */
  @ManyToOne(() => Category, c => c.series, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  /**
   * 分类ID字段
   * 存储关联的分类主键ID
   */
  @Column({ type: 'int', nullable: true, name: 'category_id' })
  categoryId: number;

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
  @Column({ type: 'int', default: 0, name: 'play_count' })
  playCount: number;

  /** 
   * 更新状态
   * 系列的更新状态信息，如"已完结"、"更新中"等
   */
  @Column({ length: 255, nullable: true, name: 'up_status' })
  upStatus: string;

  /** 
   * 更新次数
   * 记录系列更新的次数
   */
  @Column({ type: 'int', default: 0, name: 'up_count' })
  upCount: number;

  // 状态字符串字段已移除，统一使用 statusOption/statusOptionId

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
   * 地区（外键关联 filter_options）
   */
  @ManyToOne(() => FilterOption, { nullable: true })
  @JoinColumn({ name: 'region_option_id' })
  regionOption: FilterOption;

  @Column({ type: 'int', nullable: true, name: 'region_option_id' })
  regionOptionId: number;

  /** 
   * 语言（外键关联 filter_options）
   */
  @ManyToOne(() => FilterOption, { nullable: true })
  @JoinColumn({ name: 'language_option_id' })
  languageOption: FilterOption;

  @Column({ type: 'int', nullable: true, name: 'language_option_id' })
  languageOptionId: number;

  /** 
   * 状态选项（外键关联 filter_options）
   */
  @ManyToOne(() => FilterOption, { nullable: true })
  @JoinColumn({ name: 'status_option_id' })
  statusOption: FilterOption;

  @Column({ type: 'int', nullable: true, name: 'status_option_id' })
  statusOptionId: number;

  /** 
   * 年份（外键关联 filter_options）
   */
  @ManyToOne(() => FilterOption, { nullable: true })
  @JoinColumn({ name: 'year_option_id' })
  yearOption: FilterOption;

  @Column({ type: 'int', nullable: true, name: 'year_option_id' })
  yearOptionId: number;

  /** 
   * 发布日期
   * 系列的首播或发布日期
   */
  @Column({ type: 'datetime', nullable: true, name: 'release_date' })
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
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * 是否活跃（软删除标记）
   * 1=正常（默认），0=已删除
   */
  @Column({ type: 'tinyint', width: 1, default: 1, name: 'is_active' })
  isActive: number;

  /**
   * 删除时间（软删除）
   * NULL=未删除，有值=删除时间
   */
  @Column({ type: 'datetime', nullable: true, name: 'deleted_at' })
  deletedAt: Date | null;

  /**
   * 删除者用户ID（可选）
   * 记录是谁删除了这个系列
   */
  @Column({ type: 'int', nullable: true, name: 'deleted_by' })
  deletedBy: number | null;
  
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
