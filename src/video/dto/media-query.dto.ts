// src/video/dto/media-query.dto.ts
import { IsOptional, IsNumberString, IsIn, IsPositive, Min, Max } from 'class-validator';
import { Transform, TransformFnParams, Type } from 'class-transformer';
import { NumberRange } from '../../common/validators/enhanced-validation.decorator';

export class MediaQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsPositive({ message: '分类ID必须是正整数' })
  categoryId?: number;

  @IsOptional()
  @IsIn(['short', 'series'], { message: '类型只能是 short 或 series' })
  type?: 'short' | 'series';

  @IsOptional()
  @IsIn(['latest', 'like', 'play'], { message: '排序方式只能是 latest、like 或 play' })
  sort?: 'latest' | 'like' | 'play' = 'latest';

  @IsOptional()
  @Type(() => Number)
  @Min(1, { message: '页码必须大于等于1' })
  @Transform(({ value }: TransformFnParams) => Math.max(1, Number(value) || 1))
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @NumberRange(1, 50, { message: '每页数量必须在1到50之间' })
  @Transform(({ value }: TransformFnParams) => Math.min(50, Math.max(1, Number(value) || 20)))
  size = 20;
}