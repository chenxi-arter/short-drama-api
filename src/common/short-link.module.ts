import { Module } from '@nestjs/common';
import { ShortLinkController } from './controllers/short-link.controller';
import { ShortLinkService } from './services/short-link.service';

@Module({
  controllers: [ShortLinkController],
  providers: [ShortLinkService],
  exports: [ShortLinkService],
})
export class ShortLinkModule {}
