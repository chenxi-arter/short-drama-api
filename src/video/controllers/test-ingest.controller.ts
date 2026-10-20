/**
 * 数据导入测试控制器
 * 路由前缀: /api/test-ingest
 * 
 * 安全修复 C4: 添加管理员鉴权
 */
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AdminJwtAuthGuard } from '../../admin/guards/admin-jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('测试（管理员）')
@Controller('admin/test-ingest')
@UseGuards(AdminJwtAuthGuard)
@ApiBearerAuth()
export class TestIngestController {
  
  @Get()
  async testGet() {
    return { message: 'Test Ingest GET endpoint works!', timestamp: new Date().toISOString() };
  }

  @Post()
  async testPost() {
    return { message: 'Test Ingest POST endpoint works!', timestamp: new Date().toISOString() };
  }
}
