// UUID字段迁移脚本
// 为series和short_videos表添加UUID字段

const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
  let connection;
  
  try {
    // 创建数据库连接
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'short_drama'
    });
    
    console.log('✅ 数据库连接成功');
    
    // 检查series表结构
    console.log('📝 检查series表结构...');
    const [seriesColumns] = await connection.execute('SHOW COLUMNS FROM `series`');
    const seriesHasUuid = seriesColumns.some(col => col.Field === 'uuid');
    console.log('Series表UUID字段存在:', seriesHasUuid);
    
    // 检查short_videos表结构
    console.log('📝 检查short_videos表结构...');
    const [shortVideoColumns] = await connection.execute('SHOW COLUMNS FROM `short_videos`');
    const shortVideoHasUuid = shortVideoColumns.some(col => col.Field === 'uuid');
    console.log('Short_videos表UUID字段存在:', shortVideoHasUuid);
    
    // 为series表添加uuid字段（如果不存在）
    if (!seriesHasUuid) {
      console.log('📝 为series表添加uuid字段...');
      await connection.execute(`
        ALTER TABLE \`series\` 
        ADD COLUMN \`uuid\` VARCHAR(36) UNIQUE NULL 
        COMMENT 'UUID标识符，用于防枚举攻击'
      `);
      console.log('✅ series表uuid字段添加成功');
    }
    
    // 为short_videos表添加uuid字段（如果不存在）
    if (!shortVideoHasUuid) {
      console.log('📝 为short_videos表添加uuid字段...');
      await connection.execute(`
        ALTER TABLE \`short_videos\` 
        ADD COLUMN \`uuid\` VARCHAR(36) UNIQUE NULL 
        COMMENT 'UUID标识符，用于防枚举攻击'
      `);
      console.log('✅ short_videos表uuid字段添加成功');
    }
    
    // 为现有的series记录生成UUID
    if (seriesHasUuid) {
      console.log('📝 为现有series记录生成UUID...');
      const [seriesResult] = await connection.execute('UPDATE `series` SET `uuid` = UUID() WHERE `uuid` IS NULL OR `uuid` = ""');
      console.log(`✅ series记录UUID生成完成，更新了 ${seriesResult.affectedRows} 条记录`);
    }
    
    // 为现有的short_videos记录生成UUID
    if (shortVideoHasUuid) {
      console.log('📝 为现有short_videos记录生成UUID...');
      const [shortVideoResult] = await connection.execute('UPDATE `short_videos` SET `uuid` = UUID() WHERE `uuid` IS NULL OR `uuid` = ""');
      console.log(`✅ short_videos记录UUID生成完成，更新了 ${shortVideoResult.affectedRows} 条记录`);
    }
    
    // 添加索引（如果不存在）
    try {
      console.log('📝 添加UUID索引...');
      await connection.execute('CREATE INDEX `idx_series_uuid` ON `series`(`uuid`)');
      console.log('✅ series UUID索引添加完成');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('⚠️  series UUID索引已存在');
      } else {
        throw error;
      }
    }
    
    try {
      await connection.execute('CREATE INDEX `idx_short_videos_uuid` ON `short_videos`(`uuid`)');
      console.log('✅ short_videos UUID索引添加完成');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('⚠️  short_videos UUID索引已存在');
      } else {
        throw error;
      }
    }
    
    // 验证数据完整性
    console.log('📊 验证数据完整性...');
    const [seriesStats] = await connection.execute(`
      SELECT 
        'series' as table_name,
        COUNT(*) as total_records,
        COUNT(uuid) as records_with_uuid,
        COUNT(*) - COUNT(uuid) as records_without_uuid
      FROM \`series\`
    `);
    
    const [shortVideoStats] = await connection.execute(`
      SELECT 
        'short_videos' as table_name,
        COUNT(*) as total_records,
        COUNT(uuid) as records_with_uuid,
        COUNT(*) - COUNT(uuid) as records_without_uuid
      FROM \`short_videos\`
    `);
    
    console.log('📊 数据统计:');
    console.table([...seriesStats, ...shortVideoStats]);
    
    // 检查UUID唯一性
    const [duplicates] = await connection.execute(`
      SELECT 'series' as table_name, uuid, COUNT(*) as count
      FROM \`series\` 
      WHERE uuid IS NOT NULL AND uuid != ''
      GROUP BY uuid 
      HAVING COUNT(*) > 1
      UNION ALL
      SELECT 'short_videos' as table_name, uuid, COUNT(*) as count
      FROM \`short_videos\` 
      WHERE uuid IS NOT NULL AND uuid != ''
      GROUP BY uuid 
      HAVING COUNT(*) > 1
    `);
    
    if (duplicates.length === 0) {
      console.log('✅ UUID唯一性验证通过');
    } else {
      console.log('❌ 发现重复的UUID:');
      console.table(duplicates);
    }
    
    // 显示一些示例UUID
    console.log('📋 示例UUID:');
    const [sampleSeries] = await connection.execute('SELECT id, title, uuid FROM `series` LIMIT 3');
    const [sampleShortVideos] = await connection.execute('SELECT id, title, uuid FROM `short_videos` LIMIT 3');
    
    if (sampleSeries.length > 0) {
      console.log('Series示例:');
      console.table(sampleSeries);
    }
    
    if (sampleShortVideos.length > 0) {
      console.log('Short Videos示例:');
      console.table(sampleShortVideos);
    }
    
    console.log('🎉 UUID迁移完成！');
    
  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 数据库连接已关闭');
    }
  }
}

// 执行迁移
runMigration().catch(console.error);