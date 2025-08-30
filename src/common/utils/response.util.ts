export interface ApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
  success: boolean;
  timestamp: number;
}

export interface PageResult<T = any> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export class ResponseUtil {
  static success<T>(data: T, message = '操作成功'): ApiResponse<T> {
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
  ): ApiResponse<PageResult<T>> {
    const hasMore = total > page * pageSize;
    return this.success(
      { items, total, page, pageSize, hasMore },
      message
    );
  }

  static error(message = '操作失败', code = 400): ApiResponse<null> {
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
  ): ApiResponse<{ list: T[]; total: number; page: number; size: number; hasMore: boolean }> {
    const hasMore = total > page * pageSize;
    return this.success(
      { list: items, total, page, size: pageSize, hasMore },
      message
    );
  }

  static validationError(errors: any, message = '参数验证失败', code = 422): ApiResponse<{ errors: any }> {
    return {
      code,
      data: { errors },
      message,
      success: false,
      timestamp: Date.now(),
    };
  }
}


