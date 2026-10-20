import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { CoreModule } from './core/core.module';
import { SharedModule } from './common/shared.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    // 定时任务（游客数据清理等）只在 admin 进程执行。
    // ⚠️ 启用后 UserModule 里那些 @Cron 也会被激活，所以 main.admin.ts 会把
    //    APP_PROCESS_ROLE 标记为 'admin'，UserService.flushOnlineDataToDb 会据此跳过，
    //    避免和 client 进程同时刷在线时长造成重复累加。
    ScheduleModule.forRoot(),
    CoreModule,
    SharedModule,
    AuthModule,      // ✅ 添加 AuthModule
    UserModule,      // ✅ 添加 UserModule
    AdminModule,
  ],
})
export class AdminAppModule {}


