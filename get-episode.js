const mysql = require('mysql2/promise');

async function getEpisode() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      port: 3307,
      user: 'root',
      password: '123456',
      database: 'short_drama',
      connectTimeout: 3000
    });

    const [rows] = await connection.execute(
      'SELECT id, media_id, episode_number FROM episodes LIMIT 1'
    );
    
    if (rows.length > 0) {
      console.log('找到剧集:', JSON.stringify(rows[0]));
      return rows[0].id;
    } else {
      console.log('数据库中没有剧集数据');
      return null;
    }
  } catch (error) {
    console.error('查询失败:', error.message);
    return null;
  } finally {
    if (connection) await connection.end();
  }
}

getEpisode();
