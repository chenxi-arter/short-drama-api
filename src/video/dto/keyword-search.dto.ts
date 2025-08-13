import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * 关键词搜索请求DTO
 */
export class KeywordSearchDto {
  @IsNotEmpty({ message: '关键词不能为空' })
  @IsString()
  keyword: string; // 搜索关键词

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value as string) || '1')
  channelId?: string; // 频道的唯一标识符，默认为1

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value as string) || '1')
  page?: string; // 页数，默认为1

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value as string) || '20')
  pageSize?: string; // 每页大小，默认为20
}