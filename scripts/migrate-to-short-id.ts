/**
 * 数据迁移脚本：为现有记录生成短ID
 * 使用方法：npm run ts-node scripts/migrate-to-short-id.ts
 */
import * as dotenv from 'dotenv';
dotenv.config();

import { DataSource, IsNull } from 'typeorm';
import { User } from '../src/user/entity/user.entity';
import { Series } from '../src/video/entity/series.entity';
import { Episode } from '../src/video/entity/episode.entity';
import { ShortVideo } from '../src/video/entity/short-video.entity';
import { Category } from '../src/video/entity/category.entity';
import { EpisodeUrl } from '../src/video/entity/episode-url.entity';
import { WatchProgress } from '../src/video/entity/watch-progress.entity';
import { Comment } from '../src/video/entity/comment.entity';
import { ShortIdUtil } from '../src/shared/utils/short-id.util';

// 数据库连接配置
const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'short_drama',
  entities: [User, Series, Episode, ShortVideo, Category, EpisodeUrl, WatchProgress, Comment],
  synchronize: false,
});

async function migrateToShortId() {
  try {
    console.log('开始连接数据库...');
    await dataSource.initialize();
    console.log('数据库连接成功');

    // 1. 迁移用户表
    console.log('\n开始迁移用户表...');
    const userRepo = dataSource.getRepository(User);
    const usersWithoutShortId = await userRepo.find({
      where: { shortId: IsNull() }
    });
    
    console.log(`找到 ${usersWithoutShortId.length} 个用户需要生成短ID`);
    
    const existingUserShortIds: string[] = [];
    for (const user of usersWithoutShortId) {
      const shortId = ShortIdUtil.generateUnique(existingUserShortIds);
      existingUserShortIds.push(shortId);
      
      await userRepo.update(user.id, { shortId });
      console.log(`用户 ${user.id} 生成短ID: ${shortId}`);
    }
    
    console.log('用户表迁移完成');

    // 2. 迁移剧集系列表
    console.log('\n开始迁移剧集系列表...');
    const seriesRepo = dataSource.getRepository(Series);
    const seriesWithoutShortId = await seriesRepo.find({
      where: { shortId: IsNull() }
    });
    
    console.log(`找到 ${seriesWithoutShortId.length} 个剧集系列需要生成短ID`);
    
    const existingSeriesShortIds: string[] = [];
    for (const series of seriesWithoutShortId) {
      const shortId = ShortIdUtil.generateUnique(existingSeriesShortIds);
      existingSeriesShortIds.push(shortId);
      
      await seriesRepo.update(series.id, { shortId });
      console.log(`剧集系列 ${series.id} (${series.title}) 生成短ID: ${shortId}`);
    }
    
    console.log('剧集系列表迁移完成');

    // 3. 迁移剧集表
    console.log('\n开始迁移剧集表...');
    const episodeRepo = dataSource.getRepository(Episode);
    const episodesWithoutShortId = await episodeRepo.find({
      where: { shortId: IsNull() },
      relations: ['series']
    });
    
    console.log(`找到 ${episodesWithoutShortId.length} 个剧集需要生成短ID`);
    
    const existingEpisodeShortIds: string[] = [];
    for (const episode of episodesWithoutShortId) {
      const shortId = ShortIdUtil.generateUnique(existingEpisodeShortIds);
      existingEpisodeShortIds.push(shortId);
      
      await episodeRepo.update(episode.id, { shortId });
      console.log(`剧集 ${episode.id} (${episode.series?.title || '未知'} 第${episode.episodeNumber}集) 生成短ID: ${shortId}`);
    }
    
    console.log('剧集表迁移完成');

    // 4. 迁移短视频表
    console.log('\n开始迁移短视频表...');
    const shortVideoRepo = dataSource.getRepository(ShortVideo);
    const shortVideosWithoutShortId = await shortVideoRepo.find({
      where: { shortId: IsNull() }
    });
    
    console.log(`找到 ${shortVideosWithoutShortId.length} 个短视频需要生成短ID`);
    
    const existingShortVideoShortIds: string[] = [];
    for (const shortVideo of shortVideosWithoutShortId) {
      const shortId = ShortIdUtil.generateUnique(existingShortVideoShortIds);
      existingShortVideoShortIds.push(shortId);
      
      await shortVideoRepo.update(shortVideo.id, { shortId });
      console.log(`短视频 ${shortVideo.id} (${shortVideo.title}) 生成短ID: ${shortId}`);
    }
    
    console.log('短视频表迁移完成');

    console.log('\n所有数据迁移完成！');
    console.log('迁移统计:');
    console.log(`- 用户: ${usersWithoutShortId.length} 条记录`);
    console.log(`- 剧集系列: ${seriesWithoutShortId.length} 条记录`);
    console.log(`- 剧集: ${episodesWithoutShortId.length} 条记录`);
    console.log(`- 短视频: ${shortVideosWithoutShortId.length} 条记录`);
    
  } catch (error) {
    console.error('迁移过程中发生错误:', error);
  } finally {
    await dataSource.destroy();
    console.log('数据库连接已关闭');
  }
}

// 验证短ID唯一性
async function validateShortIdUniqueness() {
  try {
    console.log('\n开始验证短ID唯一性...');
    await dataSource.initialize();
    
    const queries = [
      'SELECT short_id, COUNT(*) as count FROM users WHERE short_id IS NOT NULL GROUP BY short_id HAVING count > 1',
      'SELECT short_id, COUNT(*) as count FROM series WHERE short_id IS NOT NULL GROUP BY short_id HAVING count > 1',
      'SELECT short_id, COUNT(*) as count FROM episodes WHERE short_id IS NOT NULL GROUP BY short_id HAVING count > 1',
      'SELECT short_id, COUNT(*) as count FROM short_videos WHERE short_id IS NOT NULL GROUP BY short_id HAVING count > 1'
    ];
    
    const tableNames = ['users', 'series', 'episodes', 'short_videos'];
    
    for (let i = 0; i < queries.length; i++) {
      const result = await dataSource.query(queries[i]);
      if (Array.isArray(result) && result.length > 0) {
        console.error(`❌ ${tableNames[i]} 表中发现重复的短ID:`, result);
      } else {
        console.log(`✅ ${tableNames[i]} 表中短ID唯一性验证通过`);
      }
    }
    
  } catch (error) {
    console.error('验证过程中发生错误:', error);
  } finally {
    await dataSource.destroy();
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--validate')) {
    await validateShortIdUniqueness();
  } else {
    await migrateToShortId();
    await validateShortIdUniqueness();
  }
}

// 执行迁移
if (require.main === module) {
  main().catch(console.error);
}

export { migrateToShortId, validateShortIdUniqueness };