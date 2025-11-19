const crypto = require('crypto');

const botToken = "7901458295:AAFoXrGmxK5xGVZCE8J_Hx4TJfNtHGDVbqk";

// 用户提供的新数据
const telegramData = {
  id: 6702079700,
  first_name: "随风",
  username: "seo99991",
  auth_date: 1754642628,
  hash: "cd671f60a4393b399d9cb269ac4327c8a47a3807c5520077c37477544ae93c07"
};

console.log("=== 测试新Telegram数据的哈希验证 ===");

// Bot登录方式验证
function verifyBotHash(botToken, data) {
  const { hash, ...userData } = data;
  
  const filteredData = Object.fromEntries(
    Object.entries(userData).filter(([, value]) => value !== undefined)
  );

  const checkString = Object.keys(filteredData)
    .sort()
    .map((k) => `${k}=${filteredData[k]}`)
    .join('\n');

  console.log("检查字符串:");
  console.log(checkString);

  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  const calculatedHash = crypto.createHmac('sha256', secretKey)
    .update(checkString)
    .digest('hex');

  console.log("计算的哈希:", calculatedHash);
  console.log("提供的哈希:", hash);
  console.log("验证结果:", calculatedHash === hash);
  
  return calculatedHash === hash;
}

verifyBotHash(botToken, telegramData);
