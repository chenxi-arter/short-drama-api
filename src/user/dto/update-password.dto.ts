import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePasswordDto {
  @ApiProperty({
    description: '旧密码',
    example: 'oldpassword123'
  })
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty({
    description: '新密码',
    example: 'newpassword123',
    minLength: 6
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: '密码长度至少6位' })
  newPassword: string;

  @ApiProperty({
    description: '确认新密码',
    example: 'newpassword123'
  })
  @IsString()
  @IsNotEmpty()
  confirmPassword: string;
}

export class UpdatePasswordResponseDto {
  @ApiProperty({ description: '是否成功' })
  success: boolean;

  @ApiProperty({ description: '响应消息' })
  message: string;
}
