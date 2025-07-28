// src/video/entity/category.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Series } from './series.entity';
import { ShortVideo } from './short-video.entity';

@Entity('categories')
export class Category {
  /** 分类主键 */
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  /** 分类名称，如：都市 / 古装 / 玄幻，全局唯一 */
  @Column({ length: 50, unique: true, name: 'name' })
  name: string;

  /** 该分类下的所有电视剧 */
  @OneToMany(() => Series, s => s.category)
  series: Series[];

  /** 该分类下的所有短视频 */
  @OneToMany(() => ShortVideo, sv => sv.category)
  shortVideos: ShortVideo[];
}