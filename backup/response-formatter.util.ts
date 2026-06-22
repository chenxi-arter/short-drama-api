/**
 * 统一响应格式与工具
 * 提供统一的 ApiResponse / ErrorResponse 结构及常用构造函数，
 * 用于控制器与服务层快速返回规范化的响应体。
 */
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp?: string;
  requestId?: string;
  pagination?: PaginationInfo;
}

/**
 * 分页信息
 */
export interface PaginationInfo {
  page: number;
  size: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * 错误响应格式
 */
export interface ErrorResponse {
  code: number;
  message: string;
  error?: string;
  details?: any;
  timestamp: string;
  path?: string;
  requestId?: string;
}

/**
 * 响应格式化工具类
 * - success/created/noContent：成功类响应
 * - clientError/validationError/...：错误类响应
 * - withRequestId/withPath：增强字段
 * - createPagination/formatValidationErrors：常用辅助
 */
export class ResponseFormatter {
  /**
   * 成功响应
   */
  static success<T>(data: T, message: string = '操作成功'): ApiResponse<T> {
    return {
      code: 200,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 分页成功响应
   */
  static successWithPagination<T>(
    data: T[],
    pagination: PaginationInfo,
    message: string = '获取成功'
  ): ApiResponse<T[]> {
    return {
      code: 200,
      message,
      data,
      pagination,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 创建成功响应
   */
  static created<T>(data: T, message: string = '创建成功'): ApiResponse<T> {
    return {
      code: 201,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 无内容响应
   */
  static noContent(message: string = '操作成功'): ApiResponse<null> {
    return {
      code: 204,
      message,
      data: null,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 客户端错误响应
   */
  static clientError(
    message: string = '请求错误',
    code: number = 400,
    details?: any
  ): ErrorResponse {
    return {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 验证错误响应
   */
  static validationError(
    message: string = '数据验证失败',
    details?: any
  ): ErrorResponse {
    return {
      code: 422,
      message,
      error: 'Validation Error',
      details,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 未授权响应
   */
  static unauthorized(message: string = '未授权访问'): ErrorResponse {
    return {
      code: 401,
      message,
      error: 'Unauthorized',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 禁止访问响应
   */
  static forbidden(message: string = '禁止访问'): ErrorResponse {
    return {
      code: 403,
      message,
      error: 'Forbidden',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 资源未找到响应
   */
  static notFound(message: string = '资源未找到'): ErrorResponse {
    return {
      code: 404,
      message,
      error: 'Not Found',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 请求冲突响应
   */
  static conflict(message: string = '请求冲突'): ErrorResponse {
    return {
      code: 409,
      message,
      error: 'Conflict',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 请求过于频繁响应
   */
  static tooManyRequests(message: string = '请求过于频繁'): ErrorResponse {
    return {
      code: 429,
      message,
      error: 'Too Many Requests',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 服务器错误响应
   */
  static serverError(
    message: string = '服务器内部错误',
    error?: string,
    details?: any
  ): ErrorResponse {
    return {
      code: 500,
      message,
      error: error || 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? details : undefined,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 服务不可用响应
   */
  static serviceUnavailable(message: string = '服务暂时不可用'): ErrorResponse {
    return {
      code: 503,
      message,
      error: 'Service Unavailable',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 网关超时响应
   */
  static gatewayTimeout(message: string = '网关超时'): ErrorResponse {
    return {
      code: 504,
      message,
      error: 'Gateway Timeout',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 添加请求ID到响应
   */
  static withRequestId<T extends ApiResponse | ErrorResponse>(
    response: T,
    requestId: string
  ): T {
    return {
      ...response,
      requestId,
    };
  }

  /**
   * 添加路径信息到错误响应
   */
  static withPath(response: ErrorResponse, path: string): ErrorResponse {
    return {
      ...response,
      path,
    };
  }

  /**
   * 创建分页信息
   */
  static createPagination(
    page: number,
    size: number,
    total: number
  ): PaginationInfo {
    const totalPages = Math.ceil(total / size);
    
    return {
      page,
      size,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  /**
   * 格式化验证错误详情
   */
  static formatValidationErrors(errors: any[]): any {
    const formatted: Record<string, string[]> = {};
    
    errors.forEach(error => {
      const property = error.property;
      const constraints = error.constraints || {};
      
      formatted[property] = Object.values(constraints);
    });
    
    return formatted;
  }

  /**
   * 检查是否为成功响应
   */
  static isSuccess(response: ApiResponse | ErrorResponse): response is ApiResponse {
    return response.code >= 200 && response.code < 300;
  }

  /**
   * 检查是否为错误响应
   */
  static isError(response: ApiResponse | ErrorResponse): response is ErrorResponse {
    return response.code >= 400;
  }

  /**
   * 获取响应状态文本
   */
  static getStatusText(code: number): string {
    const statusTexts: Record<number, string> = {
      200: 'OK',
      201: 'Created',
      204: 'No Content',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      503: 'Service Unavailable',
      504: 'Gateway Timeout',
    };
    
    return statusTexts[code] || 'Unknown Status';
  }
}

/**
 * 响应装饰器工厂
 */
export function ApiResponseDecorator(description?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      try {
        const result = await originalMethod.apply(this, args);
        
        // 如果结果已经是格式化的响应，直接返回
        if (result && typeof result === 'object' && 'code' in result) {
          return result;
        }
        
        // 否则包装为成功响应
        return ResponseFormatter.success(result, description || '操作成功');
      } catch (error) {
        // 如果是已知的HTTP异常，直接抛出
        if (error instanceof Error && 'status' in error) {
          throw error;
        }
        
        // 否则包装为服务器错误
        throw ResponseFormatter.serverError(
          '操作失败',
          error instanceof Error ? error.message : String(error)
        );
      }
    };
    
    return descriptor;
  };
}