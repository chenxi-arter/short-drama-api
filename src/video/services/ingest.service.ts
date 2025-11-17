import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Series } from '../entity/series.entity';
import { Episode } from '../entity/episode.entity';
import { EpisodeUrl } from '../entity/episode-url.entity';
import { IngestSeriesDto } from '../dto/ingest-series.dto';
import { AccessKeyUtil } from '../../shared/utils/access-key.util';
import { UpdateIngestSeriesDto } from '../dto/update-ingest-series.dto';
import { FilterType } from '../entity/filter-type.entity';
import { FilterOption } from '../entity/filter-option.entity';
import { FilterService } from './filter.service';
import { SeriesGenreOption } from '../entity/series-genre-option.entity';

@Injectable()
export class IngestService {
  constructor(
    @InjectRepository(Series) private readonly seriesRepo: Repository<Series>,
    @InjectRepository(Episode) private readonly episodeRepo: Repository<Episode>,
    @InjectRepository(EpisodeUrl) private readonly urlRepo: Repository<EpisodeUrl>,
    @InjectRepository(FilterType) private readonly filterTypeRepo: Repository<FilterType>,
    @InjectRepository(FilterOption) private readonly filterOptionRepo: Repository<FilterOption>,
    @InjectRepository(SeriesGenreOption) private readonly seriesGenreRepo: Repository<SeriesGenreOption>,
    private readonly filterService: FilterService,
  ) {}

  /**
   * 根据剧集进度自动更新 upStatus/totalEpisodes（upCount 改为实时计算，不再持久化）
   */
  private async updateSeriesProgress(seriesId: number, isCompleted?: boolean, status?: string) {
    const episodes = await this.episodeRepo.find({ where: { seriesId } });
    const total = episodes.length;
    let maxEpisodeNumber = 0;
    for (const e of episodes) {
      if (typeof (e as any).episodeNumber === 'number') {
        maxEpisodeNumber = Math.max(maxEpisodeNumber, (e as any).episodeNumber);
      }
    }
    const completed = isCompleted === true || status === 'completed';
    const upStatus = completed
      ? '已完结'
      : (maxEpisodeNumber > 0 ? `更新至第${maxEpisodeNumber}集` : '未发布');
    await this.seriesRepo.update(seriesId, { totalEpisodes: total, upStatus, updatedAt: new Date() as any });
  }

  /**
   * 解析筛选项ID：优先用传入的ID；否则按名称在指定类型下查找，不存在则创建。
   * @param typeCode filter_types.code，如 'region' | 'language' | 'status' | 'year'
   * @param id 可选，直接使用的ID
   * @param name 可选，按名称匹配/创建
   */
  /**
   * 解析筛选项ID：优先用传入的ID；否则按名称在指定类型下查找，不存在则创建。
   * ✅ 优化版：自动分配 display_order
   * @param typeCode filter_types.code，如 'region' | 'language' | 'status' | 'year'
   * @param name 可选，按名称匹配/创建
   */
  private async resolveOptionId(typeCode: string, name: string | undefined): Promise<number | undefined> {
    if (!name) return undefined;
    
    const fType = await this.filterTypeRepo.findOne({ where: { code: typeCode, isActive: true as any } as any });
    if (!fType) {
      throw new BadRequestException({
        message: '筛选器类型不存在',
        details: { typeCode },
      });
    }
    
    const existing = await this.filterOptionRepo.findOne({ where: { filterTypeId: fType.id, name } });
    if (existing) return existing.id;
    
    // ✅ 获取该类型下最大的 display_order，为新选项分配下一个编号
    const maxDisplayOrder = await this.filterOptionRepo
      .createQueryBuilder('option')
      .select('MAX(option.display_order)', 'maxOrder')
      .where('option.filter_type_id = :filterTypeId', { filterTypeId: fType.id })
      .getRawOne();
    
    const nextDisplayOrder = (maxDisplayOrder?.maxOrder || 0) + 1;
    
    const created = this.filterOptionRepo.create({ 
      filterTypeId: fType.id, 
      name, 
      value: name.toLowerCase(), // 设置合理的 value
      isDefault: false as any, 
      isActive: true as any, 
      sortOrder: nextDisplayOrder, // 保持 sortOrder 与 displayOrder 一致
      displayOrder: nextDisplayOrder // ✅ 自动分配 display_order
    });
    
    const saved = await this.filterOptionRepo.save(created);

    console.log(`[INGEST] 创建新筛选选项: ${typeCode}/${name}, display_order: ${nextDisplayOrder}, id: ${saved.id}`);

    // ✅ 新增选项后清理筛选器标签缓存，确保前端立刻能拉到新标签
    try {
      await this.filterService.clearAllFilterTagsCache();
    } catch (e) {
      console.warn('[INGEST] 清理筛选器标签缓存失败（忽略）:', e?.message || e);
    }

    return saved.id;
  }

