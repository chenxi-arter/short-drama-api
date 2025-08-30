import { SelectQueryBuilder, ObjectLiteral } from 'typeorm';

/**
 * 数据库查询优化工具类
 * 对 TypeORM QueryBuilder 提供通用增强（分页/排序/搜索/状态/日期范围等）。
 * 注意：仅封装通用链式方法，不提交事务，不改变查询语义。
 */
export class QueryOptimizer {
  /**
   * 添加分页查询
   * @param queryBuilder 查询构建器
   * @param page 页码（从1开始）
   * @param limit 每页数量
   */
  static addPagination<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    page: number = 1,
    limit: number = 20
  ): SelectQueryBuilder<T> {
    const skip = (page - 1) * limit;
    return queryBuilder.skip(skip).take(limit);
  }

  /**
   * 添加排序
   * @param queryBuilder 查询构建器
   * @param sortField 排序字段
   * @param sortOrder 排序方向
   */
  static addSorting<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    sortField: string,
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): SelectQueryBuilder<T> {
    return queryBuilder.orderBy(sortField, sortOrder);
  }

  /**
   * 添加多字段排序
   * @param queryBuilder 查询构建器
   * @param sortOptions 排序选项数组
   */
  static addMultipleSorting<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    sortOptions: Array<{ field: string; order: 'ASC' | 'DESC' }>
  ): SelectQueryBuilder<T> {
    sortOptions.forEach((option, index) => {
      if (index === 0) {
        queryBuilder.orderBy(option.field, option.order);
      } else {
        queryBuilder.addOrderBy(option.field, option.order);
      }
    });
    return queryBuilder;
  }

  /**
   * 添加搜索条件
   * @param queryBuilder 查询构建器
   * @param searchFields 搜索字段数组
   * @param searchTerm 搜索词
   * @param alias 表别名
   */
  static addSearch<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    searchFields: string[],
    searchTerm: string,
    alias: string = 'entity'
  ): SelectQueryBuilder<T> {
    if (!searchTerm || searchFields.length === 0) {
      return queryBuilder;
    }

    const searchConditions = searchFields
      .map((field, index) => `${alias}.${field} LIKE :searchTerm${index}`)
      .join(' OR ');

    const parameters: Record<string, string> = {};
    searchFields.forEach((_, index) => {
      parameters[`searchTerm${index}`] = `%${searchTerm}%`;
    });

    return queryBuilder.andWhere(`(${searchConditions})`, parameters);
  }

  /**
   * 添加日期范围筛选
   * @param queryBuilder 查询构建器
   * @param dateField 日期字段
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @param alias 表别名
   */
  static addDateRange<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    dateField: string,
    startDate?: Date,
    endDate?: Date,
    alias: string = 'entity'
  ): SelectQueryBuilder<T> {
    if (startDate) {
      queryBuilder.andWhere(`${alias}.${dateField} >= :startDate`, { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere(`${alias}.${dateField} <= :endDate`, { endDate });
    }
    return queryBuilder;
  }

  /**
   * 添加IN条件筛选
   * @param queryBuilder 查询构建器
   * @param field 字段名
   * @param values 值数组
   * @param alias 表别名
   */
  static addInCondition<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    field: string,
    values: any[],
    alias: string = 'entity'
  ): SelectQueryBuilder<T> {
    if (values && values.length > 0) {
      queryBuilder.andWhere(`${alias}.${field} IN (:...${field}Values)`, {
        [`${field}Values`]: values,
      });
    }
    return queryBuilder;
  }

  /**
   * 添加状态筛选
   * @param queryBuilder 查询构建器
   * @param statusField 状态字段
   * @param status 状态值
   * @param alias 表别名
   */
  static addStatusFilter<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    statusField: string,
    status?: number | string,
    alias: string = 'entity'
  ): SelectQueryBuilder<T> {
    if (status !== undefined && status !== null) {
      queryBuilder.andWhere(`${alias}.${statusField} = :status`, { status });
    }
    return queryBuilder;
  }

  /**
   * 优化查询性能 - 添加索引提示
   * @param queryBuilder 查询构建器
   * @param indexName 索引名称
   */
  static addIndexHint<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    indexName: string
  ): SelectQueryBuilder<T> {
    // MySQL索引提示
    return queryBuilder.addSelect(`/*+ USE INDEX (${indexName}) */`);
  }

  /**
   * 获取分页信息
   * @param total 总数
   * @param page 当前页
   * @param limit 每页数量
   */
  static getPaginationInfo(total: number, page: number, limit: number) {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      total,
      page,
      limit,
      totalPages,
      hasNext,
      hasPrev,
    };
  }
}