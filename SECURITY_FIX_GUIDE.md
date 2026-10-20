# 安全审计修复指南

## 📋 修复概览

基于安全审计报告，已完成大部分关键修复，以下是完整的修复状态和待执行操作。

---

## ✅ 已完成的代码修复

### 1. ✅ C4 - admin/ingest 无鉴权守卫（Critical）

**状态：已修复**

- ✅ `IngestController` 添加 `AdminJwtAuthGuard`
- ✅ `TestIngestController` 添加 `AdminJwtAuthGuard`
- ✅ 防止匿名用户注入/篡改内容

**修改文件：**
- `src/video/controllers/ingest.controller.ts`
- `src/video/controllers/test-ingest.controller.ts`

### 2. ✅ H5 - 删除硬编码 Short.io API Key（High）

**状态：已修复**

- ✅ 删除了危险的硬编码密钥 `sk_kVRKjaeA93eRTm2k`
- ✅ 强制要求从环境变量读取
- ✅ 服务启动时验证配置

**修改文件：**
- `src/common/services/short-link.service.ts`

### 3. ✅ H6 - 防止短链接开放重定向（High）

**状态：已修复**

- ✅ 添加 URL 白名单验证机制
- ✅ 支持通配符域名（`*.example.com`）
- ✅ 未配置白名单时只允许 HTTPS（会打印告警，建议配置 `SHORT_LINK_ALLOWED_DOMAINS` 收敛到具体域名）
- ✅ 添加了用户登录鉴权（`JwtAuthGuard`）

**修改文件：**
- `src/common/services/short-link.service.ts`
- `src/common/controllers/short-link.controller.ts`

### 4. ✅ H3/H4 - 广告计费污染和 DoS（High）

**状态：已修复**

- ✅ 批量事件限制数组最大 50 个（`@ArrayMaxSize(50)`）
- ✅ 单个事件接口限流：100次/分钟/IP
- ✅ 批量事件接口限流：10次/分钟/IP
- ✅ 转化事件接口限流：20次/分钟/IP

**修改文件：**
- `src/advertising/dto/tracking.dto.ts`
- `src/advertising/controllers/tracking.controller.ts`

### 5. ✅ 回归修复（2026-10-20 第二轮）

上一轮改动引入了两个只在运行期才暴露的问题，已修复：

| 问题 | 现象 | 修复 |
|------|------|------|
| `JwtStrategy` 覆写 `authenticate()` 直接 `this.success(payload)` | 绕过 passport-jwt 的 `_verify` 回调，`validate()` 不再执行，`req.user` 退化为 `{sub,iat,exp}`，全站 `req.user.userId` 为 `undefined` | 改用 `secretOrKeyProvider` 只做「选密钥」，验签与 `validate()` 仍走 passport-jwt 原生流程 |
| `ShortLinkModule` 未提供 `DauService` | `JwtAuthGuard` 依赖注入为 `undefined`，已登录用户调 `POST /api/short-links` 必 500（`Cannot read properties of undefined (reading 'trackUser')`） | 模块内显式 `providers: [ShortLinkService, DauService]` |

另外：
- 双密钥的旧密钥**只认显式配置的 `JWT_SECRET_LEGACY` / `ADMIN_JWT_SECRET_LEGACY`**，代码里 `|| 'very-secret-key'` 的硬编码兜底已删除（否则「删掉环境变量就彻底修复」永远做不到）。
- 新增 `src/common/utils/security-env.util.ts`，`main.client.ts` / `main.admin.ts` 启动前校验 `JWT_SECRET` / `ADMIN_JWT_SECRET` / `APP_SECRET`，缺失、过短或仍是历史弱值直接拒绝启动。
- `POST /api/video/episode-url` 从用户级的 `VideoController` 拆出到 `VideoCompatAdminController`（`AdminJwtAuthGuard` + HTTPS 校验），路径不变。

---

## ⚠️ 需要立即配置的环境变量

### 关键密钥更新（H1/C1/C2 - Critical）

**当前状态（2026-10-20）：已在本机 `.env` 轮换完成。**

> ⚠️ 真实密钥只放在 `.env`（已被 `.gitignore` 忽略），**不要**写进任何 md 文档或提交到仓库。

