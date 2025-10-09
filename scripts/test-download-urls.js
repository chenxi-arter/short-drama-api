#!/usr/bin/env node
/**
 * 测试剧集下载地址接口
 * 
 * 使用方法：
 * node scripts/test-download-urls.js [episodeId]
 * 
 * 示例：
 * node scripts/test-download-urls.js 2136
 */

const axios = require('axios');

// 从命令行参数获取剧集ID，默认使用2136
const episodeId = process.argv[2] || '2136';
const baseUrl = process.env.ADMIN_API_URL || 'http://localhost:8080/api';

async function testDownloadUrls() {
  console.log('🧪 测试剧集下载地址接口');
  console.log('=' .repeat(60));
  console.log(`剧集ID: ${episodeId}`);
  console.log(`API 地址: ${baseUrl}`);
  console.log('=' .repeat(60));
  console.log();

  try {
    // 获取下载地址
    console.log(`📥 正在获取剧集 ${episodeId} 的下载地址...`);
    const response = await axios.get(`${baseUrl}/admin/episodes/${episodeId}/download-urls`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = response.data;

    if (!data.success) {
      console.error('❌ 获取失败:', data.message);
      return;
    }

    console.log('✅ 获取成功!\n');
    
    // 显示剧集信息
    console.log('📺 剧集信息:');
    console.log(`  系列: ${data.seriesTitle} (ID: ${data.seriesId})`);
    console.log(`  标题: ${data.episodeTitle}`);
    console.log(`  集数: 第 ${data.episodeNumber} 集`);
    console.log(`  时长: ${data.duration} 秒 (${Math.floor(data.duration / 60)} 分钟)`);
    console.log(`  ShortID: ${data.episodeShortId}`);
    console.log();

    // 显示下载地址
    console.log('📥 可用下载地址:');
    console.log('-'.repeat(60));
    
    if (data.downloadUrls && data.downloadUrls.length > 0) {
      data.downloadUrls.forEach((url, index) => {
        console.log(`\n[${index + 1}] ${url.quality} 清晰度:`);
        console.log(`  📍 CDN 地址: ${url.cdnUrl}`);
        console.log(`  📦 OSS 地址: ${url.ossUrl}`);
        console.log(`  🔗 原始地址: ${url.originUrl}`);
        if (url.subtitleUrl) {
          console.log(`  📝 字幕地址: ${url.subtitleUrl}`);
        }
        console.log(`  🔑 AccessKey: ${url.accessKey}`);
      });
    } else {
      console.log('  ⚠️  暂无可用下载地址');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ 测试完成');
    
  } catch (error) {
    console.error('\n❌ 测试失败:');
    if (error.response) {
      console.error(`  状态码: ${error.response.status}`);
      console.error(`  错误信息:`, error.response.data);
    } else if (error.request) {
      console.error('  无法连接到服务器，请确认服务是否运行');
      console.error(`  请求地址: ${baseUrl}/admin/episodes/${episodeId}/download-urls`);
    } else {
      console.error(`  错误: ${error.message}`);
    }
    process.exit(1);
  }
}

// 运行测试
testDownloadUrls();

