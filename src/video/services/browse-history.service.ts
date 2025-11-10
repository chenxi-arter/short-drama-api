// src/video/services/browse-history.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { BrowseHistory } from '../entity/browse-history.entity';
import { DateUtil } from '../../common/utils/date.util';
import { Series } from '../entity/series.entity';
import { User } from '../../user/entity/user.entity';
import { WatchProgress } from '../entity/watch-progress.entity';
import { Episode } from '../entity/episode.entity';
import { Request } from 'express';

/**
 * 浏览记录服务
 * 管理用户的浏览历史记录
 */
@Injectable()
export class BrowseHistoryService {
  constructor(
    @InjectRepository(BrowseHistory)
    private readonly browseHistoryRepo: Repository<BrowseHistory>,
    @InjectRepository(Series)
    private readonly seriesRepo: Repository<Series>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(WatchProgress)
    private readonly watchProgressRepo: Repository<WatchProgress>,
    @InjectRepository(Episode)
    private readonly episodeRepo: Repository<Episode>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  /**
   * 记录用户浏览剧集列表（优化版）
   * @param userId 用户ID
   * @param seriesId 剧集系列ID
   * @param browseType 浏览类型
   * @param lastEpisodeNumber 最后访问的集数
   * @param req 请求对象，用于获取用户代理和IP地址
   */
  async recordBrowseHistory(
    userId: number,
    seriesId: number,
    browseType: string = 'episode_watch',
    lastEpisodeNumber: number | null = null,
    req?: Request
  ): Promise<void> {
    try {
      // 业务逻辑保护：检查用户是否在短时间内频繁操作
      await this.checkUserOperationLimit(userId);
      
      // IP地址保护：检查是否在黑名单中
      if (req) {
        await this.checkIpBlacklist(req);
      }
      
      // 数据验证
      if (!seriesId || seriesId <= 0) {
        throw new Error('无效的剧集系列ID');
      }
      
      if (lastEpisodeNumber !== null && (lastEpisodeNumber <= 0 || lastEpisodeNumber > 10000)) {
        throw new Error('无效的集数');
      }
      
      // ✅ 优化：使用更精确的查询条件，确保同系列只保留一条记录
      // 对于同一个用户和同一个系列，无论浏览类型如何，都只保留一条记录
      let browseHistory = await this.browseHistoryRepo.findOne({
        where: {
          userId,
          seriesId
          // 移除 browseType 条件，确保同系列只保留一条记录
        }
      });

      if (browseHistory) {
        // ✅ 更新现有记录（同系列更新而非新建）
        browseHistory.visitCount += 1;
        browseHistory.updatedAt = new Date();
        browseHistory.browseType = browseType; // 更新浏览类型为最新的
        
        // ✅ 修复：只有在明确传递了有效的集数时才更新，避免覆盖已有的观看进度
        if (lastEpisodeNumber !== undefined && lastEpisodeNumber !== null && lastEpisodeNumber > 0) {
          browseHistory.lastEpisodeNumber = lastEpisodeNumber;
        }
        
        if (req) {
          browseHistory.userAgent = req.headers['user-agent'] || browseHistory.userAgent;
          browseHistory.ipAddress = this.getClientIp(req) || browseHistory.ipAddress;
        }
      } else {
        // ✅ 创建新记录前，先检查用户记录数量限制
        await this.checkAndEnforceUserRecordLimit(userId);
        
        // 创建新记录
        browseHistory = new BrowseHistory();
        browseHistory.userId = userId;
        browseHistory.seriesId = seriesId;
        browseHistory.browseType = browseType;
        browseHistory.lastEpisodeNumber = lastEpisodeNumber;
        browseHistory.userAgent = req?.headers['user-agent'] || null;
        browseHistory.ipAddress = req ? this.getClientIp(req) : null;
        browseHistory.visitCount = 1;
      }

      await this.browseHistoryRepo.save(browseHistory);

      // 清除相关缓存
      await this.clearBrowseHistoryCache(userId);
    } catch (error: any) {
      console.error('记录浏览历史失败:', error?.message || error);
      // 不抛出错误，避免影响主要业务逻辑
    }
  }

  /**
   * 获取用户浏览历史（从watch_progress聚合）
   * ✅ 优化：从watch_progress表聚合数据，确保同系列只返回最新的一条记录
   * ✅ 新增：支持分类筛选
   * @param userId 用户ID
   * @param page 页码
   * @param size 每页数量
   * @param categoryId 分类ID（可选）
   */
  async getUserBrowseHistory(
    userId: number,
    page: number = 1,
    size: number = 10,
    categoryId?: number
  ): Promise<{
    list: any[];
    total: number;
    page: number;
    size: number;
    hasMore: boolean;
  }> {
    try {
      const offset = (page - 1) * size;
      
      // 从watch_progress聚合浏览记录
      // 1. 找出每个系列的最新观看记录
      let query = this.watchProgressRepo
        .createQueryBuilder('wp')
        .innerJoin('wp.episode', 'episode')
        .innerJoin('episode.series', 'series')
        .leftJoin('series.category', 'category')
        .select('series.id', 'seriesId')
        .addSelect('MAX(wp.updated_at)', 'lastVisitTime')
        .addSelect('MAX(episode.episode_number)', 'lastEpisodeNumber')
        .addSelect('COUNT(DISTINCT episode.id)', 'visitCount')
        .where('wp.user_id = :userId', { userId });
      
      // 添加分类筛选
      if (categoryId) {
        query = query.andWhere('series.category_id = :categoryId', { categoryId });
      }
      
      const aggregatedData = await query
        .groupBy('series.id')
        .orderBy('lastVisitTime', 'DESC')
        .getRawMany();
      
      if (aggregatedData.length === 0) {
        return {
          list: [],
          total: 0,
          page,
          size,
          hasMore: false
        };
      }
      
      // 2. 分页处理
      const total = aggregatedData.length;
      const paginatedData = aggregatedData.slice(offset, offset + size);
      
      // 3. 批量获取系列详细信息
      const seriesIds = paginatedData.map(item => item.seriesId);
      const seriesMap = new Map();
      
      if (seriesIds.length > 0) {
        const seriesList = await this.seriesRepo
          .createQueryBuilder('series')
          .leftJoinAndSelect('series.category', 'category')
          .where('series.id IN (:...ids)', { ids: seriesIds })
          .getMany();
        
        seriesList.forEach(series => {
          seriesMap.set(series.id, series);
        });
      }
      
      // 4. 组装返回数据
      const list = paginatedData.map(item => {
        const series = seriesMap.get(item.seriesId);
        return {
          id: item.seriesId, // 使用seriesId作为id
          seriesId: item.seriesId,
          seriesTitle: series?.title || `系列${item.seriesId}`,
          seriesShortId: series?.shortId || '',
          seriesCoverUrl: series?.coverUrl || '',
          categoryName: series?.category?.name || '',
          categoryId: series?.category?.id,
          browseType: 'episode_watch',
          browseTypeDesc: '观看剧集',
          lastEpisodeNumber: item.lastEpisodeNumber,
          lastEpisodeTitle: item.lastEpisodeNumber ? `第${item.lastEpisodeNumber}集` : null,
          visitCount: item.visitCount,
          lastVisitTime: DateUtil.formatDateTime(new Date(item.lastVisitTime)),
          watchStatus: `观看至第${item.lastEpisodeNumber}集`
        };
      });

      return {
        list,
        total,
        page,
        size,
        hasMore: total > page * size
      };
    } catch (error: any) {
      console.error('获取浏览历史失败:', error?.message || error);
      throw new Error('获取浏览历史失败');
    }
  }

  /**
   * 获取用户最近浏览的剧集系列（优化版）
   * ✅ 优化：确保同系列只返回最新的一条记录
   * @param userId 用户ID
   * @param limit 限制数量
   */
  async getRecentBrowsedSeries(
    userId: number,
    limit: number = 10
  ): Promise<any[]> {
    try {
      // ✅ 优化：使用子查询确保每个系列只返回最新的一条记录
      // ✅ 只保留 episode_watch 类型的记录
      // 先获取每个系列的最新浏览记录ID
      const latestRecordIds = await this.browseHistoryRepo
        .createQueryBuilder('bh')
        .select('MAX(bh.id)', 'maxId')
        .addSelect('bh.seriesId')
        .where('bh.userId = :userId', { userId })
        .andWhere('bh.browseType = :browseType', { browseType: 'episode_watch' })
        .groupBy('bh.seriesId')
        .orderBy('MAX(bh.updatedAt)', 'DESC') // 按最新更新时间排序
        .limit(limit)
        .getRawMany();

      const latestIds = latestRecordIds.map((row: any) => Number(row.maxId));
      
      if (latestIds.length === 0) {
        return [];
      }

      // 使用关联查询获取完整的系列信息和分类信息
      const recentBrowsed = await this.browseHistoryRepo
        .createQueryBuilder('bh')
        .leftJoinAndSelect('bh.series', 'series')
        .leftJoinAndSelect('series.category', 'category')
        .where('bh.id IN (:...ids)', { ids: latestIds })
        .orderBy('bh.updatedAt', 'DESC')
        .getMany();

      const result = recentBrowsed.map(bh => ({
        seriesId: bh.seriesId,
        seriesTitle: bh.series?.title || `系列${bh.seriesId}`, // 使用真实标题，fallback到临时标题
        seriesShortId: bh.series?.shortId || '', // 使用真实shortId
        seriesCoverUrl: bh.series?.coverUrl || '', // 使用真实封面URL
        categoryName: bh.series?.category?.name || '', // 使用真实分类名称
        lastEpisodeNumber: bh.lastEpisodeNumber,
        lastVisitTime: DateUtil.formatDateTime(bh.updatedAt),
        visitCount: bh.visitCount
      }));

      // 最近浏览记录不缓存，确保实时性
      
      return result;
    } catch (error: any) {
      console.error('获取最近浏览失败:', error?.message || error);
      return [];
    }
  }

  /**
   * 清理过期的浏览记录
   * 删除30天前的浏览记录
   */
  async cleanupExpiredBrowseHistory(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const result = await this.browseHistoryRepo
        .createQueryBuilder()
        .delete()
        .where('updated_at < :date', { date: thirtyDaysAgo })
        .execute();
      
      console.log(`清理了 ${result.affected} 条过期浏览记录`);
    } catch (error: any) {
      console.error('清理过期浏览记录失败:', error?.message || error);
    }
  }

