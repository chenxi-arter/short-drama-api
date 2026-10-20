/**
 * 广告追踪控制器 - 曝光/点击上报
 * 路由前缀: /api/advertising/tracking
 * 
 * 安全修复 H3/H4: 
 * - 添加限流保护防止计费污染
 * - 批量事件限制数组大小
 */
import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { TrackingService } from '../services';
import { CreateEventDto, BatchCreateEventDto, CreateConversionDto, EventResponseDto, ConversionResponseDto } from '../dto';
import { OptionalJwtAuthGuard } from '../../auth/guards/optional-jwt-auth.guard';
import { RateLimitGuard, RateLimit } from '../../common/guards/rate-limit.guard';

@Controller('tracking/advertising')
@UseGuards(RateLimitGuard)
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  /**
   * 创建单个广告事件
   * 安全限流: 每IP每分钟最多100次请求
   */
  @Post('event')
  @UseGuards(OptionalJwtAuthGuard)
  @RateLimit({ windowMs: 60 * 1000, maxRequests: 100 })
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

  /**
   * 批量创建广告事件
   * 安全限流: 每IP每分钟最多10次批量请求
   * 数组大小: 在DTO中限制为最多50个
   */
  @Post('events/batch')
  @RateLimit({ windowMs: 60 * 1000, maxRequests: 10 })
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

  /**
   * 创建转化事件
   * 安全限流: 每IP每分钟最多20次请求
   */
  @Post('conversion')
  @UseGuards(OptionalJwtAuthGuard)
  @RateLimit({ windowMs: 60 * 1000, maxRequests: 20 })
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
