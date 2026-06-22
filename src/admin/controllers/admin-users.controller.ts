import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../user/entity/user.entity';
import { RefreshToken } from '../../auth/entity/refresh-token.entity';
import { UserOperationLog } from '../../user/entity/user-operation-log.entity';
import { AdminJwtAuthGuard } from '../guards/admin-jwt-auth.guard';

@UseGuards(AdminJwtAuthGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    @InjectRepository(UserOperationLog)
    private readonly operationLogRepo: Repository<UserOperationLog>,
  ) {}

  @Get()
  async list(@Query('page') page = 1, @Query('size') size = 20) {
    const take = Math.max(Number(size) || 20, 1);
    const currentPage = Math.max(Number(page) || 1, 1);
    const skip = (currentPage - 1) * take;
    const [users, total] = await this.userRepo.findAndCount({ skip, take, order: { id: 'DESC' } });

    const now = new Date();
    const items = await Promise.all(
      users.map(async (u) => {
        const [lastToken, loginCount, activeLogins] = await Promise.all([
          this.refreshTokenRepo.findOne({
            where: { userId: u.id },
            order: { createdAt: 'DESC' },
          }),
          this.refreshTokenRepo.count({ where: { userId: u.id } }),
          this.refreshTokenRepo.createQueryBuilder('rt')
            .where('rt.user_id = :uid', { uid: u.id })
            .andWhere('rt.is_revoked = 0')
            .andWhere('rt.expires_at > :now', { now })
            .getCount(),
        ]);

        return {
          ...u,
          lastLoginAt: lastToken?.createdAt || null,
          lastLoginIp: lastToken?.ipAddress || null,
          lastLoginDevice: lastToken?.deviceInfo || null,
          activeLogins,
          loginCount,
        } as any;
      })
    );

    return { total, items, page: currentPage, size: take };
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const user = await this.userRepo.findOne({ where: { id: Number(id) } });
    if (!user) return null;
    const now = new Date();
    const [lastToken, loginCount, activeLogins] = await Promise.all([
      this.refreshTokenRepo.findOne({
        where: { userId: user.id },
        order: { createdAt: 'DESC' },
      }),
      this.refreshTokenRepo.count({ where: { userId: user.id } }),
      this.refreshTokenRepo.createQueryBuilder('rt')
        .where('rt.user_id = :uid', { uid: user.id })
        .andWhere('rt.is_revoked = 0')
        .andWhere('rt.expires_at > :now', { now })
        .getCount(),
    ]);

    return {
      ...user,
      lastLoginAt: lastToken?.createdAt || null,
      lastLoginIp: lastToken?.ipAddress || null,
      lastLoginDevice: lastToken?.deviceInfo || null,
      activeLogins,
      loginCount,
    } as any;
  }

  @Get(':id/login-logs')
  async loginLogs(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('size') size = 20,
  ) {
    const userId = Number(id);
    const take = Math.max(Number(size) || 20, 1);
    const currentPage = Math.max(Number(page) || 1, 1);
    const skip = (currentPage - 1) * take;
    const [logs, total] = await this.refreshTokenRepo.findAndCount({
      where: { userId },
      select: ['id', 'createdAt', 'expiresAt', 'isRevoked', 'deviceInfo', 'ipAddress'],
      order: { createdAt: 'DESC' },
      skip,
      take,
    });

    return {
      total,
      items: logs,
      page: currentPage,
      size: take,
    };
  }

  @Get(':id/operation-logs')
  async operationLogs(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('size') size = 20,
  ) {
    const userId = Number(id);
    const take = Math.max(Number(size) || 20, 1);
    const currentPage = Math.max(Number(page) || 1, 1);
    const skip = (currentPage - 1) * take;
    const [logs, total] = await this.operationLogRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip,
      take,
    });

    return {
      total,
      items: logs,
      page: currentPage,
      size: take,
    };
  }

  @Post()
  async create(@Body() body: Partial<User>) {
    const entity = this.userRepo.create(body);
    return this.userRepo.save(entity);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: Partial<User>) {
    await this.userRepo.update({ id: Number(id) }, body);
    return this.userRepo.findOne({ where: { id: Number(id) } });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.userRepo.delete({ id: Number(id) });
    return { success: true };
  }
}
