const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: '123456',
    database: 'short_drama'
  });

  const [rows] = await connection.execute(
    'SELECT id, email, username, nickname FROM users WHERE email IS NOT NULL LIMIT 5'
  );
  
  console.log('数据库中的用户:');
  console.table(rows);
  
  await connection.end();
}

main().catch(console.error);
