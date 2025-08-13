const mysql = require('mysql2/promise');

// 数据库配置
const dbConfig = {
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  password: '123456',
  database: 'short_drama',
  charset: 'utf8mb4',
  timezone: '+08:00',
  // 确保客户端连接使用正确的字符集
  charset: 'utf8mb4',
  collation: 'utf8mb4_unicode_ci'
};

// 测试数据
const testData = {
  user: {
    id: 6702079700,
    first_name: '随风',
    last_name: '用户',
    username: 'seo99991',
    is_active: 1
  },
  watchProgress: [
    { episode_id: 2001, stop_at_second: 1800 },
    { episode_id: 2002, stop_at_second: 2400 },
    { episode_id: 2003, stop_at_second: 1200 },
    { episode_id: 2136, stop_at_second: 900 },
    { episode_id: 2137, stop_at_second: 1500 }
  ],
  comments: [
    { episode_id: 2001, content: '这部剧太精彩了！演员演技很棒！', appear_second: 0 },
    { episode_id: 2002, content: '第二集比第一集更好看！', appear_second: 0 },
    { episode_id: 2003, content: '剧情发展很吸引人，期待下一集！', appear_second: 0 },
    { episode_id: 2136, content: '新剧开始追了，希望不会失望！', appear_second: 0 },
    { episode_id: 2137, content: '第二集节奏很好，继续追！', appear_second: 0 }
  ],
  browseHistory: [
    { series_id: 1001, browse_type: 'episode_list', last_episode_number: 3 },
    { series_id: 2001, browse_type: 'episode_list', last_episode_number: 2 }
  ]
};

async function insertTestData() {
  let connection;
  
  try {
    console.log('🔌 连接到数据库...');
    connection = await mysql.createConnection(dbConfig);
    
    // 设置连接字符集
    await connection.execute('SET NAMES utf8mb4');
    await connection.execute('SET CHARACTER SET utf8mb4');
    await connection.execute('SET character_set_connection=utf8mb4');
    
    // 1. 插入用户
    console.log('👤 插入用户数据...');
    const userSql = `
      INSERT INTO users (id, first_name, last_name, username, is_active, short_id) 
      VALUES (?, ?, ?, ?, ?, ?) 
      ON DUPLICATE KEY UPDATE 
        first_name = VALUES(first_name), 
        last_name = VALUES(last_name), 
        is_active = VALUES(is_active)
    `;
    
    const shortId = generateShortId();
    await connection.execute(userSql, [
      testData.user.id,
      testData.user.first_name,
      testData.user.last_name,
      testData.user.username,
      testData.user.is_active,
      shortId
    ]);
    console.log(`✅ 用户插入成功，ShortID: ${shortId}`);
    
    // 2. 插入观看进度
    console.log('📺 插入观看进度数据...');
    for (const progress of testData.watchProgress) {
      const progressSql = `
        INSERT INTO watch_progress (user_id, episode_id, stop_at_second) 
        VALUES (?, ?, ?) 
        ON DUPLICATE KEY UPDATE 
          stop_at_second = VALUES(stop_at_second), 
          updated_at = CURRENT_TIMESTAMP
      `;
      await connection.execute(progressSql, [
        testData.user.id,
        progress.episode_id,
        progress.stop_at_second
      ]);
    }
    console.log(`✅ 观看进度插入成功，共 ${testData.watchProgress.length} 条`);
    
    // 3. 插入评论
    console.log('💬 插入评论数据...');
    for (const comment of testData.comments) {
      const commentSql = `
        INSERT INTO comments (user_id, episode_id, content, appear_second) 
        VALUES (?, ?, ?, ?)
      `;
      await connection.execute(commentSql, [
        testData.user.id,
        comment.episode_id,
        comment.content,
        comment.appear_second
      ]);
    }
    console.log(`✅ 评论插入成功，共 ${testData.comments.length} 条`);
    
    // 4. 插入浏览历史
    console.log('📚 插入浏览历史数据...');
    for (const history of testData.browseHistory) {
      const historySql = `
        INSERT INTO browse_history (user_id, series_id, browse_type, last_episode_number, user_agent, ip_address) 
        VALUES (?, ?, ?, ?, ?, ?) 
        ON DUPLICATE KEY UPDATE 
          last_episode_number = VALUES(last_episode_number), 
          updated_at = CURRENT_TIMESTAMP
      `;
      await connection.execute(historySql, [
        testData.user.id,
        history.series_id,
        history.browse_type,
        history.last_episode_number,
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        '192.168.1.100'
      ]);
    }
    console.log(`✅ 浏览历史插入成功，共 ${testData.browseHistory.length} 条`);
    
    console.log('\n🎉 所有测试数据插入完成！');
    
    // 5. 验证数据
    console.log('\n🔍 验证插入的数据...');
    
    // 验证用户
    const [users] = await connection.execute(
      'SELECT id, first_name, last_name, username, short_id FROM users WHERE id = ?',
      [testData.user.id]
    );
    console.log('👤 用户数据:', users[0]);
    
    // 验证观看进度
    const [progress] = await connection.execute(
      'SELECT COUNT(*) as count FROM watch_progress WHERE user_id = ?',
      [testData.user.id]
    );
    console.log('�� 观看进度数量:', progress[0].count);
    
    // 验证评论
    const [comments] = await connection.execute(
      'SELECT COUNT(*) as count FROM comments WHERE user_id = ?',
      [testData.user.id]
    );
    console.log('💬 评论数量:', comments[0].count);
    
    // 验证浏览历史
    const [history] = await connection.execute(
      'SELECT COUNT(*) as count FROM browse_history WHERE user_id = ?',
      [testData.user.id]
    );
    console.log('📚 浏览历史数量:', history[0].count);
    
  } catch (error) {
    console.error('❌ 插入数据时发生错误:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 数据库连接已关闭');
    }
  }
}

// 生成 ShortID（模拟数据库的生成逻辑）
function generateShortId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 11; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 运行脚本
if (require.main === module) {
  insertTestData();
}

module.exports = { insertTestData };
