import { IsString, IsOptional, IsBoolean, IsNumber, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePlatformDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  iconUrl?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsObject()
  config?: any;
}

export class UpdatePlatformDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  iconUrl?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsObject()
  config?: any;
}

export class UpdatePlatformStatusDto {
  @IsBoolean()
  isEnabled: boolean;
}

export class UpdatePlatformSortDto {
  @Type(() => PlatformSortItem)
  platforms: PlatformSortItem[];
}

export class PlatformSortItem {
  @IsNumber()
  id: number;

  @IsNumber()
  sortOrder: number;
}

export class PlatformResponseDto {
  id: number;
  name: string;
  code: string;
  description: string;
  iconUrl: string;
  color: string;
  isEnabled: boolean;
  sortOrder: number;
  config: any;
  createdAt: Date;
  updatedAt: Date;
}
