const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: '123456',
    database: 'short_drama'
  });

  const [episodes] = await connection.execute(
    'SELECT id, media_id, episode_number FROM episodes LIMIT 5'
  );
  
  console.log('数据库中的剧集:');
  console.table(episodes);
  
  await connection.end();
}

main().catch(console.error);
