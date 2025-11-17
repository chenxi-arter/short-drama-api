import { Controller, Post, Body, Req } from '@nestjs/common';
import { Request } from 'express';
import { TrackingService } from '../services';
import { CreateEventDto, BatchCreateEventDto, CreateConversionDto, EventResponseDto, ConversionResponseDto } from '../dto';

@Controller('tracking/advertising')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post('event')
  async createEvent(
    @Body() createEventDto: CreateEventDto,
    @Req() req: Request
  ): Promise<{ code: number; message: string; data: EventResponseDto }> {
    const ipAddress = this.getClientIp(req);
    const result = await this.trackingService.createEvent(createEventDto, ipAddress);
    
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
  async createConversion(
    @Body() createConversionDto: CreateConversionDto
  ): Promise<{ code: number; message: string; data: ConversionResponseDto }> {
    const result = await this.trackingService.createConversion(createConversionDto);
    
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
