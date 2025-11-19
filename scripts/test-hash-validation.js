const crypto = require('crypto');

// 用户提供的数据
const telegramData = {
  id: 6702079700,
  first_name: "随风",
  username: "seo99991", 
  auth_date: 1756110977,
  hash: "3fe618fa7e4fef3d94b8c847890d8d084c249050837ecc67f072472c1305ba5b"
};

const botToken = "7901458295:AAFoXrGmxK5xGVZCE8J_Hx4TJfNtHGDVbqk"; // 从日志中看到的

console.log("=== 测试Bot登录方式的哈希验证 ===");

// Bot登录方式验证（当前绑定接口使用的方式）
function verifyBotHash(botToken, data) {
  const { hash, ...userData } = data;
  
  // 过滤掉undefined值
  const filteredData = Object.fromEntries(
    Object.entries(userData).filter(([, value]) => value !== undefined)
  );

  const checkString = Object.keys(filteredData)
    .sort()
    .map((k) => `${k}=${filteredData[k]}`)
    .join('\n');

  console.log("Bot登录检查字符串:");
  console.log(checkString);

  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  const calculatedHash = crypto.createHmac('sha256', secretKey)
    .update(checkString)
    .digest('hex');

  console.log("Bot登录计算的哈希:", calculatedHash);
  console.log("提供的哈希:", hash);
  console.log("Bot登录验证结果:", calculatedHash === hash);
  
  return calculatedHash === hash;
}

console.log("\n=== 测试Web App方式的哈希验证 ===");

// Web App方式验证
function verifyWebAppHash(botToken, data) {
  const { hash, ...userData } = data;
  
  // 过滤掉undefined值
  const filteredData = Object.fromEntries(
    Object.entries(userData).filter(([, value]) => value !== undefined)
  );

  const checkString = Object.keys(filteredData)
    .sort()
    .map((k) => `${k}=${filteredData[k]}`)
    .join('\n');

  console.log("Web App检查字符串:");
  console.log(checkString);

  // Web App使用'WebAppData'作为前缀
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();
    
  const calculatedHash = crypto.createHmac('sha256', secretKey)
    .update(checkString)
    .digest('hex');

  console.log("Web App计算的哈希:", calculatedHash);
  console.log("提供的哈希:", hash);
  console.log("Web App验证结果:", calculatedHash === hash);
  
  return calculatedHash === hash;
}

// 执行测试
verifyBotHash(botToken, telegramData);
verifyWebAppHash(botToken, telegramData);
