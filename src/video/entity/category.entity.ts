// src/video/entity/category.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Series } from './series.entity';
import { ShortVideo } from './short-video.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn() id: number;

  @Column({ length: 50, unique: true })
  name: string; // 都市 / 古装 / 玄幻 ...

  @OneToMany(() => Series, s => s.category)
  series: Series[];
   /* 新增：一对多 → ShortVideo */
  @OneToMany(() => ShortVideo, sv => sv.category)
  shortVideos: ShortVideo[];
}