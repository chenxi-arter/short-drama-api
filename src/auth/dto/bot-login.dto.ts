import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BotLoginDto {
  @ApiProperty({ description: 'Telegram 用户ID', example: 6702079700 })
  @IsNumber()
  id: number;

  @ApiProperty({ description: '名', example: '随风' })
  @IsString()
  first_name: string;

  @ApiProperty({ description: '姓', example: '李', required: false })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiProperty({ description: '用户名', example: 'seo99991', required: false })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ description: '认证时间戳', example: 1754642628 })
  @IsNumber()
  auth_date: number;

  @ApiProperty({ description: '签名', example: 'cd671f60a4...ae93c07' })
  @IsString()
  hash: string;

  @ApiProperty({ description: '设备信息', example: 'iPhone, iOS 16', required: false })
  @IsOptional()
  @IsString()
  deviceInfo?: string;
}





