  import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateShortLinkDto, ShortLinkResponseDto } from '../dto/short-link.dto';

@Injectable()
export class ShortLinkService {
  private readonly logger = new Logger(ShortLinkService.name);
  private readonly apiUrl = 'https://api.short.io/links';
  private readonly apiKey: string;
  private readonly defaultDomain: string;
  private readonly allowedDomains: string[];

  constructor(private configService: ConfigService) {
    // 从环境变量读取 API Key
    const apiKey = this.configService.get<string>('SHORT_IO_API_KEY');
    
    if (!apiKey) {
      this.logger.warn('SHORT_IO_API_KEY is not configured. Short link service will not work until configured.');
      this.apiKey = ''; // 设置为空字符串，避免类型错误
    } else {
      this.apiKey = apiKey;
      this.logger.log('Short.io service initialized successfully');
    }
    
    this.defaultDomain = this.configService.get<string>('SHORT_IO_DEFAULT_DOMAIN') || 'xgtv.short.gy';

    this.allowedDomains = (this.configService.get<string>('SHORT_LINK_ALLOWED_DOMAINS') || '')
      .split(',')
      .map((d) => d.trim().toLowerCase())
      .filter((d) => d.length > 0);

    if (this.allowedDomains.length === 0) {
      this.logger.warn(
        'SHORT_LINK_ALLOWED_DOMAINS 未配置：目前任何 HTTPS 地址都能创建短链（存在开放重定向风险，建议配置白名单）',
      );
    }
  }

  async createShortLink(dto: CreateShortLinkDto): Promise<ShortLinkResponseDto> {
    if (!this.apiKey) {
      throw new HttpException(
        'Short.io API key is not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // 安全检查：验证 URL 是否在白名单内
    this.validateUrl(dto.originalURL);

    const payload = {
      allowDuplicates: dto.allowDuplicates ?? false,
      originalURL: dto.originalURL,
      // 请求没传 domain 时回落到 SHORT_IO_DEFAULT_DOMAIN（缺省 xgtv.short.gy）
      domain: dto.domain || this.defaultDomain,
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
        
        let errorMessage = `Failed to create short link: ${errorText}`;
        
        // 针对常见错误提供友好提示
        if (response.status === 404 && errorText.includes('Domain not found')) {
          errorMessage = '域名不存在。请在 Short.io 控制台配置该域名，或不传 domain 参数使用默认域名';
        } else if (response.status === 401) {
          errorMessage = 'Short.io API 密钥无效，请检查 SHORT_IO_API_KEY 配置';
        } else if (response.status === 429) {
          errorMessage = 'Short.io API 请求频率超限，请稍后重试';
        }
        
        throw new HttpException(errorMessage, response.status);
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

  /**
   * 验证 URL 是否在允许的域名白名单内
   * 防止开放重定向攻击 (H6)
   * 
   * 如果配置了白名单，则严格验证
   * 如果未配置白名单，则只验证是 HTTPS 协议即可
   */
  private validateUrl(url: string): void {
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname.toLowerCase();

      // 首先验证必须是 HTTPS
      if (parsedUrl.protocol !== 'https:') {
        this.logger.warn(`Blocked non-HTTPS URL: ${url}`);
        throw new HttpException(
          'URL 必须使用 HTTPS 协议',
          HttpStatus.BAD_REQUEST,
        );
      }

      // 检查是否配置了白名单（构造时已解析）
      const allowedDomains = this.allowedDomains;

      // 如果没有配置白名单，只要是 HTTPS 就允许
      if (allowedDomains.length === 0) {
        this.logger.log(`URL validation passed (no whitelist configured): ${hostname}`);
        return;
      }

      // 如果配置了白名单，则进行严格验证
      const isAllowed = allowedDomains.some(domain => {
        // 支持通配符子域名，例如 *.example.com
        if (domain.startsWith('*.')) {
          const baseDomain = domain.substring(2);
          return hostname === baseDomain || hostname.endsWith('.' + baseDomain);
        }
        return hostname === domain;
      });

      if (!isAllowed) {
        this.logger.warn(`Blocked short link creation for non-whitelisted domain: ${hostname}`);
        throw new HttpException(
          `域名 ${hostname} 不在允许的白名单内。请联系管理员添加该域名。`,
          HttpStatus.FORBIDDEN,
        );
      }

      this.logger.log(`URL validation passed (whitelist match): ${hostname}`);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Invalid URL format: ${url}`);
      throw new HttpException(
        'URL 格式无效',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
