import { Global, Module } from '@nestjs/common';
import { EntitiesModule } from './base/entities.module';
import { AccessKeyUtil } from './utils/access-key.util';

/**
 * 共享模块
 * 提供全局共享的实体、工具类和DTO
 */
@Global()
@Module({
  imports: [
    EntitiesModule,
  ],
  providers: [
    AccessKeyUtil,
  ],
  exports: [
    EntitiesModule,
    AccessKeyUtil,
  ],
})
export class SharedModule {
  /**
   * 模块初始化时的日志
   */
  constructor() {
    console.log('🔧 Shared utilities and entities loaded');
  }
}