import { Type } from 'class-transformer';
import { IsInt, Min, Max, IsOptional } from 'class-validator';

export class PaginationDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: '页码必须是整数' })
  @Min(1, { message: '页码最小值为1' })
  @Max(1000, { message: '页码最大值为1000' })
  page = 1;

  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: '每页数量必须是整数' })
  @Min(1, { message: '每页数量最小值为1' })
  @Max(100, { message: '每页数量最大值为100' })
  limit = 20;
}

/**
 * 增强的分页DTO，包含更多验证规则
 */
export class EnhancedPaginationDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: '页码必须是整数' })
  @Min(1, { message: '页码最小值为1' })
  @Max(1000, { message: '页码最大值为1000' })
  page = 1;

  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: '每页数量必须是整数' })
  @Min(1, { message: '每页数量最小值为1' })
  @Max(100, { message: '每页数量最大值为100' })
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
}