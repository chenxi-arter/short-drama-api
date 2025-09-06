import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../user/entity/user.entity';
import { RefreshToken } from '../../auth/entity/refresh-token.entity';

@Controller('admin/users')
export class AdminUsersController {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  @Get()
  async list(@Query('page') page = 1, @Query('size') size = 20) {
    const take = Math.max(Number(size) || 20, 1);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
    const [users, total] = await this.userRepo.findAndCount({ skip, take, order: { id: 'DESC' } });

    const now = new Date();
    const items = await Promise.all(
      users.map(async (u) => {
        // 最新登录 = 最新创建的 refresh token 时间
        const lastToken = await this.refreshTokenRepo.findOne({
          where: { userId: u.id },
          order: { createdAt: 'DESC' },
        });
        // 活跃登录数 = 未撤销且未过期的 token 数
        const activeLogins = await this.refreshTokenRepo.count({
          where: {
            userId: u.id,
            isRevoked: false as any,
            // 由于 TypeORM 简单 where 不支持比较表达式，这里用查询构造器
          },
        });
        const activeLoginsAccurate = await this.refreshTokenRepo.createQueryBuilder('rt')
          .where('rt.user_id = :uid', { uid: u.id })
          .andWhere('rt.is_revoked = 0')
          .andWhere('rt.expires_at > :now', { now })
          .getCount();

        return {
          ...u,
          lastLoginAt: lastToken?.createdAt || null,
          lastLoginIp: lastToken?.ipAddress || null,
          lastLoginDevice: lastToken?.deviceInfo || null,
          activeLogins: activeLoginsAccurate ?? activeLogins,
        } as any;
      })
    );

    return { total, items, page: Number(page) || 1, size: take };
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const user = await this.userRepo.findOne({ where: { id: Number(id) } });
    if (!user) return null;
    const now = new Date();
    const lastToken = await this.refreshTokenRepo.findOne({
      where: { userId: user.id },
      order: { createdAt: 'DESC' },
    });
    const activeLogins = await this.refreshTokenRepo.createQueryBuilder('rt')
      .where('rt.user_id = :uid', { uid: user.id })
      .andWhere('rt.is_revoked = 0')
      .andWhere('rt.expires_at > :now', { now })
      .getCount();

    return {
      ...user,
      lastLoginAt: lastToken?.createdAt || null,
      lastLoginIp: lastToken?.ipAddress || null,
      lastLoginDevice: lastToken?.deviceInfo || null,
      activeLogins,
    } as any;
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


