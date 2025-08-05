#!/usr/bin/env node
/**
 * 生成episodes和episode_urls表的测试数据脚本
 * 包含access_key字段的完整测试数据
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

// 加载环境变量
require('dotenv').config();

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '123456',
  database: process.env.DB_NAME || 'short_drama'
};

async function generateEpisodeTestData() {
  let connection;
  
  try {
    console.log('🔌 连接数据库...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');
    
    // 读取SQL文件
    const sqlFilePath = path.join(__dirname, '..', 'migrations', 'generate-episode-test-data.sql');
    console.log('📖 读取SQL文件:', sqlFilePath);
    
    const sqlContent = await fs.readFile(sqlFilePath, 'utf8');
    console.log('✅ SQL文件读取成功');
    
    // 分割SQL语句并逐个执行
    console.log('🚀 开始执行SQL脚本...');
    
    // 更智能的SQL语句分割
    const lines = sqlContent.split('\n');
    const sqlStatements = [];
    let currentStatement = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // 跳过空行和注释行
      if (!trimmedLine || trimmedLine.startsWith('--')) {
        continue;
      }
      
      // 跳过USE语句
      if (trimmedLine.toUpperCase().startsWith('USE ')) {
        continue;
      }
      
      currentStatement += ' ' + trimmedLine;
      
      // 如果行以分号结尾，表示语句结束
      if (trimmedLine.endsWith(';')) {
        const stmt = currentStatement.trim();
        if (stmt && !stmt.toUpperCase().startsWith('COMMIT')) {
          sqlStatements.push(stmt);
        }
        currentStatement = '';
      }
    }
    
    // 处理最后一个语句（如果没有分号结尾）
    if (currentStatement.trim()) {
      sqlStatements.push(currentStatement.trim());
    }
    
    console.log('🔍 SQL语句预览:');
    sqlStatements.slice(0, 3).forEach((stmt, index) => {
      console.log(`   ${index + 1}. ${stmt.substring(0, 50)}...`);
    });
    
    console.log(`📝 共有 ${sqlStatements.length} 条SQL语句需要执行`);
    console.log('✅ 已连接到short_drama数据库');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < sqlStatements.length; i++) {
      const stmt = sqlStatements[i];
      if (stmt.trim()) {
        try {
          await connection.execute(stmt);
          successCount++;
          if (i % 10 === 0) {
            console.log(`⏳ 已执行 ${i + 1}/${sqlStatements.length} 条语句`);
          }
        } catch (error) {
          errorCount++;
          // 忽略某些预期的错误（如字段已存在）
          if (!error.message.includes('Duplicate column name') && 
              !error.message.includes('already exists')) {
            console.warn(`⚠️  语句执行警告: ${error.message}`);
            console.warn(`SQL: ${stmt.substring(0, 100)}...`);
          }
        }
      }
    }
    
    console.log(`✅ SQL脚本执行完成: ${successCount} 成功, ${errorCount} 跳过/错误`);
    
    // 查询生成的数据统计
    console.log('\n📊 数据统计:');
    const [episodeStats] = await connection.execute(`
      SELECT COUNT(*) as episode_count FROM episodes WHERE series_id <= 5
    `);
    
    const [urlStats] = await connection.execute(`
      SELECT COUNT(*) as url_count, COUNT(DISTINCT quality) as quality_types 
      FROM episode_urls eu 
      JOIN episodes e ON eu.episode_id = e.id 
      WHERE e.series_id <= 5
    `);
    
    console.log(`📺 生成剧集数量: ${episodeStats[0].episode_count}`);
    console.log(`🎬 生成播放地址数量: ${urlStats[0].url_count}`);
    console.log(`🎯 清晰度类型: ${urlStats[0].quality_types}`);
    
    // 显示一些示例数据
    console.log('\n🔍 示例数据:');
    const [sampleData] = await connection.execute(`
      SELECT 
        e.id as episode_id,
        e.series_id,
        e.episode_number,
        e.title,
        SUBSTRING(e.uuid, 1, 8) as uuid_prefix,
        eu.quality,
        SUBSTRING(eu.access_key, 1, 16) as access_key_prefix
      FROM episodes e
      LEFT JOIN episode_urls eu ON e.id = eu.episode_id
      WHERE e.series_id <= 2
      ORDER BY e.series_id, e.episode_number, eu.quality
      LIMIT 10
    `);
    
    console.table(sampleData);
    
    // 获取一些完整的access_key用于测试
    console.log('\n🔑 测试用的Access Keys:');
    const [accessKeys] = await connection.execute(`
      SELECT 
        e.series_id,
        e.episode_number,
        e.title,
        eu.quality,
        eu.access_key
      FROM episodes e
      JOIN episode_urls eu ON e.id = eu.episode_id
      WHERE e.series_id = 1 AND e.episode_number <= 3
      ORDER BY e.episode_number, eu.quality
    `);
    
    accessKeys.forEach(row => {
      console.log(`📺 系列${row.series_id} 第${row.episode_number}集 (${row.title}) - ${row.quality}: ${row.access_key}`);
    });
    
    console.log('\n✅ Episodes和Episode URLs测试数据生成完成！');
    console.log('📊 可以使用上面显示的access_key进行播放地址测试');
    console.log('🔐 每个剧集都有对应的UUID和access_key用于安全访问');
    
  } catch (error) {
    console.error('❌ 执行失败:', error.message);
    if (error.sql) {
      console.error('SQL:', error.sql);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 数据库连接已关闭');
    }
  }
}

// 检查是否直接运行此脚本
if (require.main === module) {
  // 加载环境变量
  require('dotenv').config();
  
  console.log('🎬 开始生成Episodes和Episode URLs测试数据...');
  console.log('📋 数据库配置:');
  console.log(`   Host: ${dbConfig.host}:${dbConfig.port}`);
  console.log(`   Database: ${dbConfig.database}`);
  console.log(`   User: ${dbConfig.user}`);
  console.log('');
  
  generateEpisodeTestData();
}

module.exports = { generateEpisodeTestData };