const mysql = require('mysql2/promise');

async function checkCategoriesStructure() {
  let connection;
  
  try {
    // 创建数据库连接
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123456',
      database: 'short_drama'
    });
    
    console.log('Connected to database successfully');
    
    // 查看表结构
    console.log('\nCategories table structure:');
    const [structure] = await connection.execute('DESCRIBE categories');
    console.table(structure);
    
    // 查看当前数据
    console.log('\nCurrent categories data:');
    const [data] = await connection.execute('SELECT * FROM categories ORDER BY id');
    console.table(data);
    
  } catch (error) {
    console.error('Error checking categories structure:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行检查
checkCategoriesStructure();