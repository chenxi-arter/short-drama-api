import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdvertisingEvent, AdvertisingConversion, AdvertisingCampaign, EventType, ConversionType } from '../entity';
import { CreateEventDto, BatchCreateEventDto, CreateConversionDto, EventResponseDto, ConversionResponseDto } from '../dto';
import { CampaignUtils } from '../utils/campaign-utils';
import { CampaignService } from './campaign.service';

@Injectable()
export class TrackingService {
  constructor(
    @InjectRepository(AdvertisingEvent)
    private eventRepository: Repository<AdvertisingEvent>,
    @InjectRepository(AdvertisingConversion)
    private conversionRepository: Repository<AdvertisingConversion>,
    private campaignService: CampaignService,
  ) {}

  async createEvent(createEventDto: CreateEventDto, ipAddress?: string, userId?: number): Promise<EventResponseDto> {
    try {
      // 查找对应的投放计划
      const campaign = await this.campaignService.findByCode(createEventDto.campaignCode);

      // 检查计划是否处于活跃状态
      if (!campaign.isActive) {
        return {
          success: false,
          message: '广告计划已暂停，无法记录事件',
        };
      }

      // 获取地理位置信息
      const location = await CampaignUtils.getLocationFromIp(ipAddress || '');

      const event = this.eventRepository.create({
        campaignId: campaign.id,
        campaignCode: createEventDto.campaignCode,
        eventType: createEventDto.eventType,
        eventData: createEventDto.eventData,
        sessionId: createEventDto.sessionId,
        deviceId: createEventDto.deviceId,
        referrer: createEventDto.referrer,
        userAgent: createEventDto.userAgent,
        userId: userId, // 从参数传入
        ipAddress,
        country: location.country,
        region: location.region,
        city: location.city,
        eventTime: new Date(),
      });

      await this.eventRepository.save(event);

      return {
        success: true,
        message: '事件记录成功',
      };
    } catch (error) {
      console.error('Failed to record event:', error);
      return {
        success: false,
        message: '事件记录失败',
      };
    }
  }

  async createEventsBatch(batchCreateEventDto: BatchCreateEventDto, ipAddress?: string): Promise<EventResponseDto> {
    const queryRunner = this.eventRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const events: AdvertisingEvent[] = [];
      
      for (const eventDto of batchCreateEventDto.events) {
        // 查找对应的投放计划
        const campaign = await this.campaignService.findByCode(eventDto.campaignCode);

        // 检查计划是否处于活跃状态
        if (!campaign.isActive) {
          continue; // 跳过非活跃计划的事件
        }

        // 获取地理位置信息
        const location = await CampaignUtils.getLocationFromIp(ipAddress || '');

        const event = this.eventRepository.create({
          campaignId: campaign.id,
          campaignCode: eventDto.campaignCode,
          eventType: eventDto.eventType,
          eventData: eventDto.eventData,
          sessionId: eventDto.sessionId,
          deviceId: eventDto.deviceId,
          referrer: eventDto.referrer,
          userAgent: eventDto.userAgent,
          ipAddress,
          country: location.country,
          region: location.region,
          city: location.city,
          eventTime: new Date(),
        });

        events.push(event);
      }

      await queryRunner.manager.save(AdvertisingEvent, events);
      await queryRunner.commitTransaction();

      return {
        success: true,
        message: `成功记录 ${events.length} 个事件`,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Failed to record batch events:', error);
      return {
        success: false,
        message: '批量事件记录失败',
      };
    } finally {
      await queryRunner.release();
    }
  }

  async createConversion(createConversionDto: CreateConversionDto, userId: number): Promise<ConversionResponseDto> {
    try {
      // 查找对应的投放计划
      const campaign = await this.campaignService.findByCode(createConversionDto.campaignCode);

      // 检查计划是否处于活跃状态
      if (!campaign.isActive) {
        return {
          success: false,
          message: '广告计划已暂停，无法记录转化',
        };
      }

      // 检查是否已存在相同类型的转化（防重复）
      const existingConversion = await this.conversionRepository.findOne({
        where: {
          campaignId: campaign.id,
          userId: userId,
          conversionType: createConversionDto.conversionType,
        },
      });

      if (existingConversion) {
        return {
          success: false,
          message: '该用户的此类型转化已存在',
        };
      }

      // 查找用户的首次点击时间
      const firstClickEvent = await this.eventRepository.findOne({
        where: {
          campaignId: campaign.id,
          userId: userId,
          eventType: EventType.CLICK,
        },
        order: { eventTime: 'ASC' },
      });

      const conversionTime = new Date();
      const firstClickTime = firstClickEvent?.eventTime;
      const timeToConversion = firstClickTime 
        ? CampaignUtils.calculateTimeToConversion(firstClickTime, conversionTime)
        : undefined;

      const conversion = this.conversionRepository.create({
        campaignId: campaign.id,
        campaignCode: createConversionDto.campaignCode,
        conversionType: createConversionDto.conversionType,
        conversionValue: createConversionDto.conversionValue || 0,
        userId: userId, // 从参数传入
        sessionId: createConversionDto.sessionId,
        deviceId: createConversionDto.deviceId,
        firstClickTime,
        conversionTime,
        timeToConversion,
      });

      const savedConversion = await this.conversionRepository.save(conversion);

      return {
        success: true,
        message: '转化记录成功',
        conversionId: savedConversion.id,
      };
    } catch (error) {
      console.error('Failed to record conversion:', error);
      return {
        success: false,
        message: '转化记录失败',
      };
    }
  }

  async getEventsByCampaign(campaignId: number, startDate?: Date, endDate?: Date): Promise<AdvertisingEvent[]> {
    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .where('event.campaignId = :campaignId', { campaignId });

    if (startDate) {
      queryBuilder.andWhere('event.eventTime >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('event.eventTime <= :endDate', { endDate });
    }

    return queryBuilder
      .orderBy('event.eventTime', 'DESC')
      .getMany();
  }

  async getConversionsByCampaign(campaignId: number, startDate?: Date, endDate?: Date): Promise<AdvertisingConversion[]> {
    const queryBuilder = this.conversionRepository
      .createQueryBuilder('conversion')
      .where('conversion.campaignId = :campaignId', { campaignId });

    if (startDate) {
      queryBuilder.andWhere('conversion.conversionTime >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('conversion.conversionTime <= :endDate', { endDate });
    }

    return queryBuilder
      .orderBy('conversion.conversionTime', 'DESC')
      .getMany();
  }
}
