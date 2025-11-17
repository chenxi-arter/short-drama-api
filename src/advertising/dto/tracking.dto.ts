import { IsString, IsOptional, IsNumber, IsEnum, IsObject, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
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

export class BatchCreateEventDto {
  @IsArray()
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

  @IsNumber()
  userId: number;

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
