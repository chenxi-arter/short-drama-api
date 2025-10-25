/**
 * 系列验证接口测试脚本
 * 测试所有 /api/admin/series/validation 相关接口
 */

const axios = require('axios');

const BASE_URL = process.env.ADMIN_URL || 'http://localhost:9090';
const API_PREFIX = '/api/admin/series/validation';

// 彩色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function printSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function printResult(data) {
  console.log(JSON.stringify(data, null, 2));
}

async function testAPI(endpoint, description, params = {}) {
  log(`\n📍 测试: ${description}`, 'yellow');
  log(`   URL: ${BASE_URL}${API_PREFIX}${endpoint}`, 'blue');
  
  try {
    const startTime = Date.now();
    const response = await axios.get(`${BASE_URL}${API_PREFIX}${endpoint}`, {
      params,
      timeout: 60000, // 60秒超时
    });
    const duration = Date.now() - startTime;
    
    log(`✅ 成功 (${duration}ms)`, 'green');
    
    if (response.data) {
      printResult(response.data);
      
      // 显示关键指标
      if (response.data.data) {
        const data = response.data.data;
        if (data.total !== undefined) {
          log(`   📊 发现问题数: ${data.total}`, 'yellow');
        }
        if (data.checkedSeries !== undefined) {
          log(`   📊 检查系列数: ${data.checkedSeries}`, 'yellow');
        }
      }
    }
    
    return response.data;
  } catch (error) {
    log(`❌ 失败: ${error.message}`, 'red');
    if (error.response?.data) {
      printResult(error.response.data);
    }
    throw error;
  }
}

async function runAllTests() {
  log('\n🚀 开始测试系列验证模块接口\n', 'green');
  log(`Base URL: ${BASE_URL}`, 'blue');
  
  try {
    // 1. 测试统计信息接口
    printSection('1️⃣  测试统计信息接口');
    const stats = await testAPI('/stats', '获取数据质量统计');
    
    // 2. 测试检查缺集接口（全量扫描）
    printSection('2️⃣  测试检查缺集接口（全量扫描）');
    const missingEpisodes = await testAPI(
      '/check-missing-episodes',
      '检查所有系列的缺集问题'
    );
    
    // 3. 测试检查单个系列（如果有问题系列）
    if (missingEpisodes?.data?.items?.length > 0) {
      printSection('3️⃣  测试单个系列详情接口');
      const firstIssue = missingEpisodes.data.items[0];
      const seriesId = firstIssue.series?.id;
      const seriesTitle = firstIssue.series?.title || '未知系列';
      
      if (seriesId) {
        log(`   选择系列: ${seriesTitle} (ID: ${seriesId})`, 'yellow');
        
        await testAPI(
          `/episodes/${seriesId}`,
          `获取系列 ${seriesId} 的详细集数信息`
        );
      } else {
        log('\n⏭️  跳过单个系列测试（数据格式错误）', 'yellow');
      }
    } else {
      log('\n⏭️  跳过单个系列测试（没有发现问题系列）', 'yellow');
    }
    
    // 4. 测试检查重复系列名
    printSection('4️⃣  测试检查重复系列名接口');
    await testAPI(
      '/check-duplicate-names',
      '检查所有重复的系列名'
    );
    
    // 5. 测试检查重复外部ID
    printSection('5️⃣  测试检查重复外部ID接口');
    await testAPI(
      '/check-duplicate-external-ids',
      '检查所有重复的外部ID'
    );
    
    // 测试总结
    printSection('✅ 测试完成');
    log('所有接口测试通过！', 'green');
    
    // 生成测试报告
    console.log('\n📊 测试报告摘要:');
    if (stats?.data) {
      const d = stats.data;
      console.log(`   总系列数: ${d.totalSeries || 'N/A'}`);
      console.log(`   无剧集系列: ${d.seriesWithoutEpisodes || 'N/A'}`);
      console.log(`   抽样大小: ${d.sampleSize || 'N/A'}`);
      console.log(`   估算问题率: ${d.estimatedIssueRate || 'N/A'}`);
    }
    
    if (missingEpisodes?.data) {
      console.log(`   缺集问题系列: ${missingEpisodes.data.total || 0}`);
    }
    
  } catch (error) {
    log('\n❌ 测试失败', 'red');
    process.exit(1);
  }
}

// 运行测试
runAllTests().catch(error => {
  log(`\n❌ 未捕获的错误: ${error.message}`, 'red');
  process.exit(1);
});

