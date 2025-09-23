import { IsNumber, IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 绑定Telegram DTO
 * 用于将Telegram账号绑定到现有邮箱账号
 */
export class BindTelegramDto {
  @ApiProperty({ 
    description: 'Telegram用户ID', 
    example: 6702079700,
    type: Number 
  })
  @IsNumber({}, { message: 'Telegram用户ID必须是数字' })
  @IsNotEmpty({ message: 'Telegram用户ID不能为空' })
  id: number;

  @ApiProperty({ 
    description: 'Telegram用户名', 
    example: '随风',
    type: String 
  })
  @IsString({ message: 'Telegram用户名必须是字符串' })
  @IsNotEmpty({ message: 'Telegram用户名不能为空' })
  first_name: string;

  @ApiProperty({ 
    description: 'Telegram姓氏', 
    example: '李',
    type: String,
    required: false
  })
  @IsOptional()
  @IsString({ message: 'Telegram姓氏必须是字符串' })
  last_name?: string;

  @ApiProperty({ 
    description: 'Telegram用户名', 
    example: 'seo99991',
    type: String,
    required: false
  })
  @IsOptional()
  @IsString({ message: 'Telegram用户名必须是字符串' })
  username?: string;

  @ApiProperty({ 
    description: '认证时间戳', 
    example: 1754642628,
    type: Number 
  })
  @IsNumber({}, { message: '认证时间戳必须是数字' })
  @IsNotEmpty({ message: '认证时间戳不能为空' })
  auth_date: number;

  @ApiProperty({ 
    description: '验证哈希', 
    example: 'cd671f60a4393b399d9cb269ac4327c8a47a3807c5520077c37477544ae93c07',
    type: String 
  })
  @IsString({ message: '验证哈希必须是字符串' })
  @IsNotEmpty({ message: '验证哈希不能为空' })
  hash: string;
}

/**
 * 绑定Telegram响应DTO
 */
export class BindTelegramResponseDto {
  @ApiProperty({ description: '绑定结果' })
  success: boolean;

  @ApiProperty({ description: '消息' })
  message: string;

  @ApiProperty({ description: '用户信息' })
  user: {
    id: number;
    shortId: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    telegramId: number | null;
    isActive: boolean;
  };
}

