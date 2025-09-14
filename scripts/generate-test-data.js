const mysql = require('mysql2/promise');

// 数据库配置
const dbConfig = {
  host: 'localhost',
  port: 3307,
  user: 'root',
  password: '123456',
  database: 'short_drama'
};

async function generateTestData() {
  let connection;
  
  try {
    console.log('🔗 连接数据库...');
    connection = await mysql.createConnection(dbConfig);
    
    // 测试用户ID
    const testUserId = 7845078844;
    
    console.log('📺 创建测试系列...');
    
    // 1. 创建测试系列
    const [seriesResult] = await connection.execute(`
      INSERT INTO series (title, short_id, description, category_id, cover_url, actor, director, starring, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE updated_at = NOW()
    `, [
      '测试观看进度系列',
      'TestWatch1',
      '用于测试观看进度和浏览历史功能的测试系列',
      1,
      'https://example.com/cover.jpg',
      '测试演员A,测试演员B',
      '测试导演',
      '测试主演A,测试主演B',
    ]);
    
    const seriesId = seriesResult.insertId || (await connection.execute(
      'SELECT id FROM series WHERE short_id = ?', ['TestWatch1']
    ))[0][0].id;
    
    console.log(`✅ 系列创建成功，ID: ${seriesId}`);
    
    // 2. 创建测试剧集（5集）
    console.log('🎬 创建测试剧集...');
    const episodes = [];
    
    for (let i = 1; i <= 5; i++) {
      const shortId = `TestEp${i.toString().padStart(2, '0')}`;
      const [episodeResult] = await connection.execute(`
        INSERT INTO episodes (series_id, episode_number, title, short_id, duration, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE updated_at = NOW()
      `, [
        seriesId,
        i,
        `第${i}集：测试剧集`,
        shortId,
        2000 + (i * 100), // 时长：2100, 2200, 2300, 2400, 2500秒
        'published'
      ]);
      
      const episodeId = episodeResult.insertId || (await connection.execute(
        'SELECT id FROM episodes WHERE short_id = ?', [shortId]
      ))[0][0].id;
      
      episodes.push({ id: episodeId, episodeNumber: i, shortId });
      console.log(`  ✅ 第${i}集创建成功，ID: ${episodeId}, ShortID: ${shortId}`);
    }
    
    // 3. 清除用户的旧观看进度和浏览历史
    console.log('🧹 清理旧数据...');
    await connection.execute('DELETE FROM watch_progress WHERE user_id = ?', [testUserId]);
    await connection.execute('DELETE FROM browse_history WHERE user_id = ? AND series_id = ?', [testUserId, seriesId]);
    
    // 4. 创建观看进度记录（模拟用户观看了前3集）
    console.log('⏱️ 创建观看进度记录...');
    const watchProgressData = [
      { episodeId: episodes[0].id, stopAtSecond: 1500, updatedAt: '2025-09-14 10:00:00' }, // 第1集看了1500秒
      { episodeId: episodes[1].id, stopAtSecond: 2000, updatedAt: '2025-09-14 10:30:00' }, // 第2集看了2000秒  
      { episodeId: episodes[2].id, stopAtSecond: 800, updatedAt: '2025-09-14 11:00:00' },  // 第3集看了800秒
    ];
    
    for (const progress of watchProgressData) {
      await connection.execute(`
        INSERT INTO watch_progress (user_id, episode_id, stop_at_second, updated_at)
        VALUES (?, ?, ?, ?)
      `, [testUserId, progress.episodeId, progress.stopAtSecond, progress.updatedAt]);
      
      const episode = episodes.find(ep => ep.id === progress.episodeId);
      console.log(`  ✅ 第${episode.episodeNumber}集观看进度：${progress.stopAtSecond}秒`);
    }
    
    // 5. 创建浏览历史记录（最后浏览到第4集）
    console.log('📖 创建浏览历史记录...');
    await connection.execute(`
      INSERT INTO browse_history (user_id, series_id, browse_type, last_episode_number, visit_count, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, NOW(), ?)
    `, [testUserId, seriesId, 'episode_watch', 4, 1, '2025-09-14 11:30:00']);
    
    console.log('  ✅ 浏览历史记录创建成功（最后浏览第4集）');
    
    console.log('\n🎉 测试数据生成完成！');
    console.log('\n📊 测试数据总结：');
    console.log(`👤 测试用户ID: ${testUserId}`);
    console.log(`📺 测试系列: ${seriesId} (TestWatch1)`);
    console.log(`🎬 剧集数量: 5集`);
    console.log(`⏱️ 观看进度: 前3集有观看记录`);
    console.log(`📖 浏览历史: 最后浏览到第4集`);
    console.log(`🔍 预期结果: currentEpisode应该显示第3集（最新观看）`);
    
    console.log('\n🧪 测试命令：');
    console.log(`curl -s "http://localhost:8080/api/video/episodes?seriesShortId=TestWatch1" -H "Authorization: Bearer YOUR_TOKEN" | jq '.data.userProgress'`);
    console.log(`curl -s "http://localhost:8080/api/video/browse-history" -H "Authorization: Bearer YOUR_TOKEN" | jq '.data.list[]'`);
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 数据库连接已关闭');
    }
  }
}

// 运行脚本
generateTestData();
