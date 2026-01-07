import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateShortLinkDto, ShortLinkResponseDto } from '../dto/short-link.dto';

@Injectable()
export class ShortLinkService {
  private readonly logger = new Logger(ShortLinkService.name);
  private readonly apiUrl = 'https://api.short.io/links';
  private readonly apiKey: string;
  // 默认 API Key，如果环境变量未配置则使用此默认值
  private readonly DEFAULT_API_KEY = 'sk_kVRKjaeA93eRTm2k';

  constructor(private configService: ConfigService) {
    // 优先使用环境变量，如果未配置则使用默认值
    this.apiKey = this.configService.get<string>('SHORT_IO_API_KEY') || this.DEFAULT_API_KEY;

    if (this.apiKey === this.DEFAULT_API_KEY) {
      this.logger.warn('Using default SHORT_IO_API_KEY. Please configure SHORT_IO_API_KEY in .env for production');
    }
  }

  async createShortLink(dto: CreateShortLinkDto): Promise<ShortLinkResponseDto> {
    if (!this.apiKey) {
      throw new HttpException(
        'Short.io API key is not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const payload = {
      allowDuplicates: dto.allowDuplicates ?? false,
      originalURL: dto.originalURL,
      domain: dto.domain,
      ...(dto.ttl && { ttl: dto.ttl }),
    };

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'Authorization': this.apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Short.io API error: ${response.status} - ${errorText}`);
        throw new HttpException(
          `Failed to create short link: ${errorText}`,
          response.status,
        );
      }

      const data = await response.json();

      return {
        id: data.id || data.idString,
        originalURL: data.originalURL,
        shortURL: data.shortURL,
        domain: data.domain,
        expiresAt: data.expiresAt,
        createdAt: data.createdAt,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('Error creating short link:', error);
      throw new HttpException(
        'Failed to create short link',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
