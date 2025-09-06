import { Body, Controller, Get, Param, Post, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { IngestResultInterceptor } from '../../common/interceptors/ingest-result.interceptor';
import { ValidationToItemsPipe } from '../../common/pipes/validation-to-items.pipe';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { IngestService } from '../services/ingest.service';
import { IngestSeriesDto } from '../dto/ingest-series.dto';
import { UpdateIngestSeriesDto } from '../dto/update-ingest-series.dto';
import { ResponseUtil } from '../../common/utils/response.util';

@Controller('admin/ingest')
export class IngestController {
  constructor(private readonly ingestService: IngestService) {}

  /**
   * 单个系列的采集入库
   */
  @Post('series')
  @UseInterceptors(IngestResultInterceptor)
  async ingestSeries(@Body(new ValidationToItemsPipe()) dto: IngestSeriesDto) {
    return this.ingestService.upsertSeries(dto);
  }

  /**
   * 批量系列入库
   */
  @Post('series/batch')
  @UseInterceptors(IngestResultInterceptor)
  async ingestSeriesBatch(@Body() payload: { items: IngestSeriesDto[] }) {
    const results: Array<{ statusCode?: number; seriesId?: number; shortId?: string | null; action?: 'created' | 'updated'; error?: string; details?: any; externalId?: string | null; title?: string }> = [];
    let createdCount = 0;
    let updatedCount = 0;
    let failedCount = 0;

    for (const item of payload.items || []) {
      // 先对每一项做显式校验，确保能返回 details 给前端
      const dtoInstance = plainToInstance(IngestSeriesDto, item);
      const errors = await validate(dtoInstance, { whitelist: false, forbidNonWhitelisted: false });
      if (errors.length) {
        failedCount++;
        const details = errors.map((e: any) => ({ property: e.property, constraints: e.constraints, children: e.children?.length ? e.children : undefined }));
        results.push({ statusCode: 400, error: '参数验证失败', details, externalId: item.externalId, title: item.title });
        continue;
      }
      try {
        const res = await this.ingestService.upsertSeries(item);
        results.push({ statusCode: 200, seriesId: res.seriesId, shortId: res.shortId, action: res.action, externalId: res.externalId, title: item.title });
        if (res.action === 'created') createdCount++;
        if (res.action === 'updated') updatedCount++;
      } catch (e: any) {
        failedCount++;
        results.push({ statusCode: e?.status || 400, error: e?.response?.message || e?.message || 'unknown error', details: e?.response?.details, externalId: item.externalId, title: item.title });
      }
    }

    return ResponseUtil.success({
      summary: { created: createdCount, updated: updatedCount, failed: failedCount, total: (payload.items || []).length },
      items: results
    }, '批量系列采集写入完成');
  }

  /**
   * 更新已有系列（按 externalId）
   */
  @Post('series/update')
  @UseInterceptors(IngestResultInterceptor)
  async updateSeries(@Body(new ValidationToItemsPipe()) dto: UpdateIngestSeriesDto) {
    return this.ingestService.updateSeries(dto);
  }

  /**
   * 查询系列进度（按 externalId）
   * 返回 upCount / upStatus / totalEpisodes / isCompleted
   */
  @Get('series/progress/:externalId')
  async getSeriesProgress(@Param('externalId') externalId: string) {
    try {
      const data = await this.ingestService.getSeriesProgressByExternalId(externalId);
      return ResponseUtil.success(data, '系列进度获取成功');
    } catch (e: any) {
      const status = e?.status || 400;
      const message = e?.response?.message || e?.message || 'unknown error';
      return ResponseUtil.error(message, status);
    }
  }
}


