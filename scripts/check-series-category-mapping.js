const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'short_drama'
};

async function checkSeriesCategoryMapping() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database successfully!');
    
    // 检查categories表的数据
    console.log('\n=== Categories表数据 ===');
    const [categories] = await connection.execute('SELECT * FROM categories ORDER BY id');
    console.table(categories);
    
    // 检查series表中category_id的分布
    console.log('\n=== Series表中category_id分布 ===');
    const [seriesDistribution] = await connection.execute(`
      SELECT 
        category_id,
        COUNT(*) as count,
        GROUP_CONCAT(DISTINCT title SEPARATOR ', ') as sample_titles
      FROM series 
      GROUP BY category_id 
      ORDER BY category_id
    `);
    console.table(seriesDistribution);
    
    // 检查series表和categories表的关联情况
    console.log('\n=== Series与Categories关联情况 ===');
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
    
    // 检查是否有series的category_id不在categories表中
    console.log('\n=== 检查孤立的series记录 ===');
    const [orphanSeries] = await connection.execute(`
      SELECT 
        s.category_id,
        COUNT(*) as count
      FROM series s
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE c.id IS NULL
      GROUP BY s.category_id
    `);
    
    if (orphanSeries.length > 0) {
      console.table(orphanSeries);
    } else {
      console.log('没有发现孤立的series记录');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed.');
    }
  }
}

checkSeriesCategoryMapping();