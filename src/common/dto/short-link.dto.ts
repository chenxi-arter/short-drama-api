import { IsString, IsOptional, IsBoolean, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateShortLinkDto {
  @ApiProperty({ description: '原始URL', example: 'https://t.me/xgshort_bot/xgapp?startapp=__series__BmK2rTAsXW9___eid=n5fpRH7ZCzH' })
  @IsUrl()
  @IsString()
  originalURL: string;

  @ApiPropertyOptional({ description: '是否允许重复', default: false })
  @IsOptional()
  @IsBoolean()
  allowDuplicates?: boolean;

  @ApiPropertyOptional({ description: '过期时间 (ISO 8601格式)', example: '2026-01-18T00:00:00Z' })
  @IsOptional()
  @IsString()
  ttl?: string;

  @ApiPropertyOptional({ description: '自定义域名', example: 'xgtv.short.gy' })
  @IsOptional()
  @IsString()
  domain?: string;
}

export class ShortLinkResponseDto {
  @ApiProperty({ description: '短链接ID' })
  id: string;

  @ApiProperty({ description: '原始URL' })
  originalURL: string;

  @ApiProperty({ description: '短链接' })
  shortURL: string;

  @ApiProperty({ description: '域名' })
  domain: string;

  @ApiPropertyOptional({ description: '过期时间' })
  expiresAt?: string;

  @ApiPropertyOptional({ description: '创建时间' })
  createdAt?: string;
}
