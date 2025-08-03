import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { FilterOption } from './filter-option.entity';

/**
 * 筛选器类型实体
 */
@Entity('filter_types')
export class FilterType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, comment: '筛选器类型名称' })
  name: string;

  @Column({ length: 50, unique: true, comment: '筛选器类型代码' })
  code: string;

  @Column({ name: 'index_position', default: 0, comment: '在筛选器中的位置索引' })
  indexPosition: number;

  @Column({ name: 'is_active', type: 'tinyint', width: 1, default: 1, comment: '是否启用' })
  isActive: boolean;

  @Column({ name: 'sort_order', default: 0, comment: '排序顺序' })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;

  @OneToMany(() => FilterOption, filterOption => filterOption.filterType)
  options: FilterOption[];
}