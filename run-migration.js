const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const connection = await mysql.createConnection({
    host: '34.96.247.183',
    port: 3306,
    user: 'drama',
    password: 'Drama@123',
    database: 'short_drama'
  });

  try {
    console.log('连接数据库成功');
    
    // 添加主演字段
    await connection.execute(`
      ALTER TABLE series ADD COLUMN starring TEXT NULL COMMENT '主演名单，多个演员用逗号分隔'
    `);
    console.log('✅ 添加 starring 字段成功');
    
    // 添加演员字段
    await connection.execute(`
      ALTER TABLE series ADD COLUMN actor TEXT NULL COMMENT '演员名单，多个演员用逗号分隔'
    `);
    console.log('✅ 添加 actor 字段成功');
    
    // 添加导演字段
    await connection.execute(`
      ALTER TABLE series ADD COLUMN director VARCHAR(255) NULL COMMENT '导演信息，多个导演用逗号分隔'
    `);
    console.log('✅ 添加 director 字段成功');
    
    // 验证字段添加成功
    const [rows] = await connection.execute('DESC series');
    console.log('\n📋 series表结构:');
    rows.forEach(row => {
      if (['starring', 'actor', 'director'].includes(row.Field)) {
        console.log(`  ${row.Field}: ${row.Type} ${row.Null} ${row.Comment || ''}`);
      }
    });
    
    console.log('\n🎉 数据库迁移完成！');
    
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('⚠️  字段已存在，跳过添加');
    } else {
      console.error('❌ 迁移失败:', error.message);
    }
  } finally {
    await connection.end();
  }
}

runMigration().catch(console.error);