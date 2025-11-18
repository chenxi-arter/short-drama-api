import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { AdvertisingCampaign, AdvertisingPlatform, AdvertisingEvent, AdvertisingConversion, CampaignStatus, EventType } from '../entity';
import { CreateCampaignDto, UpdateCampaignDto, UpdateCampaignStatusDto, CampaignQueryDto, CampaignListResponseDto, CampaignResponseDto } from '../dto';
import { CampaignUtils } from '../utils/campaign-utils';
import { PlatformService } from './platform.service';

@Injectable()
export class CampaignService {
  constructor(
    @InjectRepository(AdvertisingCampaign)
    private campaignRepository: Repository<AdvertisingCampaign>,
    @InjectRepository(AdvertisingPlatform)
    private platformRepository: Repository<AdvertisingPlatform>,
    @InjectRepository(AdvertisingEvent)
    private eventRepository: Repository<AdvertisingEvent>,
    @InjectRepository(AdvertisingConversion)
    private conversionRepository: Repository<AdvertisingConversion>,
    private platformService: PlatformService,
  ) {}

  async findAll(query: CampaignQueryDto): Promise<CampaignListResponseDto> {
    const { page = 1, size = 20, platform, status, keyword, startDate, endDate } = query;
    
    const queryBuilder = this.campaignRepository
      .createQueryBuilder('campaign')
      .leftJoinAndSelect('campaign.platform', 'platform');

    // 平台筛选
    if (platform) {
      queryBuilder.andWhere('campaign.platformCode = :platform', { platform });
    }

    // 状态筛选
    if (status) {
      queryBuilder.andWhere('campaign.status = :status', { status });
    }

    // 关键词搜索
    if (keyword) {
      queryBuilder.andWhere(
        '(campaign.name LIKE :keyword OR campaign.description LIKE :keyword)',
        { keyword: `%${keyword}%` }
      );
    }

    // 时间范围筛选
    if (startDate) {
      queryBuilder.andWhere('campaign.startDate >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('campaign.endDate <= :endDate', { endDate });
    }

    // 分页
    const offset = (page - 1) * size;
    queryBuilder.skip(offset).take(size);

    // 排序
    queryBuilder.orderBy('campaign.createdAt', 'DESC');

    const [items, total] = await queryBuilder.getManyAndCount();

    // 转换为响应格式
    const responseItems = await Promise.all(
      items.map(item => this.transformToResponseDto(item))
    );

    return {
      items: responseItems,
      total,
      page,
      size,
    };
  }

  async findOne(id: number): Promise<CampaignResponseDto> {
    const campaign = await this.campaignRepository.findOne({
      where: { id },
      relations: ['platform']
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    return this.transformToResponseDto(campaign);
  }

  async findByCode(campaignCode: string): Promise<AdvertisingCampaign> {
    const campaign = await this.campaignRepository.findOne({
      where: { campaignCode },
      relations: ['platform']
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign with code ${campaignCode} not found`);
    }

    return campaign;
  }

  async create(createCampaignDto: CreateCampaignDto, createdBy?: string): Promise<CampaignResponseDto> {
    // 验证平台是否存在
    const platform = await this.platformService.findByCode(createCampaignDto.platform);
    
    // 验证时间范围
    const startDate = new Date(createCampaignDto.startDate);
    const endDate = createCampaignDto.endDate ? new Date(createCampaignDto.endDate) : null;
    
    if (startDate < new Date()) {
      throw new BadRequestException('Start date cannot be in the past');
    }
    
    if (endDate && endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // 生成唯一的计划代码
    const campaignCode = CampaignUtils.generateCampaignCode(createCampaignDto.platform);

    const campaign = this.campaignRepository.create({
      name: createCampaignDto.name,
      description: createCampaignDto.description,
      platformId: platform.id,
      platformCode: platform.code,
      campaignCode,
      targetUrl: createCampaignDto.targetUrl,
      budget: createCampaignDto.budget,
      targetClicks: createCampaignDto.targetClicks,
      targetConversions: createCampaignDto.targetConversions,
      startDate,
      endDate: endDate || undefined,
      createdBy,
    });

    const savedCampaign = await this.campaignRepository.save(campaign);
    
    return this.findOne(savedCampaign.id);
  }

  async update(id: number, updateCampaignDto: UpdateCampaignDto): Promise<CampaignResponseDto> {
    const campaign = await this.campaignRepository.findOne({ where: { id } });
    
    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    // 验证时间范围
    if (updateCampaignDto.startDate || updateCampaignDto.endDate) {
      const startDate = updateCampaignDto.startDate ? new Date(updateCampaignDto.startDate) : campaign.startDate;
      const endDate = updateCampaignDto.endDate ? new Date(updateCampaignDto.endDate) : campaign.endDate;
      
      if (endDate && endDate <= startDate) {
        throw new BadRequestException('End date must be after start date');
      }
      
      updateCampaignDto.startDate = startDate.toISOString();
      if (endDate) {
        updateCampaignDto.endDate = endDate.toISOString();
      }
    }

    Object.assign(campaign, updateCampaignDto);
    
    await this.campaignRepository.save(campaign);
    
    return this.findOne(id);
  }

  async updateStatus(id: number, updateStatusDto: UpdateCampaignStatusDto): Promise<CampaignResponseDto> {
    const campaign = await this.campaignRepository.findOne({ where: { id } });
    
    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    campaign.status = updateStatusDto.status;
    campaign.isActive = updateStatusDto.status === CampaignStatus.ACTIVE;
    
    await this.campaignRepository.save(campaign);
    
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const campaign = await this.campaignRepository.findOne({ where: { id } });
    
    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    await this.campaignRepository.remove(campaign);
  }

  private async transformToResponseDto(campaign: AdvertisingCampaign): Promise<CampaignResponseDto> {
    // 实时计算统计数据
    const stats = await this.calculateCampaignStats(campaign.id);

    return {
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      platform: campaign.platformCode,
      campaignCode: campaign.campaignCode,
      targetUrl: campaign.targetUrl,
      budget: campaign.budget,
      targetClicks: campaign.targetClicks,
      targetConversions: campaign.targetConversions,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      status: campaign.status,
      isActive: campaign.isActive,
      stats,
      createdBy: campaign.createdBy,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
    };
  }

  private async calculateCampaignStats(campaignId: number) {
    // 统计点击数
    const totalClicks = await this.eventRepository.count({
      where: {
        campaignId,
        eventType: EventType.CLICK,
      },
    });

    // 统计浏览数
    const totalViews = await this.eventRepository.count({
      where: {
        campaignId,
        eventType: EventType.VIEW,
      },
    });

    // 统计转化数
    const totalConversions = await this.conversionRepository.count({
      where: {
        campaignId,
      },
    });

    // 计算转化率
    const conversionRate = totalClicks > 0 ? totalConversions / totalClicks : 0;

    // 计算成本指标（假设CPC为2元）
    const cpc = 2.0;
    const cost = totalClicks * cpc;
    const cpa = totalConversions > 0 ? cost / totalConversions : 0;

    return {
      totalClicks,
      totalViews,
      totalConversions,
      conversionRate: parseFloat(conversionRate.toFixed(4)),
      cost: parseFloat(cost.toFixed(2)),
      cpc: parseFloat(cpc.toFixed(2)),
      cpa: parseFloat(cpa.toFixed(2)),
    };
  }
}
