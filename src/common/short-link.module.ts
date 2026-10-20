import { Module } from '@nestjs/common';
import { ShortLinkController } from './controllers/short-link.controller';
import { ShortLinkService } from './services/short-link.service';
import { DauService } from '../admin/services/dau.service';
import { AdminAuthModule } from '../admin/admin-auth.module';
import { JwtOrAdminGuard } from '../auth/guards/jwt-or-admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Module({
  /**
   * 控制器上的 JwtOrAdminGuard 需要：
   * - JwtAuthGuard（用户 token）→ 依赖 DauService（DAU 埋点，RedisModule 是 @Global）
   * - AdminJwtAuthGuard（管理员 token）→ 依赖 JwtService + AdminAuthService，由 AdminAuthModule 导出
   *
   * 之前本模块没提供 DauService，守卫拿到 undefined，
   * 已登录用户调 POST /api/short-links 会 500（Cannot read properties of undefined）。
   */
  imports: [AdminAuthModule],
  controllers: [ShortLinkController],
  providers: [ShortLinkService, DauService, JwtAuthGuard, JwtOrAdminGuard],
  exports: [ShortLinkService],
})
export class ShortLinkModule {}
