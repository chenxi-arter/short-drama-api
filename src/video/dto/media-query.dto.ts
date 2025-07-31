// src/video/dto/media-query.dto.ts
import { IsOptional, IsNumber, IsIn } from 'class-validator';
import { Transform, TransformFnParams, Type } from 'class-transformer';

export class MediaQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @IsIn(['short', 'series'])
  type?: 'short' | 'series';

  @IsOptional()
  @IsIn(['latest', 'like', 'play'])
  sort?: 'latest' | 'like' | 'play' = 'latest';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Transform(({ value }: TransformFnParams) => Math.max(1, Number(value)))
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Transform(({ value }: TransformFnParams) => Math.min(50, Math.max(1, Number(value))))
  size = 20;
}