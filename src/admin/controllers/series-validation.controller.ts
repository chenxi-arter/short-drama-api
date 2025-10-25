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
  ) {
    try {
      // 获取系列列表（扫描所有活跃系列）
      let seriesQuery = this.seriesRepo
        .createQueryBuilder('s')
        .where('s.is_active = :isActive', { isActive: 1 });
      
      if (seriesId) {
        seriesQuery = seriesQuery.andWhere('s.id = :seriesId', { seriesId });
      }
      
      const seriesList = await seriesQuery
        .orderBy('s.id', 'DESC')
        .getMany();

      const results: any[] = [];

      for (const series of seriesList) {
        // 获取该系列的所有剧集
        const episodes = await this.episodeRepo
          .find({
            where: { seriesId: series.id },
            order: { episodeNumber: 'ASC' },
          });

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
        const episodeNumbers = episodes.map(ep => ep.episodeNumber).filter(n => n != null).sort((a, b) => a - b);
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
  async checkDuplicateNames() {
    try {
      // 查询所有活跃系列（扫描全部）
      const seriesList = await this.seriesRepo
        .createQueryBuilder('s')
        .select(['s.id', 's.title', 's.shortId', 's.externalId', 's.createdAt'])
        .where('s.is_active = :isActive', { isActive: 1 })
        .orderBy('s.id', 'DESC')
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
  async checkDuplicateExternalIds() {
    try {
      // 查询有外部ID的系列（扫描全部）
      const seriesList = await this.seriesRepo
        .createQueryBuilder('s')
        .select(['s.id', 's.title', 's.shortId', 's.externalId', 's.createdAt'])
        .where('s.is_active = :isActive', { isActive: 1 })
        .andWhere('s.external_id IS NOT NULL')
        .andWhere('s.external_id != :empty', { empty: '' })
        .orderBy('s.id', 'DESC')
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
   * 获取统计信息（全量统计）
   * GET /api/admin/series/validation/stats
   */
  @Get('stats')
  async getValidationStats() {
    try {
      const startTime = Date.now();

      // 总系列数
      const totalSeries = await this.seriesRepo.count({
        where: { isActive: 1 },
      });

      // 总剧集数
      const totalEpisodes = await this.episodeRepo.count();

      // 无剧集的系列（空系列）- 直接检查每个系列
      const allActiveSeries = await this.seriesRepo.find({
        where: { isActive: 1 },
        select: ['id'],
      });
      
      let emptySeries = 0;
      for (const s of allActiveSeries) {
        const count = await this.episodeRepo.count({
          where: { seriesId: s.id },
        });
        if (count === 0) {
          emptySeries++;
        }
      }

      // 获取所有系列进行全量检查
      const seriesList = await this.seriesRepo
        .createQueryBuilder('s')
        .where('s.is_active = :isActive', { isActive: 1 })
        .getMany();

      let missingCount = 0;
      let duplicateCount = 0;
      let bothCount = 0;

      for (const series of seriesList) {
        const episodes = await this.episodeRepo.find({
          where: { seriesId: series.id },
          select: ['id', 'episodeNumber'],
        });

        if (episodes.length === 0) {
          continue; // 空系列已经在 emptySeries 中统计了
        }

        const numbers = episodes.map(e => e.episodeNumber).filter(n => n != null).sort((a, b) => a - b);
        const max = Math.max(...numbers);
        
        // 检查缺集
        const missing: number[] = [];
        for (let i = 1; i <= max; i++) {
          if (!numbers.includes(i)) {
            missing.push(i);
          }
        }

        // 检查重复
        const duplicates = numbers.filter((num, index) => 
          numbers.indexOf(num) !== index
        );
        const hasDuplicates = [...new Set(duplicates)].length > 0;

        // 分类统计
        if (missing.length > 0 && hasDuplicates) {
          bothCount++;
        } else if (missing.length > 0) {
          missingCount++;
        } else if (hasDuplicates) {
          duplicateCount++;
        }
      }

      // 检查重复名称
      const titleMap = new Map<string, number>();
      seriesList.forEach(series => {
        const title = series.title.trim();
        titleMap.set(title, (titleMap.get(title) || 0) + 1);
      });
      const duplicateNamesCount = Array.from(titleMap.values()).filter(count => count > 1).length;

      // 检查重复外部ID
      const extIdMap = new Map<string, number>();
      seriesList.forEach(series => {
        if (series.externalId) {
          extIdMap.set(series.externalId, (extIdMap.get(series.externalId) || 0) + 1);
        }
      });
      const duplicateExternalIdsCount = Array.from(extIdMap.values()).filter(count => count > 1).length;

      // 计算健康系列数
      const issuesSeries = missingCount + duplicateCount + bothCount + emptySeries;
      const healthySeries = totalSeries - issuesSeries;

      // 计算质量评分
      const issueRate = totalSeries > 0 ? (issuesSeries / totalSeries) : 0;
      const score = Math.round((1 - issueRate) * 100);
      let grade = 'F';
      if (score >= 95) grade = 'A+';
      else if (score >= 90) grade = 'A';
      else if (score >= 85) grade = 'B+';
      else if (score >= 80) grade = 'B';
      else if (score >= 75) grade = 'C+';
      else if (score >= 70) grade = 'C';
      else if (score >= 60) grade = 'D';

      const duration = Date.now() - startTime;

      return {
        success: true,
        code: 200,
        message: '数据质量统计获取成功',
        timestamp: new Date().toISOString(),
        data: {
          overview: {
            totalSeries,
            totalEpisodes,
            healthySeries,
            issuesSeries,
          },
          issues: {
            missingEpisodes: missingCount,
            duplicateEpisodes: duplicateCount,
            duplicateNames: duplicateNamesCount,
            duplicateExternalIds: duplicateExternalIdsCount,
            emptySeries,
          },
          breakdown: {
            onlyMissing: missingCount,
            onlyDuplicate: duplicateCount,
            bothIssues: bothCount,
            empty: emptySeries,
          },
          quality: {
            score,
            grade,
            trend: 'stable',
            issueRate: `${(issueRate * 100).toFixed(1)}%`,
          },
          lastCheck: {
            timestamp: new Date().toISOString(),
            duration,
          },
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

