const mysql = require('mysql2/promise');

async function fixSeriesCategoryRelation() {
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
    
    // 创建备份表
    console.log('\n=== 创建备份表 ===');
    await connection.execute('DROP TABLE IF EXISTS series_backup_fix');
    await connection.execute('CREATE TABLE series_backup_fix AS SELECT * FROM series');
    console.log('✅ 备份表 series_backup_fix 创建成功');
    
    // 显示当前状态
    console.log('\n=== 当前状态 ===');
    const [currentSeries] = await connection.execute(`
      SELECT category_id, COUNT(*) as count 
      FROM series 
      GROUP BY category_id 
      ORDER BY category_id
    `);
    console.log('Series表中的category_id分布:');
    console.table(currentSeries);
    
    const [categories] = await connection.execute(`
      SELECT id, category_id, name 
      FROM categories 
      ORDER BY id
    `);
    console.log('Categories表数据:');
    console.table(categories);
    
    // 禁用外键检查
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    // 修复映射关系：将series表的category_id从categories.category_id映射到categories.id
    console.log('\n=== 修复映射关系 ===');
    
    // category_id 3 (短剧) -> id 64
    await connection.execute('UPDATE series SET category_id = 64 WHERE category_id = 3');
    console.log('✅ 短剧: category_id 3 -> 64');
    
    // category_id 4 (电影) -> id 63  
    await connection.execute('UPDATE series SET category_id = 63 WHERE category_id = 4');
    console.log('✅ 电影: category_id 4 -> 63');
    
    // category_id 5 (综艺) -> id 65
    await connection.execute('UPDATE series SET category_id = 65 WHERE category_id = 5');
    console.log('✅ 综艺: category_id 5 -> 65');
    
    // 重新启用外键检查
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    // 验证修复结果
    console.log('\n=== 修复后状态 ===');
    const [updatedSeries] = await connection.execute(`
      SELECT category_id, COUNT(*) as count 
      FROM series 
      GROUP BY category_id 
      ORDER BY category_id
    `);
    console.log('Series表中的category_id分布:');
    console.table(updatedSeries);
    
    // 验证关联
    console.log('\n=== 验证关联关系 ===');
    const [joinResult] = await connection.execute(`
      SELECT 
        c.id as category_table_id,
        c.name as category_name,
        s.category_id as series_category_id,
        COUNT(s.id) as series_count
      FROM categories c
      LEFT JOIN series s ON c.id = s.category_id
      GROUP BY c.id, c.name, s.category_id
      ORDER BY c.id
    `);
    console.table(joinResult);
    
    console.log('\n✅ 修复完成！');
    console.log('\n📝 回滚命令（如需要）:');
    console.log('DROP TABLE IF EXISTS series_temp; CREATE TABLE series_temp AS SELECT * FROM series; TRUNCATE series; INSERT INTO series SELECT * FROM series_backup_fix;');
    
  } catch (error) {
    console.error('❌ 修复失败:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed.');
    }
  }
}

// 运行修复
fixSeriesCategoryRelation();