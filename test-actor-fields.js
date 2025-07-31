// 测试演员字段功能
// 用于验证series表中新增的演员相关字段

const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:3000';
const TEST_TOKEN = 'your_test_token_here'; // 请替换为实际的测试token

// 创建axios实例
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function testActorFields() {
  console.log('🎬 开始测试演员字段功能...');
  
  try {
    // 1. 测试获取视频详情，验证演员字段
    console.log('\n1. 测试获取视频详情（验证演员字段）...');
    const detailsResult = await api.get('/api/video/details?id=1');
    
    if (detailsResult.data.code === 200) {
      const detailInfo = detailsResult.data.data.detailInfo;
      console.log('✅ 视频详情获取成功');
      console.log('📺 标题:', detailInfo.title);
      console.log('🌟 主演:', detailInfo.starring || '暂无');
      console.log('🎭 演员:', detailInfo.actor || '暂无');
      console.log('🎬 导演:', detailInfo.director || '暂无');
      
      // 验证字段是否存在
      const hasStarring = detailInfo.hasOwnProperty('starring');
      const hasActor = detailInfo.hasOwnProperty('actor');
      const hasDirector = detailInfo.hasOwnProperty('director');
      
      console.log('\n字段验证:');
      console.log(`- starring字段: ${hasStarring ? '✅ 存在' : '❌ 缺失'}`);
      console.log(`- actor字段: ${hasActor ? '✅ 存在' : '❌ 缺失'}`);
      console.log(`- director字段: ${hasDirector ? '✅ 存在' : '❌ 缺失'}`);
      
      if (hasStarring && hasActor && hasDirector) {
        console.log('\n🎉 所有演员字段都已正确添加！');
      } else {
        console.log('\n⚠️  部分演员字段缺失，请检查数据库迁移是否执行成功');
      }
    } else {
      console.log('❌ 获取视频详情失败:', detailsResult.data.msg);
    }
    
    // 2. 测试获取首页视频列表
    console.log('\n2. 测试首页视频列表...');
    const homeResult = await api.get('/api/home/getvideos?page=1');
    
    if (homeResult.data && homeResult.data.data) {
      console.log('✅ 首页视频列表获取成功');
      const videoList = homeResult.data.data.list.find(item => item.type === 1);
      if (videoList && videoList.videos && videoList.videos.length > 0) {
        console.log(`📋 找到 ${videoList.videos.length} 个视频`);
        console.log('💡 提示: 可以使用这些视频ID测试演员字段功能');
        
        // 显示前3个视频的ID
        videoList.videos.slice(0, 3).forEach((video, index) => {
          console.log(`   视频${index + 1}: ID=${video.id}, 标题=${video.title}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('错误详情:', error.message);
    }
  }
}

// 使用说明
function showUsage() {
  console.log('📖 使用说明:');
  console.log('1. 确保服务器正在运行 (npm run start:dev)');
  console.log('2. 执行数据库迁移: mysql -u root -p short_drama < migrations/add-actor-fields-to-series.sql');
  console.log('3. 替换上方的TEST_TOKEN为有效的认证token');
  console.log('4. 运行测试: node test-actor-fields.js');
  console.log('');
}

// 主函数
async function main() {
  showUsage();
  await testActorFields();
  console.log('\n🏁 测试完成！');
}

// 运行测试
if (require.main === module) {
  main();
}

module.exports = { testActorFields };