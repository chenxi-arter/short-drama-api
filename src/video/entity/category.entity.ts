// src/video/entity/category.entity.ts
/**
 * 分类实体类
 * 用于对视频内容进行分类管理，支持多种类型的分类
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
   * 分类ID（可以是数字或字符串）
   * 用于前端识别的分类标识
   */
  @Column({ length: 50, name: 'category_id', unique: true })
  categoryId: string;

  /** 
   * 分类名称 
   * 如：首页、电影、电视剧、综艺等
   */
  @Column({ length: 50, name: 'name' })
  name: string;



  /** 
   * 路由名称
   * 前端路由跳转使用的名称
   */
  @Column({ length: 50, nullable: true, name: 'route_name' })
  routeName: string;



  /** 
   * 是否启用
   * 控制分类是否在前端显示
   */
  @Column({ type: 'boolean', default: true, name: 'is_enabled' })
  isEnabled: boolean;

  /** 
   * 创建时间
   */
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  /** 
   * 更新时间
   */
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP', name: 'updated_at' })
  updatedAt: Date;

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