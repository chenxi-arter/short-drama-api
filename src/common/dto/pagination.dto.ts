import { Type, Transform } from 'class-transformer';
import { IsInt, Min, Max, IsOptional } from 'class-validator';
import { NumberRange } from '../validators/enhanced-validation.decorator';

export class PaginationDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: '页码必须是整数' })
  @NumberRange(1, 1000, { message: '页码必须在1到1000之间' })
  @Transform(({ value }) => Math.max(1, Number(value) || 1))
  page = 1;

  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: '每页数量必须是整数' })
  @NumberRange(1, 100, { message: '每页数量必须在1到100之间' })
  @Transform(({ value }) => Math.min(100, Math.max(1, Number(value) || 20)))
  limit = 20;
}

/**
 * 增强的分页DTO，包含更多验证规则
 */
export class EnhancedPaginationDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: '页码必须是整数' })
  @NumberRange(1, 1000, { message: '页码必须在1到1000之间' })
  @Transform(({ value }) => Math.max(1, Number(value) || 1))
  page = 1;

  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: '每页数量必须是整数' })
  @NumberRange(1, 100, { message: '每页数量必须在1到100之间' })
  @Transform(({ value }) => Math.min(100, Math.max(1, Number(value) || 20)))
  size = 20;

  /**
   * 获取跳过的记录数
   */
  get skip(): number {
    return (this.page - 1) * this.size;
  }

  /**
   * 获取限制数量
   */
  get take(): number {
    return this.size;
  }

  /**
   * 创建分页元数据
   */
  createMeta(total: number) {
    const totalPages = Math.ceil(total / this.size);
    return {
      page: this.page,
      size: this.size,
      total,
      totalPages,
      hasNext: this.page < totalPages,
      hasPrev: this.page > 1,
    };
  }
}