  /**
   * 根据状态选项名称智能推断是否完结
   */
  private inferCompletedFromStatus(statusOptionName?: string): boolean {
    if (!statusOptionName) return false;
    const name = statusOptionName.toLowerCase();
    const completedKeywords = ['完结', '完成', 'ended', 'finished', 'completed', '完'];
    return completedKeywords.some(keyword => name.includes(keyword));
  }

  private async resolveGenreOptionIds(payload: { genreOptionNames?: string[] }): Promise<number[]> {
    const ids = new Set<number>();
    if (Array.isArray(payload.genreOptionNames)) {
      for (const name of payload.genreOptionNames) {
        // 题材归属 genre 组
        const id = await this.resolveOptionId('genre', name);
        if (id) ids.add(id);
      }
    }
    return Array.from(ids);
  }

  private async upsertSeriesGenres(seriesId: number, optionIds: number[], replace: boolean = false): Promise<void> {
    if (!Array.isArray(optionIds)) return;
    const unique = Array.from(new Set(optionIds.filter(x => typeof x === 'number' && x > 0)));
    if (replace) {
      if (unique.length === 0) {
        await this.seriesGenreRepo.delete({ seriesId });
        return;
      }
      // 删除未包含的旧关联
      await this.seriesGenreRepo.createQueryBuilder()
        .delete()
        .where('series_id = :sid AND option_id NOT IN (:...ids)', { sid: seriesId, ids: unique })
        .execute();
    }
    // upsert 新关联
    for (const oid of unique) {
      const exists = await this.seriesGenreRepo.findOne({ where: { seriesId, optionId: oid } });
      if (!exists) {
        const row = this.seriesGenreRepo.create({ seriesId, optionId: oid });
        await this.seriesGenreRepo.save(row);
      }
    }
  }

