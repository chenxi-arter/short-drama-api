import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from '../services';
import { AnalyticsQueryDto, DashboardResponseDto, PlatformComparisonDto } from '../dto';
import { AdminJwtAuthGuard } from '../../admin/guards/admin-jwt-auth.guard';

@UseGuards(AdminJwtAuthGuard)
@Controller('admin/advertising')
export class AdminAnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  async getDashboard(@Query() query: AnalyticsQueryDto): Promise<{ code: number; message: string; data: DashboardResponseDto }> {
    const dashboard = await this.analyticsService.getDashboardStats(query.from, query.to);
    
    return {
      code: 200,
      message: 'success',
      data: dashboard,
    };
  }

  @Get('platform-comparison')
  async getPlatformComparison(@Query() query: AnalyticsQueryDto): Promise<{ code: number; message: string; data: PlatformComparisonDto[] }> {
    const comparison = await this.analyticsService.getPlatformComparison(query.from, query.to);
    
    return {
      code: 200,
      message: 'success',
      data: comparison,
    };
  }
}
