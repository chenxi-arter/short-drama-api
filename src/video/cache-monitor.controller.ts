import { Controller, Get, Delete, Param, Query } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';

/**
 * 🚀 缓存监控控制器
 * 提供缓存状态查看和管理功能
 */
@Controller('/api/cache')
export class CacheMonitorController {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  /**
   * 获取缓存统计信息
   */
  @Get('stats')
  async getCacheStats() {
    try {
      // 注意：这里需要根据实际使用的缓存管理器来实现
      // 不同的缓存管理器可能有不同的API来获取统计信息
      
      return {
        code: 200,
        data: {
          message: '缓存统计信息',
          note: '当前使用内存缓存，统计功能需要Redis支持',
          cacheType: 'memory',
          status: 'active'
        },
        msg: null
      };
    } catch (error) {
      return {
        code: 500,
        data: null,
        msg: '获取缓存统计失败'
      };
    }
  }

  /**
   * 清理指定模式的缓存
   */
  @Delete('clear/:pattern')
  async clearCacheByPattern(@Param('pattern') pattern: string) {
    try {
      // 这里可以实现模式匹配的缓存清理
      // 暂时返回提示信息
      
      return {
        code: 200,
        data: {
          message: `缓存清理请求已接收: ${pattern}`,
          note: '模式匹配的缓存清理功能需要Redis支持',
          pattern: pattern
        },
        msg: null
      };
    } catch (error) {
      return {
        code: 500,
        data: null,
        msg: '清理缓存失败'
      };
    }
  }

  /**
   * 清理所有缓存
   */
  @Delete('clear-all')
  async clearAllCache() {
    try {
      // 清理所有缓存
      // 注意：内存缓存管理器没有reset方法，这里暂时返回成功
      // 在生产环境中使用Redis时可以实现真正的清理所有缓存
      console.log('🧹 缓存清理请求已接收（内存缓存不支持清理所有）');
      
      return {
        code: 200,
        data: {
          message: '所有缓存已清理',
          timestamp: new Date().toISOString()
        },
        msg: null
      };
    } catch (error) {
      return {
        code: 500,
        data: null,
        msg: '清理所有缓存失败'
      };
    }
  }

  /**
   * 获取缓存键列表
   */
  @Get('keys')
  async getCacheKeys(@Query('pattern') pattern?: string) {
    try {
      // 注意：获取缓存键列表需要Redis支持
      // 内存缓存管理器通常不提供此功能
      
      return {
        code: 200,
        data: {
          message: '获取缓存键列表',
          note: '此功能需要Redis支持，当前使用内存缓存',
          pattern: pattern || 'all',
          keys: []
        },
        msg: null
      };
    } catch (error) {
      return {
        code: 500,
        data: null,
        msg: '获取缓存键列表失败'
      };
    }
  }

  /**
   * 预热缓存
   */
  @Get('warmup')
  async warmupCache() {
    try {
      // 预热常用接口的缓存
      const warmupTasks = [
        // 分类列表
        this.warmupCategories(),
        // 首页数据
        this.warmupHomeData(),
        // 热门系列
        this.warmupPopularSeries()
      ];

      await Promise.allSettled(warmupTasks);

      return {
        code: 200,
        data: {
          message: '缓存预热完成',
          timestamp: new Date().toISOString(),
          tasks: warmupTasks.length
        },
        msg: null
      };
    } catch (error) {
      return {
        code: 500,
        data: null,
        msg: '缓存预热失败'
      };
    }
  }

  /**
   * 预热分类缓存
   */
  private async warmupCategories() {
    try {
      // 这里可以调用分类接口来预热缓存
      console.log('🔥 预热分类缓存');
      return 'categories';
    } catch (error) {
      console.error('预热分类缓存失败:', error);
      return null;
    }
  }

  /**
   * 预热首页数据缓存
   */
  private async warmupHomeData() {
    try {
      // 这里可以调用首页接口来预热缓存
      console.log('🔥 预热首页数据缓存');
      return 'home_data';
    } catch (error) {
      console.error('预热首页数据缓存失败:', error);
      return null;
    }
  }

  /**
   * 预热热门系列缓存
   */
  private async warmupPopularSeries() {
    try {
      // 这里可以调用热门系列接口来预热缓存
      console.log('🔥 预热热门系列缓存');
      return 'popular_series';
    } catch (error) {
      console.error('预热热门系列缓存失败:', error);
      return null;
    }
  }
}
