import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ShortLinkService } from '../services/short-link.service';
import { CreateShortLinkDto, ShortLinkResponseDto } from '../dto/short-link.dto';
import { ResponseWrapper } from '../dto/response.dto';

@ApiTags('短链接')
@Controller('short-links')
export class ShortLinkController {
  constructor(private readonly shortLinkService: ShortLinkService) {}

  @Post()
  @ApiOperation({ summary: '创建短链接' })
  @ApiResponse({ status: 201, description: '短链接创建成功', type: ShortLinkResponseDto })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 500, description: '服务器错误' })
  async createShortLink(@Body() dto: CreateShortLinkDto) {
    const result = await this.shortLinkService.createShortLink(dto);
    return ResponseWrapper.success(result, '短链接创建成功');
  }
}
