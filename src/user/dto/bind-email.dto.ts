import { IsEmail, IsString, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 绑定邮箱/密码 DTO（用于 TG-only 账号绑定邮箱登录方式）
 */
export class BindEmailDto {
  @ApiProperty({ description: '邮箱地址', example: 'user@example.com', type: String })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  @IsNotEmpty({ message: '邮箱地址不能为空' })
  email: string;

  @ApiProperty({ description: '密码', example: 'password123', type: String, minLength: 6, maxLength: 20 })
  @IsString({ message: '密码必须是字符串' })
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码长度不能少于6位' })
  @MaxLength(20, { message: '密码长度不能超过20位' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]/, { message: '密码必须包含至少一个字母和一个数字' })
  password: string;

  @ApiProperty({ description: '确认密码', example: 'password123', type: String })
  @IsString({ message: '确认密码必须是字符串' })
  @IsNotEmpty({ message: '确认密码不能为空' })
  confirmPassword: string;
}





