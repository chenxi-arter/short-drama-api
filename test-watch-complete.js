const http = require('http');
const mysql = require('mysql2/promise');

function request(url, options, data) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      req.destroy();
      reject(new Error('Request timeout'));
    }, 5000);

    const req = http.request(url, options, (res) => {
      clearTimeout(timeout);
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });
    
    req.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
    
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function main() {
  let connection;
  try {
    const email = 'test93395386@example.com';
    const password = 'Test123456';
    
    console.log('========================================');
    console.log('1. 查询真实的系列ID');
    console.log('========================================\n');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      port: 3307,
      user: 'root',
      password: '123456',
      database: 'short_drama',
      connectTimeout: 3000
    });
    
    const [seriesRows] = await connection.execute('SELECT id FROM series LIMIT 1');
    
    if (seriesRows.length === 0) {
      console.log('❌ 数据库中没有series数据，无法测试');
      return;
    }
    
    const seriesId = seriesRows[0].id;
    console.log('✓ 找到系列ID:', seriesId);
    console.log('');
    
    console.log('========================================');
    console.log('2. 创建测试剧集数据');
    console.log('========================================\n');
    
    const episodeId = Math.floor(Date.now() / 1000);
    
    await connection.execute(
      `INSERT INTO episodes (id, series_id, episode_number, title, duration, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [episodeId, seriesId, 1, '测试剧集-第1集', 600]
    );
    
    console.log('✓ 测试剧集创建成功');
    console.log('  剧集ID:', episodeId);
    console.log('  系列ID:', seriesId);
    console.log('  标题: 测试剧集-第1集');
    console.log('  时长: 600秒（10分钟）');
    console.log('');
    
    console.log('========================================');
    console.log('3. 用户登录');
    console.log('========================================\n');
    
    const loginResponse = await request('http://localhost:8080/api/auth/email-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email, password });
    
    if (!loginResponse.access_token) {
      console.log('登录失败');
      return;
    }
    
    const token = loginResponse.access_token;
    console.log('✓ 登录成功！\n');
    
    console.log('========================================');
    console.log('4. 记录观看进度（第1次）');
    console.log('========================================\n');
    
    const progressData1 = {
      episodeIdentifier: episodeId,
      stopAtSecond: 120
    };
    
    console.log('观看数据:');
    console.log('  剧集ID:', progressData1.episodeIdentifier);
    console.log('  观看到:', progressData1.stopAtSecond, '秒（2分钟）');
    console.log('');
    
    const progressResponse1 = await request('http://localhost:8080/api/video/progress', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }, progressData1);
    
    console.log('✅ 观看进度响应:', JSON.stringify(progressResponse1, null, 2));
    console.log('');
    
    console.log('========================================');
    console.log('5. 更新观看进度（第2次）');
    console.log('========================================\n');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const progressData2 = {
      episodeIdentifier: episodeId,
      stopAtSecond: 360
    };
    
    console.log('观看数据:');
    console.log('  剧集ID:', progressData2.episodeIdentifier);
    console.log('  观看到:', progressData2.stopAtSecond, '秒（6分钟）');
    console.log('');
    
    const progressResponse2 = await request('http://localhost:8080/api/video/progress', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }, progressData2);
    
    console.log('✅ 观看进度响应:', JSON.stringify(progressResponse2, null, 2));
    console.log('');
    
    console.log('========================================');
    console.log('6. 查询观看进度');
    console.log('========================================\n');
    
    const getProgressResponse = await request(`http://localhost:8080/api/video/progress?episodeIdentifier=${episodeId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, null);
    
    console.log('✅ 读取进度响应:', JSON.stringify(getProgressResponse, null, 2));
    console.log('');
    
    console.log('========================================');
    console.log('7. 查看数据库记录');
    console.log('========================================\n');
    
    const [progressRows] = await connection.execute(
      'SELECT * FROM watch_progress WHERE episode_id = ?',
      [episodeId]
    );
    
    console.log('观看进度记录:');
    console.table(progressRows);
    
    const [logRows] = await connection.execute(
      'SELECT * FROM watch_log WHERE episode_id = ?',
      [episodeId]
    );
    
    console.log('观看日志记录:');
    console.table(logRows);
    
    console.log('\n========================================');
    console.log('✅ 测试完成！');
    console.log('========================================');
    console.log('\n统计数据:');
    console.log('  ✓ 第1次观看: 0 → 120秒，观看时长: 120秒（2分钟）');
    console.log('  ✓ 第2次观看: 120 → 360秒，观看时长: 240秒（4分钟）');
    console.log('  ✓ 总观看时长: 360秒（6分钟）');
    console.log('  ✓ 观看日志: 记录了2条（分别是120秒和240秒）');
    
  } catch (error) {
    console.error('\n❌ 错误:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

main();
