/**
 * 管理后台 - 用户管理控制器（列表/详情/封禁）
 * 路由前缀: /api/admin/users
 */
import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisClientType } from 'redis';
import { User } from '../../user/entity/user.entity';
import { RefreshToken } from '../../auth/entity/refresh-token.entity';
import { WatchLog } from '../../video/entity/watch-log.entity';
import { UserOnlineDaily } from '../../user/entity/user-online-daily.entity';
import { REDIS_CLIENT } from '../../core/redis/redis.module';
import { AdminJwtAuthGuard } from '../guards/admin-jwt-auth.guard';

@UseGuards(AdminJwtAuthGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    @InjectRepository(WatchLog)
    private readonly watchLogRepo: Repository<WatchLog>,
    @InjectRepository(UserOnlineDaily)
    private readonly onlineDailyRepo: Repository<UserOnlineDaily>,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: RedisClientType | null,
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
        const [lastToken, activeLogins, watchStats] = await Promise.all([
          this.refreshTokenRepo.findOne({
            where: { userId: u.id },
            order: { createdAt: 'DESC' },
          }),
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
        const lastWatchAt = watchStats?.lastActiveAt ? new Date(watchStats.lastActiveAt) : null;
        const onlineLastActiveAt = this.redisClient
          ? await this.redisClient.get(`online:last:${u.id}`).catch(() => null)
          : null;
        const lastActiveAt = onlineLastActiveAt ? new Date(onlineLastActiveAt) : lastWatchAt;
        const isOnline = !!onlineLastActiveAt;

        return {
          ...u,
          lastLoginAt: lastToken?.createdAt || null,
          lastLoginIp: lastToken?.ipAddress || null,
          lastLoginDevice: lastToken?.deviceInfo || null,
          activeLogins,
          totalWatchDuration,
          lastActiveAt,
          isOnline,
        } as any;
      })
    );

    return { total, items, page: currentPage, size: take };
  }

  @Get(':id')
  async get(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const user = await this.userRepo.findOne({ where: { id: Number(id) } });
    if (!user) return null;
    const now = new Date();
    const [lastToken, activeLogins, watchStats] = await Promise.all([
      this.refreshTokenRepo.findOne({
        where: { userId: user.id },
        order: { createdAt: 'DESC' },
      }),
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
    const lastWatchAt = watchStats?.lastActiveAt ? new Date(watchStats.lastActiveAt) : null;
    const onlineLastActiveAt = this.redisClient
      ? await this.redisClient.get(`online:last:${user.id}`).catch(() => null)
      : null;
    const lastActiveAt = onlineLastActiveAt ? new Date(onlineLastActiveAt) : lastWatchAt;
    const isOnline = !!onlineLastActiveAt;
    const onlineDaily = await this.getOnlineDailyStats(user.id, startDate, endDate);

    return {
      ...user,
      lastLoginAt: lastToken?.createdAt || null,
      lastLoginIp: lastToken?.ipAddress || null,
      lastLoginDevice: lastToken?.deviceInfo || null,
      activeLogins,
      totalWatchDuration,
      lastActiveAt,
      isOnline,
      onlineDaily,
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

    // 查询用户总在线时长（来自 user_online_daily 表）
    const onlineStats = await this.onlineDailyRepo
      .createQueryBuilder('od')
      .select('SUM(od.duration)', 'totalOnlineDuration')
      .where('od.user_id = :userId', { userId })
      .getRawOne<{ totalOnlineDuration: string }>();

    // 查询在线状态（来自 Redis）
    const onlineLastActiveAt = this.redisClient
      ? await this.redisClient.get(`online:last:${userId}`).catch(() => null)
      : null;
    const isOnline = !!onlineLastActiveAt;

    return {
      total,
      items: logs,
      page: currentPage,
      size: take,
      userSummary: {
        userId,
        totalOnlineDuration: Number(onlineStats?.totalOnlineDuration || 0),
        isOnline,
        lastActiveAt: onlineLastActiveAt || null,
      },
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
    const userId = Number(id);
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    await this.userRepo.manager.transaction(async (manager) => {
      await manager.query('DELETE FROM comment_likes WHERE user_id = ?', [userId]);
      await manager.query('DELETE FROM comment_likes WHERE comment_id IN (SELECT id FROM comments WHERE user_id = ?)', [userId]);
      await manager.query('UPDATE comments SET reply_to_user_id = NULL WHERE reply_to_user_id = ?', [userId]);
      await manager.query('DELETE FROM comments WHERE user_id = ?', [userId]);
      await manager.query('DELETE FROM watch_progress WHERE user_id = ?', [userId]);
      await manager.query('DELETE FROM watch_logs WHERE user_id = ?', [userId]);
      await manager.query('DELETE FROM browse_history WHERE user_id = ?', [userId]);
      await manager.query('DELETE FROM favorites WHERE user_id = ?', [userId]);
      await manager.query('DELETE FROM episode_reactions WHERE user_id = ?', [userId]);
      await manager.query('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
      await manager.query('DELETE FROM user_online_daily WHERE user_id = ?', [userId]);
      await manager.query('DELETE FROM advertising_events WHERE user_id = ?', [userId]);
      await manager.query('DELETE FROM advertising_conversions WHERE user_id = ?', [userId]);
      await manager.delete(User, { id: userId });
    });

    await this.clearUserOnlineCache(userId);

    return { success: true };
  }

  @Get(':id/online-daily')
  async onlineDaily(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const userId = Number(id);
    return this.getOnlineDailyStats(userId, startDate, endDate);
  }

  private async getOnlineDailyStats(userId: number, startDate?: string, endDate?: string) {
    const end = endDate || new Date().toISOString().slice(0, 10);
    const start = startDate || (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10); })();

    const records = await this.onlineDailyRepo
      .createQueryBuilder('od')
      .where('od.user_id = :userId', { userId })
      .andWhere('od.date >= :start', { start })
      .andWhere('od.date <= :end', { end })
      .andWhere('od.duration > 0')
      .orderBy('od.date', 'DESC')
      .getMany();

    const onlineDurationByDate = new Map<string, number>();
    records.forEach((record) => {
      const date = this.formatDateOnly(record.date);
      onlineDurationByDate.set(date, (onlineDurationByDate.get(date) || 0) + record.duration);
    });

    const onlineDates = Array.from(onlineDurationByDate.keys());
    const watchRows = onlineDates.length > 0
      ? await this.watchLogRepo
        .createQueryBuilder('wl')
        .select('wl.watch_date', 'date')
        .addSelect('COALESCE(SUM(wl.watch_duration), 0)', 'watchDuration')
        .where('wl.user_id = :userId', { userId })
        .andWhere('wl.watch_date IN (:...onlineDates)', { onlineDates })
        .groupBy('wl.watch_date')
        .getRawMany<{ date: string; watchDuration: string }>()
      : [];

    const watchDurationByDate = new Map(
      watchRows.map((row) => [this.formatDateOnly(row.date), Number(row.watchDuration || 0)]),
    );

    const totalOnlineDuration = Array.from(onlineDurationByDate.values()).reduce((sum, duration) => sum + duration, 0);
    const totalWatchDuration = Array.from(watchDurationByDate.values()).reduce((sum, duration) => sum + duration, 0);

    return {
      userId,
      startDate: start,
      endDate: end,
      totalOnlineDuration,
      totalWatchDuration,
      days: onlineDates.sort((a, b) => (a < b ? 1 : -1)).map((date) => {
        const onlineDuration = onlineDurationByDate.get(date) || 0;
        const watchDuration = watchDurationByDate.get(date) || 0;

        return {
          date,
          onlineDuration,
          watchDuration,
          onlineHours: Math.floor(onlineDuration / 3600),
          onlineMinutes: Math.floor((onlineDuration % 3600) / 60),
          watchHours: Math.floor(watchDuration / 3600),
          watchMinutes: Math.floor((watchDuration % 3600) / 60),
        };
      }),
    };
  }

  private async clearUserOnlineCache(userId: number): Promise<void> {
    if (!this.redisClient) return;

    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    await Promise.all([
      this.redisClient.del(`online:last:${userId}`).catch(() => 0),
      this.redisClient.hDel(`online:${today}`, String(userId)).catch(() => 0),
      this.redisClient.hDel(`online:${yesterday}`, String(userId)).catch(() => 0),
    ]);
  }

  private formatDateOnly(value: string | Date): string {
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return String(value).slice(0, 10);
  }
}
