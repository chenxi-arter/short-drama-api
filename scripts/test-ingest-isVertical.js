#!/usr/bin/env node
/**
 * 测试 ingest API 的 isVertical 字段
 * 用法: node scripts/test-ingest-isVertical.js
 */

const http = require('http');

const ADMIN_URL = 'http://localhost:9090';
const CLIENT_URL = 'http://localhost:8080';

function request(method, path, data, useAdmin = false) {
  return new Promise((resolve, reject) => {
    const baseUrl = useAdmin ? ADMIN_URL : CLIENT_URL;
    const url = new URL(path, baseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function main() {
  console.log('=== 测试 ingest API 的 isVertical 字段 ===\n');

  // 测试数据
  const testSeries = {
    externalId: `test-isVertical-${Date.now()}`,
    title: '测试竖屏剧集',
    description: '这是一个测试竖屏播放功能的剧集',
    coverUrl: 'https://example.com/cover.jpg',
    categoryId: 1,
    releaseDate: '2025-01-01T00:00:00Z',
    isCompleted: false,
    regionOptionName: '中国大陆',
    languageOptionName: '国语',
    statusOptionName: '连载中',
    yearOptionName: '2025',
    episodes: [
      {
        episodeNumber: 1,
        title: '第1集（横屏）',
        duration: 600,
        status: 'published',
        isVertical: false, // 横屏
        urls: [
          {
            quality: '720p',
            ossUrl: 'https://oss.example.com/ep1-720.m3u8',
            cdnUrl: 'https://cdn.example.com/ep1-720.m3u8',
            originUrl: 'https://origin.example.com/ep1-720.m3u8',
          },
        ],
      },
      {
        episodeNumber: 2,
        title: '第2集（竖屏）',
        duration: 650,
        status: 'published',
        isVertical: true, // 竖屏
        urls: [
          {
            quality: '720p',
            ossUrl: 'https://oss.example.com/ep2-720.m3u8',
            cdnUrl: 'https://cdn.example.com/ep2-720.m3u8',
            originUrl: 'https://origin.example.com/ep2-720.m3u8',
          },
        ],
      },
    ],
  };

  // 1. 创建系列
  console.log('1️⃣  创建系列（包含横屏和竖屏剧集）...');
  const createRes = await request('POST', '/api/admin/ingest/series', testSeries, true);
  console.log(`   状态码: ${createRes.status}`);
  console.log(`   响应: ${JSON.stringify(createRes.data, null, 2)}\n`);

  if (createRes.status !== 200 && createRes.status !== 201) {
    console.error('❌ 创建失败！');
    return;
  }

  const seriesId = createRes.data?.data?.items?.[0]?.seriesId || createRes.data?.data?.seriesId;
  const seriesShortId = createRes.data?.data?.items?.[0]?.shortId;
  if (!seriesId) {
    console.error('❌ 无法获取 seriesId！');
    return;
  }
  console.log(`✅ 系列创建成功，seriesId: ${seriesId}, shortId: ${seriesShortId}\n`);

  // 等待数据写入
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // 2. 直接使用 shortId 查询剧集
  console.log('2️⃣  使用 shortId 查询剧集列表...');
  
  if (seriesShortId) {
    console.log(`   系列 shortId: ${seriesShortId}\n`);

    // 3. 查询剧集列表，验证 isVertical 字段
    console.log('3️⃣  查询剧集列表，验证 isVertical 字段...');
    const episodesRes = await request('GET', `/api/public/video/episodes?seriesShortId=${seriesShortId}&size=10`);
    console.log(`   状态码: ${episodesRes.status}`);
    
    if (episodesRes.data?.data?.list) {
      console.log('\n   剧集列表:');
      episodesRes.data.data.list.forEach((ep) => {
        console.log(`   - 第${ep.episodeNumber}集: ${ep.title}`);
        console.log(`     isVertical: ${ep.isVertical} ${ep.isVertical ? '(竖屏 ✅)' : '(横屏 ✅)'}`);
        console.log(`     duration: ${ep.duration}秒`);
        console.log(`     status: ${ep.status}\n`);
      });

      // 验证结果
      const ep1 = episodesRes.data.data.list.find(e => e.episodeNumber === 1);
      const ep2 = episodesRes.data.data.list.find(e => e.episodeNumber === 2);

      if (ep1 && ep1.isVertical === false) {
        console.log('✅ 第1集横屏设置正确！');
      } else {
        console.log('❌ 第1集横屏设置错误！');
      }

      if (ep2 && ep2.isVertical === true) {
        console.log('✅ 第2集竖屏设置正确！');
      } else {
        console.log('❌ 第2集竖屏设置错误！');
      }
    } else {
      console.log('   ❌ 无法获取剧集列表');
    }
  } else {
    console.log('   ❌ 无法获取系列 shortId');
  }

  // 4. 测试增量更新
  console.log('\n4️⃣  测试增量更新（将第1集改为竖屏）...');
  const updatePayload = {
    externalId: testSeries.externalId,
    episodes: [
      {
        episodeNumber: 1,
        isVertical: true, // 改为竖屏
      },
    ],
  };

  const updateRes = await request('POST', '/api/admin/ingest/series/update', updatePayload, true);
  console.log(`   状态码: ${updateRes.status}`);
  console.log(`   响应: ${JSON.stringify(updateRes.data, null, 2)}\n`);

  if (updateRes.status === 200 || updateRes.status === 201) {
    console.log('✅ 更新成功！');
    
    // 等待更新生效
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 再次查询验证
    console.log('\n5️⃣  再次查询验证更新结果...');
    if (seriesShortId) {
      const verifyRes = await request('GET', `/api/public/video/episodes?seriesShortId=${seriesShortId}&size=10`);
      
      if (verifyRes.data?.data?.list) {
        const ep1Updated = verifyRes.data.data.list.find(e => e.episodeNumber === 1);
        console.log(`   第1集 isVertical: ${ep1Updated?.isVertical}`);
        
        if (ep1Updated && ep1Updated.isVertical === true) {
          console.log('✅ 第1集已成功更新为竖屏！');
        } else {
          console.log('❌ 第1集更新失败！');
        }
      }
    }
  } else {
    console.log('❌ 更新失败！');
  }

  console.log('\n=== 测试完成 ===');
}

main().catch((err) => {
  console.error('测试失败:', err);
  process.exit(1);
});
