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
    console.log('========================================');
    console.log('1. 用户登录');
    console.log('========================================\n');
    
    const loginResponse = await request('http://localhost:8080/api/auth/email-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'admin@test.com', password: 'Admin123456' });
    
    console.log('登录响应:');
    console.log(JSON.stringify(loginResponse, null, 2));
    
    if (!loginResponse.access_token) {
      console.log('\n无法获取token，测试结束');
      return;
    }
    
    const token = loginResponse.access_token;
    console.log('\n✓ 登录成功！');
    console.log('Token:', token.substring(0, 50) + '...\n');
    
    for (let i = 1; i <= 3; i++) {
      console.log('========================================');
      console.log(`${i + 1}. 第${i}次心跳检测`);
      console.log('========================================\n');
      
      const heartbeatResponse = await request('http://localhost:8080/api/user/heartbeat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }, {});
      
      console.log('心跳响应:', JSON.stringify(heartbeatResponse, null, 2));
      console.log('时间:', new Date().toLocaleString('zh-CN'));
      console.log('');
      
      if (i < 3) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('========================================');
    console.log('✓ 测试完成！');
    console.log('========================================');
    
  } catch (error) {
    console.error('错误:', error.message);
  }
}

main();
