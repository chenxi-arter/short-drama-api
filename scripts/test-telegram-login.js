/**
 * Telegram Web App登录测试脚本
 * 使用方法: node scripts/test-telegram-login.js
 */
const axios = require('axios');
const crypto = require('crypto');

const BASE_URL = 'http://localhost:8080/api';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8303051100:AAETrfsTOPHgjlDv1v06jdRTpzjE-cnX7-w';

/**
 * 生成测试用的initData
 */
function generateTestInitData() {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const userData = {
    id: 279058397,
    first_name: "Vladislav",
    last_name: "Kibenko", 
    username: "vdkfrost",
    language_code: "ru",
    is_premium: true
  };
  
  const userDataString = encodeURIComponent(JSON.stringify(userData));
  const queryId = "AAHdF6IQAAAAAN0XohDhrOrc";
  
  // 构建待签名的数据
  const dataToSign = [
    `auth_date=${currentTimestamp}`,
    `query_id=${queryId}`,
    `user=${userDataString}`
  ].join('\n');
  
  // 计算HMAC-SHA256签名
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const hash = crypto.createHmac('sha256', secretKey).update(dataToSign).digest('hex');
  
  return `query_id=${queryId}&user=${userDataString}&auth_date=${currentTimestamp}&hash=${hash}`;
}

/**
 * 测试Telegram登录
 */
async function testTelegramLogin() {
  try {
    console.log('🚀 开始测试Telegram登录功能...\n');
    console.log('🔑 使用Bot Token:', BOT_TOKEN.substring(0, 10) + '...');
    
    const initData = generateTestInitData();
    console.log('📝 生成测试initData');
    console.log('📋 initData:', initData.substring(0, 150) + '...');
    
    // 1. 测试登录
    const loginResponse = await axios.post(`${BASE_URL}/auth/telegram/login`, {
      initData: initData,
      deviceInfo: 'Test Device - Node.js'
    });
    
    console.log('✅ 登录成功');
    console.log('📋 用户信息:', loginResponse.data.user);
    
    const { access_token, refresh_token } = loginResponse.data;
    
    // 2. 测试访问受保护资源
    const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });
    
    console.log('✅ 访问受保护资源成功');
    
    // 3. 测试刷新令牌
    const refreshResponse = await axios.post(`${BASE_URL}/auth/refresh`, {
      refresh_token: refresh_token
    });
    
    console.log('✅ 刷新令牌成功');
    
    console.log('\n🎉 所有测试通过!');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 提示: 请确保API服务正在运行 (npm run start:dev)');
    }
  }
}

if (require.main === module) {
  testTelegramLogin();
}

module.exports = { testTelegramLogin, generateTestInitData };
