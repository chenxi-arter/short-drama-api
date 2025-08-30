import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Series } from '../entity/series.entity';
import { Episode } from '../entity/episode.entity';
import { EpisodeUrl } from '../entity/episode-url.entity';
import { IngestSeriesDto } from '../dto/ingest-series.dto';
import { AccessKeyUtil } from '../../shared/utils/access-key.util';
import { UpdateIngestSeriesDto } from '../dto/update-ingest-series.dto';

@Injectable()
export class IngestService {
  constructor(
    @InjectRepository(Series) private readonly seriesRepo: Repository<Series>,
    @InjectRepository(Episode) private readonly episodeRepo: Repository<Episode>,
    @InjectRepository(EpisodeUrl) private readonly urlRepo: Repository<EpisodeUrl>,
  ) {}

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
      series = this.seriesRepo.create({
        title: payload.title,
        externalId: payload.externalId,
        description: payload.description,
        coverUrl: payload.coverUrl,
        categoryId: payload.categoryId,
        status: payload.status ?? 'on-going',
        releaseDate: payload.releaseDate ? new Date(payload.releaseDate) : undefined,
        isCompleted: payload.isCompleted ?? false,
        score: payload.score ?? 0,
        playCount: payload.playCount ?? 0,
        upStatus: payload.upStatus ?? 'up',
        upCount: payload.upCount ?? 0,
        starring: payload.starring,
        actor: payload.actor,
        director: payload.director,
        regionOptionId: payload.regionOptionId,
        languageOptionId: payload.languageOptionId,
        statusOptionId: payload.statusOptionId,
        yearOptionId: payload.yearOptionId,
      });
    } else {
      action = 'updated';
      series.externalId = payload.externalId || series.externalId;
      series.description = payload.description;
      series.coverUrl = payload.coverUrl;
      series.categoryId = payload.categoryId;
      if (payload.status !== undefined) series.status = payload.status;
      if (payload.releaseDate !== undefined) series.releaseDate = new Date(payload.releaseDate);
      if (payload.isCompleted !== undefined) series.isCompleted = payload.isCompleted;
      if (payload.score !== undefined) series.score = payload.score;
      if (payload.playCount !== undefined) series.playCount = payload.playCount;
      if (payload.upStatus !== undefined) series.upStatus = payload.upStatus;
      if (payload.upCount !== undefined) series.upCount = payload.upCount;
      if (payload.starring !== undefined) series.starring = payload.starring;
      if (payload.actor !== undefined) series.actor = payload.actor;
      if (payload.director !== undefined) series.director = payload.director;
      series.regionOptionId = payload.regionOptionId;
      series.languageOptionId = payload.languageOptionId;
      series.statusOptionId = payload.statusOptionId;
      series.yearOptionId = payload.yearOptionId;
    }
    series = await this.seriesRepo.save(series);

    // 2) episodes upsert by (seriesId, episodeNumber)
    for (const ep of payload.episodes || []) {
      let episode = await this.episodeRepo.findOne({ where: { seriesId: series.id, episodeNumber: ep.episodeNumber } });
      if (!episode) {
        episode = this.episodeRepo.create({
          seriesId: series.id,
          episodeNumber: ep.episodeNumber,
          title: ep.title ?? `第${ep.episodeNumber}集`,
          duration: ep.duration ?? 0,
          status: ep.status ?? 'published',
        });
      } else {
        if (ep.title !== undefined) episode.title = ep.title;
        if (ep.duration !== undefined) episode.duration = ep.duration;
        if (ep.status !== undefined) episode.status = ep.status;
      }
      episode = await this.episodeRepo.save(episode);

      // 3) replace urls for the episode (idempotent strategy: clear and insert)
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

    // update total episodes
    const count = await this.episodeRepo.count({ where: { seriesId: series.id } });
    await this.seriesRepo.update(series.id, { totalEpisodes: count });

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
    if (payload.status !== undefined) update.status = payload.status;
    if (payload.releaseDate !== undefined) update.releaseDate = new Date(payload.releaseDate);
    if (payload.isCompleted !== undefined) update.isCompleted = payload.isCompleted;
    if (payload.score !== undefined) update.score = payload.score;
    if (payload.playCount !== undefined) update.playCount = payload.playCount;
    if (payload.upStatus !== undefined) update.upStatus = payload.upStatus;
    if (payload.upCount !== undefined) update.upCount = payload.upCount;
    if (payload.starring !== undefined) update.starring = payload.starring;
    if (payload.actor !== undefined) update.actor = payload.actor;
    if (payload.director !== undefined) update.director = payload.director;
    if (payload.regionOptionId !== undefined) update.regionOptionId = payload.regionOptionId;
    if (payload.languageOptionId !== undefined) update.languageOptionId = payload.languageOptionId;
    if (payload.statusOptionId !== undefined) update.statusOptionId = payload.statusOptionId;
    if (payload.yearOptionId !== undefined) update.yearOptionId = payload.yearOptionId;
    if (Object.keys(update).length) {
      await this.seriesRepo.update(series.id, update);
    }

    // 更新剧集与URL
    if (Array.isArray(payload.episodes)) {
      const seenEpisodeNumbers = new Set<number>();
      for (const ep of payload.episodes) {
        seenEpisodeNumbers.add(ep.episodeNumber);
        let episode = await this.episodeRepo.findOne({ where: { seriesId: series.id, episodeNumber: ep.episodeNumber } });
        if (!episode) {
          episode = this.episodeRepo.create({
            seriesId: series.id,
            episodeNumber: ep.episodeNumber,
            title: ep.title ?? `第${ep.episodeNumber}集`,
            duration: ep.duration ?? 0,
            status: ep.status ?? 'published',
          });
        } else {
          if (ep.title !== undefined) episode.title = ep.title;
          if (ep.duration !== undefined) episode.duration = ep.duration;
          if (ep.status !== undefined) episode.status = ep.status;
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

    // 更新 totalEpisodes
    const count = await this.episodeRepo.count({ where: { seriesId: series.id } });
    await this.seriesRepo.update(series.id, { totalEpisodes: count });

    return { seriesId: series.id, shortId: series.shortId, externalId: series.externalId ?? null };
  }
}


