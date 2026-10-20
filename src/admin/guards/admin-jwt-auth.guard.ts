import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AdminAuthService } from '../services/admin-auth.service';
import { ConfigService } from '@nestjs/config';
import { assertStrongSecret, optionalSecret } from '../../common/utils/security-env.util';

type AdminJwtPayload = {
  sub?: number;
  typ?: string;
};

type RequestLike = {
  headers?: Record<string, string | string[] | undefined>;
  admin?: unknown;
};

@Injectable()
export class AdminJwtAuthGuard implements CanActivate {
  /** 新密钥：必须独立配置，不再回退 JWT_SECRET（避免用户密钥可签管理员 token） */
  private readonly newSecret: string;
  /** 过渡期旧密钥：只认显式配置的环境变量，没有硬编码默认值 */
  private readonly legacySecret?: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly adminAuthService: AdminAuthService,
    private readonly configService: ConfigService,
  ) {
    this.newSecret = assertStrongSecret(
      'ADMIN_JWT_SECRET',
      this.configService.get<string>('ADMIN_JWT_SECRET'),
    );
    this.legacySecret = optionalSecret(
      'ADMIN_JWT_SECRET_LEGACY',
      this.configService.get<string>('ADMIN_JWT_SECRET_LEGACY'),
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestLike>();
    const token = this.extractToken(req);
    if (!token) {
      throw new UnauthorizedException('缺少管理员登录凭证');
    }

    // 先尝试新密钥
    try {
      return await this.authenticateWith(token, this.newSecret, req, false);
    } catch (newSecretError) {
      if (!this.legacySecret) {
        throw this.normalizeError(newSecretError);
      }

      // 新密钥失败，尝试旧密钥（过渡期兼容）
      try {
        return await this.authenticateWith(token, this.legacySecret, req, true);
      } catch {
        throw this.normalizeError(newSecretError);
      }
    }
  }

  private async authenticateWith(
    token: string,
    secret: string,
    req: RequestLike,
    isLegacy: boolean,
  ): Promise<boolean> {
    const payload = await this.jwtService.verifyAsync<AdminJwtPayload>(token, { secret });

    if (payload.typ !== 'admin' || !payload.sub) {
      throw new UnauthorizedException('无效的管理员登录凭证');
    }

    if (isLegacy) {
      console.warn('[AdminJWT] 使用过渡期旧密钥验证成功，管理员ID:', payload.sub);
    }

    const admin = await this.adminAuthService.validateAdmin(payload.sub);
    req.admin = this.adminAuthService.toSafeAdmin(admin);
    return true;
  }

  private normalizeError(error: unknown): UnauthorizedException {
    if (error instanceof UnauthorizedException) return error;
    return new UnauthorizedException('管理员登录已过期或无效');
  }

  private extractToken(req: RequestLike): string | null {
    const authorization = req.headers?.authorization;
    const value = Array.isArray(authorization) ? authorization[0] : authorization;
    if (!value) return null;
    const [type, token] = value.split(' ');
    return type === 'Bearer' && token ? token : null;
  }
}
