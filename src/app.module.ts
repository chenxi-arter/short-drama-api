import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { TestModule } from './test/test.module';
import { VideoModule } from './video/video.module';
import { AuthModule } from './auth/auth.module';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    CoreModule,     // 核心基础设施模块（配置、数据库、缓存、健康检查、限流）
    SharedModule,   // 共享模块（实体、工具类）
    AuthModule,
    UserModule,
    VideoModule,
    TestModule,
  ],
})
export class AppModule {}
