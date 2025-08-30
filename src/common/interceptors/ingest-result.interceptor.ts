import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, catchError, map, of } from 'rxjs';
import { ResponseUtil } from '../utils/response.util';
import { IngestResponseData, IngestItem } from '../types/ingest-result';

/**
 * IngestResultInterceptor
 * 将控制器返回的单条/批量结果统一包装为 { summary, items } 结构，并始终使用 ResponseUtil.success 包裹。
 *
 * 行为：
 * - 控制器直接返回 {summary, items} 则透传（仅统一外层结构）
 * - 控制器返回单条成功项（含 seriesId）时，自动包成 1 条 items
 * - 捕获抛出的异常，转为 1 条失败 items（statusCode+error+details）
 *
 * 用法：
 *   在控制器方法上添加 @UseInterceptors(IngestResultInterceptor)
 */
@Injectable()
export class IngestResultInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data: IngestResponseData | IngestItem | any) => {
        // 如果已经是标准结构，直接返回
        if (data && data.summary && Array.isArray(data.items)) {
          return ResponseUtil.success(data, '系列采集写入完成');
        }
        // 单条成功项 -> 包装
        if (data && data.seriesId) {
          const item: IngestItem = {
            statusCode: 200,
            seriesId: data.seriesId,
            shortId: data.shortId ?? null,
            externalId: data.externalId ?? null,
            action: data.action ?? 'updated',
          } as any;
          const wrapped: IngestResponseData = {
            summary: {
              created: data.action === 'created' ? 1 : 0,
              updated: data.action === 'updated' ? 1 : 0,
              failed: 0,
              total: 1,
            },
            items: [item],
          };
          return ResponseUtil.success(wrapped, '系列采集写入完成');
        }
        return ResponseUtil.success(data, '系列采集写入完成');
      }),
      catchError((err) => {
        const status = err?.status || 400;
        const error = err?.response?.message || err?.message || 'unknown error';
        const details = err?.response?.details;
        const item: IngestItem = { statusCode: status, error, details } as any;
        const wrapped: IngestResponseData = {
          summary: { created: 0, updated: 0, failed: 1, total: 1 },
          items: [item],
        };
        return of(ResponseUtil.success(wrapped, '系列采集写入完成'));
      })
    );
  }
}


