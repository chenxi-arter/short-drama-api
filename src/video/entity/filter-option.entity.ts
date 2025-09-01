import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { FilterType } from './filter-type.entity';

/**
 * 筛选器选项实体
 */
@Entity('filter_options')
export class FilterOption {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'filter_type_id', comment: '筛选器类型ID' })
  filterTypeId: number;

  @Column({ length: 100, comment: '选项名称' })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '选项值' })
  value?: string | null;

  @Column({ name: 'is_default', type: 'tinyint', width: 1, default: 0, comment: '是否默认选中' })
  isDefault: boolean;

  @Column({ name: 'is_active', type: 'tinyint', width: 1, default: 1, comment: '是否启用' })
  isActive: boolean;

  @Column({ name: 'sort_order', default: 0, comment: '排序顺序' })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;

  @ManyToOne(() => FilterType, filterType => filterType.options)
  @JoinColumn({ name: 'filter_type_id' })
  filterType: FilterType;
}