  /**
   * 获取系统统计信息
   */
  async getSystemStats(): Promise<{
    totalRecords: number;
    activeUsers: number;
    totalOperations: number;
  }> {
    try {
      const totalRecords = await this.browseHistoryRepo.count();
      
      const activeUsers = await this.browseHistoryRepo
        .createQueryBuilder('bh')
        .select('COUNT(DISTINCT bh.userId)', 'count')
        .where('bh.updatedAt > :date', { 
          date: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24小时内
        })
        .getRawOne();
      
      return {
        totalRecords,
        activeUsers: parseInt((activeUsers as any)?.count as string || '0'),
        totalOperations: 0 // 可以扩展为记录总操作次数
      };
    } catch (error: any) {
      console.error('获取系统统计信息失败:', error?.message || error);
      return {
        totalRecords: 0,
        activeUsers: 0,
        totalOperations: 0
      };
    }
  }

  /**
   * 清除浏览记录缓存
   * @param userId 用户ID
   */
  private async clearBrowseHistoryCache(userId: number): Promise<void> {
    try {
      const patterns = [
        `browse_history_${userId}_*`,
        `recent_browsed_${userId}_*`
      ];
      
      for (const pattern of patterns) {
        await this.cacheManager.del(pattern);
      }
    } catch (error: any) {
      console.error('清除浏览历史缓存失败:', error?.message || error);
    }
  }

