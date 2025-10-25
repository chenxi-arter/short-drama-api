/**
 * 验证统计接口准确性
 * 对比统计接口和缺集检查接口的结果
 */

const axios = require('axios');

const BASE_URL = process.env.ADMIN_URL || 'http://localhost:9090';
const API_PREFIX = '/api/admin/series/validation';

async function verifyAccuracy() {
  console.log('🔍 验证统计接口准确性\n');

  try {
    // 1. 获取统计数据
    console.log('📊 获取统计接口数据...');
    const statsResponse = await axios.get(`${BASE_URL}${API_PREFIX}/stats`);
    const stats = statsResponse.data.data;
    
    console.log('\n统计接口返回:');
    console.log(`  总系列数: ${stats.overview.totalSeries}`);
    console.log(`  问题系列: ${stats.overview.issuesSeries}`);
    console.log(`  健康系列: ${stats.overview.healthySeries}`);
    console.log(`  - 缺集问题: ${stats.issues.missingEpisodes}`);
    console.log(`  - 重复集数: ${stats.issues.duplicateEpisodes}`);
    console.log(`  - 空系列: ${stats.issues.emptySeries}`);

    // 2. 获取缺集检查结果
    console.log('\n📋 获取缺集检查结果...');
    const missingResponse = await axios.get(`${BASE_URL}${API_PREFIX}/check-missing-episodes`);
    const missing = missingResponse.data.data;
    
    console.log('\n缺集检查返回:');
    console.log(`  检查系列数: ${missing.checkedSeries}`);
    console.log(`  发现问题: ${missing.total}`);
    
    // 分析问题类型
    let emptyCount = 0;
    let missingCount = 0;
    let duplicateCount = 0;
    let bothCount = 0;
    
    missing.items.forEach(item => {
      if (item.status === 'NO_EPISODES') {
        emptyCount++;
      } else if (item.status === 'HAS_ISSUES') {
        const hasMissing = item.missingEpisodes && item.missingEpisodes.length > 0;
        const hasDuplicate = item.duplicateEpisodes && item.duplicateEpisodes.length > 0;
        
        if (hasMissing && hasDuplicate) {
          bothCount++;
          console.log(`  ⚠️  系列 ${item.seriesId} (${item.seriesTitle}): 缺集+重复`);
        } else if (hasMissing) {
          missingCount++;
          console.log(`  ⚠️  系列 ${item.seriesId} (${item.seriesTitle}): 缺集 ${item.missingEpisodes.join(',')}`);
        } else if (hasDuplicate) {
          duplicateCount++;
          console.log(`  ⚠️  系列 ${item.seriesId} (${item.seriesTitle}): 重复 ${item.duplicateEpisodes.join(',')}`);
        }
      }
    });
    
    console.log('\n问题分类:');
    console.log(`  空系列: ${emptyCount}`);
    console.log(`  只有缺集: ${missingCount}`);
    console.log(`  只有重复: ${duplicateCount}`);
    console.log(`  缺集+重复: ${bothCount}`);
    
    // 3. 对比验证
    console.log('\n✅ 验证结果:');
    
    const actualIssues = emptyCount + missingCount + duplicateCount + bothCount;
    const statsIssues = stats.overview.issuesSeries;
    
    if (actualIssues === statsIssues) {
      console.log(`  ✅ 总问题数一致: ${actualIssues} = ${statsIssues}`);
    } else {
      console.log(`  ❌ 总问题数不一致: 实际=${actualIssues}, 统计=${statsIssues}`);
    }
    
    if (emptyCount === stats.issues.emptySeries) {
      console.log(`  ✅ 空系列数一致: ${emptyCount}`);
    } else {
      console.log(`  ❌ 空系列数不一致: 实际=${emptyCount}, 统计=${stats.issues.emptySeries}`);
    }
    
    if (missingCount === stats.issues.missingEpisodes) {
      console.log(`  ✅ 缺集问题一致: ${missingCount}`);
    } else {
      console.log(`  ❌ 缺集问题不一致: 实际=${missingCount}, 统计=${stats.issues.missingEpisodes}`);
    }
    
    if (duplicateCount === stats.issues.duplicateEpisodes) {
      console.log(`  ✅ 重复集数一致: ${duplicateCount}`);
    } else {
      console.log(`  ❌ 重复集数不一致: 实际=${duplicateCount}, 统计=${stats.issues.duplicateEpisodes}`);
    }

    console.log('\n📈 数据质量:');
    console.log(`  质量评分: ${stats.quality.score} (${stats.quality.grade})`);
    console.log(`  问题率: ${stats.quality.issueRate}`);
    
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
    process.exit(1);
  }
}

verifyAccuracy().catch(console.error);

