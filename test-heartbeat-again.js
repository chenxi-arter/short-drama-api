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
    const email = 'test92741708@example.com';
    const password = 'Test123456';
    
    console.log('========================================');
    console.log('1. 使用已注册邮箱登录');
    console.log('========================================\n');
    console.log('登录邮箱:', email);
    console.log('');
    
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
    console.log('2. 再次调用心跳检测（第4次）');
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
    
    console.log('========================================');
    console.log('说明');
    console.log('========================================');
    console.log('✓ 每次心跳调用会累加 60 秒在线时长');
    console.log('✓ 现在总共调用了 4 次心跳，应该累计 240 秒（4分钟）');
    console.log('✓ 数据先存储在 Redis 中');
    console.log('✓ 系统每 5 分钟会自动将 Redis 数据同步到 MySQL');
    console.log('✓ 可以查看 Redis 获取实时数据\n');
    
  } catch (error) {
    console.error('\n❌ 错误:', error.message);
  }
}

main();
