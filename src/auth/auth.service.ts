import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { RefreshToken } from './entity/refresh-token.entity';
import { User } from '../user/entity/user.entity';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  /**
   * 生成访问令牌和刷新令牌
   * @param user 用户实体
   * @param deviceInfo 设备信息（可选）
   * @param ipAddress IP地址（可选）
   * @returns 包含access_token和refresh_token的对象
   */
  async generateTokens(user: User, deviceInfo?: string, ipAddress?: string) {
    // 生成 access token (短期，使用环境变量配置)
    const accessToken = this.jwtService.sign(
      { sub: user.id },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      }
    );

    // 生成 refresh token (长期，7天)
    const refreshTokenValue = randomBytes(32).toString('hex');
    const refreshToken = this.refreshTokenRepo.create({
      userId: user.id,
      token: refreshTokenValue,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天
      deviceInfo,
      ipAddress,
    });
    await this.refreshTokenRepo.save(refreshToken);

    return {
      access_token: accessToken,
      refresh_token: refreshTokenValue,
      expires_in: this.getExpiresInSeconds(), // 根据环境变量计算
      token_type: 'Bearer',
    };
  }

  /**
   * 使用refresh token刷新access token
   * @param refreshTokenValue refresh token值
   * @param ipAddress 当前请求的IP地址（可选）
   * @returns 新的access token
   */
  async refreshAccessToken(refreshTokenValue: string, ipAddress?: string) {
    if (!refreshTokenValue) {
      throw new BadRequestException('Refresh token 不能为空');
    }

    // 查找 refresh token
    const refreshToken = await this.refreshTokenRepo.findOne({
      where: { token: refreshTokenValue, isRevoked: false },
      relations: ['user'],
    });

    if (!refreshToken) {
      throw new UnauthorizedException('无效的 refresh token');
    }

    // 检查是否过期
    if (refreshToken.expiresAt < new Date()) {
      // 标记为已撤销
      await this.refreshTokenRepo.update(refreshToken.id, { isRevoked: true });
      throw new UnauthorizedException('Refresh token 已过期，请重新登录');
    }

    // 检查用户是否仍然有效
    if (!refreshToken.user || !refreshToken.user.is_active) {
      await this.refreshTokenRepo.update(refreshToken.id, { isRevoked: true });
      throw new UnauthorizedException('用户账号已被禁用');
    }

    // 安全检查：如果IP地址变化较大，可能需要额外验证（可选）
    if (ipAddress && refreshToken.ipAddress && 
        this.isIpSuspicious(refreshToken.ipAddress, ipAddress)) {
      // 这里可以添加额外的安全验证逻辑
      console.warn(`IP地址变化检测: ${refreshToken.ipAddress} -> ${ipAddress}`);
    }

    // 生成新的 access token
    const accessToken = this.jwtService.sign(
      { sub: refreshToken.userId },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      }
    );

    // 可选：实现refresh token轮换（每次刷新时生成新的refresh token）
    // 这里为了简化，暂时不实现轮换机制

    return {
      access_token: accessToken,
      expires_in: 3600,
      token_type: 'Bearer',
    };
  }

  /**
   * 撤销指定的refresh token
   * @param refreshTokenValue refresh token值
   */
  async revokeRefreshToken(refreshTokenValue: string) {
    const result = await this.refreshTokenRepo.update(
      { token: refreshTokenValue },
      { isRevoked: true }
    );
    
    if (result.affected === 0) {
      throw new UnauthorizedException('无效的 refresh token');
    }
  }

  /**
   * 撤销用户的所有refresh token（用于全设备登出）
   * @param userId 用户ID
   */
  async revokeAllUserTokens(userId: number) {
    await this.refreshTokenRepo.update(
      { userId, isRevoked: false },
      { isRevoked: true }
    );
  }

  /**
   * 清理过期的refresh token
   * 建议定期调用此方法或使用定时任务
   */
  async cleanupExpiredTokens() {
    const result = await this.refreshTokenRepo.delete({
      expiresAt: LessThan(new Date()),
    });
    
    console.log(`清理了 ${result.affected} 个过期的 refresh token`);
    return result.affected;
  }

  /**
   * 获取用户的活跃refresh token列表
   * @param userId 用户ID
   * @returns 活跃的refresh token列表（不包含token值）
   */
  async getUserActiveTokens(userId: number) {
    return this.refreshTokenRepo.find({
      where: { 
        userId, 
        isRevoked: false,
        expiresAt: LessThan(new Date())
      },
      select: ['id', 'createdAt', 'expiresAt', 'deviceInfo', 'ipAddress'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 计算JWT过期时间（秒）
   */
  private getExpiresInSeconds(): number {
    const expiresIn = process.env.JWT_EXPIRES_IN || '1h';
    
    // 解析时间字符串
    const timeUnit = expiresIn.slice(-1);
    const timeValue = parseInt(expiresIn.slice(0, -1));
    
    switch (timeUnit) {
      case 's': return timeValue;
      case 'm': return timeValue * 60;
      case 'h': return timeValue * 60 * 60;
      case 'd': return timeValue * 24 * 60 * 60;
      default: return 3600; // 默认1小时
    }
  }

  /**
   * 检查IP地址是否可疑（简单实现）
   * @param oldIp 原IP地址
   * @param newIp 新IP地址
   * @returns 是否可疑
   */
  private isIpSuspicious(oldIp: string, newIp: string): boolean {
    // 简单的IP变化检测，实际项目中可以实现更复杂的逻辑
    if (oldIp === newIp) return false;
    
    // 检查是否在同一个C段网络
    const oldSegments = oldIp.split('.');
    const newSegments = newIp.split('.');
    
    if (oldSegments.length === 4 && newSegments.length === 4) {
      // 如果前三段相同，认为是同一网络，不可疑
      return !(oldSegments[0] === newSegments[0] && 
               oldSegments[1] === newSegments[1] && 
               oldSegments[2] === newSegments[2]);
    }
    
    return true; // 无法判断时认为可疑
  }
}