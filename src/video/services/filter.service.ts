import { Injectable, Inject } from '@nestjs/common';
import { DateUtil } from '../../common/utils/date.util';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { FilterType } from '../entity/filter-type.entity';
import { FilterOption } from '../entity/filter-option.entity';
import { Series } from '../entity/series.entity';
import { Episode } from '../entity/episode.entity';
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
    @InjectRepository(Episode)
    private readonly episodeRepo: Repository<Episode>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  /**
   * 获取筛选器标签（优化版 - 支持基于display_order的ids筛选）
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
      // 使用 QueryBuilder 来确保正确的关联查询和过滤
      const filterTypes = await this.filterTypeRepo
        .createQueryBuilder('filterType')
        .leftJoinAndSelect('filterType.options', 'option', 'option.isActive = :isActive', { isActive: true })
        .where('filterType.isActive = :isActive', { isActive: true })
        .orderBy('filterType.indexPosition', 'ASC')
        .addOrderBy('option.displayOrder', 'ASC')
        .getMany();

      console.log('DEBUG: Raw query results:');
      filterTypes.forEach((ft, i) => {
        console.log(`  ${i+1}. FilterType ${ft.id} - ${ft.name} (${ft.options?.length || 0} options)`);
        ft.options?.forEach((opt, j) => {
          console.log(`    ${j+1}. Option ${opt.id}: ${opt.name} (display_order: ${opt.displayOrder}, filter_type_id: ${opt.filterTypeId})`);
        });
      });

      const filterGroups: FilterTagGroup[] = [];

      for (const filterType of filterTypes) {
        // 不再注入默认“全部(0)”，完全依据数据库选项返回
        const items: FilterTagItem[] = [];

        // 添加筛选器选项
        if (filterType.options && filterType.options.length > 0) {
          // ✅ 按 display_order 排序，这是关键修改
          const sortedOptions = filterType.options
            .filter(option => option.isActive) // 只显示活跃选项
            .sort((a, b) => (a.displayOrder || a.sortOrder || 0) - (b.displayOrder || b.sortOrder || 0));
          
          for (const option of sortedOptions) {
            
            // ✅ 使用 display_order 作为 classifyId 和 index（允许 0 显示，用于DB中的"全部..."）
            const displayOrder = option.displayOrder !== null && option.displayOrder !== undefined ? option.displayOrder : (option.sortOrder || 0);
            items.push({
              index: displayOrder,
              classifyId: displayOrder,
              classifyName: option.name,
              isDefaultSelect: option.isDefault || displayOrder === 0,
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

      // 缓存结果
      await this.cacheManager.set(cacheKey, response, CacheKeys.TTL.MEDIUM);
      
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

      // 解析筛选条件（基础数值 + 原始token，长度不足自动补0到6位）
      const filterIds = this.parseFilterIds(ids);
      const rawTokens = ids.split(',');
      const idTokens = Array(6).fill('0');
      for (let i = 0; i < Math.min(6, rawTokens.length); i++) {
        idTokens[i] = (rawTokens[i] ?? '0');
      }
      
      // 构建查询条件
      const queryBuilder = this.seriesRepo.createQueryBuilder('series')
        .leftJoinAndSelect('series.category', 'category')
        .leftJoinAndSelect('series.regionOption', 'regionOption')
        .leftJoinAndSelect('series.languageOption', 'languageOption')
        .leftJoinAndSelect('series.statusOption', 'statusOption')
        .leftJoinAndSelect('series.yearOption', 'yearOption')
        .where('series.isActive = :isActive', { isActive: 1 }) // 只查询未删除的剧集
        .distinct(true); // 避免联结导致的重复行

      // 题材多选中间表（若无筛选也可安全JOIN）
      queryBuilder.leftJoin('series_genre_options', 'sgo', 'sgo.series_id = series.id');

      // 应用筛选条件
      await this.applyFilters(queryBuilder, filterIds, channelId, idTokens);

      // 排序
      this.applySorting(queryBuilder, filterIds.typeId);

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

      // 计算当日（或昨日）新增集数作为 upCountToday
      const seriesIds = series.map(s => s.id);
      const now = new Date();
      const tzOffsetMs = now.getTimezoneOffset() * 60000;
      const localNow = new Date(now.getTime() - tzOffsetMs);
      // 计算当天 00:00 和 明天 00:00（本地）
      const dayStartLocal = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate());
      const dayEndLocal = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate() + 1);
      const dayStart = new Date(dayStartLocal.getTime() + tzOffsetMs);
      const dayEnd = new Date(dayEndLocal.getTime() + tzOffsetMs);

      let upCountMap: Record<number, number> = {};
      if (seriesIds.length > 0) {
        const rows = await this.episodeRepo.createQueryBuilder('ep')
          .select('ep.series_id', 'seriesId')
          .addSelect('COUNT(*)', 'cnt')
          .where('ep.series_id IN (:...ids)', { ids: seriesIds })
          .andWhere('ep.status = :published', { published: 'published' })
          .andWhere('ep.created_at >= :start AND ep.created_at < :end', { start: dayStart, end: dayEnd })
          .groupBy('ep.series_id')
          .getRawMany();
        upCountMap = rows.reduce((acc: Record<number, number>, r: any) => {
          acc[Number(r.seriesId)] = Number(r.cnt) || 0;
          return acc;
        }, {});
      }

      // 统计系列下三项计数（按所有已发布集聚合）
      let statMap: Record<number, { like: number; dislike: number; favorite: number }> = {};
      if (seriesIds.length > 0) {
        const rows2 = await this.episodeRepo.createQueryBuilder('ep')
          .select('ep.series_id', 'seriesId')
          .addSelect('SUM(ep.like_count)', 'likeSum')
          .addSelect('SUM(ep.dislike_count)', 'dislikeSum')
          .addSelect('SUM(ep.favorite_count)', 'favoriteSum')
          .where('ep.series_id IN (:...ids)', { ids: seriesIds })
          .andWhere('ep.status = :published', { published: 'published' })
          .groupBy('ep.series_id')
          .getRawMany();
        statMap = rows2.reduce((acc: Record<number, { like: number; dislike: number; favorite: number }>, r: any) => {
          acc[Number(r.seriesId)] = {
            like: Number(r.likeSum) || 0,
            dislike: Number(r.dislikeSum) || 0,
            favorite: Number(r.favoriteSum) || 0,
          };
          return acc;
        }, {});
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
        isSerial: (s.totalEpisodes && s.totalEpisodes > 1) || false,
        upStatus: s.upStatus || (s.statusOption?.name ? `${s.statusOption.name}` : '已完结'),
        upCount: upCountMap[s.id] ?? 0,
        likeCount: statMap[s.id]?.like ?? 0,
        dislikeCount: statMap[s.id]?.dislike ?? 0,
        favoriteCount: statMap[s.id]?.favorite ?? 0,
        author: s.starring || s.actor || '', // 使用主演或演员作为作者
        description: s.description || '', // 使用描述字段
        cidMapper: s.category?.id?.toString() || '0',
        isRecommend: false, // 默认不推荐，可根据实际业务逻辑调整
        createdAt: s.createdAt ? DateUtil.formatDateTime(s.createdAt) : DateUtil.formatDateTime(new Date()), // 创建时间
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
   * @param ids 筛选条件的“序号”组合（display_order），格式："typeId,genreId,regionId,languageId,yearId,statusId"
   * - 位置含义：[类型, 题材, 地区, 语言, 年份, 状态]
   * - 类型选项：1=最近上传，3=人气最高，4=评分最高
   * - 映射原则：先用每一位的 display_order 去 filter_options 中定位对应选项，再取该选项的 option.id 参与查询
   * - 重要：ids 中的值是 display_order（序号），不是 filter_options.id
   * - 特殊规则：当 channelId 为数值且 > 0 时，会忽略 ids 中的"类型(type)"位，避免与频道分类冲突；channelId=0 表示全库筛选
   * 示例："1,2,0,0,0,0" → 类型=最近上传，题材=2，其他不筛选
   */
  private parseFilterIds(ids: string): {
    typeId: number;      // 类型筛选（排序功能）
    genreId: number;     // 题材筛选
    regionId: number;    // 地区筛选
    languageId: number;  // 语言筛选
    yearId: number;      // 年份筛选
    statusId: number;    // 状态筛选
  } {
    const parts = ids.split(',').map(id => parseInt(id) || 0);

    return {
      typeId: parts[0] || 0,       // filter_type_id = 1 (类型)
      genreId: parts[1] || 0,      // filter_type_id = 2 (题材)
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
      typeId: number;
      genreId: number;
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
      typeId: number;
      genreId: number;
      regionId: number;
      languageId: number;
      yearId: number;
      statusId: number;
    },
    channelId: string,
    idTokens?: string[]
  ): Promise<void> {
    // 频道筛选
    FilterQueryBuilderUtil.applyChannel(queryBuilder, channelId);

    // 动态获取 filter_types，按 indexPosition 排序，确保与前端 ids 顺序一致
    const filterTypes = await this.filterTypeRepo.find({
      order: { indexPosition: 'ASC' },
      where: { isActive: true }
    });

    // ids参数数组
    const idsArray = [
      filterIds.typeId,     // 类型筛选（排序功能）
      filterIds.genreId,    // 题材筛选  ，
      filterIds.regionId,   // 地区筛选
      filterIds.languageId, // 语言筛选
      filterIds.yearId,     // 年份筛选
      filterIds.statusId    // 状态筛选
    ];

    // 根据sort_order动态应用筛选条件
    for (let i = 0; i < Math.min(filterTypes.length, idsArray.length); i++) {
      const filterType = filterTypes[i];
      const optionId = idsArray[i];

      if (optionId > 0) {
        // ✅ 关键修改：根据filter_type和display_order查找对应的选项
        const option = await this.filterOptionRepo.findOne({
          where: { 
            filterTypeId: filterType.id,
            displayOrder: optionId, // ✅ 使用 display_order 而不是 sort_order
            isActive: true
          }
        });

        if (option) {
          console.log(`[DEBUG] 应用筛选: ${filterType.code}, display_order: ${optionId}, option_id: ${option.id}, option_name: ${option.name}`);
          // 当 channeid 为数值且 > 0 时，忽略 ids 中的类型(type)筛选，避免与频道分类冲突
          const isNumericChannel = /^\d+$/.test(channelId);
          const hasChannelCategory = isNumericChannel && parseInt(channelId, 10) > 0;
          if (filterType.code === 'type' && hasChannelCategory) {
            continue;
          }
          // 根据filter_type的code来应用不同的筛选逻辑，传递实际的option.id
          switch (filterType.code) {
            case 'type': {
              // 如果禁用 type，则跳过
              break;
            }
            case 'genre': {
              // 第二位作为"题材"处理：支持单选和多选（连字符）
              const raw = idTokens?.[1] || '';
              const displayOrders = raw.includes('-')
                ? raw.split('-').map(x => parseInt(x) || 0).filter(x => x > 0)
                : [optionId].filter(x => x > 0);
              if (displayOrders.length) {
                const genreRow = await this.filterTypeRepo.findOne({ where: { code: 'genre', isActive: true as any } as any });
                if (genreRow) {
                  const opts = await this.filterOptionRepo.createQueryBuilder('fo')
                    .select('fo.id', 'id')
                    .where('fo.filter_type_id = :ftid', { ftid: genreRow.id })
                    .andWhere('fo.display_order IN (:...dos)', { dos: displayOrders })
                    .andWhere('fo.is_active = 1')
                    .getRawMany();
                  const genreIds = opts.map((r: any) => Number(r.id)).filter(Boolean);
                  if (genreIds.length) {
                    if (displayOrders.length === 1) {
                      // 单选：直接 IN
                      queryBuilder.andWhere('sgo.option_id IN (:...genreIds)', { genreIds });
                    } else {
                      // 多选：必须同时具备所有题材（AND逻辑）
                      // 使用 HAVING COUNT(DISTINCT sgo.option_id) = 要求的数量
                      queryBuilder.andWhere('sgo.option_id IN (:...genreIds)', { genreIds });
                      queryBuilder.groupBy('series.id');
                      queryBuilder.having('COUNT(DISTINCT sgo.option_id) = :requiredCount', { requiredCount: genreIds.length });
                    }
                  } else {
                    queryBuilder.andWhere('1 = 0');
                  }
                }
              }
              break;
            }
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
            default:
              break;
          }
        } else {
          console.log(`[DEBUG] 未找到筛选选项: filter_type_id=${filterType.id}, display_order=${optionId}`);
          // 当 ids 指定了非零选项，但该选项不存在时，返回空结果
          queryBuilder.andWhere('1 = 0');
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
  private applySorting(queryBuilder: any, typeId: number): void {
    FilterQueryBuilderUtil.applySorting(queryBuilder, typeId);
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
   * @param categoryId 可选，分类ID，不传则搜索全部
   * @param page 页码
   * @param size 每页大小
   */
  async fuzzySearch(
    keyword: string,
    categoryId?: string,
    page: number = 1,
    size: number = 20
  ): Promise<FuzzySearchResponse> {
    console.log('模糊搜索开始:', { keyword, categoryId, page, size });
    
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
      const trimmedKeyword = keyword.trim();
      const queryBuilder = this.seriesRepo.createQueryBuilder('series')
        .leftJoinAndSelect('series.category', 'category')
        .leftJoinAndSelect('series.episodes', 'episodes')
        .leftJoinAndSelect('series.regionOption', 'regionOption')
        .leftJoinAndSelect('series.languageOption', 'languageOption')
        .leftJoinAndSelect('series.statusOption', 'statusOption')
        .leftJoinAndSelect('series.yearOption', 'yearOption')
        .where('series.title LIKE :keyword', { keyword: `%${trimmedKeyword}%` })
        .andWhere('series.isActive = :isActive', { isActive: 1 }); // 只查询未删除的剧集

      // 如果指定了分类ID，则添加分类筛选条件
      if (categoryId && categoryId.trim() !== '') {
        queryBuilder.andWhere('series.category_id = :categoryId', { categoryId: parseInt(categoryId) });
      }

      // 排序：按相关性（标题匹配度）优先，然后按创建时间
      // 使用 MySQL 的 LOCATE 函数计算匹配位置，位置越靠前匹配度越高
      // 同时考虑完全匹配和部分匹配的优先级
      queryBuilder
        .addSelect(`
          CASE 
            WHEN series.title = :keyword THEN 1
            WHEN series.title LIKE CONCAT(:keyword, '%') THEN 2
            WHEN series.title LIKE CONCAT('%', :keyword, '%') THEN 3
            ELSE 4
          END
        `, 'matchPriority')
        .addSelect('LOCATE(:keyword, series.title)', 'matchPosition')
        .addSelect('CHAR_LENGTH(series.title)', 'titleLength')
        .orderBy('matchPriority', 'ASC') // 完全匹配 > 前缀匹配 > 包含匹配
        .addOrderBy('matchPosition', 'ASC') // 相同优先级时，匹配位置越靠前越好
        .addOrderBy('titleLength', 'ASC') // 相同匹配度时，标题越短越好（精确匹配）
        .addOrderBy('series.createdAt', 'DESC'); // 最后按创建时间排序

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
        upStatus: s.upStatus || (s.statusOption?.name ? `${s.statusOption.name}` : '已完结'),
        upCount: 0,
        author: s.starring || s.actor || '', // 使用主演或演员作为作者
        description: s.description || '', // 使用描述字段
        cidMapper: s.category?.id?.toString() || '0',
        isRecommend: false, // 默认不推荐，可根据实际业务逻辑调整
        createdAt: s.createdAt ? DateUtil.formatDateTime(s.createdAt) : DateUtil.formatDateTime(new Date()),
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
}