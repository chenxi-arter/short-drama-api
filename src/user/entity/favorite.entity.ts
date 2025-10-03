import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('favorites')
export class Favorite {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  @Column({ name: 'series_id', type: 'int' })
  seriesId: number;

  @Column({ name: 'episode_id', type: 'int', nullable: true })
  episodeId?: number;

  @Column({ name: 'favorite_type', type: 'varchar', length: 20, default: 'series' })
  favoriteType: 'series' | 'episode';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}

