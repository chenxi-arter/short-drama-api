import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, Index, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { AdvertisingCampaign } from './advertising-campaign.entity';

@Entity('advertising_campaign_stats')
@Unique(['campaignId', 'statDate'])
@Index(['statDate'])
@Index(['updatedAt'])
export class AdvertisingCampaignStats {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'campaign_id', type: 'bigint', nullable: false, comment: '投放计划ID' })
  campaignId: number;

  @Column({ name: 'stat_date', type: 'date', nullable: false, comment: '统计日期' })
  statDate: Date;

  @Column({ name: 'total_clicks', type: 'int', default: 0, comment: '总点击量' })
  totalClicks: number;

  @Column({ name: 'total_views', type: 'int', default: 0, comment: '总浏览量' })
  totalViews: number;

  @Column({ name: 'total_conversions', type: 'int', default: 0, comment: '总转化量' })
  totalConversions: number;

  @Column({ name: 'conversion_rate', type: 'decimal', precision: 5, scale: 4, default: 0, comment: '转化率' })
  conversionRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, comment: '花费' })
  cost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, comment: '单次点击成本' })
  cpc: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, comment: '单次获客成本' })
  cpa: number;

  @Column({ name: 'new_users', type: 'int', default: 0, comment: '新用户数' })
  newUsers: number;

  @Column({ name: 'returning_users', type: 'int', default: 0, comment: '回访用户数' })
  returningUsers: number;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;

  @ManyToOne(() => AdvertisingCampaign, campaign => campaign.stats, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_id' })
  campaign: AdvertisingCampaign;
}
