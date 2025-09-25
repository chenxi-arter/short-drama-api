import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateNicknameDto {
  @ApiProperty({
    description: '新昵称',
    example: 'MyNewNickname',
    maxLength: 50
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50, { message: '昵称长度不能超过50个字符' })
  nickname: string;
}

export class UpdateNicknameResponseDto {
  @ApiProperty({ description: '是否成功' })
  success: boolean;

  @ApiProperty({ description: '响应消息' })
  message: string;
}