请在部署环境的 `.env` 中提供以下三项，缺一不可（缺失/过短/仍是 `very-secret-key` 会直接启动失败）：

```bash
# 生成方式：openssl rand -base64 48
JWT_SECRET=<48字节随机值>
ADMIN_JWT_SECRET=<另一个48字节随机值，必须与 JWT_SECRET 不同>
APP_SECRET=<再一个48字节随机值>

# 短链（可选，不配则短链功能不可用，不影响启动）
SHORT_IO_API_KEY=<Short.io 控制台新建的 Key>
SHORT_IO_DEFAULT_DOMAIN=xgtv.short.gy
SHORT_LINK_ALLOWED_DOMAINS=t.me,telegram.me,telegram.org

# 其它
TELEGRAM_BOT_TOKEN=<去 @BotFather /revoke 后重新生成>
DB_SYNCHRONIZE=false
NODE_ENV=production
```

**副作用：** 轮换 JWT 密钥后所有历史 token 失效，用户需重新登录（若不想掉线，可临时配置 `JWT_SECRET_LEGACY` 过渡，见 `JWT_MIGRATION_GUIDE.md`）。

---

## 🔴 待修复的中高危问题

### C5 - video/episode-url 越权访问

**状态：可能已有保护**

经检查，`UrlController` 的 `createEpisodeUrl` 方法已有 `@UseGuards(AdminJwtAuthGuard)`。

**需要验证：**
- 是否存在其他入口可以修改 `episode_urls` 表
- 建议手动测试游客/普通用户是否能调用此接口

### H2 - 可预测的 accessKey

**问题：** accessKey 使用弱哈希 `SHA256(id_quality_default_secret)`

**待修复：**
1. ✅ 配置强 `APP_SECRET`（已生成，见上面）
2. ⏳ 修改 `AccessKeyUtil.generateFromString()` 使用 HMAC
3. ⏳ 为所有现有 accessKey 添加随机盐值

### M1 - 管理端图片 SSRF

**问题：** 管理端图片抓取使用 `::ffff:` 可绕过私网过滤

**待修复：**
需要找到图片抓取的代码，修复 IPv4-mapped IPv6 地址的检测。

### M6 - 管理员登录无限流

**问题：** `/api/admin/auth/login` 无限流保护

**待修复：**
给管理员登录接口添加限流（建议 5次/分钟/IP）。

---

## 📊 修复进度总结

| ID | 问题 | 级别 | 状态 | 修复位置 |
|----|------|------|------|----------|
| **XG-01 / H1 / C1C2** | 弱 JWT 密钥 → 伪造任意用户与管理员 token | 严重 | ✅ **已修复** | `.env` 轮换 JWT_SECRET / ADMIN_JWT_SECRET / APP_SECRET；`jwt.strategy.ts`、`admin-jwt-auth.guard.ts` + `common/utils/security-env.util.ts` 改启动 fail-fast，拒绝弱密钥与硬编码兜底 |
| **XG-02 / C4** | admin/ingest 无鉴权 | 高危 | ✅ **已修复** | `video/controllers/ingest.controller.ts`、`test-ingest.controller.ts` 加 `AdminJwtAuthGuard` |
| **XG-03 / H2** | 确定性 accessKey + 默认 APP_SECRET | 中危 | ✅ **已修复** | `common/utils/access-key.util.ts` 改 HMAC-SHA256，删除 `default_secret` 回退 |
| **XG-04 / C5** | 普通用户可改任意剧集播放源 | 高危 | ✅ **已修复** | 拆出 `video/controllers/video-compat-admin.controller.ts`：`AdminJwtAuthGuard` + HTTPS 校验 |
| **XG-05 / H5 / H6** | 硬编码 Short.io Key + 匿名短链 + 开放重定向 | 高危 | ⚠️ **代码已修，待填 Key** | 硬编码已删；控制器改用 `JwtOrAdminGuard`（用户或管理员 token 均可，匿名拦截）；服务加白名单；`short-link.module.ts` 补 `DauService` / `JwtAuthGuard` 并 import `AdminAuthModule`；需配置 `SHORT_LINK_ALLOWED_DOMAINS` |
| **XG-06** | 敏感凭据入库 | 高危 | ⚠️ **待人工** | `.env` 已确认未被 git 跟踪；Telegram Bot Token 仍需去 @BotFather 吊销 |
| **XG-07** | CORS 反射任意来源 + credentials | 中危 | ⏳ **未改** | `main.client.ts` / `main.admin.ts`，需先确定前端域名再收敛 |
| **XG-08** | ValidationPipe `whitelist:false` | 中危 | ⏳ **未改** | 建议打开 whitelist 前先跑一轮全量接口回归 |
| **XG-09 / XG-10** | 浏览历史清理 / 埋点刷量 | 中危 | ⚠️ **部分** | 埋点已加限流 + 数组上限；XFF 伪造与事件去重未处理 |
| **XG-11** | 新增管理员默认 super_admin | 中危 | ⏳ **未改** | `admin-auth.service.ts:174` 建议改默认 `admin` |
| **XG-12 / PC-01** | 前端 token 存 localStorage | 中危 | — | 属前端仓库，本仓不涉及 |

