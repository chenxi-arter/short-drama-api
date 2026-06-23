const http = require('http');

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
  try {
    const email = 'test93395386@example.com';
    const password = 'Test123456';
    
    console.log('========================================');
    console.log('1. 用户登录');
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
    console.log('2. 记录观看进度（尝试多个剧集ID）');
    console.log('========================================\n');
    
    // 尝试几个可能的剧集ID
    const testEpisodeIds = [1759889819055, 1759889819056, 1759889819057, 100, 1000];
    
    for (const episodeId of testEpisodeIds) {
      console.log(`尝试剧集ID: ${episodeId}`);
      
      const progressData = {
        episodeIdentifier: episodeId,
        stopAtSecond: 300
      };
      
      const progressResponse = await request('http://localhost:8080/api/video/progress', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }, progressData);
      
      console.log('响应:', JSON.stringify(progressResponse, null, 2));
      
      if (progressResponse?.data?.ok === true) {
        console.log('\n✅ 找到有效的剧集ID:', episodeId);
        console.log('观看时长: 300秒（5分钟）');
        console.log('');
        
        console.log('========================================');
        console.log('3. 验证观看进度');
        console.log('========================================\n');
        
        const getProgressResponse = await request(`http://localhost:8080/api/video/progress?episodeIdentifier=${episodeId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }, null);
        
        console.log('读取进度:', JSON.stringify(getProgressResponse, null, 2));
        break;
      }
      
      console.log('');
    }
    
    console.log('========================================');
    console.log('✅ 测试完成！');
    console.log('========================================');
    
  } catch (error) {
    console.error('\n❌ 错误:', error.message);
  }
}

main();
