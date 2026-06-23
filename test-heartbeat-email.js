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
    console.log('  密码:', password);
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
    console.log('\n✓ 登录成功！');
    console.log('Token (前50字符):', token.substring(0, 50) + '...\n');
    
    for (let i = 1; i <= 3; i++) {
      console.log('========================================');
      console.log(`${i + 2}. 第${i}次心跳检测`);
      console.log('========================================\n');
      
      const heartbeatResponse = await request('http://localhost:8080/api/user/heartbeat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }, {});
      
      console.log('心跳响应:', JSON.stringify(heartbeatResponse, null, 2));
      console.log('调用时间:', new Date().toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
      console.log('');
      
      if (i < 3) {
        console.log('⏱️  等待1秒...\n');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('========================================');
    console.log('✅ 测试完成！');
    console.log('========================================');
    
  } catch (error) {
    console.error('\n❌ 错误:', error.message);
  }
}

main();
