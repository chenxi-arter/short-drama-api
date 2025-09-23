import { IsEmail, IsString, IsNotEmpty, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 用户注册DTO
 * 用于邮箱密码注册
 */
export class RegisterDto {
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
    type: String,
    minLength: 6,
    maxLength: 20
  })
  @IsString({ message: '密码必须是字符串' })
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码长度不能少于6位' })
  @MaxLength(20, { message: '密码长度不能超过20位' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]/, {
    message: '密码必须包含至少一个字母和一个数字'
  })
  password: string;

  @ApiProperty({ 
    description: '确认密码', 
    example: 'password123',
    type: String 
  })
  @IsString({ message: '确认密码必须是字符串' })
  @IsNotEmpty({ message: '确认密码不能为空' })
  confirmPassword: string;

  @ApiProperty({ 
    description: '用户名', 
    example: 'username123',
    type: String,
    minLength: 3,
    maxLength: 20,
    required: false
  })
  @IsOptional()
  @IsString({ message: '用户名必须是字符串' })
  @MinLength(3, { message: '用户名长度不能少于3位' })
  @MaxLength(20, { message: '用户名长度不能超过20位' })
  @Matches(/^[a-zA-Z0-9_]+$/, { message: '用户名只能包含字母、数字和下划线' })
  username?: string;

  @ApiProperty({ 
    description: '名字', 
    example: '张',
    type: String,
    required: false
  })
  @IsOptional()
  @IsString({ message: '名字必须是字符串' })
  @MaxLength(50, { message: '名字长度不能超过50位' })
  firstName?: string;

  @ApiProperty({ 
    description: '姓氏', 
    example: '三',
    type: String,
    required: false
  })
  @IsOptional()
  @IsString({ message: '姓氏必须是字符串' })
  @MaxLength(50, { message: '姓氏长度不能超过50位' })
  lastName?: string;
}

/**
 * 注册响应DTO
 */
export class RegisterResponseDto {
  @ApiProperty({ description: '用户ID' })
  id: number;

  @ApiProperty({ description: '短ID' })
  shortId: string;

  @ApiProperty({ description: '邮箱地址' })
  email: string;

  @ApiProperty({ description: '用户名' })
  username: string;

  @ApiProperty({ description: '名字' })
  firstName: string;

  @ApiProperty({ description: '姓氏' })
  lastName: string;

  @ApiProperty({ description: '是否激活' })
  isActive: boolean;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;
}






