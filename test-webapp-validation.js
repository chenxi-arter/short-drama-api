const crypto = require('crypto');

const botToken = "7901458295:AAFoXrGmxK5xGVZCE8J_Hx4TJfNtHGDVbqk";

// 完整的initData
const initData = "user=%7B%22id%22%3A6702079700%2C%22first_name%22%3A%22%E9%9A%8F%E9%A3%8E%22%2C%22last_name%22%3A%22%22%2C%22username%22%3A%22seo99991%22%2C%22language_code%22%3A%22zh-hans%22%2C%22allows_write_to_pm%22%3Atrue%2C%22photo_url%22%3A%22https%3A%5C%2F%5C%2Ft.me%5C%2Fi%5C%2Fuserpic%5C%2F320%5C%2FZmcCUiO3ad-NkMSzrdNaA7WhKJV3YpNH9JnfmJAiBx6RaeSGSqYqQaXHl0XLd8-I.svg%22%7D&chat_instance=1564885613800394904&chat_type=private&auth_date=1758522053&signature=k2yYzZhMkFpbYPvClPacYnY4cctf7UwS04pRchBqiKo49yx5QNRGFmLxzDXph5SLAs8Fw05Wm8lRF1cj_yq2BA&hash=0e0277f78d1168ea3ef1055a3f97c1bf5725e0a3e0f8bd0b19be91d4fb8e0fae";

console.log("=== 测试Web App initData验证 ===");

function verifyInitData(initData, botToken) {
  // 解析query string
  const urlParams = new URLSearchParams(initData);
  const data = Object.fromEntries(urlParams.entries());

  // 提取hash并从数据中删除
  const receivedHash = data.hash;
  delete data.hash;

  console.log("数据参数:");
  for (const [key, value] of Object.entries(data)) {
    console.log(`  ${key}: ${value}`);
  }

  // 按字母顺序构建待验证字符串
  const dataCheckArr = [];
  for (const key of Object.keys(data).sort()) {
    const value = data[key];
    if (typeof value === 'string') {
      dataCheckArr.push(`${key}=${value}`);
    }
  }
  const dataCheckString = dataCheckArr.join('\n');

  console.log("\n检查字符串:");
  console.log(dataCheckString);

  // 计算HMAC-SHA256
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();
    
  const hmacHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  console.log("\n计算的哈希:", hmacHash);
  console.log("接收的哈希:", receivedHash);
  console.log("验证结果:", hmacHash === receivedHash);
  
  return hmacHash === receivedHash;
}

verifyInitData(initData, botToken);
