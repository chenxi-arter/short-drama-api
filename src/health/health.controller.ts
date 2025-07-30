import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

/**
 * 健康检查控制器
 */
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * 基础健康检查
   */
  @Get()
  check() {
    return this.healthService.getHealthStatus();
  }

  /**
   * 详细健康检查
   */
  @Get('detailed')
  async detailedCheck() {
    return this.healthService.getDetailedHealthStatus();
  }

  /**
   * 系统信息
   */
  @Get('system')
  systemInfo() {
    return this.healthService.getSystemInfo();
  }
}