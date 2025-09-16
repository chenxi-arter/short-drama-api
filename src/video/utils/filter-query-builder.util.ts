import { SelectQueryBuilder } from 'typeorm';

export class FilterQueryBuilderUtil {
  static applySorting(qb: SelectQueryBuilder<any>, sortType: number) {
    switch (sortType) {
      case 1:
        qb.orderBy('series.playCount', 'DESC'); // 人气最高
        break;
      case 2:
        qb.orderBy('series.score', 'DESC'); // 评分最高
        break;
      default:
        qb.orderBy('series.updatedAt', 'DESC')
          .addOrderBy('series.createdAt', 'DESC')
          .addOrderBy('series.id', 'DESC'); // 默认按更新时间排序
    }
  }

  static applyChannel(qb: SelectQueryBuilder<any>, channelId?: string) {
    if (channelId && channelId !== '0') {
      const isNumeric = /^\d+$/.test(channelId);
      if (isNumeric) {
        qb.andWhere('category.id = :channelId', { channelId: parseInt(channelId, 10) });
      } else {
        qb.andWhere('category.category_id = :categoryId', { categoryId: channelId });
      }
    }
  }

  static applyType(qb: SelectQueryBuilder<any>, optionId: number) {
    qb.andWhere('category.id = :typeId', { typeId: optionId });
  }

  static applyRegion(qb: SelectQueryBuilder<any>, optionId: number) {
    qb.andWhere('series.region_option_id = :regionId', { regionId: optionId });
  }

  static applyLanguage(qb: SelectQueryBuilder<any>, optionId: number) {
    qb.andWhere('series.language_option_id = :languageId', { languageId: optionId });
  }

  static applyYear(qb: SelectQueryBuilder<any>, optionId: number) {
    qb.andWhere('series.year_option_id = :yearId', { yearId: optionId });
  }

  static applyStatus(qb: SelectQueryBuilder<any>, optionId: number) {
    qb.andWhere('series.status_option_id = :statusId', { statusId: optionId });
  }
}


