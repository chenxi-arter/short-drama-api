import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GuestLoginDto {
  @ApiProperty({
    description: '游客token（可选，用于识别回访游客）',
    required: false,
    example: 'guest_abc123def456',
  })
  @IsOptional()
  @IsString()
  guestToken?: string;

  @ApiProperty({
    description: '设备信息（可选）',
    required: false,
    example: 'iPhone 14 Pro',
  })
  @IsOptional()
  @IsString()
  deviceInfo?: string;
}

export class GuestLoginResponseDto {
  @ApiProperty({ description: '访问令牌' })
  access_token: string;

  @ApiProperty({ description: '刷新令牌' })
  refresh_token: string;

  @ApiProperty({ description: '令牌类型' })
  token_type: string;

  @ApiProperty({ description: '过期时间（秒）' })
  expires_in: number;

  @ApiProperty({ description: '游客唯一标识token' })
  guestToken: string;

  @ApiProperty({ description: '是否为新创建的游客' })
  isNewGuest: boolean;

  @ApiProperty({ description: '用户ID' })
  userId: number;
}
