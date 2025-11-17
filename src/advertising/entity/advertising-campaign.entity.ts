import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { AdvertisingPlatform } from './advertising-platform.entity';
import { AdvertisingEvent } from './advertising-event.entity';
import { AdvertisingConversion } from './advertising-conversion.entity';
import { AdvertisingCampaignStats } from './advertising-campaign-stats.entity';

export enum CampaignStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

@Entity('advertising_campaigns')
@Index(['platformId'])
@Index(['platformCode'])
@Index(['status'])
@Index(['campaignCode'])
@Index(['startDate', 'endDate'])
@Index(['createdAt'])
export class AdvertisingCampaign {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: false, comment: '计划名称' })
  name: string;

  @Column({ type: 'text', nullable: true, comment: '计划描述' })
  description: string;

  @Column({ name: 'platform_id', type: 'bigint', nullable: false, comment: '投放平台ID' })
  platformId: number;

  @Column({ name: 'platform_code', type: 'varchar', length: 50, nullable: false, comment: '平台代码（冗余字段，便于查询）' })
  platformCode: string;

  @Column({ name: 'campaign_code', type: 'varchar', length: 50, unique: true, nullable: false, comment: '计划唯一标识码' })
  campaignCode: string;

  @Column({ name: 'target_url', type: 'text', nullable: false, comment: '目标落地页URL' })
  targetUrl: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '预算金额' })
  budget: number;

  @Column({ name: 'target_clicks', type: 'int', nullable: true, comment: '目标点击量' })
  targetClicks: number;

  @Column({ name: 'target_conversions', type: 'int', nullable: true, comment: '目标转化量' })
  targetConversions: number;

  @Column({ name: 'start_date', type: 'datetime', nullable: false, comment: '开始时间' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'datetime', nullable: true, comment: '结束时间' })
  endDate: Date;

  @Column({ 
    type: 'enum', 
    enum: CampaignStatus, 
    default: CampaignStatus.DRAFT,
    comment: '状态'
  })
  status: CampaignStatus;

  @Column({ name: 'is_active', type: 'boolean', default: true, comment: '是否活跃' })
  isActive: boolean;

  @Column({ name: 'created_by', type: 'varchar', length: 100, nullable: true, comment: '创建人' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;

  @ManyToOne(() => AdvertisingPlatform, platform => platform.campaigns)
  @JoinColumn({ name: 'platform_id' })
  platform: AdvertisingPlatform;

  @OneToMany(() => AdvertisingEvent, event => event.campaign)
  events: AdvertisingEvent[];

  @OneToMany(() => AdvertisingConversion, conversion => conversion.campaign)
  conversions: AdvertisingConversion[];

  @OneToMany(() => AdvertisingCampaignStats, stats => stats.campaign)
  stats: AdvertisingCampaignStats[];
}
