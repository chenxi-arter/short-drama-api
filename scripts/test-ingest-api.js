#!/usr/bin/env node

/**
 * Ingest API 快速测试脚本
 * 使用方法: node scripts/test-ingest-api.js
 */

const fs = require('fs');
const path = require('path');

// 配置
const DEFAULT_PORT = process.env.PORT || 8080;
const API_BASE = process.env.API_BASE || `http://localhost:${DEFAULT_PORT}/api/admin/ingest`;
const TEST_DATA_FILE = path.join(__dirname, 'ingest-test-examples.json');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// 加载测试数据
function loadTestData() {
  try {
    const data = fs.readFileSync(TEST_DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    logError(`无法加载测试数据文件: ${error.message}`);
    process.exit(1);
  }
}

// 发送HTTP请求
async function makeRequest(endpoint, data, description) {
  try {
    logInfo(`测试: ${description}`);
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      logSuccess(`${description} - 成功`);
      log(`   响应: ${JSON.stringify(result.data, null, 2)}`, 'cyan');
      return true;
    } else {
      logError(`${description} - 失败`);
      log(`   状态码: ${response.status}`, 'red');
      log(`   错误信息: ${JSON.stringify(result, null, 2)}`, 'red');
      return false;
    }
  } catch (error) {
    logError(`${description} - 网络错误: ${error.message}`);
    return false;
  }
}

// 主测试函数
async function runTests() {
  log('🚀 开始测试 Ingest API', 'bright');
  log(`目标地址: ${API_BASE}`, 'cyan');
  log('==================================================', 'cyan');
  // 健康检查
  try {
    const base = new URL(API_BASE);
    const healthUrl = `${base.origin}/api/health`;
    const healthRes = await fetch(healthUrl).catch(() => null);
    if (!healthRes || !healthRes.ok) {
      logWarning(`健康检查失败或服务不可达: ${healthUrl}`);
      logInfo('请先启动服务，如: PORT=8080 npm run start');
    } else {
      logSuccess('健康检查通过');
    }
  } catch {}
  
  const testData = loadTestData();
  let successCount = 0;
  let totalCount = 0;

  // 测试1: 单个系列入库
  totalCount++;
  const singleResult = await makeRequest(
    '/series',
    testData.single_series_example,
    '单个系列入库'
  );
  if (singleResult) successCount++;

  // 等待一下，避免请求过快
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 测试2: 批量系列入库
  totalCount++;
  const batchResult = await makeRequest(
    '/series/batch',
    testData.batch_series_example,
    '批量系列入库'
  );
  if (batchResult) successCount++;

  // 等待一下
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 测试3: 增量更新
  totalCount++;
  const updateResult = await makeRequest(
    '/series/update',
    testData.update_example,
    '增量更新'
  );
  if (updateResult) successCount++;

  // 等待一下
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 测试4: 最小化示例
  totalCount++;
  const minimalResult = await makeRequest(
    '/series',
    testData.minimal_example,
    '最小化示例'
  );
  if (minimalResult) successCount++;

  // 测试5: 无效-缺字段（应失败，返回 items[0].details）
  totalCount++;
  await makeRequest(
    '/series',
    testData.invalid_single_missing_fields,
    '无效-单条缺字段'
  );

  // 测试6: 批量混合好坏（应部分失败）
  totalCount++;
  await makeRequest(
    '/series/batch',
    testData.invalid_batch_mixed,
    '无效-批量混合'
  );

  // 测试7: 更新不存在（应404）
  totalCount++;
  await makeRequest(
    '/series/update',
    testData.invalid_update_not_found,
    '无效-更新不存在'
  );

  // 测试结果汇总
  log('==================================================', 'cyan');
  log('📊 测试结果汇总', 'bright');
  log(`总测试数: ${totalCount}`, 'cyan');
  log(`成功数: ${successCount}`, 'green');
  log(`失败数: ${totalCount - successCount}`, 'red');
  log(`成功率: ${((successCount / totalCount) * 100).toFixed(1)}%`, 'cyan');

  if (successCount === totalCount) {
    log('🎉 所有测试通过！Ingest API 工作正常。', 'green');
  } else {
    log('⚠️  部分测试失败，请检查API状态。', 'yellow');
  }
}

// 检查依赖
function checkDependencies() {
  try {
    // 检查 fetch 是否可用 (Node.js 18+)
    if (typeof fetch === 'undefined') {
      logError('当前Node.js版本不支持fetch，请升级到Node.js 18+');
      logInfo('或者安装 node-fetch: npm install node-fetch');
      process.exit(1);
    }
  } catch (error) {
    logError(`依赖检查失败: ${error.message}`);
    process.exit(1);
  }
}

// 主函数
async function main() {
  try {
    checkDependencies();
    await runTests();
  } catch (error) {
    logError(`测试执行失败: ${error.message}`);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  main();
}

module.exports = { runTests, makeRequest };
