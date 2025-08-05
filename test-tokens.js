const http = require('http');
const { URL } = require('url');
const mysql = require('mysql2/promise');
require('dotenv').config();

// 测试用的token
const ACCESS_TOKEN = '8cdd448a91b0df60ab101618906ff5afec8d779f70d810a294633b19e7d3d52e';
const REFRESH_TOKEN = 'your_refresh_token_here'; // 用户没有提供refresh_token

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'short_drama_db',
  port: process.env.DB_PORT || 3306
};

// HTTP请求函数
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testTokens() {
  console.log('🔑 测试Token有效性...');
  console.log('Access Token:', ACCESS_TOKEN);
  console.log('');

  try {
    // 1. 测试 /test/me 端点（需要认证）
    console.log('📡 测试 /test/me 端点...');
    const testMeResponse = await makeRequest('http://localhost:3001/test/me', {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      }
    });
    console.log('状态码:', testMeResponse.status);
    console.log('响应:', testMeResponse.data);
    console.log('');

    // 2. 测试播放地址API
    console.log('🎬 测试播放地址API...');
    const videoResponse = await makeRequest('http://localhost:3001/api/video/episode-url?episode_id=1&quality=720p', {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      }
    });
    console.log('状态码:', videoResponse.status);
    console.log('响应:', videoResponse.data);
    console.log('');

    // 3. 检查数据库中的token记录
    console.log('🗄️ 检查数据库中的token记录...');
    const connection = await mysql.createConnection(dbConfig);
    
    // 查找匹配的access_token
    const [tokenRows] = await connection.execute(
      'SELECT * FROM user_tokens WHERE access_token = ? LIMIT 1',
      [ACCESS_TOKEN]
    );
    
    if (tokenRows.length > 0) {
      const token = tokenRows[0];
      console.log('✅ 找到匹配的token记录:');
      console.log('- Token ID:', token.id);
      console.log('- User ID:', token.user_id);
      console.log('- 创建时间:', token.created_at);
      console.log('- 过期时间:', token.expires_at);
      console.log('- 是否已撤销:', token.is_revoked ? '是' : '否');
      
      // 检查是否过期
      const now = new Date();
      const expiresAt = new Date(token.expires_at);
      if (now > expiresAt) {
        console.log('❌ Token已过期');
      } else {
        console.log('✅ Token未过期');
      }
      
      if (token.is_revoked) {
        console.log('❌ Token已被撤销');
      } else {
        console.log('✅ Token未被撤销');
      }
    } else {
      console.log('❌ 数据库中未找到匹配的token记录');
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message);
  }
}

// 运行测试
testTokens();