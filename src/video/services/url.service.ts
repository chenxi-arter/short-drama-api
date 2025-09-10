import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PlayCountService } from './play-count.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Episode } from '../entity/episode.entity';
import { EpisodeUrl } from '../entity/episode-url.entity';
import { Series } from '../entity/series.entity';
import { AccessKeyUtil } from '../../shared/utils/access-key.util';

/**
 * URL服务
 * 专门处理播放地址和访问密钥相关的业务逻辑
 */
@Injectable()
export class UrlService {
  constructor(
    @InjectRepository(Episode)
    private readonly episodeRepo: Repository<Episode>,
    @InjectRepository(EpisodeUrl)
    private readonly episodeUrlRepo: Repository<EpisodeUrl>,
    @InjectRepository(Series)
    private readonly seriesRepo: Repository<Series>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly playCountService: PlayCountService,
  ) {}

  /**
   * 优先使用 Redis 递增系列播放次数，失败时回退到 MySQL 原子自增
   */
  private async incrementSeriesPlayCount(seriesId: number): Promise<void> {
    await this.playCountService.increment(seriesId);
  }

  /**
   * 创建剧集播放地址
   * @param episodeId 剧集ID
   * @param quality 清晰度
   * @param ossUrl OSS地址
   * @param cdnUrl CDN地址
   * @param subtitleUrl 字幕地址
   */
  async createEpisodeUrl(
    episodeId: number,
    quality: string,
    ossUrl: string,
    cdnUrl: string,
    subtitleUrl?: string
  ) {
    try {
      // 检查剧集是否存在
      const episode = await this.episodeRepo.findOne({
        where: { id: episodeId },
        relations: ['series']
      });

      if (!episode) {
        throw new Error('剧集不存在');
      }

      // 检查是否已存在相同清晰度的URL
      let episodeUrl = await this.episodeUrlRepo.findOne({
        where: { episodeId, quality }
      });

      if (episodeUrl) {
        // 更新现有URL
        episodeUrl.ossUrl = ossUrl;
        episodeUrl.cdnUrl = cdnUrl;
        episodeUrl.subtitleUrl = subtitleUrl || null;
      } else {
        // 创建新URL
        episodeUrl = this.episodeUrlRepo.create({
          episodeId,
          quality,
          ossUrl,
          cdnUrl,
          subtitleUrl: subtitleUrl || null,
          originUrl: cdnUrl, // 默认使用CDN地址作为原始地址
        });
      }

      const saved = await this.episodeUrlRepo.save(episodeUrl);

      return {
        code: 200,
        data: {
          id: saved.id,
          episodeId: saved.episodeId,
          quality: saved.quality,
          accessKey: saved.accessKey,
          ossUrl: saved.ossUrl,
          cdnUrl: saved.cdnUrl,
          subtitleUrl: saved.subtitleUrl
        },
        msg: '播放地址创建成功'
      };
    } catch (error) {
      console.error('创建剧集播放地址失败:', error);
      throw new Error('创建剧集播放地址失败');
    }
  }

  /**
   * 通过访问密钥获取播放地址
   * @param accessKey 访问密钥
   */
  async getEpisodeUrlByAccessKey(accessKey: string) {
    try {
      const episodeUrl = await this.episodeUrlRepo.findOne({
        where: { accessKey },
        relations: ['episode', 'episode.series']
      });

      if (!episodeUrl) {
        throw new Error('播放地址不存在或访问密钥无效');
      }

      // ✅ 访问播放地址时，优先用Redis计数，失败回退MySQL
      if (episodeUrl.episode?.series?.id) {
        await this.incrementSeriesPlayCount(episodeUrl.episode.series.id);
      }

      return {
        code: 200,
        data: {
          ossUrl: episodeUrl.ossUrl,
          cdnUrl: episodeUrl.cdnUrl,
          originUrl: episodeUrl.originUrl,
          subtitleUrl: episodeUrl.subtitleUrl,
          quality: episodeUrl.quality,
          episodeId: episodeUrl.episodeId,
          episodeTitle: episodeUrl.episode?.title,
          seriesTitle: episodeUrl.episode?.series?.title
        },
        msg: '获取成功'
      };
    } catch (error) {
      console.error('通过访问密钥获取播放地址失败:', error);
      throw new Error('播放地址不存在或访问密钥无效');
    }
  }

