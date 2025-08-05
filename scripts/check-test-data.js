require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkTestData() {
  console.log('🔍 检查测试数据...');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '123456',
    database: process.env.DB_NAME || 'short_drama'
  });
  
  try {
    console.log('✅ 数据库连接成功');
    
    // 检查series表
    const [seriesRows] = await connection.execute('SELECT id, title FROM series LIMIT 10');
    console.log('\n📺 Series表数据:');
    console.table(seriesRows);
    
    // 检查episodes表
    const [episodeRows] = await connection.execute('SELECT id, series_id, episode_number, title, duration, status FROM episodes LIMIT 10');
    console.log('\n🎬 Episodes表数据:');
    console.table(episodeRows);
    
    // 检查episode_urls表
    const [urlRows] = await connection.execute('SELECT id, episode_id, quality, access_key FROM episode_urls LIMIT 10');
    console.log('\n🔗 Episode URLs表数据:');
    console.table(urlRows);
    
    // 统计数据
    const [seriesCount] = await connection.execute('SELECT COUNT(*) as count FROM series');
    const [episodeCount] = await connection.execute('SELECT COUNT(*) as count FROM episodes');
    const [urlCount] = await connection.execute('SELECT COUNT(*) as count FROM episode_urls');
    
    console.log('\n📊 数据统计:');
    console.log(`Series: ${seriesCount[0].count} 条`);
    console.log(`Episodes: ${episodeCount[0].count} 条`);
    console.log(`Episode URLs: ${urlCount[0].count} 条`);
    
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
  } finally {
    await connection.end();
    console.log('\n🔌 数据库连接已关闭');
  }
}

checkTestData().catch(console.error);