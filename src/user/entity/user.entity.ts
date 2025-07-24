import { Entity, PrimaryColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Comment } from '../../video/entity/comment.entity';
import { WatchProgress } from '../../video/entity/watch-progress.entity';

@Entity('users')
export class User {
  @PrimaryColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 255 })
  first_name: string;

  @Column({ type: 'varchar', length: 255 })
  last_name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  username: string;

  @Column({ type: 'tinyint', default: 1 })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;
  @OneToMany(() => Comment, c => c.user) comments: Comment[];
  @OneToMany(() => WatchProgress, wp => wp.user) watchProgresses: WatchProgress[];
}
