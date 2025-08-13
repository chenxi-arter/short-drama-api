const jwt = require('jsonwebtoken');

// 使用项目中的 JWT 密钥
const JWT_SECRET = 'your-secret-key';

function generateToken(userId) {
  const payload = {
    sub: userId.toString(),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7天过期
  };
  
  const token = jwt.sign(payload, JWT_SECRET);
  console.log(`🔑 为用户 ${userId} 生成的 JWT Token:`);
  console.log(token);
  console.log('\n📋 使用方式:');
  console.log(`curl -H "Authorization: Bearer ${token}" "http://localhost:8080/api/video/episodes?seriesShortId=fpcxnnFA6m9&page=1&size=3"`);
  
  return token;
}

// 生成测试用户的 token
const testUserId = 6702079700;
generateToken(testUserId);
