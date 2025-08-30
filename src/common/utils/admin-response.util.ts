export interface AdminResponse<T = any> {
  code: number;
  data: T;
  message: string;
  success: boolean;
  timestamp: number;
}

export interface AdminPageResult<T = any> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * AdminResponseUtil
 * 后台管理接口通用响应封装：
 * - success/pageSuccess/listSuccess：成功结构（带分页/列表）
 * - error/validationError：错误结构（统一 code/message/时间戳）
 */
export class AdminResponseUtil {
  static success<T>(data: T, message = '操作成功'): AdminResponse<T> {
    return {
      code: 200,
      data,
      message,
      success: true,
      timestamp: Date.now(),
    };
  }

  static pageSuccess<T>(
    items: T[],
    total: number,
    page: number,
    pageSize: number,
    message = '获取成功'
  ): AdminResponse<AdminPageResult<T>> {
    const hasMore = total > page * pageSize;
    return this.success(
      { items, total, page, pageSize, hasMore },
      message
    );
  }

  static error(message = '操作失败', code = 400): AdminResponse<null> {
    return {
      code,
      data: null,
      message,
      success: false,
      timestamp: Date.now(),
    };
  }

  static listSuccess<T>(
    items: T[],
    total: number,
    page: number,
    pageSize: number,
    message = '获取成功'
  ): AdminResponse<{ list: T[]; total: number; page: number; size: number; hasMore: boolean }> {
    const hasMore = total > page * pageSize;
    return this.success(
      { list: items, total, page, size: pageSize, hasMore },
      message
    );
  }

  static validationError(errors: any, message = '参数验证失败', code = 422): AdminResponse<{ errors: any }> {
    return {
      code,
      data: { errors },
      message,
      success: false,
      timestamp: Date.now(),
    };
  }
}


