#!/usr/bin/env node

/**
 * Ingest API 示例数据写入脚本（基于 docs/ingest-api-complete-guide.md）
 * 使用：
 *   PORT=8080 node scripts/ingest-insert-sample.js
 * 可选：
 *   ADMIN_TOKEN=<jwt> PORT=8080 node scripts/ingest-insert-sample.js
 */

const DEFAULT_PORT = process.env.PORT || 8080;
const API_BASE = process.env.API_BASE || `http://localhost:${DEFAULT_PORT}/api/admin/ingest`;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

function log(msg, color = '\x1b[0m') {
  console.log(`${color}%s\x1b[0m`, msg);
}

function ok(msg) { log(`✅ ${msg}`, '\x1b[32m'); }
function info(msg) { log(`ℹ️  ${msg}`, '\x1b[34m'); }
function warn(msg) { log(`⚠️  ${msg}`, '\x1b[33m'); }
function err(msg) { log(`❌ ${msg}`, '\x1b[31m'); }

async function post(endpoint, body, desc) {
  try {
    info(`${desc} → POST ${endpoint}`);
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(ADMIN_TOKEN ? { Authorization: `Bearer ${ADMIN_TOKEN}` } : {}),
      },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok && (json?.code === 200 || json?.success)) {
      ok(`${desc} 成功`);
      info(JSON.stringify(json, null, 2));
      return json;
    }
    err(`${desc} 失败 (${res.status})`);
    info(JSON.stringify(json, null, 2));
    process.exitCode = 1;
    return json;
  } catch (e) {
    err(`${desc} 异常: ${e?.message || e}`);
    process.exitCode = 1;
    return null;
  }
}

async function main() {
  info(`Ingest API: ${API_BASE}`);
  if (!ADMIN_TOKEN) {
    warn('未设置 ADMIN_TOKEN，将尝试在无鉴权情况下调用（仅限本地/开发环境可用）');
  }

  // 示例：创建一个系列（含 2 集、各1条清晰度）
  const seriesPayload = {
    title: '示例短剧·甜宠·校园',
    externalId: 'demo-drama-2025-001',
    description: '根据 ingest 文档写入的演示系列，用于联调验证。',
    coverUrl: 'https://example.com/demo-cover.jpg',
    categoryId: 1,
    // status 用途仅限：维护 isCompleted 与软删除（不入库为字符串）。此处标记为连载中。
    status: 'on-going', // 'on-going' | 'completed' | 'deleted'
    releaseDate: '2025-01-01',
    score: 8.8,
    playCount: 12345,
    starring: '张三,李四',
    actor: '张三,李四,王五',
    director: '导演A',
    regionOptionName: '大陆',
    languageOptionName: '国语',
    statusOptionName: '连载中',
    yearOptionName: '2025',
    episodes: [
      {
        episodeNumber: 1,
        title: '第1集 起风了',
        duration: 1800,
        status: 'published',
        urls: [
          {
            quality: '720p',
            ossUrl: 'https://oss.example.com/demo-ep1.m3u8',
            cdnUrl: 'https://cdn.example.com/demo-ep1.m3u8',
            originUrl: 'https://origin.example.com/demo-ep1',
            subtitleUrl: 'https://subtitle.example.com/demo-ep1.srt',
          },
        ],
      },
      {
        episodeNumber: 2,
        title: '第2集 心动信号',
        duration: 1820,
        status: 'published',
        urls: [
          {
            quality: '720p',
            ossUrl: 'https://oss.example.com/demo-ep2.m3u8',
            cdnUrl: 'https://cdn.example.com/demo-ep2.m3u8',
            originUrl: 'https://origin.example.com/demo-ep2',
          },
        ],
      },
    ],
  };

  await post('/series', seriesPayload, '创建示例系列');

  // 追加：演示一次增量更新（可选）
  const updatePayload = {
    externalId: 'demo-drama-2025-001',
    title: '示例短剧·甜宠·校园（更新后）',
    // 若该集已存在则更新；不存在则新增
    episodes: [
      {
        episodeNumber: 3,
        title: '第3集 约定',
        duration: 1750,
        status: 'published',
        urls: [
          {
            quality: '720p',
            ossUrl: 'https://oss.example.com/demo-ep3.m3u8',
            cdnUrl: 'https://cdn.example.com/demo-ep3.m3u8',
            originUrl: 'https://origin.example.com/demo-ep3',
          },
        ],
      },
    ],
  };

  await post('/series/update', updatePayload, '增量更新示例系列');

  ok('示例写入完成');
}

main().catch((e) => {
  err(e?.message || String(e));
  process.exit(1);
});


