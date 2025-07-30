// src/video/entity/category.entity.ts
/**
 * 分类实体类
 * 用于对视频内容进行分类管理，如都市、古装、玄幻等
 */
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Series } from './series.entity';
import { ShortVideo } from './short-video.entity';

@Entity('categories')
export class Category {
  /** 
   * 分类主键ID 
   * 自动生成的唯一标识符
   */
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  /** 
   * 分类名称 
   * 如：都市、古装、玄幻等，全局唯一
   */
  @Column({ length: 50, unique: true, name: 'name' })
  name: string;

  /** 
   * 一对多关系：该分类下的所有电视剧系列 
   * 一个分类可以包含多个电视剧系列
   */
  @OneToMany(() => Series, s => s.category)
  series: Series[];

  /** 
   * 一对多关系：该分类下的所有短视频 
   * 一个分类可以包含多个短视频
   */
  @OneToMany(() => ShortVideo, sv => sv.category)
  shortVideos: ShortVideo[];
}