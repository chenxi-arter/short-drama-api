import { IsString, IsNotEmpty, IsUrl, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAvatarDto {
  @ApiProperty({
    description: '头像URL',
    example: 'https://ui-avatars.com/api/?name=John+Doe&size=200',
    maxLength: 500
  })
  @IsString()
  @IsNotEmpty({ message: '头像URL不能为空' })
  @IsUrl({}, { message: '请输入有效的URL地址' })
  @MaxLength(500, { message: '头像URL长度不能超过500个字符' })
  photo_url: string;
}

export class UpdateAvatarResponseDto {
  @ApiProperty({ description: '是否成功' })
  success: boolean;

  @ApiProperty({ description: '响应消息' })
  message: string;

  @ApiProperty({ description: '更新后的头像URL', required: false })
  photo_url?: string;
}

