#!/usr/bin/env node

/**
 * 浏览记录优化测试脚本
 * 用于验证优化后的浏览记录功能
 */

const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:3000';
const TEST_USER_TOKEN = 'your-test-token-here'; // 需要替换为实际的测试用户token

// 测试数据
const testSeries = [
  { shortId: 'series001', title: '测试系列1' },
  { shortId: 'series002', title: '测试系列2' },
  { shortId: 'series003', title: '测试系列3' },
];

async function testBrowseHistoryOptimization() {
  console.log('🚀 开始浏览记录优化测试...\n');

  try {
    // 1. 测试记录浏览历史（同系列多次访问）
    console.log('📝 测试1: 同系列多次访问（应该更新而非新建）');
    for (let i = 0; i < 3; i++) {
      await recordBrowseHistory('series001', 'episode_list', i + 1);
      await sleep(1000); // 等待1秒
    }
    console.log('✅ 同系列多次访问测试完成\n');

    // 2. 测试获取浏览记录（应该只返回最新记录）
    console.log('📋 测试2: 获取浏览记录（应该去重）');
    const browseHistory = await getBrowseHistory();
    console.log(`📊 返回记录数量: ${browseHistory.list.length}`);
    console.log('📋 浏览记录列表:');
    browseHistory.list.forEach((record, index) => {
      console.log(`  ${index + 1}. ${record.seriesTitle} - ${record.browseTypeDesc} - 访问次数: ${record.visitCount}`);
    });
    console.log('✅ 获取浏览记录测试完成\n');

    // 3. 测试清理统计信息
    console.log('📈 测试3: 获取清理统计信息');
    const stats = await getCleanupStats();
    console.log(`📊 清理统计信息:`, stats);
    console.log('✅ 清理统计信息测试完成\n');

    // 4. 测试手动清理任务
    console.log('🧹 测试4: 手动触发清理任务');
    const cleanupResult = await manualCleanup();
    console.log(`📊 清理结果:`, cleanupResult);
    console.log('✅ 手动清理任务测试完成\n');

    console.log('🎉 所有测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    process.exit(1);
  }
}

// 记录浏览历史
async function recordBrowseHistory(seriesShortId, browseType, lastEpisodeNumber) {
  try {
    const response = await axios.get(`${BASE_URL}/video/browse-history/sync`, {
      params: {
        seriesShortId,
        browseType,
        lastEpisodeNumber
      },
      headers: {
        'Authorization': `Bearer ${TEST_USER_TOKEN}`
      }
    });
    
    if (response.data.code === 200) {
      console.log(`  ✅ 记录浏览历史成功: ${seriesShortId} - ${browseType} - 第${lastEpisodeNumber}集`);
    } else {
      console.log(`  ❌ 记录浏览历史失败: ${response.data.msg}`);
    }
  } catch (error) {
    console.log(`  ❌ 记录浏览历史异常: ${error.message}`);
  }
}

// 获取浏览记录
async function getBrowseHistory() {
  try {
    const response = await axios.get(`${BASE_URL}/video/browse-history`, {
      params: {
        page: 1,
        size: 10
      },
      headers: {
        'Authorization': `Bearer ${TEST_USER_TOKEN}`
      }
    });
    
    if (response.data.code === 200) {
      return response.data.data;
    } else {
      throw new Error(response.data.msg);
    }
  } catch (error) {
    throw new Error(`获取浏览记录失败: ${error.message}`);
  }
}

// 获取清理统计信息
async function getCleanupStats() {
  try {
    const response = await axios.get(`${BASE_URL}/video/browse-history/cleanup-stats`, {
      headers: {
        'Authorization': `Bearer ${TEST_USER_TOKEN}`
      }
    });
    
    if (response.data.code === 200) {
      return response.data.data;
    } else {
      throw new Error(response.data.msg);
    }
  } catch (error) {
    throw new Error(`获取清理统计信息失败: ${error.message}`);
  }
}

// 手动触发清理任务
async function manualCleanup() {
  try {
    const response = await axios.post(`${BASE_URL}/video/browse-history/cleanup-excess`, {}, {
      headers: {
        'Authorization': `Bearer ${TEST_USER_TOKEN}`
      }
    });
    
    if (response.data.code === 200) {
      return response.data.data;
    } else {
      throw new Error(response.data.msg);
    }
  } catch (error) {
    throw new Error(`手动清理任务失败: ${error.message}`);
  }
}

// 睡眠函数
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 运行测试
if (require.main === module) {
  testBrowseHistoryOptimization();
}

module.exports = {
  testBrowseHistoryOptimization,
  recordBrowseHistory,
  getBrowseHistory,
  getCleanupStats,
  manualCleanup
};