**完成度：XG-01/02/03/04 已闭环，XG-05 代码层已闭环；剩余为配置项与人工动作**

---

## 🚀 立即执行步骤

### 1. 更新 .env 文件（最重要！）

```bash
# 备份当前配置
cp .env .env.backup.$(date +%Y%m%d)

# 编辑 .env 文件
nano .env

# 按照上面的"关键密钥更新"部分替换所有弱密钥
```

### 2. 检查 linter 错误

```bash
npm run lint
```

### 3. 重新构建

```bash
npm run build
```

### 4. 重启服务

```bash
# 停止旧服务
pm2 stop all  # 或 docker-compose down

# 启动新服务
npm run start:client  # 或 pm2 start ecosystem.config.js
```

### 5. 验证修复

```bash
# 1. 测试 ingest 接口（应该返回 401 未授权）
curl -X POST http://localhost:8080/api/admin/ingest/series \
  -H "Content-Type: application/json" \
  -d '{"externalId":"test","title":"Test"}'

# 2. 测试短链接接口（应该返回 401 未授权）
curl -X POST http://localhost:8080/api/short-links \
  -H "Content-Type: application/json" \
  -d '{"originalURL":"https://example.com"}'

# 3. 测试广告批量限制（超过50个应该失败）
# 4. 测试广告限流（快速请求超过100次应该被限流）
```

---

## 📝 配置检查清单

- [ ] 更新 `JWT_SECRET` 为强随机密钥
- [ ] 设置独立的 `ADMIN_JWT_SECRET`
- [ ] 设置强 `APP_SECRET`
- [ ] 配置 `SHORT_IO_API_KEY`
- [ ] 配置 `SHORT_LINK_ALLOWED_DOMAINS`
- [ ] 更换泄露的 `TELEGRAM_BOT_TOKEN`
- [ ] 设置 `DB_SYNCHRONIZE=false`
- [ ] 设置 `NODE_ENV=production`
- [ ] 验证 `.gitignore` 包含 `.env`
- [ ] 重启所有服务
- [ ] 测试关键接口鉴权
- [ ] 通知用户重新登录（JWT密钥已更换）

---

## 🔧 后续改进建议

### 1. 添加全局安全响应头

在 `main.client.ts` 中添加：

```typescript
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
```

### 2. 实施 Redis 分布式限流

当前限流是进程内的，多实例部署会失效。建议：
- 使用 Redis 存储限流计数器
- 实现分布式限流

### 3. 添加事件去重

广告事件应该基于 `userId + campaignCode + 时间窗口` 去重。

### 4. 监控和告警

- 监控异常登录尝试
- 监控大量失败的 API 请求
- 设置限流触发告警

---

## 📞 需要帮助？

查看完整的审计报告：`docs/audit/审计报告.html`

查看 PoC 脚本：`docs/audit/poc/`

---

**最后更新：** 2026-08-06  
**已修复：** 6个关键问题（C4, H5, H6, H3, H4）  
**待配置：** 3个（H1, C1/C2, C3）  
**待开发：** 3个（C5验证, H2, M1, M6）
