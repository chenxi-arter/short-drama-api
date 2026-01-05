import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, Not, IsNull, In } from 'typeorm';
import { User } from '../user/entity/user.entity';
import { AuthService } from './auth.service';
import { randomBytes } from 'crypto';

@Injectable()
export class GuestService {
  private readonly logger = new Logger(GuestService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly authService: AuthService,
  ) {}

  async guestLogin(guestToken?: string, deviceInfo?: string) {
    let user: User | null = null;
    let isNewGuest = false;

    if (guestToken) {
      user = await this.userRepo.findOne({
        where: { guestToken, isGuest: true },
      });
    }

    if (!user) {
      user = await this.createGuestUser();
      isNewGuest = true;
    }

    const tokens = await this.authService.generateTokens(
      user,
      deviceInfo || 'Guest User',
    );

    return {
      ...tokens,
      guestToken: user.guestToken,
      isNewGuest,
      userId: user.id,
    };
  }

  private async createGuestUser(): Promise<User> {
    const guestToken = this.generateGuestToken();
    
    const { DefaultAvatarUtil } = await import('../shared/utils/default-avatar.util');
    const defaultAvatar = DefaultAvatarUtil.getRandomAvatar();

    const guestNumber = Math.floor(Math.random() * 999999);
    const nickname = `游客${guestNumber.toString().padStart(6, '0')}`;

    const user = this.userRepo.create({
      isGuest: true,
      guestToken,
      nickname,
      first_name: '',
      last_name: '',
      photo_url: defaultAvatar,
      is_active: true,
      username: `guest_${guestToken}`,
    });

    return await this.userRepo.save(user);
  }

  private generateGuestToken(): string {
    return `guest_${randomBytes(16).toString('hex')}`;
  }

  async convertGuestToUser(userId: number, email?: string, telegramId?: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId, isGuest: true },
    });

    if (!user) {
      throw new BadRequestException('游客用户不存在');
    }

    user.isGuest = false;
    
    if (email) {
      const existingUser = await this.userRepo.findOne({ where: { email } });
      if (existingUser) {
        throw new BadRequestException('该邮箱已被使用');
      }
      user.email = email;
    }

    if (telegramId) {
      const existingUser = await this.userRepo.findOne({ where: { telegram_id: telegramId } });
      if (existingUser) {
        throw new BadRequestException('该Telegram账号已被绑定');
      }
      user.telegram_id = telegramId;
    }

    return await this.userRepo.save(user);
  }

  /**
   * 清理不活跃的游客用户（软删除）
   * @param inactiveDays 不活跃天数阈值（默认90天）
   * @param recentActivityDays 最近活跃天数（默认30天）
   * @returns 清理结果统计
   */
  async cleanInactiveGuests(
    inactiveDays: number = 90,
    recentActivityDays: number = 30,
  ) {
    this.logger.log(`开始清理不活跃游客：不活跃天数>${inactiveDays}天，最近${recentActivityDays}天无活动`);

    // 计算截止日期
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - inactiveDays);

    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - recentActivityDays);

    try {
      // 查找需要清理的游客（创建时间早于cutoffDate，且最近无活动）
      const inactiveGuests = await this.userRepo
        .createQueryBuilder('user')
        .where('user.is_guest = :isGuest', { isGuest: true })
        .andWhere('user.is_active = :isActive', { isActive: true })
        .andWhere('user.created_at < :cutoffDate', { cutoffDate })
        .andWhere(
          `user.id NOT IN (
            SELECT DISTINCT user_id 
            FROM watch_progress 
            WHERE updated_at > :recentDate
          )`,
          { recentDate },
        )
        .getMany();

      if (inactiveGuests.length === 0) {
        this.logger.log('没有需要清理的不活跃游客');
        return {
          success: true,
          deactivated: 0,
          message: '没有需要清理的不活跃游客',
        };
      }

      // 软删除：将这些游客标记为不活跃
      const guestIds = inactiveGuests.map((g) => g.id);
      const result = await this.userRepo.update(
        { id: In(guestIds) },
        { is_active: false },
      );

      this.logger.log(`成功标记 ${result.affected} 个不活跃游客为不活跃状态`);

      return {
        success: true,
        deactivated: result.affected || 0,
        message: `已将 ${result.affected} 个不活跃游客标记为不活跃状态`,
        details: {
          inactiveDays,
          recentActivityDays,
          cutoffDate: cutoffDate.toISOString(),
          recentDate: recentDate.toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(`清理不活跃游客失败: ${error.message}`, error.stack);
      throw new BadRequestException(`清理失败: ${error.message}`);
    }
  }

  /**
   * 获取游客统计信息
   * @returns 游客统计数据
   */
  async getGuestStatistics() {
    const totalGuests = await this.userRepo.count({
      where: { isGuest: true },
    });

    const activeGuests = await this.userRepo.count({
      where: { isGuest: true, is_active: true },
    });

    const inactiveGuests = await this.userRepo.count({
      where: { isGuest: true, is_active: false },
    });

    const convertedGuests = await this.userRepo.count({
      where: { 
        isGuest: false, 
        guestToken: Not(IsNull()) 
      },
    });

    // 计算最近30天创建的游客数
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentGuests = await this.userRepo.count({
      where: {
        isGuest: true,
        created_at: MoreThan(thirtyDaysAgo),
      },
    });

    const totalGuestsEver = totalGuests + convertedGuests;
    
    return {
      totalGuests,
      activeGuests,
      inactiveGuests,
      convertedGuests,
      recentGuests,
      conversionRate:
        totalGuestsEver > 0
          ? ((convertedGuests / totalGuestsEver) * 100).toFixed(2) + '%'
          : '0.00%',
    };
  }

  /**
   * 恢复被标记为不活跃的游客
   * @param userId 用户ID
   * @returns 恢复结果
   */
  async reactivateGuest(userId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId, isGuest: true, is_active: false },
    });

    if (!user) {
      throw new BadRequestException('游客用户不存在或已是活跃状态');
    }

    user.is_active = true;
    await this.userRepo.save(user);

    this.logger.log(`游客用户 ${userId} 已恢复为活跃状态`);

    return {
      success: true,
      message: '游客已恢复为活跃状态',
      userId,
    };
  }
}
