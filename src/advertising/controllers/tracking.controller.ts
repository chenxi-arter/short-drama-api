import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { TrackingService } from '../services';
import { CreateEventDto, BatchCreateEventDto, CreateConversionDto, EventResponseDto, ConversionResponseDto } from '../dto';
import { OptionalJwtAuthGuard } from '../../auth/guards/optional-jwt-auth.guard';

@Controller('tracking/advertising')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post('event')
  @UseGuards(OptionalJwtAuthGuard)
  async createEvent(
    @Body() createEventDto: CreateEventDto,
    @Req() req: Request & { user?: { userId: number } }
  ): Promise<{ code: number; message: string; data: EventResponseDto }> {
    const ipAddress = this.getClientIp(req);
    const userId = req.user?.userId; // 从 JWT Token 获取 userId
    const result = await this.trackingService.createEvent(createEventDto, ipAddress, userId);
    
    return {
      code: result.success ? 200 : 400,
      message: result.message || (result.success ? 'success' : 'error'),
      data: result,
    };
  }

  @Post('events/batch')
  async createEventsBatch(
    @Body() batchCreateEventDto: BatchCreateEventDto,
    @Req() req: Request
  ): Promise<{ code: number; message: string; data: EventResponseDto }> {
    const ipAddress = this.getClientIp(req);
    const result = await this.trackingService.createEventsBatch(batchCreateEventDto, ipAddress);
    
    return {
      code: result.success ? 200 : 400,
      message: result.message || (result.success ? 'success' : 'error'),
      data: result,
    };
  }

  @Post('conversion')
  @UseGuards(OptionalJwtAuthGuard)
  async createConversion(
    @Body() createConversionDto: CreateConversionDto,
    @Req() req: Request & { user?: { userId: number } }
  ): Promise<{ code: number; message: string; data: ConversionResponseDto }> {
    const userId = req.user?.userId; // 从 JWT Token 获取 userId
    
    // 转化接口必须有 userId
    if (!userId) {
      return {
        code: 400,
        message: '转化记录需要用户ID，请先登录',
        data: {
          success: false,
          message: '转化记录需要用户ID，请先登录',
        },
      };
    }
    
    const result = await this.trackingService.createConversion(createConversionDto, userId);
    
    return {
      code: result.success ? 200 : 400,
      message: result.message || (result.success ? 'success' : 'error'),
      data: result,
    };
  }

  private getClientIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      ''
    );
  }
}
