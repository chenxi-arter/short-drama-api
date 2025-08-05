require('dotenv').config();
const mysql = require('mysql2/promise');
const http = require('http');
const { URL } = require('url');

async function testAPI() {
  console.log('🧪 测试API和数据...');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '123456',
    database: process.env.DB_NAME || 'short_drama'
  });
  
  try {
    // 获取一些测试数据
    const [episodes] = await connection.execute(`
      SELECT e.id, e.uuid, e.series_id, e.episode_number, e.title, e.duration, e.status
      FROM episodes e 
      WHERE e.series_id = 66 
      ORDER BY e.episode_number 
      LIMIT 3
    `);
    
    console.log('\n📺 系列66的剧集数据:');
    console.table(episodes);
    
    // 获取播放地址
    const [urls] = await connection.execute(`
      SELECT eu.id, eu.episode_id, eu.quality, eu.access_key, eu.oss_url
      FROM episode_urls eu
      JOIN episodes e ON eu.episode_id = e.id
      WHERE e.series_id = 66
      ORDER BY e.episode_number, eu.quality
      LIMIT 5
    `);
    
    console.log('\n🔗 播放地址数据:');
    console.table(urls);
    
    if (urls.length > 0) {
      const testAccessKey = urls[0].access_key;
      console.log(`\n🔑 测试Access Key: ${testAccessKey}`);
      
      // 测试API
      try {
        console.log('\n🌐 测试API端点...');
        
        // 简单的HTTP请求函数
        const makeRequest = (url) => {
          return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const options = {
              hostname: urlObj.hostname,
              port: urlObj.port,
              path: urlObj.pathname + urlObj.search,
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              }
            };
            
            const req = http.request(options, (res) => {
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
            
            req.setTimeout(5000, () => {
              req.destroy();
              reject(new Error('Request timeout'));
            });
            
            req.end();
          });
        };
        
        // 测试基础端点
        try {
          const testResponse = await makeRequest('http://localhost:3001/test/me');
          console.log('✅ /test/me 响应:', testResponse.status, testResponse.data);
        } catch (err) {
          console.log('❌ /test/me 失败:', err.message);
        }
        
        // 测试播放地址API
        try {
          const urlResponse = await makeRequest(`http://localhost:3001/api/video/episode-url/${testAccessKey}`);
          console.log('✅ 播放地址API响应:', urlResponse.status, urlResponse.data);
        } catch (err) {
          console.log('❌ 播放地址API失败:', err.message);
        }
        
      } catch (apiError) {
        console.error('❌ API测试失败:', apiError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    await connection.end();
    console.log('\n🔌 数据库连接已关闭');
  }
}

testAPI().catch(console.error);