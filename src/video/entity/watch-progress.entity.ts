import { Entity, PrimaryColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../../user/entity/user.entity';
import { Episode } from './episode.entity';

@Entity('watch_progress')
export class WatchProgress {
  @PrimaryColumn() userId: number;
  @PrimaryColumn() episodeId: number;
  @Column({ type: 'int', default: 0 }) stopAtSecond: number; // 看到第几秒
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }) updatedAt: Date;

  @ManyToOne(() => User, u => u.watchProgresses) user: User;
  @ManyToOne(() => Episode, ep => ep.watchProgresses) episode: Episode;
}