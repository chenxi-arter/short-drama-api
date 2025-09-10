import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('banner_metrics_daily')
@Index(['bannerId', 'date'], { unique: true })
export class BannerMetricDaily {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'banner_id' })
  bannerId: number;

  // 存储为 DATE（YYYY-MM-DD）
  @Column({ type: 'date', name: 'date' })
  date: string;

  @Column({ type: 'int', default: 0 })
  impressions: number;

  @Column({ type: 'int', default: 0 })
  clicks: number;
}




