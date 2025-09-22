import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TelegramLoginDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Telegram Web App的initData字符串',
    example: 'query_id=AAHdF6IQAAAAAN0XohDhrOrc&user=%7B%22id%22%3A279058397%2C%22first_name%22%3A%22Vladislav%22%2C%22last_name%22%3A%22Kibenko%22%2C%22username%22%3A%22vdkfrost%22%2C%22language_code%22%3A%22ru%22%2C%22is_premium%22%3Atrue%7D&auth_date=1662771648&hash=c501b71e775f74ce10e377dea85a7ea24ecd640b223ea86dfe453e0eaed2e2b2'
  })
  initData: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '设备信息（可选）',
    example: 'iPhone 14 Pro, iOS 16.0',
    required: false
  })
  deviceInfo?: string;
}

export class TelegramLoginResponseDto {
  @ApiProperty({
    description: '访问令牌',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  access_token: string;

  @ApiProperty({
    description: '刷新令牌',
    example: 'abc123def456...'
  })
  refresh_token: string;

  @ApiProperty({
    description: '令牌类型',
    example: 'Bearer'
  })
  token_type: string;

  @ApiProperty({
    description: '过期时间（秒）',
    example: 3600
  })
  expires_in: number;

  @ApiProperty({
    description: '用户信息'
  })
  user: {
    id: number;
    shortId: string;
    first_name: string;
    last_name: string;
    username: string;
  };
}
