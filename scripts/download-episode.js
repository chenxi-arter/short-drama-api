#!/usr/bin/env node
/**
 * 下载剧集视频
 * 
 * 使用方法：
 * node scripts/download-episode.js <episodeId> [quality] [outputDir]
 * 
 * 示例：
 * node scripts/download-episode.js 28808                    # 下载剧集28808的第一个可用清晰度
 * node scripts/download-episode.js 28808 1080p            # 下载指定清晰度
 * node scripts/download-episode.js 28808 720p ./videos    # 下载到指定目录
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// 命令行参数
const episodeId = process.argv[2];
const preferredQuality = process.argv[3];
const outputDir = process.argv[4] || './downloads';

const baseUrl = process.env.ADMIN_API_URL || 'http://localhost:8080/api';

// 辅助函数：格式化文件大小
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// 辅助函数：清理文件名
function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_');
}

// 下载文件
function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`📥 开始下载: ${url}`);
    console.log(`📁 保存到: ${outputPath}`);
    
    const curl = spawn('curl', [
      '-L',
      url,
      '-o', outputPath,
      '--progress-bar'
    ]);

    curl.stdout.pipe(process.stdout);
    curl.stderr.pipe(process.stderr);

    curl.on('close', (code) => {
      if (code === 0) {
        const stats = fs.statSync(outputPath);
        console.log(`\n✅ 下载完成! 文件大小: ${formatBytes(stats.size)}`);
        resolve(outputPath);
      } else {
        reject(new Error(`下载失败，退出码: ${code}`));
      }
    });

    curl.on('error', reject);
  });
}

async function main() {
  if (!episodeId) {
    console.error('❌ 错误: 请提供剧集ID');
    console.log('\n使用方法:');
    console.log('  node scripts/download-episode.js <episodeId> [quality] [outputDir]');
    console.log('\n示例:');
    console.log('  node scripts/download-episode.js 28808');
    console.log('  node scripts/download-episode.js 28808 1080p');
    console.log('  node scripts/download-episode.js 28808 720p ./videos');
    process.exit(1);
  }

  try {
    console.log('🎬 剧集视频下载工具');
    console.log('=' .repeat(60));
    console.log(`剧集ID: ${episodeId}`);
    if (preferredQuality) console.log(`优先清晰度: ${preferredQuality}`);
    console.log(`输出目录: ${outputDir}`);
    console.log('=' .repeat(60));
    console.log();

    // 获取下载地址
    console.log('📡 正在获取下载地址...');
    const response = await axios.get(`${baseUrl}/admin/episodes/${episodeId}/download-urls`);
    const data = response.data;

    if (!data.success || !data.downloadUrls || data.downloadUrls.length === 0) {
      console.error('❌ 无法获取下载地址');
      process.exit(1);
    }

    console.log(`✅ 获取成功: ${data.seriesTitle} - 第${data.episodeNumber}集`);
    console.log();

    // 显示可用清晰度
    console.log('📺 可用清晰度:');
    data.downloadUrls.forEach((url, index) => {
      console.log(`  [${index + 1}] ${url.quality}`);
    });
    console.log();

    // 选择下载地址
    let selectedUrl;
    if (preferredQuality) {
      selectedUrl = data.downloadUrls.find(u => u.quality === preferredQuality);
      if (!selectedUrl) {
        console.warn(`⚠️  未找到 ${preferredQuality} 清晰度，使用第一个可用清晰度`);
        selectedUrl = data.downloadUrls[0];
      }
    } else {
      selectedUrl = data.downloadUrls[0];
    }

    console.log(`🎯 选择清晰度: ${selectedUrl.quality}`);
    console.log();

    // 确定下载 URL（优先 OSS，然后 CDN）
    const downloadUrl = selectedUrl.ossUrl || selectedUrl.cdnUrl;
    if (!downloadUrl) {
      console.error('❌ 无有效下载地址');
      process.exit(1);
    }

    // 创建输出目录
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`📁 创建目录: ${outputDir}`);
    }

    // 生成文件名
    const seriesName = sanitizeFilename(data.seriesTitle);
    const episodeNum = String(data.episodeNumber).padStart(2, '0');
    const quality = selectedUrl.quality;
    const ext = downloadUrl.includes('.mp4') ? '.mp4' : '.m3u8';
    const filename = `${seriesName}_EP${episodeNum}_${quality}${ext}`;
    const outputPath = path.join(outputDir, filename);

    // 下载文件
    await downloadFile(downloadUrl, outputPath);

    // 下载字幕（如果有）
    if (selectedUrl.subtitleUrl) {
      console.log();
      console.log('📝 发现字幕文件，正在下载...');
      const subtitlePath = outputPath.replace(ext, '.srt');
      await downloadFile(selectedUrl.subtitleUrl, subtitlePath);
    }

    console.log();
    console.log('=' .repeat(60));
    console.log('🎉 下载完成!');
    console.log(`📂 文件位置: ${path.resolve(outputPath)}`);
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('\n❌ 下载失败:');
    if (error.response) {
      console.error(`  状态码: ${error.response.status}`);
      console.error(`  错误信息:`, error.response.data);
    } else if (error.request) {
      console.error('  无法连接到服务器');
    } else {
      console.error(`  错误: ${error.message}`);
    }
    process.exit(1);
  }
}

main();

