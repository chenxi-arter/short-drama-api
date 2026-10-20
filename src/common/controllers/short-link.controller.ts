import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ShortLinkService } from '../services/short-link.service';
import { CreateShortLinkDto, ShortLinkResponseDto } from '../dto/short-link.dto';
import { ResponseWrapper } from '../dto/response.dto';
import { JwtOrAdminGuard } from '../../auth/guards/jwt-or-admin.guard';

@ApiTags('短链接')
@Controller('short-links')
// 登录用户（H5/App）或管理员（后台）都可用；匿名不可用
@UseGuards(JwtOrAdminGuard)
@ApiBearerAuth()
export class ShortLinkController {
  constructor(private readonly shortLinkService: ShortLinkService) {}

  @Post()
  @ApiOperation({ 
    summary: '创建短链接',
    description: '需要登录。创建短链接会消耗 Short.io 配额，请谨慎使用。'
  })
  @ApiResponse({ status: 201, description: '短链接创建成功', type: ShortLinkResponseDto })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权，需要登录' })
  @ApiResponse({ status: 403, description: 'URL 不在白名单内' })
  @ApiResponse({ status: 500, description: '服务器错误' })
  async createShortLink(@Body() dto: CreateShortLinkDto) {
    const result = await this.shortLinkService.createShortLink(dto);
    return ResponseWrapper.success(result, '短链接创建成功');
  }
}
