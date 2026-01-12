import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from '../user/entity/user.entity';

/**
 * 异步账户合并服务
 * 适合大数据量场景，立即返回，后台处理
 * 
 * 使用方法：
 * 1. 安装 Bull: npm install @nestjs/bull bull
 * 2. 安装 Redis: 确保Redis运行中
 * 3. 在 auth.module.ts 中配置 BullModule
 */

interface MergeStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  guestUserId: number;
  targetUserId: number;
  progress?: number;
  stats?: any;
  error?: string;
  startTime?: Date;
  endTime?: Date;
}

@Injectable()
export class AccountMergeAsyncService {
  private readonly logger = new Logger(AccountMergeAsyncService.name);
  
  // 存储合并任务状态（生产环境应使用Redis）
  private mergeJobs = new Map<string, MergeStatus>();

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 提交合并任务到队列
   * 立即返回jobId，不等待合并完成
   */
  queueMerge(guestUserId: number, targetUserId: number): { jobId: string; message: string } {
    const jobId = `merge_${guestUserId}_${targetUserId}_${Date.now()}`;
    
    // 创建任务状态
    const jobStatus: MergeStatus = {
      jobId,
      status: 'pending',
      guestUserId,
      targetUserId,
      startTime: new Date(),
    };
    
    this.mergeJobs.set(jobId, jobStatus);
    
    this.logger.log(`[异步合并] 任务已加入队列: ${jobId}`);
    
    // 异步执行合并（不等待完成）
    void this.executeMergeInBackground(jobId, guestUserId, targetUserId);
    
    return {
      jobId,
      message: '数据合并任务已提交，请稍后查询合并状态',
    };
  }

  /**
   * 后台执行合并任务
   */
  private async executeMergeInBackground(jobId: string, guestUserId: number, targetUserId: number) {
    const job = this.mergeJobs.get(jobId);
    if (!job) return;

    try {
      job.status = 'processing';
      this.logger.log(`[异步合并] 开始处理任务: ${jobId}`);

      // 执行合并（使用优化的批量SQL）
      const stats = await this.performMerge(guestUserId, targetUserId, (progress) => {
        job.progress = progress;
      });

      job.status = 'completed';
      job.stats = stats;
      job.endTime = new Date();
      job.progress = 100;

      this.logger.log(`[异步合并] 任务完成: ${jobId}, 耗时: ${job.endTime.getTime() - job.startTime!.getTime()}ms`);
      
      // 可选：发送通知给用户（邮件、推送等）
      // await this.notifyUser(targetUserId, stats);
      
    } catch (error) {
      job.status = 'failed';
      job.error = (error as Error)?.message || 'Unknown error';
      job.endTime = new Date();
      this.logger.error(`[异步合并] 任务失败: ${jobId}`, (error as Error)?.stack);
    }
  }

