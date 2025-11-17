import { IsDateString, IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class ExportSeriesDetailsDto {
  @IsDateString()
  startDate: string; // YYYY-MM-DD

  @IsDateString()
  endDate: string; // YYYY-MM-DD

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;
}

export interface SeriesDetailData {
  date: string;
  seriesId: number;
  seriesTitle: string;
  categoryName: string;
  episodeCount: number;
  playCount: number;
  completionRate: number;
  avgWatchDuration: number;
  likeCount: number;
  dislikeCount: number;
  shareCount: number;
  favoriteCount: number;
  commentCount: number;
}