  /**
   * 通过键值获取播放地址（支持不同的键格式）
   * @param prefix 前缀（ep 或 url）
   * @param key 密钥
   */
  async getEpisodeUrlByKey(prefix: string, key: string) {
    try {
      if (prefix === 'ep') {
        // 剧集级访问：通过episode的accessKey获取该集的所有地址
        const episode = await this.episodeRepo.findOne({
          where: { accessKey: key },
          relations: ['urls', 'series']
        });

        if (!episode) {
          throw new Error('剧集不存在或访问密钥无效');
        }

        // ✅ 以剧集级 accessKey 获取播放列表时，优先用Redis计数，失败回退MySQL
        if (episode.series?.id) {
          await this.incrementSeriesPlayCount(episode.series.id);
        }

        return {
          code: 200,
          data: {
            episodeId: episode.id,
            episodeTitle: episode.title,
            episodeNumber: episode.episodeNumber,
            seriesTitle: episode.series?.title,
            urls: episode.urls?.map(url => ({
              quality: url.quality,
              ossUrl: url.ossUrl,
              cdnUrl: url.cdnUrl,
              originUrl: url.originUrl,
              subtitleUrl: url.subtitleUrl,
              accessKey: url.accessKey
            })) || []
          },
          msg: '获取成功'
        };
      } else if (prefix === 'url') {
        // 地址级访问：通过具体URL的accessKey获取单个地址
        return await this.getEpisodeUrlByAccessKey(key);
      } else {
        throw new Error('无效的前缀，仅支持 ep 或 url');
      }
    } catch (error) {
      console.error('通过键值获取播放地址失败:', error);
      throw error;
    }
  }

  /**
   * 为现有数据生成访问密钥
   */
  async generateAccessKeysForExisting() {
    try {
      let updatedCount = 0;

      // 为没有accessKey的Episode生成
      const episodesWithoutKey = await this.episodeRepo.find({
        where: { accessKey: '' } // ✅ 修复null类型错误
      });

      for (const episode of episodesWithoutKey) {
        episode.accessKey = AccessKeyUtil.generateAccessKey(32);
        await this.episodeRepo.save(episode);
        updatedCount++;
      }

      // 为没有accessKey的EpisodeUrl生成
      const urlsWithoutKey = await this.episodeUrlRepo.find({
        where: { accessKey: '' }, // ✅ 修复null类型错误
        relations: ['episode', 'episode.series']
      });

      for (const url of urlsWithoutKey) {
        if (url.episode?.series?.externalId) {
          // 使用确定性生成
          url.accessKey = AccessKeyUtil.generateFromString(
            `${url.episode.series.externalId}:${url.episode.episodeNumber}:${url.quality}`
          );
        } else {
          // 使用随机生成
          url.accessKey = AccessKeyUtil.generateAccessKey(32);
        }
        await this.episodeUrlRepo.save(url);
        updatedCount++;
      }

      return {
        code: 200,
        data: {
          updatedCount,
          message: `已为 ${updatedCount} 个记录生成访问密钥`
        },
        msg: '访问密钥生成完成'
      };
    } catch (error) {
      console.error('生成访问密钥失败:', error);
      throw new Error('生成访问密钥失败');
    }
  }

  /**
   * 更新剧集续集状态
   * @param episodeId 剧集ID
   * @param hasSequel 是否有续集
   */
  async updateEpisodeSequel(episodeId: number, hasSequel: boolean) {
    try {
      const episode = await this.episodeRepo.findOne({
        where: { id: episodeId }
      });

      if (!episode) {
        throw new Error('剧集不存在');
      }

      episode.hasSequel = hasSequel;
      await this.episodeRepo.save(episode);

      return {
        code: 200,
        data: {
          episodeId: episode.id,
          hasSequel: episode.hasSequel
        },
        msg: '续集状态更新成功'
      };
    } catch (error) {
      console.error('更新剧集续集状态失败:', error);
      throw new Error('更新剧集续集状态失败');
    }
  }
}
