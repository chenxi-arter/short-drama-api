import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WatchProgress } from './entity/watch-progress.entity';
import { Comment } from './entity/comment.entity';
import { Category } from './entity/category.entity';
import { Series } from './entity/series.entity';
import { Episode } from './entity/episode.entity';

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
  
}