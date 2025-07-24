import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../../user/entity/user.entity';
import { Episode } from './episode.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn() id: number;
  @Column() userId: number;
  @Column() episodeId: number;
  @Column({ type: 'text' }) content: string;
  @Column({ type: 'int', default: 0 }) appearSecond: number; // 弹幕出现秒
  @CreateDateColumn() createdAt: Date;

  @ManyToOne(() => User, u => u.comments) user: User;
  @ManyToOne(() => Episode, ep => ep.comments) episode: Episode;
}