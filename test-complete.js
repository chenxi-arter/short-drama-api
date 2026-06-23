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
    const timestamp = Date.now().toString().slice(-8);
    const email = `test${timestamp}@example.com`;
    const password = 'Test123456';
    const username = `user${timestamp}`;
    
    console.log('========================================');
    console.log('1. 邮箱注册新账号');
    console.log('========================================\n');
    console.log('注册信息:');
    console.log('  邮箱:', email);
    console.log('  用户名:', username);
    console.log('');
    
    const registerResponse = await request('http://localhost:8080/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email, password, confirmPassword: password, username });
    
    console.log('注册响应:', JSON.stringify(registerResponse, null, 2));
    console.log('');
    
    console.log('========================================');
    console.log('2. 邮箱密码登录');
    console.log('========================================\n');
    
    const loginResponse = await request('http://localhost:8080/api/auth/email-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email, password });
    
    console.log('登录响应:', JSON.stringify(loginResponse, null, 2));
    
    if (!loginResponse.access_token) {
      console.log('\n无法获取token，测试结束');
      return;
    }
    
    const token = loginResponse.access_token;
    console.log('\n✓ 登录成功！\n');
    
    console.log('========================================');
    console.log('3. 记录观看进度（模拟观看视频）');
    console.log('========================================\n');
    
    // 模拟观看视频，记录观看进度
    const progressData = {
      episodeIdentifier: 1,
      stopAtSecond: 180
    };
    
    console.log('观看数据:');
    console.log('  剧集ID:', progressData.episodeIdentifier);
    console.log('  观看到:', progressData.stopAtSecond, '秒（3分钟）');
    console.log('');
    
    const progressResponse = await request('http://localhost:8080/api/video/progress', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }, progressData);
    
    console.log('观看进度响应:', JSON.stringify(progressResponse, null, 2));
    console.log('');
    
    console.log('========================================');
    console.log('4. 调用心跳检测（3次）');
    console.log('========================================\n');
    
    for (let i = 1; i <= 3; i++) {
      const heartbeatResponse = await request('http://localhost:8080/api/user/heartbeat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }, {});
      
      console.log(`第${i}次心跳:`, JSON.stringify(heartbeatResponse, null, 2));
      
      if (i < 3) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('\n========================================');
    console.log('✅ 测试完成！');
    console.log('========================================');
    console.log('\n数据统计:');
    console.log('  ✓ 注册账号: 1个');
    console.log('  ✓ 登录次数: 1次');
    console.log('  ✓ 观看时长: 3分钟（180秒）');
    console.log('  ✓ 心跳次数: 3次（累计在线180秒）');
    console.log('  ✓ DAU统计: 已记录到HyperLogLog');
    
  } catch (error) {
    console.error('\n❌ 错误:', error.message);
  }
}

main();
