import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * 可选的JWT认证Guard
 * 如果请求带有有效的JWT token，则会在request中设置user
 * 如果没有token或token无效，则继续执行但不设置user（不抛出异常）
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // 即使没有用户或有错误，也返回用户（可能是undefined）
    // 不抛出异常，允许请求继续
    return user;
  }
}

