// src/video/entity/episode.entity.ts
/**
 * 剧集实体类
 * 表示一个电视剧系列中的单集内容
 */
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn, BeforeInsert } from 'typeorm';
import { Series } from './series.entity';
import { EpisodeUrl } from './episode-url.entity';
import { WatchProgress } from './watch-progress.entity';
import { Comment } from './comment.entity';
import { ShortIdUtil } from '../../shared/utils/short-id.util';

@Entity('episodes')
export class Episode {
  /** 
   * 剧集主键ID 
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
   * 所属电视剧ID 
   * 外键，关联到series表的id字段
   */
  @Column({ name: 'series_id' })
  seriesId: number;

  /** 
   * 集数编号 
   * 表示该剧集是第几集
   */
  @Column({ name: 'episode_number' })
  episodeNumber: number;

  /** 
   * 剧集标题 
   * 本集的名称，最大长度255字符
   */
  @Column({ length: 255, name: 'title' })
  title: string;

  /** 
   * 时长 
   * 剧集的播放时长，以秒为单位
   */
  @Column({ type: 'int', name: 'duration' })
  duration: number;

  /** 
   * 状态 
   * 剧集的发布状态，如：published（已发布）、hidden（隐藏）、draft（草稿）等
   */
  @Column({ default: 'published', name: 'status' })
  status: string;

  /** 
   * 多对一关系：所属电视剧 
   * 一个剧集属于一个系列
   */
  @ManyToOne(() => Series, s => s.episodes)
  @JoinColumn({ name: 'series_id' })
  series: Series;

  /** 
   * 一对多关系：该集的所有播放地址 
   * 一个剧集可以有多个不同清晰度的播放地址
   */
  @OneToMany(() => EpisodeUrl, url => url.episode)
  urls: EpisodeUrl[];

  /** 
   * 一对多关系：所有用户的观看进度 
   * 记录不同用户对该剧集的观看进度
   */
  @OneToMany(() => WatchProgress, wp => wp.episode)
  watchProgresses: WatchProgress[];

  /** 
   * 一对多关系：该集的所有评论/弹幕 
   * 一个剧集可以有多条评论或弹幕
   */
  @OneToMany(() => Comment, c => c.episode)
  comments: Comment[];
  /** 
   * 播放次数
   * 记录剧集的播放次数，默认为0
   */
  @Column({ type: 'int', default: 0, name: 'play_count' })
  playCount: number;

  /** 
   * 创建时间 
   * 记录剧集创建的时间戳
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /** 
   * 更新时间 
   * 记录剧集最后更新的时间戳
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /** 
   * 是否有续集 
   * 标识该剧集是否有续集或后续内容
   */
  @Column({ type: 'boolean', default: false, name: 'has_sequel' })
  hasSequel: boolean;

  /**
   * 剧集分类通过所属系列的category进行管理
   * 不再需要单独的tags字段
   */
  
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