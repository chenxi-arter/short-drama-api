import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Series } from './series.entity';
import { FilterOption } from './filter-option.entity';

@Entity('series_genre_options')
export class SeriesGenreOption {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ type: 'int', name: 'series_id' })
  seriesId: number;

  @Column({ type: 'int', name: 'option_id' })
  optionId: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => Series, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'series_id' })
  series: Series;

  @ManyToOne(() => FilterOption)
  @JoinColumn({ name: 'option_id' })
  option: FilterOption;
}