  /**
   * 根据标题（或可扩展唯一键）进行 upsert，写入系列/剧集/链接
   */
  async upsertSeries(payload: IngestSeriesDto): Promise<{ seriesId: number; shortId: string | null; externalId: string | null; action: 'created' | 'updated' }> {
    // 1) upsert series by title
    // 优先使用 externalId 作为唯一键
    let series: Series | null = null;
    if (payload.externalId) {
      series = await this.seriesRepo.findOne({ where: { externalId: payload.externalId } });
    }
    if (!series) {
      series = await this.seriesRepo.findOne({ where: { title: payload.title } });
    }
    let action: 'created' | 'updated' = 'updated';
    if (!series) {
      action = 'created';
      // 解析各筛选项（支持传入具体 optionId，或按名称自动创建）
      const regionId = (payload as any).regionOptionId ?? await this.resolveOptionId('region', payload.regionOptionName);
      const languageId = (payload as any).languageOptionId ?? await this.resolveOptionId('language', payload.languageOptionName);
      const statusId = (payload as any).statusOptionId ?? await this.resolveOptionId('status', payload.statusOptionName);
      const yearId = (payload as any).yearOptionId ?? await this.resolveOptionId('year', payload.yearOptionName);
      series = this.seriesRepo.create({
        title: payload.title,
        externalId: payload.externalId,
        description: payload.description,
        coverUrl: payload.coverUrl,
        categoryId: payload.categoryId,
        releaseDate: payload.releaseDate ? new Date(payload.releaseDate) : undefined,
        isCompleted: payload.isCompleted,
        score: payload.seriesScore ?? payload.score ?? 0, // 优先使用seriesScore，兼容score
        playCount: payload.playCount ?? 0,
        starring: payload.starring,
        actor: payload.actor,
        director: payload.director,
        regionOptionId: regionId,
        languageOptionId: languageId,
        statusOptionId: statusId,
        yearOptionId: yearId,
      });
    } else {
      action = 'updated';
      series.externalId = payload.externalId || series.externalId;
      series.description = payload.description;
      series.coverUrl = payload.coverUrl;
      series.categoryId = payload.categoryId;
      // ✅ 修复：允许在更新时变更完结状态
      if (payload.isCompleted !== undefined) {
        series.isCompleted = payload.isCompleted;
      }
      // status 字段已废弃，不再直接写入字符串状态
      if (payload.releaseDate !== undefined) series.releaseDate = new Date(payload.releaseDate);
      // 优先使用seriesScore，兼容score
      const scoreValue = payload.seriesScore ?? payload.score;
      if (scoreValue !== undefined) series.score = scoreValue;
      if (payload.playCount !== undefined) series.playCount = payload.playCount;
      // upStatus/upCount 自动维护
      if (payload.starring !== undefined) series.starring = payload.starring;
      if (payload.actor !== undefined) series.actor = payload.actor;
      if (payload.director !== undefined) series.director = payload.director;
      // 解析名称与ID（仅在传入时才更新）
      const regionId = (payload as any).regionOptionId ?? await this.resolveOptionId('region', payload.regionOptionName);
      const languageId = (payload as any).languageOptionId ?? await this.resolveOptionId('language', payload.languageOptionName);
      const statusId = (payload as any).statusOptionId ?? await this.resolveOptionId('status', payload.statusOptionName);
      const yearId = (payload as any).yearOptionId ?? await this.resolveOptionId('year', payload.yearOptionName);
      if (regionId !== undefined) series.regionOptionId = regionId;
      if (languageId !== undefined) series.languageOptionId = languageId;
      if (statusId !== undefined) series.statusOptionId = statusId;
      if (yearId !== undefined) series.yearOptionId = yearId;
    }
    series = await this.seriesRepo.save(series);

    // 2) genres upsert (append mode)
    try {
      const genreIds = await this.resolveGenreOptionIds(payload);
      if (genreIds.length) {
        await this.upsertSeriesGenres(series.id, genreIds, false);
      }
    } catch (e) {
      console.warn('[INGEST] 题材写入失败（忽略不中断）：', e?.message || e);
    }

    // 3) episodes upsert by (seriesId, episodeNumber)
    for (const ep of payload.episodes || []) {
      let episode = await this.episodeRepo.findOne({ where: { seriesId: series.id, episodeNumber: ep.episodeNumber } });
      
      if (!episode) {
        // 生成初始互动数据（让新剧集看起来有人气）
        const initialLikeCount = this.generateInitialLikeCount();
        const initialFavoriteCount = this.generateInitialFavoriteCount(initialLikeCount);
        const initialPlayCount = this.generateInitialPlayCount(initialLikeCount);
        
        episode = this.episodeRepo.create({
          seriesId: series.id,
          episodeNumber: ep.episodeNumber,
          title: ep.title ?? `第${ep.episodeNumber}集`,
          duration: ep.duration ?? 0,
          status: ep.status ?? 'published',
          isVertical: ep.isVertical ?? false,
          likeCount: initialLikeCount,
          favoriteCount: initialFavoriteCount,
          playCount: initialPlayCount,
          dislikeCount: Math.floor(Math.random() * 20), // 0-20个点踩
        });
      } else {
        if (ep.title !== undefined) episode.title = ep.title;
        if (ep.duration !== undefined) episode.duration = ep.duration;
        if (ep.status !== undefined) episode.status = ep.status;
        if (ep.isVertical !== undefined) episode.isVertical = ep.isVertical;
      }
      episode = await this.episodeRepo.save(episode);

      // 4) replace urls for the episode (idempotent strategy: clear and insert)
      if (Array.isArray(ep.urls)) {
        // 逐个 upsert，按 (episodeId, quality) 唯一
        for (const u of ep.urls) {
          const existing = await this.urlRepo.findOne({ where: { episodeId: episode.id, quality: u.quality } });
          if (existing) {
            if (u.ossUrl !== undefined) existing.ossUrl = u.ossUrl;
            if (u.cdnUrl !== undefined) existing.cdnUrl = u.cdnUrl;
            existing.subtitleUrl = u.subtitleUrl ?? null;
            existing.originUrl = u.originUrl;
            // 保持 accessKey 不变，确保稳定
            await this.urlRepo.save(existing);
          } else {
            const entity = this.urlRepo.create({
              episodeId: episode.id,
              quality: u.quality,
              ossUrl: u.ossUrl ?? '',
              cdnUrl: u.cdnUrl ?? (u.ossUrl ?? ''),
              subtitleUrl: u.subtitleUrl ?? null,
              originUrl: u.originUrl,
              // 使用外部ID + episodeNumber + quality 生成稳定 key（若有 externalId）
              accessKey: payload.externalId
                ? AccessKeyUtil.generateFromString(`${payload.externalId}:${ep.episodeNumber}:${u.quality}`)
                : undefined,
            });
            await this.urlRepo.save(entity);
          }
        }
      }
    }

    // 自动更新进度（upStatus/totalEpisodes）
    await this.updateSeriesProgress(series.id, series.isCompleted);

    // 如果传入 status=deleted，则做软删除标记
    if (payload.status === 'deleted') {
      await this.seriesRepo.update(series.id, { isActive: 0, deletedAt: new Date() as any, updatedAt: new Date() as any });
    } else {
      // 确保未被删除
      await this.seriesRepo.update(series.id, { isActive: 1, updatedAt: new Date() as any });
    }
    return { seriesId: series.id, shortId: series.shortId, externalId: series.externalId ?? null, action };
  }