  /**
   * 获取客户端IP地址
   * @param req 请求对象
   */
  private getClientIp(req: Request): string | null {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    }
    
    const realIp = req.headers['x-real-ip'];
    if (realIp) {
      return Array.isArray(realIp) ? realIp[0] : realIp;
    }
    
    return req.socket?.remoteAddress || null;
  }

  /**
   * 检查IP地址是否在黑名单中
   * @param req 请求对象
   */
  private async checkIpBlacklist(req: Request): Promise<void> {
    try {
      const ip = this.getClientIp(req);
      if (!ip) return;
      
      const blacklistKey = `ip_blacklist_${ip}`;
      const isBlacklisted = await this.cacheManager.get<boolean>(blacklistKey);
      
      if (isBlacklisted) {
        throw new Error('IP地址已被限制访问');
      }
      
      // 检查IP操作频率
      const ipOperationKey = `ip_operation_${ip}`;
      const ipOperationCount = await this.cacheManager.get<number>(ipOperationKey) || 0;
      
      // 限制：每分钟最多50次操作
      if (ipOperationCount >= 50) {
        // 将IP加入黑名单（5分钟）
        await this.cacheManager.set(blacklistKey, true, 300000);
        throw new Error('IP地址操作过于频繁，已被临时限制');
      }
      
      // 增加计数并设置过期时间（1分钟）
      await this.cacheManager.set(ipOperationKey, ipOperationCount + 1, 60000);
    } catch (error: any) {
      if (error?.message?.includes('IP地址')) {
        throw error;
      }
      // 其他错误不影响主要业务逻辑
      console.error('检查IP黑名单失败:', error?.message || error);
    }
  }

  /**
   * 检查用户操作频率限制
   * @param userId 用户ID
   */
  private async checkUserOperationLimit(userId: number): Promise<void> {
    try {
      const cacheKey = `user_operation_limit_${userId}`;
      const operationCount = await this.cacheManager.get<number>(cacheKey) || 0;
      
      // 限制：每分钟最多10次浏览记录操作
      if (operationCount >= 10) {
        throw new Error('操作过于频繁，请稍后再试');
      }
      
      // 增加计数并设置过期时间（1分钟）
      await this.cacheManager.set(cacheKey, operationCount + 1, 60000);
    } catch (error: any) {
      if (error?.message === '操作过于频繁，请稍后再试') {
        throw error;
      }
      // 其他错误不影响主要业务逻辑
      console.error('检查用户操作限制失败:', error?.message || error);
    }
  }

  /**
   * 删除用户的浏览记录
   * @param userId 用户ID
   * @param seriesId 可选的剧集系列ID，不传则删除所有
   */
  async deleteBrowseHistory(userId: number, seriesId?: number): Promise<void> {
    try {
      // 批量操作保护：检查用户是否在短时间内频繁删除
      await this.checkUserOperationLimit(userId);
      
      if (seriesId) {
        // 删除指定系列的浏览记录
        const result = await this.browseHistoryRepo.delete({
          userId,
          seriesId
        });
        
        if (result.affected === 0) {
          throw new Error('浏览记录不存在或已被删除');
        }
      } else {
        // 删除所有浏览记录需要额外保护
        const count = await this.browseHistoryRepo.count({
          where: { userId }
        });
        
        if (count > 100) {
          throw new Error('浏览记录数量过多，请分批删除');
        }
        
        await this.browseHistoryRepo.delete({
          userId
        });
      }
      
      // 清除相关缓存
      await this.clearBrowseHistoryCache(userId);
    } catch (error: any) {
      console.error('删除浏览历史失败:', error);
      throw new Error(error.message || '删除浏览历史失败');
    }
  }

  /**
   * 通过 ShortID 查找系列
   */
  async findSeriesByShortId(shortId: string): Promise<Series | null> {
    try {
      return await this.seriesRepo.findOne({
        where: { shortId }
      });
    } catch (error: any) {
      console.error('通过ShortID查找系列失败:', error?.message || error);
      return null;
    }
  }

  /**
   * ✅ 新增：获取浏览类型描述
   */
  private getBrowseTypeDescription(browseType: string): string {
    // 只保留 episode_watch 类型
    if (browseType === 'episode_watch') {
      return '观看剧集';
    }
    return '未知浏览类型';
  }

  /**
   * ✅ 新增：获取观看状态
   * ✅ 修复：使用更准确的观看状态描述
   */
  private getWatchStatus(browseType: string, lastEpisodeNumber: number | null): string {
    if (browseType === 'episode_watch' && lastEpisodeNumber) {
      return `观看至第${lastEpisodeNumber}集`;
    }
    return '浏览中';
  }

  /**
   * ✅ 新增：格式化日期时间为用户友好的格式（支持时区转换）
   * @param date 日期对象
   * @returns 格式化后的日期字符串，如 "2024-01-15 16:30"
   */
  private formatDateTime(date: Date): string {
    if (!date) return '';
    
    // ✅ 修复：确保时区正确处理
    // 将UTC时间转换为北京时间 (UTC+8)
    const beijingTime = new Date(date.getTime() + (date.getTimezoneOffset() * 60000) + (8 * 3600000));
    
    const year = beijingTime.getFullYear();
    const month = String(beijingTime.getMonth() + 1).padStart(2, '0');
    const day = String(beijingTime.getDate()).padStart(2, '0');
    const hours = String(beijingTime.getHours()).padStart(2, '0');
    const minutes = String(beijingTime.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  /**
   * ✅ 新增：检查并强制执行用户记录数量限制
   * 当用户记录数量接近或超过限制时，删除最旧的记录
   * @param userId 用户ID
   */
  private async checkAndEnforceUserRecordLimit(userId: number): Promise<void> {
    const MAX_RECORDS_PER_USER = 100;
    
    try {
      // 获取用户当前的浏览记录总数
      const currentCount = await this.browseHistoryRepo.count({
        where: { userId }
      });

      // 如果记录数量已经达到或超过限制，删除最旧的记录
      if (currentCount >= MAX_RECORDS_PER_USER) {
        const recordsToDelete = currentCount - MAX_RECORDS_PER_USER + 1; // +1 为即将新增的记录预留空间
        
        // 获取需要删除的最旧记录ID列表
        const recordsToDeleteIds = await this.browseHistoryRepo
          .createQueryBuilder('bh')
          .select('bh.id')
          .where('bh.userId = :userId', { userId })
          .orderBy('bh.updatedAt', 'ASC') // 按更新时间升序，删除最旧的
          .limit(recordsToDelete)
          .getMany();

        if (recordsToDeleteIds.length > 0) {
          // 批量删除最旧的记录
          await this.browseHistoryRepo
            .createQueryBuilder()
            .delete()
            .where('id IN (:...ids)', { 
              ids: recordsToDeleteIds.map(record => record.id) 
            })
            .execute();

          console.log(`用户 ${userId} 自动清理了 ${recordsToDeleteIds.length} 条最旧的浏览记录`);
        }
      }
    } catch (error: any) {
      console.error(`检查用户 ${userId} 记录数量限制失败:`, error);
      // 不抛出错误，避免影响主要业务逻辑
    }
  }
}
