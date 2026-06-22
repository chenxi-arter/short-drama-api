/**
 * 管理员认证服务 - 登录/注册/Token管理/密码重置
 */
import { Injectable, OnModuleInit, UnauthorizedException, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminUser } from '../entity/admin-user.entity';
import { PasswordUtil } from '../../common/utils/password.util';

type AdminLoginDto = {
  username: string;
  password: string;
};

type CreateAdminDto = {
  username: string;
  password: string;
  name?: string;
  role?: string;
};

@Injectable()
export class AdminAuthService implements OnModuleInit {
  constructor(
    @InjectRepository(AdminUser)
    private readonly adminUserRepo: Repository<AdminUser>,
    private readonly jwtService: JwtService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureTable();
  }

  async login(dto: AdminLoginDto) {
    const username = String(dto.username || '').trim();
    const password = String(dto.password || '');
    if (!username || !password) {
      throw new BadRequestException('用户名和密码不能为空');
    }

    const admin = await this.adminUserRepo.findOne({ where: { username } });
    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('管理员账号或密码错误');
    }

    const matched = await PasswordUtil.comparePassword(password, admin.passwordHash);
    if (!matched) {
      throw new UnauthorizedException('管理员账号或密码错误');
    }

    const accessToken = this.jwtService.sign({
      sub: admin.id,
      username: admin.username,
      role: admin.role,
      typ: 'admin',
    });

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: this.getExpiresInSeconds(),
      admin: this.toSafeAdmin(admin),
    };
  }

  async createFirstAdmin(dto: CreateAdminDto) {
    const existingCount = await this.adminUserRepo.count();
    if (existingCount > 0) {
      throw new ConflictException('管理员已存在，不能重复初始化');
    }
    return this.createAdmin(dto);
  }

  async addAdmin(dto: CreateAdminDto) {
    return this.createAdmin(dto);
  }

  async changePassword(adminId: number, oldPassword: string, newPassword: string) {
    const admin = await this.adminUserRepo.findOne({ where: { id: adminId } });
    if (!admin) {
      throw new NotFoundException('管理员不存在');
    }

    const matched = await PasswordUtil.comparePassword(oldPassword, admin.passwordHash);
    if (!matched) {
      throw new UnauthorizedException('原密码错误');
    }

    const validation = PasswordUtil.validatePasswordStrength(newPassword);
    if (!validation.valid) {
      throw new BadRequestException(validation.message);
    }

    admin.passwordHash = await PasswordUtil.hashPassword(newPassword);
    await this.adminUserRepo.save(admin);
    return { success: true, message: '密码修改成功' };
  }

  async resetPassword(adminId: number, newPassword: string) {
    const admin = await this.adminUserRepo.findOne({ where: { id: adminId } });
    if (!admin) {
      throw new NotFoundException('管理员不存在');
    }

    const validation = PasswordUtil.validatePasswordStrength(newPassword);
    if (!validation.valid) {
      throw new BadRequestException(validation.message);
    }

    admin.passwordHash = await PasswordUtil.hashPassword(newPassword);
    await this.adminUserRepo.save(admin);
    return { success: true, message: '密码重置成功' };
  }

  async removeAdmin(adminId: number, currentAdminId: number) {
    if (adminId === currentAdminId) {
      throw new BadRequestException('不能删除自己的账号');
    }
    const admin = await this.adminUserRepo.findOne({ where: { id: adminId } });
    if (!admin) {
      throw new NotFoundException('管理员不存在');
    }
    await this.adminUserRepo.remove(admin);
    return { success: true, message: '管理员已删除' };
  }

  async listAdmins() {
    const admins = await this.adminUserRepo.find({ order: { id: 'ASC' } });
    return admins.map(a => this.toSafeAdmin(a));
  }

  async validateAdmin(adminId: number): Promise<AdminUser> {
    const admin = await this.adminUserRepo.findOne({ where: { id: adminId, isActive: true } });
    if (!admin) {
      throw new UnauthorizedException('管理员登录已失效');
    }
    return admin;
  }

  toSafeAdmin(admin: AdminUser) {
    return {
      id: admin.id,
      username: admin.username,
      name: admin.name,
      role: admin.role,
      isActive: admin.isActive,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    };
  }

  private async createAdmin(dto: CreateAdminDto) {
    const username = String(dto.username || '').trim();
    const password = String(dto.password || '');
    if (!username || !password) {
      throw new BadRequestException('用户名和密码不能为空');
    }

    const validation = PasswordUtil.validatePasswordStrength(password);
    if (!validation.valid) {
      throw new BadRequestException(validation.message);
    }

    const exists = await this.adminUserRepo.findOne({ where: { username } });
    if (exists) {
      throw new ConflictException('管理员用户名已存在');
    }

    const admin = this.adminUserRepo.create({
      username,
      passwordHash: await PasswordUtil.hashPassword(password),
      name: dto.name || username,
      role: dto.role || 'super_admin',
      isActive: true,
    });
    const saved = await this.adminUserRepo.save(admin);
    return this.toSafeAdmin(saved);
  }

  private getExpiresInSeconds(): number {
    const expiresIn = process.env.ADMIN_JWT_EXPIRES_IN || process.env.JWT_EXPIRES_IN || '8h';
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1), 10);
    if (!Number.isFinite(value)) return 8 * 60 * 60;
    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 24 * 60 * 60;
      default: return 8 * 60 * 60;
    }
  }

  private async ensureTable(): Promise<void> {
    await this.adminUserRepo.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INT NOT NULL AUTO_INCREMENT,
        username VARCHAR(100) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(100) NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'admin',
        is_active TINYINT NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_admin_users_username (username)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  }
}
