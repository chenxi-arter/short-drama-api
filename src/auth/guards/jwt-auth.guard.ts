// src/auth/guards/jwt-auth.guard.ts
import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DauService } from '../../admin/services/dau.service';
import { UserOperationLogService } from '../../user/services/user-operation-log.service';

type JwtGuardUser = { id?: number | string };
type JwtGuardInfo = { name?: string };
type HttpRequestLike = {
  method?: string;
  originalUrl?: string;
  url?: string;
  ip?: string;
  connection?: { remoteAddress?: string };
  socket?: { remoteAddress?: string };
  get(name: string): string | undefined;
  headers?: Record<string, string | string[] | undefined>;
};

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly dauService: DauService,
    private readonly operationLogService: UserOperationLogService,
  ) {
    super();
  }

  handleRequest<TUser = any>(
    err: unknown,
    user: JwtGuardUser | undefined,
    info: JwtGuardInfo | undefined,
    context: ExecutionContext,
  ): TUser {
    if (err || !user) {
      throw new UnauthorizedException(
        info?.name === 'TokenExpiredError'
          ? '登录信息已过期'
          : '登录信息无效或已过期',
      );
    }

    const req = context.switchToHttp().getRequest<HttpRequestLike>();
    const ua = req?.get('user-agent') || '';
    const banned = /bot|crawler|spider|scrapy/i;
    if (banned.test(ua)) {
      throw new UnauthorizedException('拒绝访问');
    }

    const userId = typeof user.id === 'number' ? user.id : Number(user.id);
    if (Number.isFinite(userId) && userId > 0) {
      void this.dauService.trackUser(userId);
      void this.operationLogService.record({
        userId,
        method: req?.method || 'UNKNOWN',
        path: req?.originalUrl || req?.url || '',
        action: `${req?.method || 'UNKNOWN'} ${req?.originalUrl || req?.url || ''}`.trim(),
        ipAddress: this.getClientIp(req),
        userAgent: ua,
      });
    }

    return user as TUser;
  }

  private getClientIp(req?: HttpRequestLike): string | null {
    if (!req) return null;
    const forwardedFor = req.headers?.['x-forwarded-for'];
    if (Array.isArray(forwardedFor)) return forwardedFor[0]?.split(',')[0]?.trim() || null;
    if (typeof forwardedFor === 'string') return forwardedFor.split(',')[0]?.trim() || null;
    return req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || null;
  }
}
