const mysql = require('mysql2/promise');

async function updateCategoryIds() {
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
    
    // 备份当前数据
    console.log('Creating backup table...');
    await connection.execute('DROP TABLE IF EXISTS categories_backup');
    await connection.execute('CREATE TABLE categories_backup AS SELECT * FROM categories');
    console.log('Backup created successfully');
    
    // 显示更新前的数据
    console.log('\nBefore update:');
    const [beforeRows] = await connection.execute('SELECT id, categoryId, name, type, routeName FROM categories ORDER BY categoryId');
    console.table(beforeRows);
    
    // 更新categoryId字段
    console.log('\nUpdating categoryId values...');
    
    const updates = [
      { old: '0', new: '62', name: '首页' },
      { old: '4', new: '63', name: '短剧' },
      { old: '3', new: '64', name: '电影' },
      { old: '5', new: '65', name: '综艺' }
    ];
    
    for (const update of updates) {
      const [result] = await connection.execute(
        'UPDATE categories SET categoryId = ? WHERE categoryId = ? AND name = ?',
        [update.new, update.old, update.name]
      );
      console.log(`Updated ${update.name}: ${update.old} -> ${update.new} (${result.affectedRows} rows affected)`);
    }
    
    // 显示更新后的数据
    console.log('\nAfter update:');
    const [afterRows] = await connection.execute('SELECT id, categoryId, name, type, routeName FROM categories ORDER BY categoryId');
    console.table(afterRows);
    
    console.log('\nCategory IDs updated successfully!');
    console.log('Backup table "categories_backup" has been created for rollback if needed.');
    
  } catch (error) {
    console.error('Error updating category IDs:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行更新
updateCategoryIds();