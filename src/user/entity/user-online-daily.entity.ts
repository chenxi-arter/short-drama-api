import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';

@Entity('user_online_daily')
@Unique('uk_user_date', ['userId', 'date'])
export class UserOnlineDaily {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'int', default: 0 })
  duration: number;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
