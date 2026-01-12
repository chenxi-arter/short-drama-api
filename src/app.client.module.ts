import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';

import { CoreModule } from './core/core.module';
import { SharedModule } from './common/shared.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { VideoApiModule } from './video/modules/video-api.module';
import { AdvertisingModule } from './advertising/advertising.module';
import { ShortLinkModule } from './common/short-link.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    CoreModule,
    SharedModule,
    AuthModule,
    UserModule,
    VideoApiModule,
    AdvertisingModule,
    ShortLinkModule,
  ],
  providers: [
    // 全局异常过滤器 - 统一处理异常，4xx错误只记录简洁日志，不输出堆栈
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class ClientAppModule {}


