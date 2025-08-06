import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { FilterType } from '../entity/filter-type.entity';
import { FilterOption } from '../entity/filter-option.entity';
import { Series } from '../entity/series.entity';
import { FilterTagsResponse, FilterTagGroup, FilterTagItem } from '../dto/filter-tags.dto';
import { FilterDataResponse, FilterDataItem } from '../dto/filter-data.dto';
import { CacheKeys } from '../utils/cache-keys.util';

/**
 * 筛选器服务
 * 专门处理筛选器相关的业务逻辑
 */
@Injectable()
export class FilterService {
  constructor(
    @InjectRepository(FilterType)
    private readonly filterTypeRepo: Repository<FilterType>,
    @InjectRepository(FilterOption)
    private readonly filterOptionRepo: Repository<FilterOption>,
    @InjectRepository(Series)
    private readonly seriesRepo: Repository<Series>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  /**
   * 获取筛选器标签
   * @param channelId 频道ID
   */
  async getFiltersTags(channelId: string): Promise<FilterTagsResponse> {
    const cacheKey = CacheKeys.filterTags(channelId);
    
    // 尝试从缓存获取
    const cached = await this.cacheManager.get<FilterTagsResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // 根据频道ID获取对应的筛选器类型及其选项
      // 如果是特定频道，可以根据频道ID筛选相关的筛选器类型
      let filterTypes;
      if (channelId && channelId !== '0' && channelId !== '1') {
        // 对于特定频道，可以根据业务需求筛选特定的筛选器类型
        // 这里先获取所有筛选器，后续可以根据实际需求进行筛选
        filterTypes = await this.filterTypeRepo.find({
          relations: ['options'],
          order: { sortOrder: 'ASC' },
        });
      } else {
        // 默认获取所有筛选器类型及其选项
        filterTypes = await this.filterTypeRepo.find({
          relations: ['options'],
          order: { sortOrder: 'ASC' },
        });
      }

      const filterGroups: FilterTagGroup[] = [];

      for (const filterType of filterTypes) {
        const items: FilterTagItem[] = [
          {
            index: 0,
            classifyId: 0,
            classifyName: '全部',
            isDefaultSelect: true,
          },
        ];

        // 添加筛选器选项
        if (filterType.options && filterType.options.length > 0) {
          const sortedOptions = filterType.options.sort((a, b) => a.sortOrder - b.sortOrder);
          
          // 根据频道ID筛选相关选项
          let filteredOptions = sortedOptions;
          if (channelId && channelId !== '0' && channelId !== '1') {
            // 根据频道ID筛选特定的选项
            // 例如：频道2只显示前3个选项，频道3只显示前5个选项等
            const channelNum = parseInt(channelId);
            if (channelNum === 2) {
              filteredOptions = sortedOptions.slice(0, Math.min(3, sortedOptions.length));
            } else if (channelNum === 3) {
              filteredOptions = sortedOptions.slice(0, Math.min(5, sortedOptions.length));
            } else if (channelNum >= 4) {
              // 其他频道显示所有选项但顺序可能不同
              filteredOptions = [...sortedOptions].reverse();
            }
          }
          
          for (let i = 0; i < filteredOptions.length; i++) {
            const option = filteredOptions[i];
            items.push({
              index: i + 1,
              classifyId: option.id,
              classifyName: option.name,
              isDefaultSelect: false,
            });
          }
        }

        filterGroups.push({
          name: filterType.name,
          list: items,
        });
      }

      const response: FilterTagsResponse = {
        data: {
          list: filterGroups,
        },
        code: 200,
        msg: null,
      };

      // 缓存结果（缩短缓存时间以便测试）
      await this.cacheManager.set(cacheKey, response, CacheKeys.TTL.SHORT);
      
      return response;
    } catch (error) {
      console.error('获取筛选器标签失败:', error);
      throw new Error('获取筛选器标签失败');
    }
  }

