import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { AdvertisingCampaign } from './advertising-campaign.entity';

export enum ConversionType {
  REGISTER = 'register',
  FIRST_PLAY = 'first_play',
  SUBSCRIPTION = 'subscription',
  PURCHASE = 'purchase'
}

@Entity('advertising_conversions')
@Index(['campaignCode'])
@Index(['userId'])
export class AdvertisingConversion {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'campaign_id', type: 'bigint', nullable: false, comment: '投放计划ID' })
  campaignId: number;

  @Column({ name: 'campaign_code', type: 'varchar', length: 50, nullable: false, comment: '计划代码' })
  campaignCode: string;

  @Column({ 
    name: 'conversion_type',
    type: 'enum', 
    enum: ConversionType, 
    nullable: false,
    comment: '转化类型'
  })
  conversionType: ConversionType;

  @Column({ name: 'conversion_value', type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '转化价值' })
  conversionValue: number;

  @Column({ name: 'user_id', type: 'bigint', nullable: false, comment: '用户ID' })
  userId: number;

  @Column({ name: 'session_id', type: 'varchar', length: 100, nullable: true, comment: '会话ID' })
  sessionId: string;

  @Column({ name: 'device_id', type: 'varchar', length: 100, nullable: true, comment: '设备ID' })
  deviceId: string;

  @Column({ name: 'first_click_time', type: 'timestamp', nullable: true, comment: '首次点击时间' })
  firstClickTime: Date;

  @Column({ name: 'conversion_time', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', comment: '转化时间' })
  conversionTime: Date;

  @Column({ name: 'time_to_conversion', type: 'int', nullable: true, comment: '转化耗时（秒）' })
  timeToConversion: number;

  @Column({ name: 'attribution_model', type: 'varchar', length: 50, default: 'last_click', comment: '归因模型' })
  attributionModel: string;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @ManyToOne(() => AdvertisingCampaign, campaign => campaign.conversions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_id' })
  campaign: AdvertisingCampaign;
}