  /**
   * 按 externalId 更新已有系列；支持可选的缺失清理
   */
  async updateSeries(payload: UpdateIngestSeriesDto): Promise<{ seriesId: number; shortId: string | null; externalId: string | null }> {
    const series = await this.seriesRepo.findOne({ where: { externalId: payload.externalId } });
    if (!series) {
      throw new NotFoundException({
        message: '系列不存在',
        details: { externalId: payload.externalId }
      });
    }

    // 更新系列基本信息（按提供字段）
    const update: Partial<Series> = {};
    if (payload.title !== undefined) update.title = payload.title;
    if (payload.description !== undefined) update.description = payload.description;
    if (payload.coverUrl !== undefined) update.coverUrl = payload.coverUrl;
    if (payload.categoryId !== undefined) update.categoryId = payload.categoryId;
    if (payload.isCompleted !== undefined) {
      update.isCompleted = payload.isCompleted;
    }
    if (payload.releaseDate !== undefined) update.releaseDate = new Date(payload.releaseDate);
    // 优先使用seriesScore，兼容score
    const scoreValue = payload.seriesScore ?? payload.score;
    if (scoreValue !== undefined) update.score = scoreValue;
    if (payload.playCount !== undefined) update.playCount = payload.playCount;
    // upStatus/upCount 自动维护
    if (payload.starring !== undefined) update.starring = payload.starring;
    if (payload.actor !== undefined) update.actor = payload.actor;
    if (payload.director !== undefined) update.director = payload.director;
    // 解析名称（仅在传入时才更新）
    const regionId = (payload as any).regionOptionId ?? await this.resolveOptionId('region', payload.regionOptionName);
    const languageId = (payload as any).languageOptionId ?? await this.resolveOptionId('language', payload.languageOptionName);
    const statusId = (payload as any).statusOptionId ?? await this.resolveOptionId('status', payload.statusOptionName);
    const yearId = (payload as any).yearOptionId ?? await this.resolveOptionId('year', payload.yearOptionName);
    if (regionId !== undefined) update.regionOptionId = regionId;
    if (languageId !== undefined) update.languageOptionId = languageId;
    if (statusId !== undefined) update.statusOptionId = statusId;
    if (yearId !== undefined) update.yearOptionId = yearId;
    if (payload.status === 'deleted') {
      // 软删除
      await this.seriesRepo.update(series.id, { isActive: 0, deletedAt: new Date() as any, updatedAt: new Date() as any });
    } else if (Object.keys(update).length) {
      await this.seriesRepo.update(series.id, { ...update, updatedAt: new Date() as any });
      // 恢复为活跃（如果之前被删除）
      await this.seriesRepo.update(series.id, { isActive: 1, deletedAt: null as any, updatedAt: new Date() as any });
    }

    // 更新题材与剧集/URL
    try {
      const genreIds = await this.resolveGenreOptionIds(payload);
      if (genreIds.length) {
        await this.upsertSeriesGenres(series.id, genreIds, !!payload.replaceGenres);
      } else if (payload.replaceGenres) {
        await this.upsertSeriesGenres(series.id, [], true);
      }
    } catch (e) {
      console.warn('[INGEST] 更新题材失败（忽略不中断）：', e?.message || e);
    }

    // 更新剧集与URL
    if (Array.isArray(payload.episodes)) {
      const seenEpisodeNumbers = new Set<number>();
      for (const ep of payload.episodes) {
        seenEpisodeNumbers.add(ep.episodeNumber);
        let episode = await this.episodeRepo.findOne({ where: { seriesId: series.id, episodeNumber: ep.episodeNumber } });
        if (!episode) {
          // 生成初始互动数据（让新剧集看起来有人气）
          const initialLikeCount = this.generateInitialLikeCount();
          const initialFavoriteCount = this.generateInitialFavoriteCount(initialLikeCount);
          const initialPlayCount = this.generateInitialPlayCount(initialLikeCount);
          
          episode = this.episodeRepo.create({
            seriesId: series.id,
            episodeNumber: ep.episodeNumber,
            title: ep.title ?? `第${ep.episodeNumber}集`,
            duration: ep.duration ?? 0,
            status: ep.status ?? 'published',
            isVertical: ep.isVertical ?? false,
            likeCount: initialLikeCount,
            favoriteCount: initialFavoriteCount,
            playCount: initialPlayCount,
            dislikeCount: Math.floor(Math.random() * 20), // 0-20个点踩
          });
        } else {
          if (ep.title !== undefined) episode.title = ep.title;
          if (ep.duration !== undefined) episode.duration = ep.duration;
          if (ep.status !== undefined) episode.status = ep.status;
          if (ep.isVertical !== undefined) episode.isVertical = ep.isVertical;
        }
        episode = await this.episodeRepo.save(episode);

        if (Array.isArray(ep.urls)) {
          const seenQualities = new Set<string>();
          for (const u of ep.urls) {
            seenQualities.add(u.quality);
            const existing = await this.urlRepo.findOne({ where: { episodeId: episode.id, quality: u.quality } });
            if (existing) {
              if (u.ossUrl !== undefined) existing.ossUrl = u.ossUrl;
              if (u.cdnUrl !== undefined) existing.cdnUrl = u.cdnUrl;
              if (u.subtitleUrl !== undefined) existing.subtitleUrl = u.subtitleUrl ?? null;
              if (u.originUrl !== undefined) existing.originUrl = u.originUrl;
              await this.urlRepo.save(existing);
            } else {
              const accessKey = AccessKeyUtil.generateFromString(`${payload.externalId}:${ep.episodeNumber}:${u.quality}`);
              const entity = this.urlRepo.create({
                episodeId: episode.id,
                quality: u.quality,
                ossUrl: u.ossUrl ?? '',
                cdnUrl: u.cdnUrl ?? (u.ossUrl ?? ''),
                originUrl: u.originUrl ?? (u.ossUrl ?? ''),
                subtitleUrl: u.subtitleUrl ?? null,
                accessKey: accessKey,
              });
              await this.urlRepo.save(entity);
            }
          }

          // 清理未出现的 URL（按需）
          if (payload.removeMissingUrls) {
            const toRemove = await this.urlRepo.find({ where: { episodeId: episode.id } });
            for (const r of toRemove) {
              if (!seenQualities.has(r.quality)) {
                await this.urlRepo.remove(r);
              }
            }
          }
        }
      }

      // 清理未出现的剧集（按需）
      if (payload.removeMissingEpisodes) {
        const all = await this.episodeRepo.find({ where: { seriesId: series.id } });
        for (const e of all) {
          if (!seenEpisodeNumbers.has(e.episodeNumber)) {
            // 先删 URL，再删 episode
            const urls = await this.urlRepo.find({ where: { episodeId: e.id } });
            if (urls.length) await this.urlRepo.remove(urls);
            await this.episodeRepo.remove(e);
          }
        }
      }
    }

    // 自动更新进度（upStatus/totalEpisodes）
    await this.updateSeriesProgress(series.id, (update.isCompleted ?? series.isCompleted));

    return { seriesId: series.id, shortId: series.shortId, externalId: series.externalId ?? null };
  }

