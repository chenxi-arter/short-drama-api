const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'short_drama'
};

async function syncSeriesWithCategories() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database successfully!');
    
    // 首先查看当前的映射关系
    console.log('\n=== 当前Categories表数据 ===');
    const [categories] = await connection.execute('SELECT id, category_id, name, route_name FROM categories ORDER BY id');
    console.table(categories);
    
    console.log('\n=== 当前Series表category_id分布 ===');
    const [seriesDistribution] = await connection.execute(`
      SELECT 
        category_id,
        COUNT(*) as count
      FROM series 
      GROUP BY category_id 
      ORDER BY category_id
    `);
    console.table(seriesDistribution);
    
    // 创建备份表
    console.log('\n=== 创建备份表 ===');
    await connection.execute('DROP TABLE IF EXISTS series_backup_sync');
    await connection.execute('CREATE TABLE series_backup_sync AS SELECT * FROM series');
    console.log('备份表 series_backup_sync 创建成功');
    
    // 更新series表的category_id，使其与categories表的category_id保持一致
    console.log('\n=== 开始更新Series表的category_id ===');
    
    // 临时禁用外键检查
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    console.log('已禁用外键检查');
    
    // 根据categories表的映射关系更新series表
    // 首页: categories.id=62, category_id=0
    // 电影: categories.id=63, category_id=3  
    // 短剧: categories.id=64, category_id=4
    // 综艺: categories.id=65, category_id=5
    
    const updates = [
      { from: 63, to: 3, name: '电影' },  // 将series中的63改为3
      { from: 64, to: 4, name: '短剧' },  // 将series中的64改为4
      { from: 65, to: 5, name: '综艺' }   // 将series中的65改为5
    ];
    
    for (const update of updates) {
      const [result] = await connection.execute(
        'UPDATE series SET category_id = ? WHERE category_id = ?',
        [update.to, update.from]
      );
      console.log(`${update.name}: 更新了 ${result.affectedRows} 条记录 (${update.from} -> ${update.to})`);
    }
    
    // 重新启用外键检查
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('已重新启用外键检查');
    
    // 验证更新结果
    console.log('\n=== 更新后的Series表category_id分布 ===');
    const [newSeriesDistribution] = await connection.execute(`
      SELECT 
        category_id,
        COUNT(*) as count
      FROM series 
      GROUP BY category_id 
      ORDER BY category_id
    `);
    console.table(newSeriesDistribution);
    
    // 验证与categories表的关联
    console.log('\n=== 验证Series与Categories的关联 ===');
    const [joinResult] = await connection.execute(`
      SELECT 
        c.id as categories_table_id,
        c.category_id as categories_category_id,
        c.name as category_name,
        COUNT(s.id) as series_count
      FROM categories c
      LEFT JOIN series s ON c.category_id = s.category_id
      GROUP BY c.id, c.category_id, c.name
      ORDER BY c.id
    `);
    console.table(joinResult);
    
    console.log('\n=== 更新完成 ===');
    console.log('现在series表的category_id与categories表的category_id字段保持一致');
    console.log('如需回滚，请执行: UPDATE series s1 JOIN series_backup_sync s2 ON s1.id = s2.id SET s1.category_id = s2.category_id');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed.');
    }
  }
}

syncSeriesWithCategories();