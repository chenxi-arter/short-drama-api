import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AdminAuthService } from '../services/admin-auth.service';

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
  constructor(
    private readonly jwtService: JwtService,
    private readonly adminAuthService: AdminAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestLike>();
    const token = this.extractToken(req);
    if (!token) {
      throw new UnauthorizedException('缺少管理员登录凭证');
    }

    try {
      const payload = await this.jwtService.verifyAsync<AdminJwtPayload>(token, {
        secret: process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET,
      });
      if (payload.typ !== 'admin' || !payload.sub) {
        throw new UnauthorizedException('无效的管理员登录凭证');
      }
      const admin = await this.adminAuthService.validateAdmin(payload.sub);
      req.admin = this.adminAuthService.toSafeAdmin(admin);
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('管理员登录已过期或无效');
    }
  }

  private extractToken(req: RequestLike): string | null {
    const authorization = req.headers?.authorization;
    const value = Array.isArray(authorization) ? authorization[0] : authorization;
    if (!value) return null;
    const [type, token] = value.split(' ');
    return type === 'Bearer' && token ? token : null;
  }
}
