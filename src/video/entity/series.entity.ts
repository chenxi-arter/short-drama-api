import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn , ManyToOne} from 'typeorm';
import { Episode } from './episode.entity';
import { Category } from './category.entity';

@Entity('series')
export class Series {
  @PrimaryGeneratedColumn() id: number;
  @Column({ length: 255 }) title: string;
  @Column({ type: 'text', nullable: true }) description: string;
  @Column({ length: 255, nullable: true }) coverUrl: string; // OSS 封面
  @Column({ default: 0 }) totalEpisodes: number;
  @CreateDateColumn() createdAt: Date;

  @OneToMany(() => Episode, ep => ep.series) episodes: Episode[];

  /* 新增：多对一 → Category */
  @ManyToOne(() => Category, c => c.series, { nullable: true })
  category: Category;
}