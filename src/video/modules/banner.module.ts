import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Banner } from '../entity/banner.entity';
import { BannerService } from '../services/banner.service';

@Module({
  imports: [TypeOrmModule.forFeature([Banner])],
  providers: [BannerService],
  exports: [BannerService, TypeOrmModule],
})
export class BannerModule {}


