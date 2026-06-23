const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function main() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: '123456',
    database: 'short_drama'
  });

  const email = 'heartbeat_test@example.com';
  const password = 'Test123456';
  const username = 'heartbeat_test';
  
  const [existing] = await connection.execute(
    'SELECT id FROM users WHERE email = ?',
    [email]
  );
  
  if (existing.length > 0) {
    console.log('用户已存在，删除旧用户...');
    await connection.execute('DELETE FROM users WHERE email = ?', [email]);
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = Date.now();
  
  await connection.execute(
    'INSERT INTO users (id, email, password, username, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
    [userId, email, hashedPassword, username, true]
  );
  
  console.log('✓ 测试用户创建成功！');
  console.log('邮箱:', email);
  console.log('密码:', password);
  console.log('用户ID:', userId);
  
  await connection.end();
}

main().catch(console.error);
