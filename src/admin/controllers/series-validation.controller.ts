import { Controller, Get, Query, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Series } from '../../video/entity/series.entity';
import { Episode } from '../../video/entity/episode.entity';

/**
 * 系列数据验证控制器
 * 用于检测系列中的数据问题（如缺集）
 */
@Controller('admin/series/validation')
export class SeriesValidationController {
  constructor(
    @InjectRepository(Series)
    private readonly seriesRepo: Repository<Series>,
    @InjectRepository(Episode)
    private readonly episodeRepo: Repository<Episode>,
  ) {}

  /**
   * 检查所有系列的集数是否连续
   * GET /api/admin/series/validation/check-missing-episodes
   */
  @Get('check-missing-episodes')
  async checkMissingEpisodes(
    @Query('seriesId') seriesId?: number,
    @Query('limit') limit?: number,
    @Query('checkAll') checkAll?: string,
  ) {
    try {
      // 默认检查全部系列；如果指定limit则使用limit
      const queryLimit = limit 
        ? Math.min(Number(limit), 10000)
        : (checkAll === 'false' ? 100 : 999999);
      
      // 获取系列列表
      let seriesQuery = this.seriesRepo
        .createQueryBuilder('s')
        .where('s.is_active = :isActive', { isActive: 1 });
      
      if (seriesId) {
        seriesQuery = seriesQuery.andWhere('s.id = :seriesId', { seriesId });
      }
      
      const seriesList = await seriesQuery
        .orderBy('s.id', 'DESC')
        .limit(queryLimit)
        .getMany();

      const results: any[] = [];

      for (const series of seriesList) {
        // 获取该系列的所有剧集
        const episodes = await this.episodeRepo
          .createQueryBuilder('e')
          .select(['e.id', 'e.episode_number', 'e.title', 'e.status'])
          .where('e.series_id = :seriesId', { seriesId: series.id })
          .orderBy('e.episode_number', 'ASC')
          .getMany();

        if (episodes.length === 0) {
          // 没有剧集的系列
          results.push({
            seriesId: series.id,
            seriesTitle: series.title,
            seriesShortId: series.shortId,
            totalEpisodes: 0,
            missingEpisodes: [],
            status: 'NO_EPISODES',
            message: '该系列没有任何剧集',
          });
          continue;
        }

        // 检查集数是否连续
        const episodeNumbers = episodes.map(ep => ep.episodeNumber).sort((a, b) => a - b);
        const maxEpisode = Math.max(...episodeNumbers);
        const missingEpisodes: number[] = [];

        // 检查从1到最大集数之间是否有缺失
        for (let i = 1; i <= maxEpisode; i++) {
          if (!episodeNumbers.includes(i)) {
            missingEpisodes.push(i);
          }
        }

        // 检查是否有重复集数
        const duplicates = episodeNumbers.filter((num, index) => 
          episodeNumbers.indexOf(num) !== index
        );
        const uniqueDuplicates = [...new Set(duplicates)].filter(num => num != null);

        // 只记录有问题的系列
        if (missingEpisodes.length > 0 || uniqueDuplicates.length > 0) {
          results.push({
            seriesId: series.id,
            seriesTitle: series.title,
            seriesShortId: series.shortId,
            totalEpisodes: episodes.length,
            expectedEpisodes: maxEpisode,
            missingEpisodes,
            duplicateEpisodes: uniqueDuplicates,
            status: 'HAS_ISSUES',
            issues: {
              hasMissing: missingEpisodes.length > 0,
              hasDuplicates: uniqueDuplicates.length > 0,
              missingCount: missingEpisodes.length,
              duplicateCount: uniqueDuplicates.length,
            },
          });
        }
      }

      return {
        success: true,
        data: {
          total: results.length,
          checkedSeries: seriesList.length,
          items: results,
        },
        message: results.length > 0 
          ? `发现 ${results.length} 个系列存在集数问题` 
          : '所有系列集数连续，无问题',
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('检查缺集失败:', error);
      return {
        success: false,
        data: null,
        message: error?.message || '检查失败',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取单个系列的详细集数信息
   * GET /api/admin/series/validation/episodes/:seriesId
   */
  @Get('episodes/:seriesId')
  async getSeriesEpisodeDetails(
    @Param('seriesId') seriesId: number,
  ) {
    try {
      const series = await this.seriesRepo.findOne({
        where: { id: seriesId },
      });

      if (!series) {
        return {
          success: false,
          data: null,
          message: '系列不存在',
        };
      }

      const episodes = await this.episodeRepo
        .createQueryBuilder('e')
        .where('e.series_id = :seriesId', { seriesId })
        .orderBy('e.episode_number', 'ASC')
        .getMany();

      const episodeNumbers = episodes.map(ep => ep.episodeNumber).sort((a, b) => a - b);
      const maxEpisode = episodeNumbers.length > 0 ? Math.max(...episodeNumbers) : 0;
      const missingEpisodes: number[] = [];

      // 检查缺失
      for (let i = 1; i <= maxEpisode; i++) {
        if (!episodeNumbers.includes(i)) {
          missingEpisodes.push(i);
        }
      }

      // 检查重复
      const episodeMap = new Map();
      episodes.forEach(ep => {
        if (!episodeMap.has(ep.episodeNumber)) {
          episodeMap.set(ep.episodeNumber, []);
        }
        episodeMap.get(ep.episodeNumber).push({
          id: ep.id,
          shortId: ep.shortId,
          title: ep.title,
          status: ep.status,
        });
      });

      const duplicates: any[] = [];
      episodeMap.forEach((eps: any, num: number) => {
        if (eps?.length > 1) {
          duplicates.push({
            episodeNumber: num,
            count: eps.length,
            episodes: eps,
          });
        }
      });

      return {
        success: true,
        data: {
          series: {
            id: series.id,
            shortId: series.shortId,
            title: series.title,
            totalEpisodes: episodes.length,
            isCompleted: series.isCompleted,
          },
          episodes: episodes.map(ep => ({
            id: ep.id,
            shortId: ep.shortId,
            episodeNumber: ep.episodeNumber,
            title: ep.title,
            status: ep.status,
            duration: ep.duration,
          })),
          validation: {
            expectedCount: maxEpisode,
            actualCount: episodes.length,
            isContinuous: missingEpisodes.length === 0 && duplicates.length === 0,
            missingEpisodes,
            duplicates,
          },
        },
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error?.message || '获取失败',
      };
    }
  }

  /**
   * 检测重复系列名
   * GET /api/admin/series/validation/check-duplicate-names
   */
  @Get('check-duplicate-names')
  async checkDuplicateNames(
    @Query('checkAll') checkAll?: string,
    @Query('limit') limit?: number,
  ) {
    try {
      // 默认检查全部系列；如果指定limit则使用limit
      const queryLimit = limit 
        ? Math.min(Number(limit), 10000)
        : (checkAll === 'false' ? 100 : 999999);

      // 查询所有活跃系列
      const seriesList = await this.seriesRepo
        .createQueryBuilder('s')
        .select(['s.id', 's.title', 's.shortId', 's.externalId', 's.createdAt'])
        .where('s.is_active = :isActive', { isActive: 1 })
        .orderBy('s.id', 'DESC')
        .limit(queryLimit)
        .getMany();

      // 按标题分组，找出重复的
      const titleMap = new Map<string, any[]>();
      
      seriesList.forEach(series => {
        const title = series.title.trim();
        if (!titleMap.has(title)) {
          titleMap.set(title, []);
        }
        titleMap.get(title)?.push({
          id: series.id,
          shortId: series.shortId,
          title: series.title,
          externalId: series.externalId,
          createdAt: series.createdAt,
        });
      });

      // 找出重复的系列名
      const duplicates: any[] = [];
      titleMap.forEach((seriesArray, title) => {
        if (seriesArray.length > 1) {
          duplicates.push({
            title,
            count: seriesArray.length,
            series: seriesArray.sort((a, b) => 
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            ),
          });
        }
      });

      // 按重复数量排序
      duplicates.sort((a, b) => b.count - a.count);

      return {
        success: true,
        data: {
          total: duplicates.length,
          checkedSeries: seriesList.length,
          totalDuplicateCount: duplicates.reduce((sum, item) => sum + item.count, 0),
          items: duplicates,
        },
        message: duplicates.length > 0 
          ? `发现 ${duplicates.length} 个重复的系列名` 
          : '未发现重复系列名',
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('检查重复系列名失败:', error);
      return {
        success: false,
        data: null,
        message: error?.message || '检查失败',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 检测重复外部ID
   * GET /api/admin/series/validation/check-duplicate-external-ids
   */
  @Get('check-duplicate-external-ids')
  async checkDuplicateExternalIds(
    @Query('checkAll') checkAll?: string,
    @Query('limit') limit?: number,
  ) {
    try {
      // 默认检查全部系列；如果指定limit则使用limit
      const queryLimit = limit 
        ? Math.min(Number(limit), 10000)
        : (checkAll === 'false' ? 100 : 999999);

      // 查询有外部ID的系列
      const seriesList = await this.seriesRepo
        .createQueryBuilder('s')
        .select(['s.id', 's.title', 's.shortId', 's.externalId', 's.createdAt'])
        .where('s.is_active = :isActive', { isActive: 1 })
        .andWhere('s.external_id IS NOT NULL')
        .andWhere('s.external_id != :empty', { empty: '' })
        .orderBy('s.id', 'DESC')
        .limit(queryLimit)
        .getMany();

      // 按外部ID分组
      const externalIdMap = new Map<string, any[]>();
      
      seriesList.forEach(series => {
        const extId = series.externalId;
        if (extId) {
          if (!externalIdMap.has(extId)) {
            externalIdMap.set(extId, []);
          }
          externalIdMap.get(extId)?.push({
            id: series.id,
            shortId: series.shortId,
            title: series.title,
            externalId: series.externalId,
            createdAt: series.createdAt,
          });
        }
      });

      // 找出重复的外部ID
      const duplicates: any[] = [];
      externalIdMap.forEach((seriesArray, externalId) => {
        if (seriesArray.length > 1) {
          duplicates.push({
            externalId,
            count: seriesArray.length,
            series: seriesArray.sort((a, b) => 
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            ),
          });
        }
      });

      duplicates.sort((a, b) => b.count - a.count);

      return {
        success: true,
        data: {
          total: duplicates.length,
          checkedSeries: seriesList.length,
          totalDuplicateCount: duplicates.reduce((sum, item) => sum + item.count, 0),
          items: duplicates,
        },
        message: duplicates.length > 0 
          ? `发现 ${duplicates.length} 个重复的外部ID` 
          : '未发现重复外部ID',
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('检查重复外部ID失败:', error);
      return {
        success: false,
        data: null,
        message: error?.message || '检查失败',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取统计信息
   * GET /api/admin/series/validation/stats
   */
  @Get('stats')
  async getValidationStats() {
    try {
      // 总系列数
      const totalSeries = await this.seriesRepo.count({
        where: { isActive: 1 },
      });

      // 无剧集的系列
      const seriesWithoutEpisodes = await this.seriesRepo
        .createQueryBuilder('s')
        .leftJoin('s.episodes', 'e')
        .where('s.is_active = :isActive', { isActive: 1 })
        .groupBy('s.id')
        .having('COUNT(e.id) = 0')
        .getCount();

      // 快速抽样检查（前100个系列）
      const sampleSize = Math.min(100, totalSeries);
      const seriesSample = await this.seriesRepo
        .createQueryBuilder('s')
        .where('s.is_active = :isActive', { isActive: 1 })
        .limit(sampleSize)
        .getMany();

      let seriesWithIssues = 0;
      for (const series of seriesSample) {
        const episodes = await this.episodeRepo.find({
          where: { seriesId: series.id },
          select: ['episodeNumber'],
        });

        if (episodes.length > 0) {
          const numbers = episodes.map(e => e.episodeNumber).sort((a, b) => a - b);
          const max = Math.max(...numbers);
          
          // 检查是否有缺集
          for (let i = 1; i <= max; i++) {
            if (!numbers.includes(i)) {
              seriesWithIssues++;
              break;
            }
          }
        }
      }

      // 估算总问题数
      const estimatedIssues = Math.round((seriesWithIssues / sampleSize) * totalSeries);

      return {
        success: true,
        data: {
          totalSeries,
          seriesWithoutEpisodes,
          sampleSize,
          issuesInSample: seriesWithIssues,
          estimatedTotalIssues: estimatedIssues,
          estimatedIssueRate: `${((seriesWithIssues / sampleSize) * 100).toFixed(1)}%`,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error?.message || '获取统计失败',
      };
    }
  }
}

