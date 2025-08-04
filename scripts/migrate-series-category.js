const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// 数据库配置
const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '123456',
  database: 'short_drama',
  charset: 'utf8mb4'
};

async function migrateSeriesToCategory() {
  let connection;
  
  try {
    console.log('连接数据库...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('开始执行数据库迁移...');
    
    // 1. 检查并添加category_id字段
    console.log('1. 检查category_id字段...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = 'short_drama' 
      AND TABLE_NAME = 'series' 
      AND COLUMN_NAME = 'category_id'
    `);
    
    if (columns.length === 0) {
      console.log('添加category_id字段...');
      await connection.execute(`
        ALTER TABLE series ADD COLUMN category_id VARCHAR(50)
      `);
    } else {
      console.log('category_id字段已存在');
    }
    
    // 2. 根据现有数据更新category_id字段
    console.log('2. 更新category_id字段...');
    
    // 将电影类series关联到电影分类
    await connection.execute(`
      UPDATE series SET category_id = '2' 
      WHERE (title LIKE '%电影%' OR description LIKE '%电影%') AND category_id IS NULL
    `);
    
    // 将电视剧类series关联到电视剧分类
    await connection.execute(`
      UPDATE series SET category_id = '4' 
      WHERE (title LIKE '%电视剧%' OR description LIKE '%电视剧%' OR title LIKE '%剧集%') AND category_id IS NULL
    `);
    
    // 将综艺类series关联到综艺分类
    await connection.execute(`
      UPDATE series SET category_id = '5' 
      WHERE (title LIKE '%综艺%' OR description LIKE '%综艺%') AND category_id IS NULL
    `);
    
    // 将动漫类series关联到动漫分类
    await connection.execute(`
      UPDATE series SET category_id = '6' 
      WHERE (title LIKE '%动漫%' OR description LIKE '%动漫%' OR title LIKE '%动画%') AND category_id IS NULL
    `);
    
    // 将纪录片类series关联到纪录片分类
    await connection.execute(`
      UPDATE series SET category_id = '7' 
      WHERE (title LIKE '%纪录片%' OR description LIKE '%纪录片%') AND category_id IS NULL
    `);
    
    // 将体育类series关联到体育分类
    await connection.execute(`
      UPDATE series SET category_id = '95' 
      WHERE (title LIKE '%体育%' OR description LIKE '%体育%') AND category_id IS NULL
    `);
    
    // 默认未分类的series关联到首页分类
    await connection.execute(`
      UPDATE series SET category_id = '1' WHERE category_id IS NULL
    `);
    
    // 3. 检查并删除tags相关表（如果存在）
    console.log('3. 清理tags相关表...');
    
    // 先删除所有引用tags表的表
    const [allTables] = await connection.execute(`
      SELECT TABLE_NAME FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = 'short_drama' 
      AND TABLE_NAME IN ('series_tags', 'episode_tags', 'video_tags')
    `);
    
    for (const table of allTables) {
      console.log(`删除表: ${table.TABLE_NAME}`);
      await connection.execute(`DROP TABLE IF EXISTS ${table.TABLE_NAME}`);
    }
    
    // 最后删除tags表
    console.log('删除tags表...');
    await connection.execute(`DROP TABLE IF EXISTS tags`);
    
    console.log('所有tags相关表已清理完成');
    
    
    // 4. 为category_id字段添加索引以提高查询性能
    console.log('4. 添加索引...');
    try {
      await connection.execute(`
        CREATE INDEX idx_series_category_id ON series(category_id)
      `);
    } catch (error) {
      if (error.code !== 'ER_DUP_KEYNAME') {
        throw error;
      }
      console.log('索引已存在，跳过创建');
    }
    
    // 5. 查询更新结果
    console.log('5. 查询更新结果...');
    const [results] = await connection.execute(`
      SELECT category_id, COUNT(*) as count 
      FROM series 
      GROUP BY category_id 
      ORDER BY category_id
    `);
    
    console.log('\n更新结果统计:');
    results.forEach(row => {
      console.log(`分类ID ${row.category_id}: ${row.count} 个系列`);
    });
    
    console.log('\n数据库迁移完成！');
    
  } catch (error) {
    console.error('迁移失败:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 执行迁移
migrateSeriesToCategory();