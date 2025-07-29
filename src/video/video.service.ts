import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WatchProgress } from './entity/watch-progress.entity';
import { Comment } from './entity/comment.entity';
import { Category } from './entity/category.entity';
import { Series } from './entity/series.entity';
import { Episode } from './entity/episode.entity';
import { ShortVideo } from "./entity/short-video.entity";

@Injectable()
export class VideoService {
  constructor(
    @InjectRepository(WatchProgress)
    private readonly wpRepo: Repository<WatchProgress>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
     /* 原有... */
    @InjectRepository(Category) private readonly catRepo: Repository<Category>,
    @InjectRepository(Series)  private readonly seriesRepo: Repository<Series>,
    @InjectRepository(ShortVideo) private readonly shortRepo: Repository<ShortVideo>,
    @InjectRepository(Episode) private readonly epRepo: Repository<Episode>,
  ) {}
   /* 列出所有分类 */
  async listCategories() {
    return this.catRepo.find({ order: { id: 'ASC' } });
  }

  /* 根据分类 id 查短剧（电视剧）列表 */
  async listSeriesByCategory(categoryId: number) {
    return this.seriesRepo.find({
      where: { category: { id: categoryId } },
      order: { createdAt: 'DESC' },
    });
  }

  /* 根据短剧 id 查详情（含所有剧集） */
  async getSeriesDetail(seriesId: number) {
    return this.seriesRepo.findOne({
      where: { id: seriesId },
      relations: ['category', 'episodes', 'episodes.urls'],
    });
  }

  /* 断点：写/读 */
  async saveProgress(userId: number, episodeId: number, stopAtSecond: number) {
    await this.wpRepo.upsert(
      { userId, episodeId, stopAtSecond },
      ['userId', 'episodeId'],
    );
    return { ok: true };
  }

  async getProgress(userId: number, episodeId: number) {
    const row = await this.wpRepo.findOne({ where: { userId, episodeId } });
    return { stopAtSecond: row?.stopAtSecond || 0 };
  }

  /* 发弹幕/评论 */
  async addComment(userId: number, episodeId: number, content: string, appearSecond?: number) {
    const c = this.commentRepo.create({
      userId,
      episodeId,
      content,
      appearSecond: appearSecond ?? 0,
    });
    await this.commentRepo.save(c);
    return c;
  }
 
async listMedia(
  categoryId?: number,
  type?: 'short' | 'series',
  userId?: number,
  sort: 'latest' | 'like' | 'play' = 'latest',
  page = 1,
  size = 20,
) {
  const skip = (page - 1) * size;

// 1. 短视频
if (type === 'short') {
  const qb = this.shortRepo
    .createQueryBuilder('sv')
    .leftJoinAndSelect('sv.category', 'c')
    .orderBy({
      'sv.likeCount': sort === 'like' ? 'DESC' : sort === 'play' ? 'DESC' : 'ASC',
      'sv.createdAt': 'DESC',
    })
    .skip(skip)
    .take(size);

  if (categoryId) {
    qb.where('sv.category_id = :categoryId', { categoryId }); // ✅ 这里改成数据库列名
  }

  return qb.getManyAndCount();
}

// 2. Series
const qb = this.seriesRepo
  .createQueryBuilder('s')
  .leftJoinAndSelect('s.category', 'c')
  .leftJoinAndSelect('s.episodes', 'ep')
  .orderBy({
    's.createdAt': 'DESC',
  })
  .skip(skip)
  .take(size);

if (categoryId) {
  qb.where('s.category_id = :categoryId', { categoryId }); // ✅ 同样改这里
}


  const [rows, total] = await qb.getManyAndCount();
  return {
    list: rows.map(r => ({
      id: r.id,
      title: r.title,
      coverUrl: r.coverUrl,
      totalEpisodes: r.totalEpisodes,
      categoryName: r.category?.name || '',
      latestEpisode: r.episodes?.[0]?.episodeNumber || 0,
    })),
    total,
    page,
    size,
  };
}
async listSeriesFull(
  categoryId?: number,
  page = 1,
  size = 20,
) {
  console.log(1121212);
  
  const skip = (page - 1) * size;
  const qb = this.seriesRepo
    .createQueryBuilder('s')
    .leftJoinAndSelect('s.category', 'c')
    .leftJoinAndSelect('s.episodes', 'ep')
    .orderBy('s.createdAt', 'DESC')
    .addOrderBy('ep.episodeNumber', 'ASC')
    .skip(skip)
    .take(size);
  

  if (categoryId) {
    qb.where('s.category_id = :categoryId', { categoryId });
  }

  const [rows, total] = await qb.getManyAndCount();

  // 组装成干净结构
  return {
    list: rows.map(series => ({
      id: series.id,
      title: series.title,
      description: series.description,
      coverUrl: series.coverUrl,
      totalEpisodes: series.totalEpisodes,
      categoryName: series.category?.name || '',
      createdAt: series.createdAt,
      episodes: series.episodes.map(ep => ({
        id: ep.id,
        episodeNumber: ep.episodeNumber,
        title: ep.title,
        duration: ep.duration,
        status: ep.status,
      })),
    })),
    total,
    page,
    size,
  };
}
  
}