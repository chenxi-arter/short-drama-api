import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform, ValidationPipe } from '@nestjs/common';

/**
 * ValidationToItemsPipe
 * 基于 Nest 内置 ValidationPipe，输出统一的校验错误结构：
 *   { message: '参数验证失败', details: [...class-validator 错误映射...] }
 *
 * 适用场景：
 * - Ingest 等需要将校验错误下沉到 items[].details 的接口
 * - 作为 @Body(new ValidationToItemsPipe()) 使用，替代手写 plainToInstance/validate
 */

@Injectable()
export class ValidationToItemsPipe extends ValidationPipe implements PipeTransform<any> {
  constructor() {
    super({ transform: true, whitelist: false, forbidNonWhitelisted: false });
  }

  override createExceptionFactory() {
    return (errors: any[]) => {
      const details = errors.map((e: any) => ({
        property: e.property,
        constraints: e.constraints,
        children: e.children?.length ? e.children : undefined,
      }));
      return new BadRequestException({ message: '参数验证失败', details });
    };
  }
}


