// src/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { verify } from 'jsonwebtoken';
import { assertStrongSecret, optionalSecret } from '../../common/utils/security-env.util';

const strategyLogger = new Logger('JwtStrategy');

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const newSecret = assertStrongSecret('JWT_SECRET', configService.get<string>('JWT_SECRET'));
    // 过渡期旧密钥：只认显式配置，代码里不再写死 'very-secret-key'
    const legacySecret = optionalSecret(
      'JWT_SECRET_LEGACY',
      configService.get<string>('JWT_SECRET_LEGACY'),
    );

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      /**
       * 这里只负责「选哪把密钥」，真正的验签与 validate() 仍交给 passport-jwt 完成。
       *
       * ⚠️ 不要覆写 authenticate() 去直接调 this.success(payload)：
       * 那样会绕过 passport-jwt 的 this._verify 回调，validate() 不再执行，
       * req.user 会退化成原始 payload（{sub,iat,exp}），
       * 全站依赖 req.user.userId 的接口都会拿到 undefined。
       */
      secretOrKeyProvider: (
        _request: unknown,
        rawJwtToken: string,
        done: (err: Error | null, secretOrKey?: string) => void,
      ) => {
        if (!legacySecret) {
          return done(null, newSecret);
        }

        try {
          verify(rawJwtToken, newSecret);
          return done(null, newSecret);
        } catch {
          try {
            verify(rawJwtToken, legacySecret);
            strategyLogger.warn('检测到使用过渡期旧密钥签发的 token，请尽快完成迁移');
            return done(null, legacySecret);
          } catch {
            // 交给 passport-jwt 按新密钥再校验一次，以便返回准确的过期/无效原因
            return done(null, newSecret);
          }
        }
      },
    });
  }

  async validate(payload: any) {
    if (!payload?.sub) {
      throw new UnauthorizedException('登录信息无效或已过期');
    }
    // 将 sub 从字符串转为数字（兼容之前的 snowflake ID 字符串格式）
    const userId = typeof payload.sub === 'string' ? parseInt(payload.sub, 10) : payload.sub;
    if (!Number.isFinite(userId) || userId <= 0) {
      throw new UnauthorizedException('登录信息无效或已过期');
    }
    return { userId };
  }
}
