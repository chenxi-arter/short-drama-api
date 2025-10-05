/**
 * 推荐功能测试脚本
 * 测试类似抖音的随机推荐功能
 * 
 * 运行方式：node scripts/test-recommend.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api/video';

// ANSI 颜色代码
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60) + '\n');
}

/**
 * 测试推荐接口
 */
async function testRecommendAPI() {
  logSection('📋 测试 1: 获取推荐列表（默认参数）');
  
  try {
    const startTime = Date.now();
    const response = await axios.get(`${BASE_URL}/recommend`);
    const duration = Date.now() - startTime;
    
    if (response.data.code === 200) {
      log(`✅ 请求成功 (${duration}ms)`, 'green');
      log(`返回数据结构:`, 'cyan');
      
      const data = response.data.data;
      console.log(`  - 当前页码: ${data.page}`);
      console.log(`  - 每页数量: ${data.size}`);
      console.log(`  - 列表长度: ${data.list.length}`);
      console.log(`  - 是否有更多: ${data.hasMore}`);
      
      if (data.list.length > 0) {
        log(`\n第一条推荐内容:`, 'cyan');
        const first = data.list[0];
        console.log(`  - 剧集标题: ${first.seriesTitle} - 第${first.episodeTitle}集`);
        console.log(`  - 剧集 ShortId: ${first.shortId}`);
        console.log(`  - 系列 ShortId: ${first.seriesShortId}`);
        console.log(`  - 时长: ${first.duration}秒`);
        console.log(`  - 状态: ${first.status}`);
        console.log(`  - 竖屏播放: ${first.isVertical}`);
        console.log(`  - 播放次数: ${first.playCount}`);
        console.log(`  - 点赞数: ${first.likeCount}`);
        console.log(`  - 收藏数: ${first.favoriteCount}`);
        console.log(`  - 评论数: ${first.commentCount}`);
        console.log(`  - 推荐分数: ${first.recommendScore}`);
        console.log(`  - 播放地址数量: ${first.urls.length}`);
      }
      
      return true;
    } else {
      log(`❌ 请求失败: ${response.data.msg}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ 请求异常: ${error.message}`, 'red');
    if (error.response) {
      console.log('响应数据:', error.response.data);
    }
    return false;
  }
}

/**
 * 测试分页功能
 */
async function testPagination() {
  logSection('📋 测试 2: 分页功能');
  
  try {
    log('请求第1页（每页3条）...', 'yellow');
    const page1 = await axios.get(`${BASE_URL}/recommend?page=1&size=3`);
    
    log('请求第2页（每页3条）...', 'yellow');
    const page2 = await axios.get(`${BASE_URL}/recommend?page=2&size=3`);
    
    if (page1.data.code === 200 && page2.data.code === 200) {
      log('✅ 分页测试通过', 'green');
      
      const list1 = page1.data.data.list;
      const list2 = page2.data.data.list;
      
      console.log(`第1页返回 ${list1.length} 条数据`);
      console.log(`第2页返回 ${list2.length} 条数据`);
      
      // 检查是否有重复
      const ids1 = list1.map(item => item.shortId);
      const ids2 = list2.map(item => item.shortId);
      const duplicates = ids1.filter(id => ids2.includes(id));
      
      if (duplicates.length > 0) {
        log(`⚠️  发现重复数据: ${duplicates.length} 条`, 'yellow');
      } else {
        log('✅ 无重复数据', 'green');
      }
      
      return true;
    } else {
      log('❌ 分页测试失败', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ 分页测试异常: ${error.message}`, 'red');
    return false;
  }
}

/**
 * 测试随机性
 */
async function testRandomness() {
  logSection('📋 测试 3: 随机性测试');
  
  try {
    log('连续请求3次，观察结果是否有变化...', 'yellow');
    
    const requests = [];
    for (let i = 0; i < 3; i++) {
      const response = await axios.get(`${BASE_URL}/recommend?page=1&size=5`);
      requests.push(response.data.data.list.map(item => ({
        shortId: item.shortId,
        score: item.recommendScore
      })));
      await new Promise(resolve => setTimeout(resolve, 100)); // 短暂延迟
    }
    
    log('结果对比:', 'cyan');
    for (let i = 0; i < requests.length; i++) {
      console.log(`\n第 ${i + 1} 次请求:`);
      requests[i].forEach((item, idx) => {
        console.log(`  ${idx + 1}. ${item.shortId} (分数: ${item.score})`);
      });
    }
    
    // 检查是否完全相同
    const firstIds = requests[0].map(item => item.shortId).join(',');
    const allSame = requests.every(req => 
      req.map(item => item.shortId).join(',') === firstIds
    );
    
    if (allSame) {
      log('\n⚠️  3次请求结果完全相同（可能需要检查随机因子）', 'yellow');
    } else {
      log('\n✅ 结果具有随机性', 'green');
    }
    
    return true;
  } catch (error) {
    log(`❌ 随机性测试异常: ${error.message}`, 'red');
    return false;
  }
}

/**
 * 性能测试
 */
async function testPerformance() {
  logSection('📋 测试 4: 性能测试');
  
  try {
    log('执行10次请求，统计响应时间...', 'yellow');
    
    const times = [];
    for (let i = 0; i < 10; i++) {
      const startTime = Date.now();
      await axios.get(`${BASE_URL}/recommend?page=1&size=20`);
      const duration = Date.now() - startTime;
      times.push(duration);
    }
    
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    log('性能统计:', 'cyan');
    console.log(`  - 平均响应时间: ${avgTime.toFixed(2)}ms`);
    console.log(`  - 最快响应: ${minTime}ms`);
    console.log(`  - 最慢响应: ${maxTime}ms`);
    
    if (avgTime < 100) {
      log('✅ 性能优秀（< 100ms）', 'green');
    } else if (avgTime < 500) {
      log('✅ 性能良好（< 500ms）', 'green');
    } else {
      log('⚠️  响应较慢，建议优化', 'yellow');
    }
    
    return true;
  } catch (error) {
    log(`❌ 性能测试异常: ${error.message}`, 'red');
    return false;
  }
}

/**
 * 主测试函数
 */
async function runTests() {
  log('🚀 开始测试推荐功能', 'bright');
  log(`测试服务器: ${BASE_URL}`, 'cyan');
  
  const results = [];
  
  // 执行所有测试
  results.push(await testRecommendAPI());
  results.push(await testPagination());
  results.push(await testRandomness());
  results.push(await testPerformance());
  
  // 统计结果
  logSection('📊 测试结果汇总');
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  log(`通过: ${passed}/${total}`, passed === total ? 'green' : 'yellow');
  
  if (passed === total) {
    log('\n🎉 所有测试通过！', 'green');
  } else {
    log('\n⚠️  部分测试失败，请检查日志', 'yellow');
  }
}

// 执行测试
runTests().catch(error => {
  log(`\n❌ 测试执行失败: ${error.message}`, 'red');
  process.exit(1);
});
