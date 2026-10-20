import { IsString, IsOptional, IsNumber, IsEnum, IsObject, IsArray, ArrayMaxSize, ValidateNested } from 'class-validator';
import { Type, Exclude } from 'class-transformer';
import { EventType, ConversionType } from '../entity';

export class CreateEventDto {
  @IsString()
  campaignCode: string;

  @IsEnum(EventType)
  eventType: EventType;

  @IsOptional()
  @IsObject()
  eventData?: any;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsString()
  referrer?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;
}

/**
 * 批量事件DTO
 * 安全修复 H4: 限制数组大小防止 DoS 攻击
 */
export class BatchCreateEventDto {
  @IsArray()
  @ArrayMaxSize(50, { message: '单次最多提交50个事件' })
  @ValidateNested({ each: true })
  @Type(() => CreateEventDto)
  events: CreateEventDto[];
}

export class CreateConversionDto {
  @IsString()
  campaignCode: string;

  @IsEnum(ConversionType)
  conversionType: ConversionType;

  @IsOptional()
  @IsNumber()
  conversionValue?: number;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  deviceId?: string;
}

export class EventResponseDto {
  success: boolean;
  message?: string;
}

export class ConversionResponseDto {
  success: boolean;
  message?: string;
  conversionId?: number;
}