  /**
   * 执行实际的合并操作（使用优化的批量SQL）
   */
  private async performMerge(
    guestUserId: number, 
    targetUserId: number,
    onProgress?: (progress: number) => void
  ) {
    const stats = {
      watchProgress: 0,
      favorites: 0,
      episodeReactions: 0,
      comments: 0,
      commentLikes: 0,
      deletedDuplicates: 0,
    };

    await this.dataSource.transaction(async (manager) => {
      // 1. 观看进度 (20%)
      onProgress?.(10);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const wpResult: any = await manager.query(`
        DELETE wp_guest FROM watch_progress wp_guest
        INNER JOIN watch_progress wp_target 
          ON wp_guest.episode_id = wp_target.episode_id 
          AND wp_target.user_id = ?
        WHERE wp_guest.user_id = ?
          AND wp_guest.updated_at <= wp_target.updated_at
      `, [targetUserId, guestUserId]);
      stats.deletedDuplicates += Number(wpResult?.affectedRows) || 0;
      
      const movedWp = await manager.query(`
        UPDATE watch_progress SET user_id = ? WHERE user_id = ?
      `, [targetUserId, guestUserId]) as any;
      stats.watchProgress = (movedWp?.affectedRows as number) || 0;
      onProgress?.(30);

      // 2. 收藏 (40%)
      const favResult = await manager.query(`
        DELETE fav_guest FROM favorites fav_guest
        INNER JOIN favorites fav_target 
          ON fav_guest.series_id = fav_target.series_id 
          AND fav_guest.favorite_type = fav_target.favorite_type
          AND COALESCE(fav_guest.episode_id, 0) = COALESCE(fav_target.episode_id, 0)
          AND fav_target.user_id = ?
        WHERE fav_guest.user_id = ?
      `, [targetUserId, guestUserId]) as any;
      stats.deletedDuplicates += (favResult?.affectedRows as number) || 0;
      
      const movedFav = await manager.query(`
        UPDATE favorites SET user_id = ? WHERE user_id = ?
      `, [targetUserId, guestUserId]) as any;
      stats.favorites = (movedFav?.affectedRows as number) || 0;
      onProgress?.(50);

      // 3. 剧集反应 (60%)
      const reactResult = await manager.query(`
        DELETE er_guest FROM episode_reactions er_guest
        INNER JOIN episode_reactions er_target 
          ON er_guest.episode_id = er_target.episode_id 
          AND er_target.user_id = ?
        WHERE er_guest.user_id = ?
          AND er_guest.updated_at <= er_target.updated_at
      `, [targetUserId, guestUserId]) as any;
      stats.deletedDuplicates += (reactResult?.affectedRows as number) || 0;
      
      const movedReact = await manager.query(`
        UPDATE episode_reactions SET user_id = ? WHERE user_id = ?
      `, [targetUserId, guestUserId]) as any;
      stats.episodeReactions = (movedReact?.affectedRows as number) || 0;
      onProgress?.(70);

      // 4. 评论 (80%)
      const movedComments = await manager.query(`
        UPDATE comments SET user_id = ? WHERE user_id = ?
      `, [targetUserId, guestUserId]) as any;
      stats.comments = (movedComments?.affectedRows as number) || 0;
      onProgress?.(80);

      // 5. 评论点赞 (90%)
      const likeResult = await manager.query(`
        DELETE cl_guest FROM comment_likes cl_guest
        INNER JOIN comment_likes cl_target 
          ON cl_guest.comment_id = cl_target.comment_id 
          AND cl_target.user_id = ?
        WHERE cl_guest.user_id = ?
      `, [targetUserId, guestUserId]) as any;
      stats.deletedDuplicates += (likeResult?.affectedRows as number) || 0;
      
      const movedLikes = await manager.query(`
        UPDATE comment_likes SET user_id = ? WHERE user_id = ?
      `, [targetUserId, guestUserId]) as any;
      stats.commentLikes = (movedLikes?.affectedRows as number) || 0;
      onProgress?.(95);

      // 6. 清理
      await manager.query('DELETE FROM refresh_tokens WHERE user_id = ?', [guestUserId]);
      await manager.query('DELETE FROM users WHERE id = ?', [guestUserId]);
      onProgress?.(100);
    });

    return stats;
  }

  /**
   * 查询合并任务状态
   */
  getMergeStatus(jobId: string): MergeStatus | null {
    return this.mergeJobs.get(jobId) || null;
  }

  /**
   * 查询用户的合并任务
   */
  getUserMergeJobs(userId: number): MergeStatus[] {
    const jobs: MergeStatus[] = [];
    for (const job of this.mergeJobs.values()) {
      if (job.guestUserId === userId || job.targetUserId === userId) {
        jobs.push(job);
      }
    }
    return jobs.sort((a, b) => 
      (b.startTime?.getTime() || 0) - (a.startTime?.getTime() || 0)
    );
  }

  /**
   * 清理已完成的任务（定期执行）
   */
  cleanupCompletedJobs(olderThanHours: number = 24): void {
    const cutoffTime = Date.now() - olderThanHours * 60 * 60 * 1000;
    
    for (const [jobId, job] of this.mergeJobs.entries()) {
      if (
        (job.status === 'completed' || job.status === 'failed') &&
        job.endTime &&
        job.endTime.getTime() < cutoffTime
      ) {
        this.mergeJobs.delete(jobId);
        this.logger.log(`[异步合并] 清理过期任务: ${jobId}`);
      }
    }
  }
}