  /**
   * 根据 externalId 获取系列进度信息（upStatus、totalEpisodes 等）
   */
  async getSeriesProgressByExternalId(externalId: string): Promise<{
    seriesId: number;
    shortId: string | null;
    externalId: string | null;
    upStatus: string | null;
    totalEpisodes: number;
    isCompleted: boolean;
  }> {
    const series = await this.seriesRepo.findOne({ where: { externalId } });
    if (!series) {
      throw new NotFoundException({
        message: '系列不存在',
        details: { externalId }
      });
    }

    // 确保进度是最新（轻量刷新一次）
    await this.updateSeriesProgress(series.id, series.isCompleted);
    await this.updateSeriesProgress(series.id, series.isCompleted);
    const refreshed = await this.seriesRepo.findOne({ where: { id: series.id } });

    return {
      seriesId: refreshed!.id,
      shortId: refreshed!.shortId ?? null,
      externalId: refreshed!.externalId ?? null,
      upStatus: refreshed!.upStatus ?? null,
      totalEpisodes: refreshed!.totalEpisodes,
      isCompleted: !!refreshed!.isCompleted,
    };
  }

  /**
   * 生成初始点赞数（适配推荐算法）
   * 20% 热门：800-1500
   * 30% 中等：200-800
   * 50% 普通：20-200
   */
  private generateInitialLikeCount(): number {
    const rand = Math.random();
    if (rand > 0.8) {
      // 20% 热门剧
      return Math.floor(800 + Math.random() * 700); // 800-1500
    } else if (rand > 0.5) {
      // 30% 中等
      return Math.floor(200 + Math.random() * 600); // 200-800
    } else {
      // 50% 普通
      return Math.floor(20 + Math.random() * 180); // 20-200
    }
  }

  /**
   * 生成初始收藏数（点赞数的8%-15%，最高200）
   */
  private generateInitialFavoriteCount(likeCount: number): number {
    const percentage = 0.08 + Math.random() * 0.07; // 8%-15%
    const favoriteCount = Math.floor(likeCount * percentage);
    return Math.min(favoriteCount, 200); // 最高不超过200
  }

  /**
   * 生成初始播放数（点赞数的3-8倍）
   */
  private generateInitialPlayCount(likeCount: number): number {
    const multiplier = 3 + Math.random() * 5; // 3-8倍
    return Math.floor(likeCount * multiplier);
  }
}


