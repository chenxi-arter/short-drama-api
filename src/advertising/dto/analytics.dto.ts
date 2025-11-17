import { IsOptional, IsDateString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class AnalyticsQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}

export class CampaignStatsQueryDto extends AnalyticsQueryDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class OverviewStatsDto {
  totalClicks: number;
  totalViews: number;
  totalConversions: number;
  conversionRate: number;
  cost: number;
  cpc: number;
  cpa: number;
}

export class TimelineStatsDto {
  date: string;
  clicks: number;
  views: number;
  conversions: number;
}

export class CampaignStatsResponseDto {
  overview: OverviewStatsDto;
  timeline: TimelineStatsDto[];
}

export class PlatformStatsDto {
  platform: string;
  campaigns: number;
  clicks: number;
  conversions: number;
  spend: number;
}

export class RecentEventDto {
  id: number;
  campaignCode: string;
  eventType: string;
  eventTime: Date;
}

export class DashboardResponseDto {
  totalCampaigns: number;
  activeCampaigns: number;
  totalSpend: number;
  totalClicks: number;
  totalConversions: number;
  avgConversionRate: number;
  platformStats: PlatformStatsDto[];
  recentEvents: RecentEventDto[];
}

export class PlatformComparisonDto {
  platform: string;
  clicks: number;
  conversions: number;
  conversionRate: number;
  cost: number;
  cpc: number;
  cpa: number;
}
