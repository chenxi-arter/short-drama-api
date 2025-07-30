import { IsNumber, IsString, IsOptional } from 'class-validator';

export class TelegramUserDto {
  @IsNumber()
  id: number;

  @IsString()
  first_name: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsNumber()
  auth_date: number;

  @IsString()
  hash: string;

  @IsOptional()
  @IsString()
  photo_url?: string;
}
