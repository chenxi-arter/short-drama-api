const http = require('http');

async function request(url, options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
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
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function main() {
  console.log('=========================================');
  console.log('1. 用户注册');
  console.log('=========================================');
  
  const timestamp = Date.now().toString().slice(-6);
  const email = 'test' + timestamp + '@ex.com';
  const password = 'Test123456';
  
  const registerData = {
    email: email,
    password: password,
    confirmPassword: password,
    username: 'test' + timestamp
  };
  
  const registerResponse = await request('http://localhost:8080/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, registerData);
  
  console.log('注册响应:', JSON.stringify(registerResponse, null, 2));
  
  console.log('\n=========================================');
  console.log('2. 用户登录');
  console.log('=========================================');
  
  const loginData = {
    email: email,
    password: password
  };
  
  const loginResponse = await request('http://localhost:8080/api/auth/email-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, loginData);
  
  console.log('登录响应:', JSON.stringify(loginResponse, null, 2));
  
  const token = loginResponse.access_token;
  if (!token) {
    console.log('登录失败，无法获取token');
    return;
  }
  
  console.log('\n获取到的 Token:', token.substring(0, 50) + '...');
  
  for (let i = 1; i <= 3; i++) {
    console.log('\n=========================================');
    console.log(`${i + 2}. 第${i}次心跳检测`);
    console.log('=========================================');
    
    const heartbeatResponse = await request('http://localhost:8080/api/user/heartbeat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }, {});
    
    console.log(`心跳响应:`, JSON.stringify(heartbeatResponse, null, 2));
    console.log(`时间: ${new Date().toLocaleString('zh-CN')}`);
    
    if (i < 3) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('\n=========================================');
  console.log('测试完成');
  console.log('=========================================');
}

main().catch(console.error);
