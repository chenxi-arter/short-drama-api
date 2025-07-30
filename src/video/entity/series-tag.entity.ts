// src/video/entity/series-tag.entity.ts
/**
 * 系列标签关联实体类
 * 用于管理系列与标签之间的多对多关系
 * 注意：此文件内容与tag.entity.ts重复，建议使用tag.entity.ts作为标准实现
 */
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Series } from './series.entity';
import { Episode } from './episode.entity';

/**
 * 标签实体类 - 系列标签关联版本
 * 此类与tag.entity.ts中的Tag类功能相同，建议统一使用tag.entity.ts中的实现
 */
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