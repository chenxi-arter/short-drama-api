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
import { FuzzySearchResponse, FuzzySearchItem } from '../dto/fuzzy-search.dto';
import { CacheKeys } from '../utils/cache-keys.util';
import { FilterQueryBuilderUtil } from '../utils/filter-query-builder.util';

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
    // 验证 channelId 是否存在
    if (!channelId || channelId.trim() === '') {
      return {
        data: { list: [], total: 0, page: 1, size: 20, hasMore: false },
        code: 400,
        msg: 'channeid参数不能为空',
      };
    }

    // 说明：列表筛选数据不使用Redis缓存，避免不必要的内存占用

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
        .where('series.isActive = :isActive', { isActive: 1 }); // 只查询未删除的剧集

      // 应用筛选条件
      await this.applyFilters(queryBuilder, filterIds, channelId);

      // 排序
      this.applySorting(queryBuilder, filterIds.sortType);

      // 分页
      const [series, total] = await queryBuilder
        .skip(offset)
        .take(pageSize)
        .getManyAndCount();

      // 如果没有查询到数据，返回空数据和提示信息
      if (!series || series.length === 0) {
        const response: FilterDataResponse = {
          data: { list: [], total: 0, page: pageNum, size: pageSize, hasMore: false },
          code: 200,
          msg: '暂无相关数据',
        };
        
        return response;
      }

      // 转换为响应格式
      const items: FilterDataItem[] = series.map(s => ({
        id: s.id,
        shortId: s.shortId || '',
        coverUrl: s.coverUrl || '',
        title: s.title,
        score: s.score?.toString() || '0.0',
        playCount: s.playCount || 0,
        url: s.id.toString(), // 使用ID作为URL
        type: s.category?.name || '未分类', // 使用分类名称作为类型
        isSerial: (s.episodes && s.episodes.length > 1) || false,
        upStatus: s.upStatus || '已完结',
        upCount: s.upCount || 0,
        author: s.starring || s.actor || '', // 使用主演或演员作为作者
        description: s.description || '', // 使用描述字段
        cidMapper: s.category?.id?.toString() || '0',
        isRecommend: false, // 默认不推荐，可根据实际业务逻辑调整
        createdAt: s.createdAt ? s.createdAt.toISOString() : new Date().toISOString(), // 创建时间
      }));

      const response: FilterDataResponse = {
        data: {
          list: items,
          total,
          page: pageNum,
          size: pageSize,
          hasMore: total > pageNum * pageSize,
        },
        code: 200,
        msg: null,
      };

      return response;
    } catch (error) {
      console.error('获取筛选器数据失败:', error);
      throw new Error('获取筛选器数据失败');
    }
  }

  /**
   * 解析筛选条件ID字符串
   * @param ids 筛选条件的“序号”组合（sort_order），格式："sortType,categoryId,regionId,languageId,yearId,statusId"
   * - 位置含义：[排序, 类型, 地区, 语言, 年份, 状态]
   * - 映射原则：先用每一位的 sort_order 去 filter_options 中定位对应选项，再取该选项的 option.id 参与查询
   * - 重要：ids 中的值是 sort_order（序号），不是 filter_options.id
   * - 特殊规则：当 channelId 为数值且 > 0 时，会忽略 ids 中的“类型(type)”位，避免与频道分类冲突；channelId=0 表示全库筛选
   * 示例："1,2,0,0,0,0" → 排序=1，类型=2，其他不筛选
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
      sortType: parts[0] || 0,     // filter_type_id = 1 (排序)
      categoryId: parts[1] || 0,   // filter_type_id = 2 (类型)
      regionId: parts[2] || 0,     // filter_type_id = 3 (地区)
      languageId: parts[3] || 0,   // filter_type_id = 4 (语言)
      yearId: parts[4] || 0,       // filter_type_id = 5 (年份)
      statusId: parts[5] || 0,     // filter_type_id = 6 (状态)
    };
  }

  /**
   * 公共方法：应用筛选条件到查询构建器
   */
  async applyFiltersToQueryBuilder(
    queryBuilder: any,
    filterIds: {
      sortType: number;
      categoryId: number;
      regionId: number;
      languageId: number;
      yearId: number;
      statusId: number;
    },
    channelId: string
  ): Promise<void> {
    await this.applyFilters(queryBuilder, filterIds, channelId);
  }

  /**
   * 应用筛选条件到查询构建器
   * 使用 ids 的 sort_order 动态定位 filter_options，再将 option.id 应用到 SQL 条件。
   * 业务规则：当 channelId 为数值且 > 0 时，忽略 ids 中的类型(type)筛选，避免与频道分类重复/冲突；
   * channelId=0 时不忽略任何 ids 位，在“全部分类”下按 ids 完整筛选。
   */
  private async applyFilters(
    queryBuilder: any, 
    filterIds: {
      sortType: number;
      categoryId: number;
      regionId: number;
      languageId: number;
      yearId: number;
      statusId: number;
    }, 
    channelId: string
  ): Promise<void> {
    // 频道筛选
    FilterQueryBuilderUtil.applyChannel(queryBuilder, channelId);

    // 动态获取filter_types按sort_order排序的映射
    const filterTypes = await this.filterTypeRepo.find({
      order: { sortOrder: 'ASC' },
      where: { isActive: true }
    });

    // ids参数数组
    const idsArray = [
      filterIds.sortType,
      filterIds.categoryId, 
      filterIds.regionId,
      filterIds.languageId,
      filterIds.yearId,
      filterIds.statusId
    ];

    // 根据sort_order动态应用筛选条件
    for (let i = 0; i < Math.min(filterTypes.length, idsArray.length); i++) {
      const filterType = filterTypes[i];
      const optionId = idsArray[i];

      if (optionId > 0) {
        // 根据filter_type和sort_order查找对应的选项
        const option = await this.filterOptionRepo.findOne({
          where: { 
            filterTypeId: filterType.id,
            sortOrder: optionId,
            isActive: true
          }
        });

        if (option) {
          console.log(`[DEBUG] 应用筛选: ${filterType.code}, sort_order: ${optionId}, option_id: ${option.id}, option_name: ${option.name}`);
          // 当 channeid 为数值且 > 0 时，忽略 ids 中的类型(type)筛选，避免与频道分类冲突
          const isNumericChannel = /^\d+$/.test(channelId);
          const hasChannelCategory = isNumericChannel && parseInt(channelId, 10) > 0;
          if (filterType.code === 'type' && hasChannelCategory) {
            continue;
          }
          // 根据filter_type的code来应用不同的筛选逻辑，传递实际的option.id
          switch (filterType.code) {
            case 'type':
              FilterQueryBuilderUtil.applyType(queryBuilder, option.id);
              break;
            case 'region':
              FilterQueryBuilderUtil.applyRegion(queryBuilder, option.id);
              break;
            case 'language':
              FilterQueryBuilderUtil.applyLanguage(queryBuilder, option.id);
              break;
            case 'year':
              FilterQueryBuilderUtil.applyYear(queryBuilder, option.id);
              break;
            case 'status':
              FilterQueryBuilderUtil.applyStatus(queryBuilder, option.id);
              break;
            case 'sort':
              // 排序在 applySorting 中统一处理
              break;
            default:
              break;
          }
        } else {
          console.log(`[DEBUG] 未找到筛选选项: filter_type_id=${filterType.id}, sort_order=${optionId}`);
        }
      }
    }
  }

  /**
   * 根据筛选类型应用具体的筛选条件
   */
  private async applyFilterByType() { /* 已由 FilterQueryBuilderUtil 接管，保留空实现以兼容旧调用 */ }

  /**
   * 应用排序条件
   */
  private applySorting(queryBuilder: any, sortType: number): void {
    FilterQueryBuilderUtil.applySorting(queryBuilder, sortType);
  }

  /**
   * 从日期解析中文年份名称，优先匹配 value，其次匹配 name（如“2024年”）
   */
  async resolveYearNameFromDate(date?: Date | string): Promise<string> {
    if (!date) return '';
    const year = (date instanceof Date ? date : new Date(date)).getFullYear().toString();
    let yearOption = await this.filterOptionRepo.findOne({ where: { value: year } });
    if (!yearOption) {
      yearOption = await this.filterOptionRepo.findOne({ where: { name: year + '年' } });
    }
    return yearOption?.name || year;
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

  /**
   * 模糊搜索
   * 根据关键词在标题中进行模糊搜索
   * @param keyword 搜索关键词
   * @param channeid 可选，频道ID，不传则搜索全部
   * @param page 页码
   * @param size 每页大小
   */
  async fuzzySearch(
    keyword: string,
    channeid?: string,
    page: number = 1,
    size: number = 20
  ): Promise<FuzzySearchResponse> {
    console.log('模糊搜索开始:', { keyword, channeid, page, size });
    
    if (!keyword || keyword.trim() === '') {
      console.log('搜索关键词为空');
      return {
        code: 400,
        data: {
          list: [],
          total: 0,
          page: 1,
          size: 20,
          hasMore: false
        },
        msg: '搜索关键词不能为空'
      };
    }

    // 说明：关键词搜索不使用Redis缓存，避免热点键导致的内存压力与键爆炸

    try {
      const offset = (page - 1) * size;
      console.log('查询参数:', { offset, size });
      
      // 构建查询条件
      const queryBuilder = this.seriesRepo.createQueryBuilder('series')
        .leftJoinAndSelect('series.category', 'category')
        .leftJoinAndSelect('series.episodes', 'episodes')
        .where('series.title LIKE :keyword', { keyword: `%${keyword.trim()}%` })
        .andWhere('series.isActive = :isActive', { isActive: 1 }); // 只查询未删除的剧集

      // 如果指定了频道ID，则添加频道筛选条件
      if (channeid && channeid.trim() !== '') {
        queryBuilder.andWhere('series.category_id = :channeid', { channeid: parseInt(channeid) });
      }

      // 排序：按相关性（标题匹配度）和创建时间
      queryBuilder.orderBy('series.createdAt', 'DESC');

      console.log('SQL查询:', queryBuilder.getSql());
      console.log('查询参数:', queryBuilder.getParameters());

      // 分页
      const [series, total] = await queryBuilder
        .skip(offset)
        .take(size)
        .getManyAndCount();

      console.log('查询结果:', { count: series?.length || 0, total });

      // 如果没有查询到数据，返回空数据
      if (!series || series.length === 0) {
        console.log('未找到相关结果');
        const response: FuzzySearchResponse = {
          code: 200,
          data: {
            list: [],
            total: 0,
            page,
            size,
            hasMore: false
          },
          msg: '未找到相关结果'
        };
        
        return response;
      }

      // 转换为响应格式
      const items: FuzzySearchItem[] = series.map(s => ({
        id: s.id,
        shortId: s.shortId || '',
        coverUrl: s.coverUrl || '',
        title: s.title,
        score: s.score?.toString() || '0.0',
        playCount: s.playCount || 0,
        url: s.id.toString(), // 使用ID作为URL
        type: s.category?.name || '未分类', // 使用分类名称作为类型
        isSerial: (s.episodes && s.episodes.length > 1) || false,
        upStatus: s.upStatus || '已完结',
        upCount: s.upCount || 0,
        author: s.starring || s.actor || '', // 使用主演或演员作为作者
        description: s.description || '', // 使用描述字段
        cidMapper: s.category?.id?.toString() || '0',
        isRecommend: false, // 默认不推荐，可根据实际业务逻辑调整
        createdAt: s.createdAt ? s.createdAt.toISOString() : new Date().toISOString(),
        channeid: s.categoryId || 0 // 添加频道ID标识
      }));

      const response: FuzzySearchResponse = {
        code: 200,
        data: {
          list: items,
          total,
          page,
          size,
          hasMore: total > page * size
        },
        msg: null
      };

      console.log('返回结果:', { itemCount: items.length, total, hasMore: response.data.hasMore });

      return response;
    } catch (error) {
      console.error('模糊搜索失败:', error);
      return {
        code: 500,
        data: {
          list: [],
          total: 0,
          page,
          size,
          hasMore: false
        },
        msg: '搜索失败，请稍后重试'
      };
    }
  }
}