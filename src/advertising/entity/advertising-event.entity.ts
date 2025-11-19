import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { AdvertisingCampaign } from './advertising-campaign.entity';

export enum EventType {
  CLICK = 'click',
  VIEW = 'view',
  REGISTER = 'register',
  LOGIN = 'login',
  PLAY = 'play',
  SHARE = 'share'
}

@Entity('advertising_events')
@Index(['campaignCode'])
@Index(['userId'])
@Index(['deviceId'])
export class AdvertisingEvent {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'campaign_id', type: 'bigint', nullable: false, comment: '投放计划ID' })
  campaignId: number;

  @Column({ name: 'campaign_code', type: 'varchar', length: 50, nullable: false, comment: '计划代码' })
  campaignCode: string;

  @Column({ 
    name: 'event_type',
    type: 'enum', 
    enum: EventType, 
    nullable: false,
    comment: '事件类型'
  })
  eventType: EventType;

  @Column({ name: 'event_data', type: 'json', nullable: true, comment: '事件详细数据' })
  eventData: any;

  @Column({ name: 'user_id', type: 'bigint', nullable: true, comment: '用户ID（如果已注册）' })
  userId: number;

  @Column({ name: 'session_id', type: 'varchar', length: 100, nullable: true, comment: '会话ID' })
  sessionId: string;

  @Column({ name: 'device_id', type: 'varchar', length: 100, nullable: true, comment: '设备唯一标识' })
  deviceId: string;

  @Column({ type: 'text', nullable: true, comment: '来源页面' })
  referrer: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true, comment: '用户代理' })
  userAgent: string;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true, comment: 'IP地址' })
  ipAddress: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '国家' })
  country: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '地区' })
  region: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '城市' })
  city: string;

  @Column({ name: 'event_time', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', comment: '事件时间' })
  eventTime: Date;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @ManyToOne(() => AdvertisingCampaign, campaign => campaign.events, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_id' })
  campaign: AdvertisingCampaign;
}
