const mysql = require('mysql2/promise');

async function updateSeriesCategoryIds() {
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
    
    // 检查series表结构
    console.log('\nSeries table structure:');
    const [structure] = await connection.execute('DESCRIBE series');
    console.table(structure);
    
    // 备份当前数据
    console.log('\nCreating backup table...');
    await connection.execute('DROP TABLE IF EXISTS series_backup');
    await connection.execute('CREATE TABLE series_backup AS SELECT * FROM series');
    console.log('Backup created successfully');
    
    // 显示更新前的数据
    console.log('\nBefore update - Series category_id distribution:');
    const [beforeStats] = await connection.execute(`
      SELECT category_id, COUNT(*) as count 
      FROM series 
      WHERE category_id IS NOT NULL 
      GROUP BY category_id 
      ORDER BY category_id
    `);
    console.table(beforeStats);
    
    // 更新series表中的category_id字段
    console.log('\nUpdating series category_id values...');
    
    const updates = [
      { old: '0', new: '62', name: '首页' },
      { old: '3', new: '64', name: '电影' },
      { old: '4', new: '63', name: '短剧' },
      { old: '5', new: '65', name: '综艺' }
    ];
    
    for (const update of updates) {
      const [result] = await connection.execute(
        'UPDATE series SET category_id = ? WHERE category_id = ?',
        [update.new, update.old]
      );
      console.log(`Updated ${update.name}: ${update.old} -> ${update.new} (${result.affectedRows} rows affected)`);
    }
    
    // 显示更新后的数据
    console.log('\nAfter update - Series category_id distribution:');
    const [afterStats] = await connection.execute(`
      SELECT category_id, COUNT(*) as count 
      FROM series 
      WHERE category_id IS NOT NULL 
      GROUP BY category_id 
      ORDER BY category_id
    `);
    console.table(afterStats);
    
    // 验证与categories表的关联
    console.log('\nVerifying category associations:');
    const [verification] = await connection.execute(`
      SELECT 
        c.id as category_table_id,
        c.category_id as category_id_field,
        c.name as category_name,
        COUNT(s.id) as series_count
      FROM categories c
      LEFT JOIN series s ON s.category_id = c.id
      GROUP BY c.id, c.category_id, c.name
      ORDER BY c.id
    `);
    console.table(verification);
    
    console.log('\nSeries category_id values updated successfully!');
    console.log('Backup table "series_backup" has been created for rollback if needed.');
    
  } catch (error) {
    console.error('Error updating series category IDs:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行更新
updateSeriesCategoryIds();