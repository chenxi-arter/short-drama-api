import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AdminJwtAuthGuard } from '../../admin/guards/admin-jwt-auth.guard';

/**
 * 「用户 token 或管理员 token 都认」的复合守卫
 *
 * 背景：管理员 token 用独立的 ADMIN_JWT_SECRET 签名，用户级 JwtAuthGuard 验不过。
 * 某些接口（如创建短链）既会被 H5/App 的登录用户调用，也会被管理后台调用，
 * 于是需要「任一身份通过即可」，但匿名仍然拦住。
 *
 * 校验顺序：先按管理员校验（失败静默），再按用户校验（失败抛出 401）。
 * 注意：管理员校验失败的原因（过期/无效/账号停用）不单独暴露，统一走最后的 401。
 */
@Injectable()
export class JwtOrAdminGuard implements CanActivate {
  constructor(
    private readonly userGuard: JwtAuthGuard,
    private readonly adminGuard: AdminJwtAuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      if (await this.adminGuard.canActivate(context)) {
        return true;
      }
    } catch {
      // 不是管理员 token，落到用户 token 校验
    }

    // CanActivate 的返回类型是 boolean | Promise<boolean> | Observable<boolean>，
    // 这里 JwtAuthGuard 走的是 Promise 分支，await 后即为 boolean
    return (await this.userGuard.canActivate(context)) as unknown as boolean;

  }
}
