import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { CampaignService, AnalyticsService } from '../services';
import { CreateCampaignDto, UpdateCampaignDto, UpdateCampaignStatusDto, CampaignQueryDto, CampaignListResponseDto, CampaignResponseDto, CampaignStatsResponseDto, AnalyticsQueryDto } from '../dto';

@Controller('admin/advertising/campaigns')
export class AdminCampaignController {
  constructor(
    private readonly campaignService: CampaignService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Get()
  async findAll(@Query() query: CampaignQueryDto): Promise<{ code: number; message: string; data: CampaignListResponseDto }> {
    const result = await this.campaignService.findAll(query);
    
    return {
      code: 200,
      message: 'success',
      data: result,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<{ code: number; message: string; data: CampaignResponseDto }> {
    const campaign = await this.campaignService.findOne(id);
    
    return {
      code: 200,
      message: 'success',
      data: campaign,
    };
  }

  @Post()
  async create(@Body() createCampaignDto: CreateCampaignDto): Promise<{ code: number; message: string; data: CampaignResponseDto }> {
    const campaign = await this.campaignService.create(createCampaignDto, 'admin'); // TODO: 获取当前用户
    
    return {
      code: 200,
      message: 'Campaign created successfully',
      data: campaign,
    };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCampaignDto: UpdateCampaignDto
  ): Promise<{ code: number; message: string; data: CampaignResponseDto }> {
    const campaign = await this.campaignService.update(id, updateCampaignDto);
    
    return {
      code: 200,
      message: 'Campaign updated successfully',
      data: campaign,
    };
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateCampaignStatusDto
  ): Promise<{ code: number; message: string; data: CampaignResponseDto }> {
    const campaign = await this.campaignService.updateStatus(id, updateStatusDto);
    
    return {
      code: 200,
      message: 'Campaign status updated successfully',
      data: campaign,
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ code: number; message: string }> {
    await this.campaignService.remove(id);
    
    return {
      code: 200,
      message: 'Campaign deleted successfully',
    };
  }

  @Get(':id/stats')
  async getStats(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: AnalyticsQueryDto
  ): Promise<{ code: number; message: string; data: CampaignStatsResponseDto }> {
    const stats = await this.analyticsService.getCampaignStats(id, query.from, query.to);
    
    return {
      code: 200,
      message: 'success',
      data: stats,
    };
  }
}