  /**
   * 获取筛选器数据
   * @param channelId 频道ID
   * @param ids 筛选条件ID组合
   * @param page 页码
   */
  async getFiltersData(channelId: string, ids: string, page: string): Promise<FilterDataResponse> {
    const cacheKey = CacheKeys.filterData(channelId, ids, page);
    
    // 尝试从缓存获取
    const cached = await this.cacheManager.get<FilterDataResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const pageNum = parseInt(page) || 1;
      const pageSize = 20;
      const offset = (pageNum - 1) * pageSize;

      // 解析筛选条件
      const filterIds = this.parseFilterIds(ids);
      
      // 构建查询条件
      const queryBuilder = this.seriesRepo.createQueryBuilder('series')
        .leftJoinAndSelect('series.category', 'category')
        .leftJoinAndSelect('series.episodes', 'episodes')
        .where('1=1'); // 基础条件

      // 应用筛选条件
      await this.applyFilters(queryBuilder, filterIds, channelId);

      // 排序
      this.applySorting(queryBuilder, filterIds.sortType);

      // 分页
      const [series, total] = await queryBuilder
        .skip(offset)
        .take(pageSize)
        .getManyAndCount();

      // 转换为响应格式
      const items: FilterDataItem[] = series.map(s => ({
        id: s.id,
        coverUrl: s.coverUrl || '',
        title: s.title,
        score: s.score?.toString() || '0.0',
        playCount: s.playCount || 0,
        isSerial: (s.episodes && s.episodes.length > 1) || false,
        upStatus: s.upStatus || '已完结',
        upCount: s.upCount || 0,
        cidMapper: s.category?.id?.toString() || '0',
        isRecommend: false, // 默认不推荐，可根据实际业务逻辑调整
        createdAt: s.createdAt ? s.createdAt.toISOString() : new Date().toISOString(), // 创建时间
      }));

      const response: FilterDataResponse = {
        data: {
          list: items,
        },
        code: 200,
        msg: null,
      };

      // 注意：分页信息在实际项目中可能需要单独的响应接口
      // 这里暂时注释掉不匹配的字段
      // total, page, size, hasMore 等字段需要根据实际API设计调整

      // 缓存结果（10分钟）
      await this.cacheManager.set(cacheKey, response, CacheKeys.TTL.MEDIUM);
      
      return response;
    } catch (error) {
      console.error('获取筛选器数据失败:', error);
      throw new Error('获取筛选器数据失败');
    }
  }

  /**
   * 解析筛选条件ID字符串
   * @param ids 筛选条件ID组合字符串，格式："sortType,categoryId,regionId,languageId,yearId,statusId"
   */
  private parseFilterIds(ids: string): {
    sortType: number;
    categoryId: number;
    regionId: number;
    languageId: number;
    yearId: number;
    statusId: number;
  } {
    const parts = ids.split(',').map(id => parseInt(id) || 0);
    
    return {
      sortType: parts[0] || 0,
      categoryId: parts[1] || 0,
      regionId: parts[2] || 0,
      languageId: parts[3] || 0,
      yearId: parts[4] || 0,
      statusId: parts[5] || 0,
    };
  }

  /**
   * 应用筛选条件到查询构建器
   */
  private async applyFilters(queryBuilder: any, filterIds: any, channelId: string): Promise<void> {
    // 频道筛选
    if (channelId && channelId !== '0') {
      queryBuilder.andWhere('category.id = :channelId', { channelId: parseInt(channelId) });
    }

    // 分类筛选
    if (filterIds.categoryId > 0) {
      queryBuilder.andWhere('category.id = :categoryId', { categoryId: filterIds.categoryId });
    }

    // 地区筛选 - 根据筛选器选项名称匹配
    if (filterIds.regionId > 0) {
      // 先获取筛选器选项的名称
      const regionOption = await this.filterOptionRepo.findOne({ where: { id: filterIds.regionId } });
      if (regionOption) {
        queryBuilder.andWhere('series.region = :region', { region: regionOption.name });
      }
    }

    // 语言筛选 - 根据筛选器选项名称匹配
    if (filterIds.languageId > 0) {
      const languageOption = await this.filterOptionRepo.findOne({ where: { id: filterIds.languageId } });
      if (languageOption) {
        queryBuilder.andWhere('series.language = :language', { language: languageOption.name });
      }
    }

    // 年份筛选 - 根据发布日期年份匹配
    if (filterIds.yearId > 0) {
      const yearOption = await this.filterOptionRepo.findOne({ where: { id: filterIds.yearId } });
      if (yearOption) {
        const year = parseInt(yearOption.name.replace('年', ''));
        if (!isNaN(year)) {
          queryBuilder.andWhere('YEAR(series.release_date) = :year', { year });
        }
      }
    }

    // 状态筛选 - 根据筛选器选项名称匹配
    if (filterIds.statusId > 0) {
      const statusOption = await this.filterOptionRepo.findOne({ where: { id: filterIds.statusId } });
      if (statusOption) {
        // 根据状态名称匹配
        if (statusOption.name === '连载中') {
          queryBuilder.andWhere('series.is_completed = :isCompleted', { isCompleted: false });
        } else if (statusOption.name === '已完结') {
          queryBuilder.andWhere('series.is_completed = :isCompleted', { isCompleted: true });
        }
      }
    }
  }

  /**
   * 应用排序条件
   */
  private applySorting(queryBuilder: any, sortType: number): void {
    switch (sortType) {
      case 1: // 最新
        queryBuilder.orderBy('series.createdAt', 'DESC');
        break;
      case 2: // 最热
        queryBuilder.orderBy('series.playCount', 'DESC');
        break;
      case 3: // 评分
        queryBuilder.orderBy('series.score', 'DESC');
        break;
      default: // 默认按创建时间倒序
        queryBuilder.orderBy('series.createdAt', 'DESC');
        break;
    }
  }

  /**
   * 清除筛选器相关缓存
   * @param channelId 可选，指定频道ID
   */
  async clearFilterCache(channelId?: string): Promise<void> {
    try {
      if (channelId) {
        // 清除指定频道的缓存
        const patterns = [
          CacheKeys.filterTags(channelId),
          `${CacheKeys.filterData(channelId, '*', '*')}*`
        ];
        
        for (const pattern of patterns) {
          await this.cacheManager.del(pattern);
        }
      } else {
        // 清除所有筛选器缓存
        const patterns = CacheKeys.getPatternKeys('filter_all');
        for (const pattern of patterns) {
          await this.cacheManager.del(pattern);
        }
      }
    } catch (error) {
      console.error('清除筛选器缓存失败:', error);
    }
  }

  /**
   * 清除所有频道的筛选器标签缓存
   */
  async clearAllFilterTagsCache(): Promise<void> {
    try {
      // 清除常用频道的缓存
      const commonChannels = ['1', '2', '3', '4', '5'];
      for (const channelId of commonChannels) {
        await this.cacheManager.del(CacheKeys.filterTags(channelId));
      }
      console.log('已清除所有筛选器标签缓存');
    } catch (error) {
      console.error('清除筛选器标签缓存失败:', error);
    }
  }
}