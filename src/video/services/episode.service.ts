import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Episode } from '../entity/episode.entity';
import { EpisodeUrl } from '../entity/episode-url.entity';
import { AccessKeyUtil } from '../../shared/utils/access-key.util';

/**
 * 剧集管理服务
 * 负责剧集和播放地址的管理
 */
@Injectable()
export class EpisodeService {
  constructor(
    @InjectRepository(Episode)
    private readonly episodeRepo: Repository<Episode>,
    @InjectRepository(EpisodeUrl)
    private readonly episodeUrlRepo: Repository<EpisodeUrl>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  /**
   * 创建剧集播放地址
   */
  async createEpisodeUrl(
    episodeId: number,
    quality: string,
    ossUrl: string,
    cdnUrl: string,
    subtitleUrl?: string
  ) {
    const episodeUrl = this.episodeUrlRepo.create({
      episodeId,
      quality,
      ossUrl,
      cdnUrl,
      subtitleUrl,
      accessKey: AccessKeyUtil.generateAccessKey(),
    });
    
    const saved = await this.episodeUrlRepo.save(episodeUrl);
    
    // 清除相关缓存
    await this.clearEpisodeCache(episodeId.toString());
    
    return saved;
  }

  /**
   * 通过访问密钥获取播放地址
   */
  async getEpisodeUrlByAccessKey(accessKey: string) {
    if (!AccessKeyUtil.isValidAccessKey(accessKey)) {
      throw new BadRequestException('无效的访问密钥格式');
    }
    
    const episodeUrl = await this.episodeUrlRepo.findOne({
      where: { accessKey },
      relations: ['episode', 'episode.series'],
    });
    
    if (!episodeUrl) {
      throw new NotFoundException('播放地址不存在或已过期');
    }
    
    return episodeUrl;
  }

  /**
   * 更新剧集续集状态
   */
  async updateEpisodeSequel(episodeId: number, hasSequel: boolean) {
    await this.episodeRepo.update(episodeId, { hasSequel });
    
    // 清除相关缓存
    await this.clearEpisodeCache(episodeId.toString());
    
    return { ok: true };
  }

  /**
   * 批量为现有播放地址生成访问密钥
   */
  async generateAccessKeysForExisting() {
    const episodeUrls = await this.episodeUrlRepo.find({
      where: { accessKey: '' },
    });
    
    const updates = episodeUrls.map(url => {
      url.accessKey = AccessKeyUtil.generateAccessKey();
      return url;
    });
    
    if (updates.length > 0) {
      await this.episodeUrlRepo.save(updates);
      
      // 清除所有相关缓存
      await this.clearAllCache();
    }
    
    return { updated: updates.length };
  }

  /**
   * 获取剧集详情（通过ID）
   */
  async getEpisodeById(episodeId: number) {
    return this.episodeRepo.findOne({
      where: { id: episodeId },
      relations: ['series', 'urls'],
    });
  }

  /**
   * 获取剧集详情（通过ShortID）
   */
  async getEpisodeByShortId(episodeShortId: string) {
    return this.episodeRepo.findOne({
      where: { shortId: episodeShortId },
      relations: ['series', 'urls'],
    });
  }

  /**
   * 获取剧集的播放地址列表
   */
  async getEpisodeUrls(episodeId: number) {
    return this.episodeUrlRepo.find({
      where: { episodeId },
      order: { quality: 'DESC' },
    });
  }

  /**
   * 更新剧集播放次数
   */
  async incrementPlayCount(episodeId: number) {
    await this.episodeRepo.increment({ id: episodeId }, 'playCount', 1);
    
    // 清除相关缓存
    await this.clearEpisodeCache(episodeId.toString());
    
    return { ok: true };
  }

  /**
   * 删除剧集播放地址
   */
  async deleteEpisodeUrl(urlId: number) {
    const episodeUrl = await this.episodeUrlRepo.findOne({
      where: { id: urlId },
    });
    
    if (!episodeUrl) {
      throw new Error('播放地址不存在');
    }
    
    await this.episodeUrlRepo.remove(episodeUrl);
    
    // 清除相关缓存
    await this.clearEpisodeCache(episodeUrl.episodeId.toString());
    
    return { ok: true };
  }

  /**
   * 清除剧集相关缓存
   */
  private async clearEpisodeCache(episodeId: string) {
    try {
      // 清除视频详情缓存
      await this.cacheManager.del(`video_details_${episodeId}`);
      
      // 清除首页视频缓存
      const homeKeys = ['home_videos_1_1', 'home_videos_1_2', 'home_videos_1_3'];
      for (const key of homeKeys) {
        await this.cacheManager.del(key);
      }
      
      // 清除筛选器数据缓存
      const filterKeys = ['filter_data_1_0,0,0,0,0_1', 'filter_data_1_0,0,0,0,0_2'];
      for (const key of filterKeys) {
        await this.cacheManager.del(key);
      }
    } catch (error) {
      console.error('清除剧集缓存失败:', error);
    }
  }

  /**
   * 清除所有相关缓存
   */
  private async clearAllCache() {
    try {
      // 清除首页缓存
      const homeKeys = ['home_videos_1_1', 'home_videos_1_2', 'home_videos_1_3'];
      for (const key of homeKeys) {
        await this.cacheManager.del(key);
      }
      
      // 清除筛选器标签缓存
      await this.cacheManager.del('filter_tags_1');
      
      // 清除筛选器数据缓存
      const filterKeys = ['filter_data_1_0,0,0,0,0_1', 'filter_data_1_0,0,0,0,0_2', 'filter_data_1_0,0,0,0,0_3'];
      for (const key of filterKeys) {
        await this.cacheManager.del(key);
      }
    } catch (error) {
      console.error('清除所有缓存失败:', error);
    }
  }
}