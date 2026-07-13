/**
 * 管理员认证控制器 - 登录/初始化/用户管理
 * 路由前缀: /api/admin/auth
 */
import { Body, Controller, Delete, ForbiddenException, Get, Headers, Param, ParseIntPipe, Post, Put, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AdminAuthService } from '../services/admin-auth.service';
import { AdminJwtAuthGuard } from '../guards/admin-jwt-auth.guard';

type AdminRequest = {
  admin?: { id: number; username: string; role: string };
};

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  login(@Body() body: { username: string; password: string }) {
    return this.adminAuthService.login(body);
  }

  @Post('init')
  init(
    @Headers('x-init-admin-token') initToken: string | undefined,
    @Body() body: { username: string; password: string; name?: string; role?: string },
  ) {
    this.assertInitToken(initToken);
    return this.adminAuthService.createFirstAdmin(body);
  }

  @Get('me')
  @UseGuards(AdminJwtAuthGuard)
  me(@Req() req: AdminRequest) {
    return req.admin;
  }

  @Get('list')
  @UseGuards(AdminJwtAuthGuard)
  list(@Req() req: AdminRequest) {
    this.assertSuperAdmin(req);
    return this.adminAuthService.listAdmins();
  }

  @Post('add')
  @UseGuards(AdminJwtAuthGuard)
  add(
    @Req() req: AdminRequest,
    @Body() body: { username: string; password: string; name?: string; role?: string },
  ) {
    this.assertSuperAdmin(req);
    return this.adminAuthService.addAdmin(body);
  }

  @Put('change-password')
  @UseGuards(AdminJwtAuthGuard)
  changePassword(
    @Req() req: AdminRequest,
    @Body() body: { oldPassword: string; newPassword: string },
  ) {
    return this.adminAuthService.changePassword(req.admin!.id, body.oldPassword, body.newPassword);
  }

  @Put('reset-password/:id')
  @UseGuards(AdminJwtAuthGuard)
  resetPassword(
    @Req() req: AdminRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { newPassword: string },
  ) {
    this.assertSuperAdmin(req);
    return this.adminAuthService.resetPassword(id, body.newPassword);
  }

  @Delete(':id')
  @UseGuards(AdminJwtAuthGuard)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AdminRequest,
  ) {
    this.assertSuperAdmin(req);
    return this.adminAuthService.removeAdmin(id, req.admin!.id);
  }

  private assertInitToken(initToken: string | undefined): void {
    const expected = process.env.INIT_ADMIN_TOKEN;
    if (!expected || initToken !== expected) {
      throw new UnauthorizedException('初始化令牌无效');
    }
  }

  private assertSuperAdmin(req: AdminRequest): void {
    if (req.admin?.role !== 'super_admin') {
      throw new ForbiddenException('仅超级管理员可执行该操作');
    }
  }
}
