const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixCategoryMapping() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '123456',
    database: process.env.DB_NAME || 'short_drama'
  };

  console.log('连接数据库...');
  const connection = await mysql.createConnection(config);

  try {
    console.log('开始修复category_id映射...');
    
    // 创建映射关系：旧的数字category_id -> categories表的实际id
    const categoryMapping = {
      1: 62,   // 首页 (category_id='0')
      2: 63,   // 电影 (category_id='3')
      3: 64,   // 电视剧 (category_id='4')
      4: 65,   // 综艺 (category_id='5')
      5: 66,   // 动漫 (category_id='6')
      13: 67,  // 体育 (category_id='95')
      14: 68,  // 纪录片 (category_id='7')
      15: 70,  // 新闻 (category_id='news')
      16: 71   // 娱乐 (category_id='yule')
    };

    // 更新series表中的category_id，使其引用categories表的正确id
    for (const [oldId, newId] of Object.entries(categoryMapping)) {
      const [result] = await connection.execute(
        'UPDATE series SET category_id = ? WHERE category_id = ?',
        [newId, oldId]
      );
      console.log(`更新category_id ${oldId} -> ${newId}: ${result.affectedRows} 条记录`);
    }

    // 验证更新结果
    console.log('\n验证更新结果:');
    const [seriesResult] = await connection.execute(
      'SELECT category_id, COUNT(*) as count FROM series GROUP BY category_id ORDER BY category_id'
    );
    console.log('Series表中的category_id分布:', seriesResult);

    const [categoriesResult] = await connection.execute(
      'SELECT category_id, name FROM categories ORDER BY category_id'
    );
    console.log('\nCategories表中的category_id:', categoriesResult);

    console.log('\nCategory_id映射修复完成！');
  } catch (error) {
    console.error('修复过程中出错:', error);
  } finally {
    await connection.end();
  }
}

fixCategoryMapping().catch(console.error);