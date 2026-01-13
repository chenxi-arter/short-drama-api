import { IsEmail, IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 邮箱密码登录DTO
 */
export class EmailLoginDto {
  @ApiProperty({ 
    description: '邮箱地址', 
    example: 'user@example.com',
    type: String 
  })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  @IsNotEmpty({ message: '邮箱地址不能为空' })
  email: string;

  @ApiProperty({ 
    description: '密码', 
    example: 'password123',
    type: String 
  })
  @IsString({ message: '密码必须是字符串' })
  @IsNotEmpty({ message: '密码不能为空' })
  password: string;

  @ApiProperty({ 
    description: '设备信息', 
    example: 'iPhone 13 Pro',
    type: String,
    required: false
  })
  @IsOptional()
  @IsString({ message: '设备信息必须是字符串' })
  deviceInfo?: string;

  @ApiProperty({ 
    description: '游客唯一标识（可选，用于自动合并游客数据）', 
    example: 'guest_abc123xyz',
    type: String,
    required: false
  })
  @IsOptional()
  @IsString({ message: '游客token必须是字符串' })
  guestToken?: string;
}

/**
 * 邮箱登录响应DTO
 */
export class EmailLoginResponseDto {
  @ApiProperty({ description: '访问令牌' })
  access_token: string;

  @ApiProperty({ description: '刷新令牌' })
  refresh_token: string;

  @ApiProperty({ description: '过期时间（秒）' })
  expires_in: number;

  @ApiProperty({ description: '令牌类型' })
  token_type: string;

  // 移除 user 字段以保护隐私
  // 前端可以通过 GET /api/user/me 获取用户信息
}




