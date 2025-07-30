import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ValidationError } from 'class-validator';

/**
 * 全局异常过滤器
 * 统一处理所有异常，返回标准化的错误响应
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = this.getHttpStatus(exception);
    const errorResponse = this.buildErrorResponse(exception, request, status);

    // 记录错误日志
    this.logError(exception, request, status);

    response.status(status).json(errorResponse);
  }

  /**
   * 获取HTTP状态码
   */
  private getHttpStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  /**
   * 构建错误响应
   */
  private buildErrorResponse(exception: unknown, request: Request, status: number) {
    const baseResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      
      if (typeof response === 'object' && response !== null) {
        return {
          ...baseResponse,
          ...response,
        };
      }
      
      return {
        ...baseResponse,
        message: response,
        error: this.getErrorType(status),
      };
    }

    // 处理验证错误
    if (this.isValidationError(exception)) {
      return {
        ...baseResponse,
        message: '请求参数验证失败',
        errors: this.extractValidationErrors(exception),
        error: 'Bad Request',
      };
    }

    // 处理未知错误
    return {
      ...baseResponse,
      message: '服务器内部错误',
      error: 'Internal Server Error',
    };
  }

  /**
   * 获取错误类型
   */
  private getErrorType(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'Bad Request';
      case HttpStatus.UNAUTHORIZED:
        return 'Unauthorized';
      case HttpStatus.FORBIDDEN:
        return 'Forbidden';
      case HttpStatus.NOT_FOUND:
        return 'Not Found';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'Too Many Requests';
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'Internal Server Error';
      default:
        return 'Unknown Error';
    }
  }

  /**
   * 检查是否为验证错误
   */
  private isValidationError(exception: unknown): exception is ValidationError[] {
    return Array.isArray(exception) && 
           exception.every(error => error instanceof ValidationError);
  }

  /**
   * 提取验证错误信息
   */
  private extractValidationErrors(exception: ValidationError[]): any[] {
    return exception.map(error => ({
      property: error.property,
      value: error.value,
      constraints: error.constraints,
    }));
  }

  /**
   * 记录错误日志
   */
  private logError(exception: unknown, request: Request, status: number) {
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    
    const logMessage = `${method} ${url} - ${status} - ${ip} - ${userAgent}`;
    
    if (status >= 500) {
      this.logger.error(logMessage, exception instanceof Error ? exception.stack : exception);
    } else if (status >= 400) {
      this.logger.warn(logMessage);
    }
  }
}