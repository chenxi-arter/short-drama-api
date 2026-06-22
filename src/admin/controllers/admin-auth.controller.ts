import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Req, UseGuards } from '@nestjs/common';
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
  init(@Body() body: { username: string; password: string; name?: string; role?: string }) {
    return this.adminAuthService.createFirstAdmin(body);
  }

  @Get('me')
  @UseGuards(AdminJwtAuthGuard)
  me(@Req() req: AdminRequest) {
    return req.admin;
  }

  @Get('list')
  @UseGuards(AdminJwtAuthGuard)
  list() {
    return this.adminAuthService.listAdmins();
  }

  @Post('add')
  @UseGuards(AdminJwtAuthGuard)
  add(@Body() body: { username: string; password: string; name?: string; role?: string }) {
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
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { newPassword: string },
  ) {
    return this.adminAuthService.resetPassword(id, body.newPassword);
  }

  @Delete(':id')
  @UseGuards(AdminJwtAuthGuard)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AdminRequest,
  ) {
    return this.adminAuthService.removeAdmin(id, req.admin!.id);
  }
}
