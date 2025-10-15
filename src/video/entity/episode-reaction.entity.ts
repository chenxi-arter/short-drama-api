import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../user/entity/user.entity';
import { Episode } from './episode.entity';

@Entity('episode_reactions')
export class EpisodeReaction {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  @Column({ name: 'episode_id', type: 'int' })
  episodeId: number;

  @Column({ name: 'reaction_type', type: 'varchar', length: 20 })
  reactionType: 'like' | 'dislike';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Episode)
  @JoinColumn({ name: 'episode_id' })
  episode: Episode;
}

