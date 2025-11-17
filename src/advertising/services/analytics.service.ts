import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdvertisingCampaign, AdvertisingEvent, AdvertisingConversion, AdvertisingCampaignStats, EventType, ConversionType } from '../entity';
import { OverviewStatsDto, TimelineStatsDto, CampaignStatsResponseDto, DashboardResponseDto, PlatformStatsDto, RecentEventDto, PlatformComparisonDto } from '../dto';
import { CampaignUtils } from '../utils/campaign-utils';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(AdvertisingCampaign)
    private campaignRepository: Repository<AdvertisingCampaign>,
    @InjectRepository(AdvertisingEvent)
    private eventRepository: Repository<AdvertisingEvent>,
    @InjectRepository(AdvertisingConversion)
    private conversionRepository: Repository<AdvertisingConversion>,
    @InjectRepository(AdvertisingCampaignStats)
    private statsRepository: Repository<AdvertisingCampaignStats>,
  ) {}

  async getCampaignStats(campaignId: number, from?: string, to?: string): Promise<CampaignStatsResponseDto> {
    const startDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 默认30天前
    const endDate = to ? new Date(to) : new Date();

    // 获取概览统计
    const overview = await this.calculateOverviewStats(campaignId, startDate, endDate);

    // 获取时间线数据
    const timeline = await this.getTimelineStats(campaignId, startDate, endDate);

    return {
      overview,
      timeline,
    };
  }

  async getDashboardStats(from?: string, to?: string): Promise<DashboardResponseDto> {
    const startDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = to ? new Date(to) : new Date();

    // 获取总体统计
    const totalCampaigns = await this.campaignRepository.count();
    const activeCampaigns = await this.campaignRepository.count({
      where: { isActive: true }
    });

    // 获取事件统计
    const eventStats = await this.eventRepository
      .createQueryBuilder('event')
      .select('COUNT(*)', 'totalEvents')
      .where('event.eventTime BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getRawOne();

    const clickStats = await this.eventRepository
      .createQueryBuilder('event')
      .select('COUNT(*)', 'totalClicks')
      .where('event.eventType = :eventType', { eventType: EventType.CLICK })
      .andWhere('event.eventTime BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getRawOne();

    const conversionStats = await this.conversionRepository
      .createQueryBuilder('conversion')
      .select('COUNT(*)', 'totalConversions')
      .where('conversion.conversionTime BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getRawOne();

    const totalClicks = parseInt(clickStats.totalClicks) || 0;
    const totalConversions = parseInt(conversionStats.totalConversions) || 0;
    const avgConversionRate = CampaignUtils.calculateConversionRate(totalConversions, totalClicks);

    // 获取平台统计
    const platformStats = await this.getPlatformStats(startDate, endDate);

    // 获取最近事件
    const recentEvents = await this.getRecentEvents(10);

    // TODO: 计算总花费
    const totalSpend = 0;

    return {
      totalCampaigns,
      activeCampaigns,
      totalSpend,
      totalClicks,
      totalConversions,
      avgConversionRate,
      platformStats,
      recentEvents,
    };
  }

  async getPlatformComparison(from?: string, to?: string): Promise<PlatformComparisonDto[]> {
    const startDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = to ? new Date(to) : new Date();

    const platformStats = await this.eventRepository
      .createQueryBuilder('event')
      .leftJoin('event.campaign', 'campaign')
      .leftJoin('campaign.platform', 'platform')
      .select([
        'platform.code as platform',
        'COUNT(CASE WHEN event.eventType = :clickType THEN 1 END) as clicks',
        'COUNT(CASE WHEN event.eventType = :viewType THEN 1 END) as views',
      ])
      .where('event.eventTime BETWEEN :startDate AND :endDate', { startDate, endDate })
      .setParameter('clickType', EventType.CLICK)
      .setParameter('viewType', EventType.VIEW)
      .groupBy('platform.code')
      .getRawMany();

    const result: PlatformComparisonDto[] = [];

    for (const stat of platformStats) {
      const conversions = await this.conversionRepository
        .createQueryBuilder('conversion')
        .leftJoin('conversion.campaign', 'campaign')
        .leftJoin('campaign.platform', 'platform')
        .where('platform.code = :platform', { platform: stat.platform })
        .andWhere('conversion.conversionTime BETWEEN :startDate AND :endDate', { startDate, endDate })
        .getCount();

      const clicks = parseInt(stat.clicks) || 0;
      const conversionRate = CampaignUtils.calculateConversionRate(conversions, clicks);
      
      // TODO: 获取实际成本数据
      const cost = 0;
      const cpc = CampaignUtils.calculateCPC(cost, clicks);
      const cpa = CampaignUtils.calculateCPA(cost, conversions);

      result.push({
        platform: stat.platform,
        clicks,
        conversions,
        conversionRate,
        cost,
        cpc,
        cpa,
      });
    }

    return result;
  }

  private async calculateOverviewStats(campaignId: number, startDate: Date, endDate: Date): Promise<OverviewStatsDto> {
    // 获取点击数
    const clickCount = await this.eventRepository.count({
      where: {
        campaignId,
        eventType: EventType.CLICK,
        eventTime: { $gte: startDate, $lte: endDate } as any,
      },
    });

    // 获取浏览数
    const viewCount = await this.eventRepository.count({
      where: {
        campaignId,
        eventType: EventType.VIEW,
        eventTime: { $gte: startDate, $lte: endDate } as any,
      },
    });

    // 获取转化数
    const conversionCount = await this.conversionRepository.count({
      where: {
        campaignId,
        conversionTime: { $gte: startDate, $lte: endDate } as any,
      },
    });

    const conversionRate = CampaignUtils.calculateConversionRate(conversionCount, clickCount);
    
    // TODO: 获取实际成本数据
    const cost = 0;
    const cpc = CampaignUtils.calculateCPC(cost, clickCount);
    const cpa = CampaignUtils.calculateCPA(cost, conversionCount);

    return {
      totalClicks: clickCount,
      totalViews: viewCount,
      totalConversions: conversionCount,
      conversionRate,
      cost,
      cpc,
      cpa,
    };
  }

  private async getTimelineStats(campaignId: number, startDate: Date, endDate: Date): Promise<TimelineStatsDto[]> {
    const timeline: TimelineStatsDto[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const clicks = await this.eventRepository.count({
        where: {
          campaignId,
          eventType: EventType.CLICK,
          eventTime: { $gte: dayStart, $lte: dayEnd } as any,
        },
      });

      const views = await this.eventRepository.count({
        where: {
          campaignId,
          eventType: EventType.VIEW,
          eventTime: { $gte: dayStart, $lte: dayEnd } as any,
        },
      });

      const conversions = await this.conversionRepository.count({
        where: {
          campaignId,
          conversionTime: { $gte: dayStart, $lte: dayEnd } as any,
        },
      });

      timeline.push({
        date: currentDate.toISOString().split('T')[0],
        clicks,
        views,
        conversions,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return timeline;
  }

  private async getPlatformStats(startDate: Date, endDate: Date): Promise<PlatformStatsDto[]> {
    const stats = await this.campaignRepository
      .createQueryBuilder('campaign')
      .leftJoin('campaign.platform', 'platform')
      .leftJoin('campaign.events', 'event', 'event.eventTime BETWEEN :startDate AND :endDate')
      .leftJoin('campaign.conversions', 'conversion', 'conversion.conversionTime BETWEEN :startDate AND :endDate')
      .select([
        'platform.code as platform',
        'COUNT(DISTINCT campaign.id) as campaigns',
        'COUNT(CASE WHEN event.eventType = :clickType THEN 1 END) as clicks',
        'COUNT(conversion.id) as conversions',
      ])
      .where('campaign.isActive = :isActive', { isActive: true })
      .setParameter('startDate', startDate)
      .setParameter('endDate', endDate)
      .setParameter('clickType', EventType.CLICK)
      .groupBy('platform.code')
      .getRawMany();

    return stats.map(stat => ({
      platform: stat.platform,
      campaigns: parseInt(stat.campaigns) || 0,
      clicks: parseInt(stat.clicks) || 0,
      conversions: parseInt(stat.conversions) || 0,
      spend: 0, // TODO: 获取实际花费数据
    }));
  }

  private async getRecentEvents(limit: number): Promise<RecentEventDto[]> {
    const events = await this.eventRepository
      .createQueryBuilder('event')
      .select(['event.id', 'event.campaignCode', 'event.eventType', 'event.eventTime'])
      .orderBy('event.eventTime', 'DESC')
      .limit(limit)
      .getMany();

    return events.map(event => ({
      id: event.id,
      campaignCode: event.campaignCode,
      eventType: event.eventType,
      eventTime: event.eventTime,
    }));
  }
}
