// src/auth/guards/jwt-auth.guard.ts
import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // 1. JWT 校验
    if (err || !user) {
      throw new UnauthorizedException(
        info?.name === 'TokenExpiredError'
          ? '登录信息已过期'
          : '登录信息无效或已过期',
      );
    }

    // 2. 安全防护：拒绝常见自动化工具 UA
    const req = context.switchToHttp().getRequest();
    const ua = req.get('user-agent') || '';
    const banned = /bot|crawler|spider|scrapy/i;
    if (banned.test(ua)) {
      throw new UnauthorizedException('拒绝访问');
    }

    return user;
  }
}