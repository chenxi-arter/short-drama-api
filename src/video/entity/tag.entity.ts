// src/video/entity/tag.entity.ts
/**
 * 标签实体类
 * 用于对视频内容进行标签化管理，如热映、悬疑、都市等
 */
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Episode } from './episode.entity';
import { Series } from './series.entity';

@Entity('tags')
export class Tag {
  /** 
   * 标签主键ID 
   * 自动生成的唯一标识符
   */
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  /** 
   * 标签名称 
   * 如：2025热映、悬疑、都市等，全局唯一
   */
  @Column({ length: 30, unique: true })
  name: string;

  /** 
   * 多对多关系：关联的电视剧系列 
   * 一个标签可以关联多个系列，反向引用，不建外键列
   */
  @ManyToMany(() => Series, s => s.tags)
  series: Series[];

  /** 
   * 多对多关系：关联的剧集 
   * 一个标签可以关联多个剧集，反向引用，不建外键列
   */
  @ManyToMany(() => Episode, ep => ep.tags)
  episodes: Episode[];
}