#!/usr/bin/env node
/**
 * 部署前环境自检
 *
 * 用法（在服务器上、且在 npm run build 之后执行）：
 *   node scripts/preflight-env.js
 *
 * 为什么需要它：安全加固后有几项配置会导致「进程起不来」或「某个功能静默 500」，
 * 而且这些失败发生在启动瞬间/首次调用，不跑一遍很难提前发现。
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ENV_FILE = process.env.ENV_FILE || path.join(ROOT, '.env');

function loadEnv() {
  if (!fs.existsSync(ENV_FILE)) {
    console.error(`找不到 ${ENV_FILE}`);
    process.exit(2);
  }
  const env = {};
  for (const line of fs.readFileSync(ENV_FILE, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#') || !t.includes('=')) continue;
    const i = t.indexOf('=');
    const k = t.slice(0, i).trim();
    env[k] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

const env = loadEnv();
const rows = [];

function push(level, item, note) {
  rows.push({ level, item, note });
}

// 1) 三把必需密钥：直接复用线上同一份校验逻辑，避免规则漂移
const utilPath = path.join(ROOT, 'dist/src/common/utils/security-env.util.js');
const utilPathAlt = path.join(ROOT, 'dist/common/utils/security-env.util.js');
const util = fs.existsSync(utilPath)
  ? utilPath
  : fs.existsSync(utilPathAlt)
    ? utilPathAlt
    : null;

if (!util) {
  push('WARN', '找不到编译产物', '先跑 npm run build，否则无法复用启动校验逻辑');
} else {
  const { assertStrongSecret } = require(util);
  const clean = (msg, name) =>
    String(msg).replace(/^\[安全配置\]\s*/, '').replace(new RegExp('^' + name + '\\s*'), '');

  for (const name of ['JWT_SECRET', 'ADMIN_JWT_SECRET', 'APP_SECRET']) {
    try {
      assertStrongSecret(name, env[name]);
      push('PASS', name, '合规');
    } catch (e) {
      push('FAIL', name, clean(e.message, name));
    }
  }

  // 短链 key 也当密钥校验：能同时挡掉「未配置」和「还是 your_xxx 占位值」
  try {
    assertStrongSecret('SHORT_IO_API_KEY', env.SHORT_IO_API_KEY);
    if (env.SHORT_IO_API_KEY === 'sk_kVRKjaeA93eRTm2k') {
      push('FAIL', 'SHORT_IO_API_KEY', '仍是仓库历史里泄露的那把，必须去 Short.io 轮换');
    } else {
      push('PASS', 'SHORT_IO_API_KEY', '已配置');
    }
  } catch (e) {
    push(
      'FAIL',
      'SHORT_IO_API_KEY',
      env.SHORT_IO_API_KEY
        ? '仍是占位值，请填 Short.io 后台的真实 key（缺它 → 建短链 500）'
        : '未配置，请填 Short.io 后台的 key（缺它 → 建短链 500）',
    );
  }
}

// 2) 两个密钥不能相同：相同等于管理员 token 可以用用户密钥签
if (env.JWT_SECRET && env.ADMIN_JWT_SECRET && env.JWT_SECRET === env.ADMIN_JWT_SECRET) {
  push('FAIL', 'JWT_SECRET vs ADMIN_JWT_SECRET', '两者相同，管理员密钥形同虚设');
}

if (!env.SHORT_LINK_ALLOWED_DOMAINS) {
  push('WARN', 'SHORT_LINK_ALLOWED_DOMAINS', '未配置 → 任何 HTTPS 地址都能建短链（开放重定向风险）');
} else {
  push('PASS', 'SHORT_LINK_ALLOWED_DOMAINS', env.SHORT_LINK_ALLOWED_DOMAINS);
}

// 4) 迁移期旧密钥：只是提示，说明影响面
if (env.JWT_SECRET_LEGACY || env.ADMIN_JWT_SECRET_LEGACY) {
  push('WARN', 'LEGACY 旧密钥', '已配置 → 用旧密钥签发的 token 仍有效，迁移完成后请删除');
} else {
  push('INFO', 'LEGACY 旧密钥', '未配置 → 存量 token 全部失效，用户需重新登录');
}

// 5) 端口：管理端路由只挂在 admin 进程上
if (env.CLIENT_PORT && env.ADMIN_PORT && env.CLIENT_PORT === env.ADMIN_PORT) {
  push('FAIL', 'CLIENT_PORT / ADMIN_PORT', '两个进程端口相同，必然有一个起不来');
} else {
  push('INFO', '端口', `client=${env.CLIENT_PORT || '(缺省3000)'} admin=${env.ADMIN_PORT || '(缺省8080)'}`);
}

const order = { FAIL: 0, WARN: 1, INFO: 2, PASS: 3 };
rows.sort((a, b) => order[a.level] - order[b.level]);

const width = Math.max(...rows.map((r) => r.item.length), 10);
console.log('\n部署前环境自检  ' + ENV_FILE + '\n' + '='.repeat(60));
for (const r of rows) {
  console.log(`[${r.level.padEnd(4)}] ${r.item.padEnd(width)}  ${r.note}`);
}
console.log('='.repeat(60));

const fails = rows.filter((r) => r.level === 'FAIL').length;
if (fails > 0) {
  console.log(`\n有 ${fails} 项会导致启动失败或接口 500，请先处理。`);
  process.exit(1);
}
console.log('\n关键项全部通过。');
