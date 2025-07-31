/**
 * 测试剧集新功能的脚本
 * 包括访问密钥生成、续集状态更新等功能
 */

const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:3000';
const TEST_TOKEN = 'your_jwt_token_here'; // 需要替换为实际的JWT token

// 创建axios实例
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// 测试函数
async function testEpisodeFeatures() {
  console.log('🚀 开始测试剧集新功能...');
  
  try {
    // 1. 测试批量生成访问密钥
    console.log('\n1. 测试批量生成访问密钥...');
    const generateResult = await api.post('/api/video/generate-access-keys');
    console.log('✅ 批量生成结果:', generateResult.data);
    
    // 2. 测试创建新的剧集播放地址
    console.log('\n2. 测试创建剧集播放地址...');
    const createUrlResult = await api.post('/api/video/episode-url', {
      episodeId: 1,
      quality: '1080p',
      ossUrl: 'https://oss.example.com/video1.mp4',
      cdnUrl: 'https://cdn.example.com/video1.mp4',
      subtitleUrl: 'https://cdn.example.com/subtitle1.srt'
    });
    console.log('✅ 创建播放地址结果:', createUrlResult.data);
    
    const accessKey = createUrlResult.data.accessKey;
    
    // 3. 测试通过访问密钥获取播放地址
    console.log('\n3. 测试通过访问密钥获取播放地址...');
    const getUrlResult = await api.get(`/api/video/episode-url/${accessKey}`);
    console.log('✅ 获取播放地址结果:', getUrlResult.data);
    
    // 4. 测试更新剧集续集状态
    console.log('\n4. 测试更新剧集续集状态...');
    const updateSequelResult = await api.post('/api/video/episode-sequel', {
      episodeId: 1,
      hasSequel: true
    });
    console.log('✅ 更新续集状态结果:', updateSequelResult.data);
    
    // 5. 测试获取视频详情（验证新字段）
    console.log('\n5. 测试获取视频详情...');
    const detailsResult = await api.get('/api/video/details?id=1');
    console.log('✅ 视频详情结果:', JSON.stringify(detailsResult.data, null, 2));
    
    console.log('\n🎉 所有测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

// 测试访问密钥工具类
function testAccessKeyUtil() {
  console.log('\n🔧 测试访问密钥工具类...');
  
  // 模拟AccessKeyUtil功能（因为这是Node.js环境）
  const crypto = require('crypto');
  
  function generateAccessKey(length = 32) {
    return crypto.randomBytes(length / 2).toString('hex');
  }
  
  function isValidAccessKey(key) {
    return /^[a-f0-9]{32}$/i.test(key);
  }
  
  // 测试生成
  const key1 = generateAccessKey();
  const key2 = generateAccessKey(64);
  
  console.log('生成的32位密钥:', key1);
  console.log('生成的64位密钥:', key2);
  console.log('32位密钥验证:', isValidAccessKey(key1));
  console.log('64位密钥验证:', isValidAccessKey(key2));
  console.log('无效密钥验证:', isValidAccessKey('invalid-key'));
}

// 运行测试
if (require.main === module) {
  testAccessKeyUtil();
  
  if (TEST_TOKEN !== 'your_jwt_token_here') {
    testEpisodeFeatures();
  } else {
    console.log('\n⚠️  请先设置有效的JWT token再运行API测试');
  }
}

module.exports = {
  testEpisodeFeatures,
  testAccessKeyUtil
};