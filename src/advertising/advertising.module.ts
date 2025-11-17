import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import {
  AdvertisingPlatform,
  AdvertisingCampaign,
  AdvertisingEvent,
  AdvertisingConversion,
  AdvertisingCampaignStats,
} from './entity';

// Services
import {
  PlatformService,
  CampaignService,
  TrackingService,
  AnalyticsService,
} from './services';

// Controllers
import {
  AdminPlatformController,
  AdminCampaignController,
  AdminAnalyticsController,
  TrackingController,
} from './controllers';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdvertisingPlatform,
      AdvertisingCampaign,
      AdvertisingEvent,
      AdvertisingConversion,
      AdvertisingCampaignStats,
    ]),
  ],
  controllers: [
    AdminPlatformController,
    AdminCampaignController,
    AdminAnalyticsController,
    TrackingController,
  ],
  providers: [
    PlatformService,
    CampaignService,
    TrackingService,
    AnalyticsService,
  ],
  exports: [
    PlatformService,
    CampaignService,
    TrackingService,
    AnalyticsService,
  ],
})
export class AdvertisingModule {}
