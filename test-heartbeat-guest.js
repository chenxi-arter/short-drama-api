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
    console.log('1. 游客登录（自动注册）');
    console.log('========================================\n');
    
    // 使用游客登录
    const guestLoginResponse = await request('http://localhost:8080/api/auth/guest-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {});
    
    console.log('游客登录响应:');
    console.log(JSON.stringify(guestLoginResponse, null, 2));
    
    if (!guestLoginResponse.access_token) {
      console.log('\n无法获取token，测试结束');
      return;
    }
    
    const token = guestLoginResponse.access_token;
    console.log('\n✓ 游客登录成功！');
    console.log('Token (前50字符):', token.substring(0, 50) + '...\n');
    
    // 调用三次心跳检测
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
      
      // 在第一次和第二次之间等待1秒
      if (i < 3) {
        console.log('⏱️  等待1秒后继续...\n');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('========================================');
    console.log('✅ 测试完成！');
    console.log('========================================');
    console.log('\n说明:');
    console.log('- 心跳检测API会记录用户的在线活动');
    console.log('- 每次调用都会更新用户当天的在线状态');
    console.log('- 返回 { ok: true } 表示心跳记录成功');
    
  } catch (error) {
    console.error('\n❌ 错误:', error.message);
  }
}

main();
