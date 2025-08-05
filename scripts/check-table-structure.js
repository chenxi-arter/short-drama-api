require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkTableStructure() {
  console.log('🔍 检查表结构...');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '123456',
    database: process.env.DB_NAME || 'short_drama'
  });
  
  try {
    console.log('✅ 数据库连接成功');
    
    // 检查episodes表结构
    const [episodeStructure] = await connection.execute('DESCRIBE episodes');
    console.log('\n📋 Episodes表结构:');
    console.table(episodeStructure);
    
    // 检查series表结构
    const [seriesStructure] = await connection.execute('DESCRIBE series');
    console.log('\n📋 Series表结构:');
    console.table(seriesStructure);
    
    // 尝试手动插入一条测试数据
    console.log('\n🧪 尝试手动插入测试数据...');
    try {
      const insertResult = await connection.execute(
        'INSERT INTO episodes (series_id, episode_number, title, duration, status) VALUES (?, ?, ?, ?, ?)',
        [66, 1, '第1集：初遇', 1200, 'published']
      );
      console.log('✅ 手动插入成功:', insertResult[0]);
      
      // 查询刚插入的数据
      const [newEpisode] = await connection.execute(
        'SELECT * FROM episodes WHERE series_id = 66 AND episode_number = 1'
      );
      console.log('📺 新插入的剧集:');
      console.table(newEpisode);
      
    } catch (insertError) {
      console.error('❌ 手动插入失败:', insertError.message);
    }
    
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
  } finally {
    await connection.end();
    console.log('\n🔌 数据库连接已关闭');
  }
}

checkTableStructure().catch(console.error);