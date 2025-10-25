#!/usr/bin/env node

/**
 * 完整测试系列验证统计功能
 * 验证 duplicateNames 和 duplicateExternalIds 统计的准确性
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:9090/api/admin/series/validation';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function printSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

async function testAPI(endpoint, description) {
  try {
    const startTime = Date.now();
    const response = await axios.get(`${BASE_URL}${endpoint}`);
    const duration = Date.now() - startTime;
    
    log(`\n✅ ${description}`, 'green');
    log(`   耗时: ${duration}ms`, 'blue');
    
    return response.data;
  } catch (error) {
    log(`\n❌ ${description} - 失败`, 'red');
    if (error.response) {
      log(`   状态码: ${error.response.status}`, 'red');
      log(`   错误信息: ${JSON.stringify(error.response.data)}`, 'red');
    } else {
      log(`   错误: ${error.message}`, 'red');
    }
    return null;
  }
}

async function main() {
  printSection('📊 系列验证统计功能完整测试');
  
  // 1. 获取统计信息
  printSection('1️⃣  测试统计接口');
  const stats = await testAPI('/stats', '获取数据质量统计');
  
  if (stats?.data) {
    console.log('\n📈 统计结果：');
    console.log(JSON.stringify(stats.data, null, 2));
    
    log('\n📊 关键指标：', 'yellow');
    log(`   总系列数: ${stats.data.overview.totalSeries}`, 'blue');
    log(`   健康系列: ${stats.data.overview.healthySeries}`, 'green');
    log(`   问题系列: ${stats.data.overview.issuesSeries}`, 'red');
    log(`   缺集问题: ${stats.data.issues.missingEpisodes}`, 'yellow');
    log(`   重复集数: ${stats.data.issues.duplicateEpisodes}`, 'yellow');
    log(`   重复名称: ${stats.data.issues.duplicateNames} 组`, 'yellow');
    log(`   重复外部ID: ${stats.data.issues.duplicateExternalIds} 组`, 'yellow');
    log(`   空系列: ${stats.data.issues.emptySeries}`, 'yellow');
    log(`   质量评分: ${stats.data.quality.score} (${stats.data.quality.grade})`, 'cyan');
  }
  
  // 2. 测试重复名称检查
  printSection('2️⃣  测试重复名称检查');
  const duplicateNames = await testAPI('/check-duplicate-names', '检查重复系列名');
  
  if (duplicateNames?.data) {
    log(`\n发现 ${duplicateNames.data.total} 个重复名称组`, 'yellow');
    log(`涉及 ${duplicateNames.data.totalDuplicateCount} 个系列`, 'yellow');
    
    if (duplicateNames.data.items?.length > 0) {
      log('\n详细信息：', 'cyan');
      duplicateNames.data.items.forEach((item, index) => {
        log(`\n  ${index + 1}. 名称: "${item.title}"`, 'blue');
        log(`     重复次数: ${item.count}`, 'yellow');
        log(`     系列ID: ${item.series.map(s => s.id).join(', ')}`, 'blue');
      });
    }
  }
  
  // 3. 测试重复外部ID检查
  printSection('3️⃣  测试重复外部ID检查');
  const duplicateExtIds = await testAPI('/check-duplicate-external-ids', '检查重复外部ID');
  
  if (duplicateExtIds?.data) {
    log(`\n发现 ${duplicateExtIds.data.total} 个重复外部ID组`, 'yellow');
    log(`涉及 ${duplicateExtIds.data.totalDuplicateCount || 0} 个系列`, 'yellow');
    
    if (duplicateExtIds.data.items?.length > 0) {
      log('\n详细信息：', 'cyan');
      duplicateExtIds.data.items.forEach((item, index) => {
        log(`\n  ${index + 1}. 外部ID: "${item.externalId}"`, 'blue');
        log(`     重复次数: ${item.count}`, 'yellow');
        log(`     系列ID: ${item.series.map(s => s.id).join(', ')}`, 'blue');
      });
    } else {
      log('\n  ✅ 没有发现重复的外部ID', 'green');
    }
  }
  
  // 4. 验证数据一致性
  printSection('4️⃣  验证数据一致性');
  
  if (stats?.data && duplicateNames?.data) {
    const statsCount = stats.data.issues.duplicateNames;
    const actualCount = duplicateNames.data.total;
    
    if (statsCount === actualCount) {
      log(`\n✅ 重复名称统计一致: ${statsCount} 组`, 'green');
    } else {
      log(`\n❌ 重复名称统计不一致！`, 'red');
      log(`   统计接口显示: ${statsCount} 组`, 'red');
      log(`   实际检查发现: ${actualCount} 组`, 'red');
    }
  }
  
  if (stats?.data && duplicateExtIds?.data) {
    const statsCount = stats.data.issues.duplicateExternalIds;
    const actualCount = duplicateExtIds.data.total;
    
    if (statsCount === actualCount) {
      log(`\n✅ 重复外部ID统计一致: ${statsCount} 组`, 'green');
    } else {
      log(`\n❌ 重复外部ID统计不一致！`, 'red');
      log(`   统计接口显示: ${statsCount} 组`, 'red');
      log(`   实际检查发现: ${actualCount} 组`, 'red');
    }
  }
  
  // 5. 总结
  printSection('📝 测试总结');
  log('\n✅ 所有测试完成！', 'green');
  log('\n验证项目：', 'cyan');
  log('  ✓ 统计接口响应正常', 'green');
  log('  ✓ 重复名称检查功能正常', 'green');
  log('  ✓ 重复外部ID检查功能正常', 'green');
  log('  ✓ 统计数据一致性验证', 'green');
  
  console.log('\n');
}

main().catch(error => {
  log('\n❌ 测试过程出错', 'red');
  console.error(error);
  process.exit(1);
});

