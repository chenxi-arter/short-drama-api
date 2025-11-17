import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToMany } from 'typeorm';
import { AdvertisingCampaign } from './advertising-campaign.entity';

@Entity('advertising_platforms')
@Index(['code'])
@Index(['isEnabled'])
@Index(['sortOrder'])
@Index(['createdAt'])
export class AdvertisingPlatform {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 100, nullable: false, comment: '平台名称' })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: false, comment: '平台代码（用于生成campaign_code）' })
  code: string;

  @Column({ type: 'text', nullable: true, comment: '平台描述' })
  description: string;

  @Column({ name: 'icon_url', type: 'varchar', length: 500, nullable: true, comment: '平台图标URL' })
  iconUrl: string;

  @Column({ type: 'varchar', length: 20, default: '#1890ff', comment: '平台主题色' })
  color: string;

  @Column({ name: 'is_enabled', type: 'boolean', default: true, comment: '是否启用' })
  isEnabled: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0, comment: '排序权重' })
  sortOrder: number;

  @Column({ type: 'json', nullable: true, comment: '平台特有配置信息' })
  config: any;

  @Column({ name: 'created_by', type: 'varchar', length: 100, nullable: true, comment: '创建人' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;

  @OneToMany(() => AdvertisingCampaign, campaign => campaign.platform)
  campaigns: AdvertisingCampaign[];
}
