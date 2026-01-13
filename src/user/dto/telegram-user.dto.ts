import { IsNumber, IsString, IsOptional, IsEnum, ValidateIf } from 'class-validator';

export enum LoginType {
  WEBAPP = 'webapp',
  BOT = 'bot'
}

export class TelegramUserDto {
  // 登录方式标识（仅用于判断使用哪种验证方式）
  @IsEnum(LoginType)
  loginType: LoginType;

  // 新格式：initData字段（当loginType为webapp时使用）
  @ValidateIf((o: TelegramUserDto) => o.loginType === LoginType.WEBAPP)
  @IsString()
  initData?: string;

  @IsOptional()
  @IsString()
  deviceInfo?: string;

  @IsOptional()
  @IsString()
  guestToken?: string;

  // 旧格式：分离字段（当loginType为bot时必需）
  @ValidateIf((o: TelegramUserDto) => o.loginType === LoginType.BOT)
  @IsNumber()
  id?: number;

  @ValidateIf((o: TelegramUserDto) => o.loginType === LoginType.BOT)
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @ValidateIf((o: TelegramUserDto) => o.loginType === LoginType.BOT)
  @IsNumber()
  auth_date?: number;

  @ValidateIf((o: TelegramUserDto) => o.loginType === LoginType.BOT)
  @IsString()
  hash?: string;

  @IsOptional()
  @IsString()
  photo_url?: string;
}
