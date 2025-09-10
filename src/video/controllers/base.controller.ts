import { Controller, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

/**
 * 控制器基类
 * 提供统一的响应格式、异常处理和常用功能
 */
export abstract class BaseController {
  /**
   * 成功响应
   * @param data 数据
   * @param message 消息
   * @param code 状态码
   */
  protected success<T = any>(
    data: T,
    message: string | null = null,
    code: number = 200
  ): ApiResponse<T> {
    return {
      code,
      data,
      message,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 错误响应
   * @param message 错误消息
   * @param code 错误码
   * @param status HTTP状态码
   */
  protected error(
    message: string = 'error',
    code: number = 500,
    status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR
  ): ApiResponse<null> {
    throw new HttpException({
      code,
      data: null,
      message,
      timestamp: new Date().toISOString()
    }, status);
  }

  /**
   * 分页响应
   * @param data 数据列表
   * @param total 总条数
   * @param page 当前页
   * @param size 每页大小
   * @param message 消息
   */
  protected paginatedSuccess<T = any>(
    data: T[],
    total: number,
    page: number,
    size: number,
    message: string | null = null
  ): PaginatedApiResponse<T> {
    return {
      code: 200,
      data: {
        list: data,
        total,
        page,
        size,
        hasMore: total > page * size
      },
      message,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 设置缓存头
   * @param res Response对象
   * @param ttl 缓存时间（秒）
   */
  protected setCacheHeaders(res: Response, ttl: number = 300): void {
    res.setHeader('Cache-Control', `public, max-age=${ttl}`);
    res.setHeader('X-Cache-TTL', ttl.toString());
  }

  /**
   * 设置不缓存头
   * @param res Response对象
   */
  protected setNoCacheHeaders(res: Response): void {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  /**
   * 标准化分页参数
   * @param page 页码
   * @param size 每页大小
   * @param maxSize 最大每页大小
   */
  protected normalizePagination(
    page: any,
    size: any,
    maxSize: number = 50
  ): { page: number; size: number } {
    const pageNum = Math.max(1, parseInt(page?.toString() || '1', 10));
    const pageSize = Math.min(
      maxSize,
      Math.max(1, parseInt(size?.toString() || '20', 10))
    );

    return { page: pageNum, size: pageSize };
  }

  /**
   * 验证ID参数
   * @param id ID值
   * @param fieldName 字段名
   */
  protected validateId(id: any, fieldName: string = 'ID'): number {
    const numId = parseInt(id?.toString(), 10);
    if (isNaN(numId) || numId <= 0) {
      this.error(`${fieldName}参数无效`, 400, HttpStatus.BAD_REQUEST);
    }
    return numId;
  }

  /**
   * 处理服务异常
   * @param error 错误对象
   * @param defaultMessage 默认错误消息
   */
  protected handleServiceError(error: any, defaultMessage: string = '操作失败'): void {
    console.error('Service Error:', error);

    if (error instanceof HttpException) {
      throw error;
    }

    // 处理数据库错误
    if (error.code === 'ER_DUP_ENTRY') {
      this.error('数据已存在', 409, HttpStatus.CONFLICT);
    }

    if (error.code === 'ER_NO_REFERENCED_ROW') {
      this.error('关联数据不存在', 404, HttpStatus.NOT_FOUND);
    }

    // 默认错误处理
    this.error(defaultMessage, 500, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * API响应接口
 */
export interface ApiResponse<T = any> {
  code: number;
  data: T;
  message: string | null;
  timestamp: string;
}

/**
 * 分页API响应接口
 */
export interface PaginatedApiResponse<T = any> extends ApiResponse {
  data: {
    list: T[];
    total: number;
    page: number;
    size: number;
    hasMore: boolean;
  };
}

/**
 * 标准返回码定义
 */
export const RetCodes = {
  SUCCESS: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
  VALIDATION_ERROR: 422
} as const;

/**
 * 标准错误消息
 */
export const ErrorMessages = {
  [RetCodes.BAD_REQUEST]: '请求参数错误',
  [RetCodes.UNAUTHORIZED]: '未授权访问',
  [RetCodes.FORBIDDEN]: '访问被拒绝',
  [RetCodes.NOT_FOUND]: '资源不存在',
  [RetCodes.CONFLICT]: '数据冲突',
  [RetCodes.INTERNAL_ERROR]: '服务器内部错误',
  [RetCodes.VALIDATION_ERROR]: '数据验证失败'
} as const;
