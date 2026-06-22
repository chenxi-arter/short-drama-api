/**
 * 管理后台 - 用户管理控制器（列表/详情/封禁）
 * 路由前缀: /api/admin/users
 */
import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../user/entity/user.entity';
import { RefreshToken } from '../../auth/entity/refresh-token.entity';
import { UserOperationLog } from '../../user/entity/user-operation-log.entity';
import { WatchLog } from '../../video/entity/watch-log.entity';
import { UserOnlineDaily } from '../../user/entity/user-online-daily.entity';
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
    @InjectRepository(WatchLog)
    private readonly watchLogRepo: Repository<WatchLog>,
    @InjectRepository(UserOnlineDaily)
    private readonly onlineDailyRepo: Repository<UserOnlineDaily>,
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
        const [lastToken, loginCount, activeLogins, watchStats] = await Promise.all([
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
          this.watchLogRepo.createQueryBuilder('wl')
            .select('COALESCE(SUM(wl.watch_duration), 0)', 'totalDuration')
            .addSelect('MAX(wl.created_at)', 'lastActiveAt')
            .where('wl.user_id = :uid', { uid: u.id })
            .getRawOne(),
        ]);

        const totalWatchDuration = Number(watchStats?.totalDuration || 0);
        const lastActiveAt = watchStats?.lastActiveAt ? new Date(watchStats.lastActiveAt) : null;
        const isOnline = lastActiveAt && (now.getTime() - lastActiveAt.getTime()) < 5 * 60 * 1000;

        return {
          ...u,
          lastLoginAt: lastToken?.createdAt || null,
          lastLoginIp: lastToken?.ipAddress || null,
          lastLoginDevice: lastToken?.deviceInfo || null,
          activeLogins,
          loginCount,
          totalWatchDuration,
          lastActiveAt,
          isOnline: !!isOnline,
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
    const [lastToken, loginCount, activeLogins, watchStats] = await Promise.all([
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
      this.watchLogRepo.createQueryBuilder('wl')
        .select('COALESCE(SUM(wl.watch_duration), 0)', 'totalDuration')
        .addSelect('MAX(wl.created_at)', 'lastActiveAt')
        .where('wl.user_id = :uid', { uid: user.id })
        .getRawOne(),
    ]);

    const totalWatchDuration = Number(watchStats?.totalDuration || 0);
    const lastActiveAt = watchStats?.lastActiveAt ? new Date(watchStats.lastActiveAt) : null;
    const isOnline = lastActiveAt && (now.getTime() - lastActiveAt.getTime()) < 5 * 60 * 1000;

    return {
      ...user,
      lastLoginAt: lastToken?.createdAt || null,
      lastLoginIp: lastToken?.ipAddress || null,
      lastLoginDevice: lastToken?.deviceInfo || null,
      activeLogins,
      loginCount,
      totalWatchDuration,
      lastActiveAt,
      isOnline: !!isOnline,
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

  @Get(':id/online-daily')
  async onlineDaily(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const userId = Number(id);
    const end = endDate || new Date().toISOString().slice(0, 10);
    const start = startDate || (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10); })();

    const records = await this.onlineDailyRepo
      .createQueryBuilder('od')
      .where('od.user_id = :userId', { userId })
      .andWhere('od.date >= :start', { start })
      .andWhere('od.date <= :end', { end })
      .orderBy('od.date', 'DESC')
      .getMany();

    const totalDuration = records.reduce((sum, r) => sum + r.duration, 0);

    return {
      userId,
      startDate: start,
      endDate: end,
      totalDuration,
      days: records.map((r) => ({
        date: r.date,
        duration: r.duration,
        hours: Math.floor(r.duration / 3600),
        minutes: Math.floor((r.duration % 3600) / 60),
      })),
    };
  }
}
