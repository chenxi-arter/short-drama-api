import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, IsEmail } from 'class-validator';

export class ConvertGuestToEmailDto {
  @ApiProperty({
    description: '邮箱地址',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: '密码',
    example: 'Password123!',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: '确认密码',
    example: 'Password123!',
  })
  @IsString()
  confirmPassword: string;

  @ApiProperty({
    description: '用户名（可选）',
    required: false,
    example: 'myusername',
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({
    description: '名字（可选）',
    required: false,
    example: '张三',
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({
    description: '姓氏（可选）',
    required: false,
    example: '李',
  })
  @IsOptional()
  @IsString()
  lastName?: string;
}

export class ConvertGuestResponseDto {
  @ApiProperty({ description: '是否成功' })
  success: boolean;

  @ApiProperty({ description: '提示信息' })
  message: string;

  @ApiProperty({ description: '新的访问令牌' })
  access_token: string;

  @ApiProperty({ description: '新的刷新令牌' })
  refresh_token: string;

  @ApiProperty({ description: '令牌类型' })
  token_type: string;

  @ApiProperty({ description: '过期时间（秒）' })
  expires_in: number;
}
