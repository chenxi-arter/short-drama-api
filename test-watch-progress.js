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
    // 使用之前成功创建的用户
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
      console.log('登录失败:', JSON.stringify(loginResponse, null, 2));
      return;
    }
    
    const token = loginResponse.access_token;
    console.log('✓ 登录成功！\n');
    
    console.log('========================================');
    console.log('2. 获取视频列表（找一个真实的剧集ID）');
    console.log('========================================\n');
    
    const mediaResponse = await request('http://localhost:8080/api/video/media?page=1&size=1', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, null);
    
    console.log('视频列表响应:', JSON.stringify(mediaResponse, null, 2).substring(0, 500) + '...');
    console.log('');
    
    // 尝试获取第一个视频的剧集列表
    const items = mediaResponse?.data?.data?.list || mediaResponse?.items || [];
    if (items.length > 0) {
      const mediaId = items[0].id;
      console.log('找到视频 ID:', mediaId);
      console.log('');
      
      console.log('========================================');
      console.log('3. 获取该视频的剧集列表');
      console.log('========================================\n');
      
      const episodesResponse = await request(`http://localhost:8080/api/video/episodes?mediaId=${mediaId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }, null);
      
      console.log('剧集列表响应:', JSON.stringify(episodesResponse, null, 2).substring(0, 300) + '...');
      console.log('');
      
      const episodes = episodesResponse?.data?.episodes || episodesResponse?.episodes || episodesResponse || [];
      if (episodes.length > 0) {
        const episodeId = episodes[0].id || episodes[0].episodeId;
        console.log('找到剧集 ID:', episodeId);
        console.log('');
        
        console.log('========================================');
        console.log('4. 记录观看进度（使用真实剧集ID）');
        console.log('========================================\n');
        
        const progressData = {
          episodeIdentifier: episodeId,
          stopAtSecond: 300
        };
        
        console.log('观看数据:');
        console.log('  剧集ID:', progressData.episodeIdentifier);
        console.log('  观看到:', progressData.stopAtSecond, '秒（5分钟）');
        console.log('');
        
        const progressResponse = await request('http://localhost:8080/api/video/progress', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }, progressData);
        
        console.log('✅ 观看进度响应:', JSON.stringify(progressResponse, null, 2));
        console.log('');
        
        console.log('========================================');
        console.log('5. 验证观看进度（读取刚才保存的进度）');
        console.log('========================================\n');
        
        const getProgressResponse = await request(`http://localhost:8080/api/video/progress?episodeIdentifier=${episodeId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }, null);
        
        console.log('✅ 读取进度响应:', JSON.stringify(getProgressResponse, null, 2));
        console.log('');
      }
    } else {
      console.log('⚠️  数据库中没有视频数据，无法测试观看进度');
    }
    
    console.log('========================================');
    console.log('✅ 测试完成！');
    console.log('========================================');
    
  } catch (error) {
    console.error('\n❌ 错误:', error.message);
  }
}

main();
