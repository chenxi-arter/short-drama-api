import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    CoreModule,
    SharedModule,
    AdminModule,
  ],
})
export class AdminAppModule {}


