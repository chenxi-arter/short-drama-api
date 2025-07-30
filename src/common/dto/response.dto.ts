/**
 * 通用API响应接口
 */
export interface ApiResponse<T = any> {
  code: number;
  data?: T;
  message?: string;
  timestamp?: string;
  path?: string;
}

/**
 * 分页信息接口
 */
export interface PaginationInfo {
  total: number;
  page: number;
  size: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * 分页响应接口
 */
export interface PaginatedResponse<T = any> {
  code: number;
  data: T[];
  pagination: PaginationInfo;
  message?: string;
  timestamp?: string;
}

/**
 * 分页查询结果接口
 */
export interface PaginatedResult<T = any> {
  data: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

/**
 * 统一响应包装器
 */
export class ResponseWrapper {
  /**
   * 成功响应
   */
  static success<T>(data: T, message = 'success'): ApiResponse<T> {
    return {
      code: 200,
      data,
      message,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 分页响应
   */
  static paginated<T>(
    data: T[],
    total: number,
    page: number,
    size: number,
    message = 'success'
  ): PaginatedResponse<T> {
    const totalPages = Math.ceil(total / size);
    
    return {
      code: 200,
      data,
      pagination: {
        total,
        page,
        size,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      message,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 错误响应
   */
  static error(message: string, code = 400): ApiResponse<null> {
    return {
      code,
      data: null,
      message,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 创建响应（兼容旧格式）
   */
  static create<T>(data: T, code = 200, msg: string | null = null): any {
    return {
      data,
      code,
      msg,
    };
  }
}