import { IsString, IsOptional, IsNumber, IsDateString, IsEnum, IsUrl, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { CampaignStatus } from '../entity';

export class CreateCampaignDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  platform: string;

  @IsUrl()
  targetUrl: string;

  @IsOptional()
  @IsNumber()
  budget?: number;

  @IsOptional()
  @IsNumber()
  targetClicks?: number;

  @IsOptional()
  @IsNumber()
  targetConversions?: number;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class UpdateCampaignDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl()
  targetUrl?: string;

  @IsOptional()
  @IsNumber()
  budget?: number;

  @IsOptional()
  @IsNumber()
  targetClicks?: number;

  @IsOptional()
  @IsNumber()
  targetConversions?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class UpdateCampaignStatusDto {
  @IsEnum(CampaignStatus)
  status: CampaignStatus;
}

export class CampaignQueryDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  size?: number = 20;

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class CampaignStatsDto {
  totalClicks: number;
  totalViews: number;
  totalConversions: number;
  conversionRate: number;
  cost: number;
  cpc: number;
  cpa: number;
}

export class CampaignResponseDto {
  id: number;
  name: string;
  description: string;
  platform: string;
  campaignCode: string;
  targetUrl: string;
  budget: number;
  targetClicks: number;
  targetConversions: number;
  startDate: Date;
  endDate: Date;
  status: CampaignStatus;
  isActive: boolean;
  stats?: CampaignStatsDto;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CampaignListResponseDto {
  items: CampaignResponseDto[];
  total: number;
  page: number;
  size: number;
}
