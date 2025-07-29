// src/video/dto/media-query.dto.ts
import { IsOptional, IsNumberString, IsIn } from 'class-validator';
import { Transform, TransformFnParams } from 'class-transformer';

export class MediaQueryDto {
  @IsOptional()
  @IsNumberString()
  categoryId?: number;

  @IsOptional()
  type?: 'short' | 'series';

  @IsOptional()
  @IsIn(['latest', 'like', 'play'])
  sort?: 'latest' | 'like' | 'play' = 'latest';

  @IsOptional()
  @IsNumberString()
  @Transform(({ value }: TransformFnParams) => Math.max(1, Number(value)))
  page = 1;

  @IsOptional()
  @IsNumberString()
  @Transform(({ value }: TransformFnParams) => Math.min(50, Math.max(1, Number(value))))
  size = 20;
}