#!/usr/bin/env node

/**
 * 批量写入 Ingest 示例数据脚本
 * - 支持生成大量系列与剧集，并通过 batch 接口写入
 * - 使用：
 *   node scripts/ingest-bulk-insert.js --count 100 --episodes 3 --batch 20 --qualities 720p,1080p
 *   ADMIN_TOKEN=<jwt> PORT=8080 node scripts/ingest-bulk-insert.js --count 50 --episodes 5
 */

const DEFAULT_PORT = process.env.PORT || 8080;
const API_BASE = process.env.API_BASE || `http://localhost:${DEFAULT_PORT}/api/admin/ingest`;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const [k, v] = a.replace(/^--/, '').split('=');
    args[k] = v === undefined ? true : v;
  }
  return args;
}

function log(msg, color = '\x1b[0m') { console.log(`${color}%s\x1b[0m`, msg); }
function ok(msg) { log(`✅ ${msg}`, '\x1b[32m'); }
function info(msg) { log(`ℹ️  ${msg}`, '\x1b[34m'); }
function warn(msg) { log(`⚠️  ${msg}`, '\x1b[33m'); }
function err(msg) { log(`❌ ${msg}`, '\x1b[31m'); }

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function choice(arr) { return arr[randInt(0, arr.length - 1)]; }
function pad2(n) { return String(n).padStart(2, '0'); }

const ADJ = ['甜宠', '燃爽', '古风', '都市', '校园', '职场', '逆袭', '奇幻', '爽文', '虐恋'];
const NOUN = ['恋曲', '风暴', '密语', '迷局', '心跳', '契约', '攻略', '危机', '重启', '救赎'];
const REGIONS = ['大陆', '香港', '台湾', '日本', '韩国', '欧美', '泰国', '印度'];
const LANGS = ['国语', '粤语', '英语', '韩语', '日语', '泰语'];
const STATUSES = ['连载中', '已完结'];
const GENRES = ['言情','玄幻','爱情','都市','古风','校园','职场'];

function genTitle() {
  return `示例短剧·${choice(ADJ)}·${choice(NOUN)}`;
}

function genExternalId(prefix, i) {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `${prefix}-${stamp}-${pad2(i)}`;
}

function buildSeriesItem(index, episodesCount, qualities) {
  const title = genTitle();
  const externalId = genExternalId('bulk-demo', index);
  const region = choice(REGIONS);
  const lang = choice(LANGS);
  const statusOpt = choice(STATUSES);
  const year = String(randInt(2018, 2025));
  const completed = statusOpt === '已完结';
  // 题材：随机 1~3 个
  const genreCount = Math.max(1, Math.floor(Math.random() * 3));
  const shuffled = [...GENRES].sort(() => Math.random() - 0.5);
  const genreOptionNames = shuffled.slice(0, genreCount);

  const episodes = Array.from({ length: episodesCount }, (_, idx) => {
    const epNo = idx + 1;
    return {
      episodeNumber: epNo,
      title: `第${epNo}集 ${choice(NOUN)}`,
      duration: randInt(1200, 2400),
      status: 'published',
      urls: qualities.map(q => ({
        quality: q,
        ossUrl: `https://oss.example.com/${externalId}-ep${epNo}-${q}.m3u8`,
        cdnUrl: `https://cdn.example.com/${externalId}-ep${epNo}-${q}.m3u8`,
        originUrl: `https://origin.example.com/${externalId}-ep${epNo}-${q}`,
      })),
    };
  });

  return {
    title,
    externalId,
    description: `${title} · 批量脚本生成示例`,
    coverUrl: `https://picsum.photos/seed/${encodeURIComponent(externalId)}/400/600`,
    categoryId: 1,
    status: completed ? 'completed' : 'on-going',
    releaseDate: `${year}-01-01`,
    score: Number((Math.random() * 3 + 6.5).toFixed(1)),
    playCount: randInt(1000, 500000),
    starring: '张三,李四',
    actor: '张三,李四,王五',
    director: '导演A',
    regionOptionName: region,
    languageOptionName: lang,
    statusOptionName: statusOpt,
    yearOptionName: year,
    genreOptionNames,
    episodes,
  };
}

async function postBatch(items) {
  const payload = { items };
  const res = await fetch(`${API_BASE}/series/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(ADMIN_TOKEN ? { Authorization: `Bearer ${ADMIN_TOKEN}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (res.ok && json?.code === 200) return json;
  throw new Error(`batch failed: ${res.status} ${JSON.stringify(json)}`);
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const args = parseArgs(process.argv);
  const total = Number(args.count || 50);
  const episodesCount = Number(args.episodes || 3);
  const batchSize = Number(args.batch || 20);
  const qualities = String(args.qualities || '720p').split(',').map(s => s.trim()).filter(Boolean);

  info(`API: ${API_BASE}`);
  if (!ADMIN_TOKEN) warn('未设置 ADMIN_TOKEN，将在无鉴权下尝试调用（适用于本地/开发环境）');
  info(`计划写入系列数: ${total}, 每系列集数: ${episodesCount}, 批大小: ${batchSize}, 清晰度: ${qualities.join(',')}`);

  let created = 0;
  for (let i = 1; i <= total; i += batchSize) {
    const chunk = [];
    for (let j = 0; j < batchSize && i + j <= total; j++) {
      chunk.push(buildSeriesItem(i + j, episodesCount, qualities));
    }
    info(`提交批次：${i} ~ ${i + chunk.length - 1}`);
    try {
      const resp = await postBatch(chunk);
      const createdCnt = resp?.data?.summary?.created ?? 0;
      const updatedCnt = resp?.data?.summary?.updated ?? 0;
      ok(`批次成功：created=${createdCnt}, updated=${updatedCnt}`);
      created += createdCnt;
    } catch (e) {
      err(`批次失败：${e.message || e}`);
    }
    // 避免压垮服务
    await sleep(500);
  }

  ok(`完成，累计新建系列：${created}`);
}

main().catch(e => {
  err(e?.message || String(e));
  process.exit(1);
});


