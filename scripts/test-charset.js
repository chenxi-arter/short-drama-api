const mysql = require('mysql2/promise');

async function testCharset() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    password: '123456',
    database: 'short_drama'
  });

  try {
    // 设置字符集
    await connection.execute('SET NAMES utf8mb4');
    await connection.execute('SET CHARACTER SET utf8mb4');
    await connection.execute('SET character_set_connection=utf8mb4');
    
    console.log('✅ 字符集设置完成');
    
    // 测试插入一个简单的中文字符
    const testSql = "INSERT INTO users (id, first_name, last_name, username, is_active, short_id) VALUES (9999999, '测试', '用户', 'testuser', 1, 'test12345') ON DUPLICATE KEY UPDATE first_name = VALUES(first_name)";
    
    await connection.execute(testSql);
    console.log('✅ 测试数据插入成功');
    
    // 查询验证
    const [rows] = await connection.execute('SELECT id, first_name, last_name FROM users WHERE id = 9999999');
    console.log('📊 查询结果:', rows[0]);
    
    // 清理测试数据
    await connection.execute('DELETE FROM users WHERE id = 9999999');
    console.log('🧹 测试数据清理完成');
    
  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    await connection.end();
  }
}

testCharset();
