/**
 * 详细诊断脚本 - 找出所有有问题的系列
 */

const axios = require('axios');

const BASE_URL = process.env.ADMIN_URL || 'http://localhost:9090';

async function findAllIssues() {
  console.log('🔍 开始全面诊断数据库问题\n');

  try {
    // 1. 获取所有系列
    console.log('📥 正在获取所有系列...');
    const seriesResponse = await axios.get(`${BASE_URL}/api/admin/series?size=99999`);
    const allSeries = seriesResponse.data.items;
    console.log(`   找到 ${allSeries.length} 个系列\n`);

    // 2. 检查每个系列的剧集
    console.log('🔎 逐个检查系列剧集情况...\n');
    
    let emptyCount = 0;
    let missingCount = 0;
    let duplicateCount = 0;
    let bothCount = 0;
    
    const issues = [];

    for (const series of allSeries) {
      // 获取该系列的所有剧集
      const episodesResponse = await axios.get(
        `${BASE_URL}/api/admin/episodes?seriesId=${series.id}&size=999`
      );
      const episodes = episodesResponse.data.items || [];
      
      if (episodes.length === 0) {
        if (series.isActive === 1) {
          emptyCount++;
          issues.push({
            type: 'empty',
            seriesId: series.id,
            title: series.title,
            totalEpisodes: 0,
          });
        }
        continue;
      }

      // 提取集数
      const numbers = episodes
        .map(e => e.episodeNumber)
        .filter(n => n != null)
        .sort((a, b) => a - b);
      
      if (numbers.length === 0) continue;

      const max = Math.max(...numbers);
      const min = Math.min(...numbers);
      
      // 检查缺集
      const missing = [];
      for (let i = min; i <= max; i++) {
        if (!numbers.includes(i)) {
          missing.push(i);
        }
      }

      // 检查重复
      const duplicates = numbers.filter((num, index) => 
        numbers.indexOf(num) !== index
      );
      const uniqueDuplicates = [...new Set(duplicates)];

      // 记录问题
      if (missing.length > 0 || uniqueDuplicates.length > 0) {
        const issue = {
          seriesId: series.id,
          title: series.title,
          totalEpisodes: episodes.length,
          expectedRange: `${min}-${max}`,
          missing: missing.length > 0 ? missing : null,
          duplicate: uniqueDuplicates.length > 0 ? uniqueDuplicates : null,
        };

        if (missing.length > 0 && uniqueDuplicates.length > 0) {
          issue.type = 'both';
          bothCount++;
        } else if (missing.length > 0) {
          issue.type = 'missing';
          missingCount++;
        } else {
          issue.type = 'duplicate';
          duplicateCount++;
        }

        issues.push(issue);
        
        // 实时输出发现的问题
        console.log(`⚠️  [${issue.type.toUpperCase()}] 系列 ${series.id}: ${series.title}`);
        if (missing.length > 0) {
          console.log(`   缺集: ${missing.slice(0, 10).join(', ')}${missing.length > 10 ? '...' : ''}`);
        }
        if (uniqueDuplicates.length > 0) {
          console.log(`   重复: ${uniqueDuplicates.join(', ')}`);
        }
      }
    }

    // 3. 输出统计结果
    console.log('\n' + '='.repeat(60));
    console.log('📊 诊断结果汇总');
    console.log('='.repeat(60));
    console.log(`总系列数: ${allSeries.length}`);
    console.log(`问题系列数: ${issues.length}`);
    console.log(`  - 空系列: ${emptyCount}`);
    console.log(`  - 只有缺集: ${missingCount}`);
    console.log(`  - 只有重复: ${duplicateCount}`);
    console.log(`  - 缺集+重复: ${bothCount}`);
    console.log(`健康系列: ${allSeries.length - issues.length}`);

    if (issues.length > 0) {
      console.log('\n📋 问题系列列表:');
      issues.forEach(issue => {
        console.log(`\nID: ${issue.seriesId} - ${issue.title}`);
        console.log(`  类型: ${issue.type}`);
        console.log(`  剧集数: ${issue.totalEpisodes}`);
        if (issue.missing) {
          console.log(`  缺失: ${issue.missing.join(', ')}`);
        }
        if (issue.duplicate) {
          console.log(`  重复: ${issue.duplicate.join(', ')}`);
        }
      });
    }

    console.log('\n✅ 诊断完成');
    
  } catch (error) {
    console.error('❌ 诊断失败:', error.message);
    if (error.response) {
      console.error('   响应:', error.response.data);
    }
    process.exit(1);
  }
}

findAllIssues().catch(console.error);

