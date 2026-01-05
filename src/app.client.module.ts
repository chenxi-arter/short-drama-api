import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { CoreModule } from './core/core.module';
import { SharedModule } from './common/shared.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { VideoApiModule } from './video/modules/video-api.module';
import { AdvertisingModule } from './advertising/advertising.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    CoreModule,
    SharedModule,
    AuthModule,
    UserModule,
    VideoApiModule,
    AdvertisingModule,
  ],
})
export class ClientAppModule {}


