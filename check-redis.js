const redis = require('redis');

async function checkRedisData() {
  const client = redis.createClient({
    url: 'redis://localhost:6379'
  });
  
  await client.connect();
  
  const today = new Date().toISOString().slice(0, 10);
  const userId = '1782192742719';
  const key = `online:${today}`;
  
  console.log('========================================');
  console.log('查询 Redis 中的在线时长数据');
  console.log('========================================\n');
  console.log('日期:', today);
  console.log('用户ID:', userId);
  console.log('Redis Key:', key);
  console.log('');
  
  const onlineSeconds = await client.hGet(key, userId);
  
  console.log('========================================');
  console.log('结果');
  console.log('========================================');
  console.log('累计在线时长:', onlineSeconds, '秒');
  console.log('换算:', Math.floor(onlineSeconds / 60), '分钟', onlineSeconds % 60, '秒');
  console.log('');
  console.log('心跳调用次数:', Math.floor(onlineSeconds / 60), '次（每次60秒）');
  console.log('');
  
  await client.disconnect();
}

checkRedisData().catch(console.error);
