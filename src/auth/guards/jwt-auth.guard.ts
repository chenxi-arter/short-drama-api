// src/auth/guards/jwt-auth.guard.ts
import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DauService } from '../../admin/services/dau.service';

type JwtGuardUser = { id?: number | string };
type JwtGuardInfo = { name?: string };
type HttpRequestLike = {
  get(name: string): string | undefined;
};

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly dauService: DauService,
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
    }

    return user as TUser;
  }
}
