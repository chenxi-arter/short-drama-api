# 本批次改动说明（供 Code Review）

> 生成时间：2026-10-20
> 范围：`/Users/mac/work/short-drama-api` 工作区未提交改动，共 **24 个修改文件 + 8 个新增文件**（含本说明），`+687 / -183` 行。
> 目的：安全审计（XG-01 ~ XG-16）整改，让「弱密钥 / 匿名写入 / 枚举」这三类问题在代码层面失效。

---

## 一、先看结论

| 维度 | 结论 |
|---|---|
| 存量数据 | **不受影响**。没有任何代码路径会重写已有行的 `access_key` |
| 接口兼容 | 路径全不变；变的是**鉴权要求**和**入参校验** |
| 部署前置 | 三把密钥 + `SHORT_IO_API_KEY` 必须先在 `.env` 就位，否则进程起不来或建短链 500 |
| 回滚 | 只回退代码即可；`APP_SECRET` 不回退、无需数据修复 |

---

## 二、新增文件（7 个）

| 文件 | 作用 |
|---|---|
| `src/common/utils/security-env.util.ts` | 密钥统一校验。`assertStrongSecret` 拒绝缺失 / 弱值 / 过短 / 占位值；`optionalSecret` 只认显式配置的过渡密钥；`validateSecurityEnv` 在启动时一次性校验三把密钥 |
| `src/auth/guards/jwt-or-admin.guard.ts` | 复合守卫：先按管理员 token 验，失败再按用户 token 验，都失败返回 401。短链接口用它 |
| `src/video/controllers/video-compat-admin.controller.ts` | 承接原 `POST /api/video/episode-url`，改挂 `AdminJwtAuthGuard` + 三个 URL 字段强制 HTTPS |
| `scripts/preflight-env.js` | 部署前自检。复用编译产物里的 `assertStrongSecret`，输出 FAIL / WARN / INFO / PASS，有 FAIL 时退出码 1 |
| `SECURITY_FIX_GUIDE.md` | 逐条对应 XG 编号的修复总览与状态表 |
| `JWT_MIGRATION_GUIDE.md` | 密钥轮换与灰度步骤（明文密钥已换成占位符） |
| `docs/INGEST_AUTH_GUIDE.md` | 采集端鉴权接入指南（登录 → 拿 token → 调用） |

---

## 三、修改文件（按主题分组）

### A. 认证与密钥（核心）

| 文件 | 改了什么 | 风险 |
|---|---|---|
| `src/auth/strategies/jwt.strategy.ts` | 删掉 `authenticate()` 覆写，改用 `secretOrKeyProvider`：新密钥优先，失败回落 `JWT_SECRET_LEGACY`（仅显式配置时）。`validate()` 返回 `{ userId }` | 中。旧实现绕过 `_verify`，导致 `validate()` 不执行、`req.user.userId` 全是 `undefined`，这是必须修的 bug |
| `src/admin/guards/admin-jwt-auth.guard.ts` | `ADMIN_JWT_SECRET` 不再回退 `JWT_SECRET`；过渡旧密钥只认 `ADMIN_JWT_SECRET_LEGACY`；校验 `typ === 'admin'` | 高（部署面）。线上若从未单独配过 `ADMIN_JWT_SECRET`，升级后起不来 |
| `src/main.client.ts` / `src/main.admin.ts` | `bootstrap()` 首行调用 `validateSecurityEnv()` | 高（部署面）。同上 |
| `src/common/utils/access-key.util.ts` | `generateDeterministicKey` / `generateFromString` 从「sha256(明文拼接)」改成 HMAC-SHA256，密钥取 `APP_SECRET`，缺失即抛错 | 低（数据面）。只影响新插入行，见第五节 |

### B. 短链

| 文件 | 改了什么 | 风险 |
|---|---|---|
| `src/common/services/short-link.service.ts` | 删除硬编码 API Key `sk_kVRKjaeA93eRTm2k`；新增域名白名单校验（HTTPS 强制 + 支持 `*.example.com`）；`domain` 未传时回落到 `SHORT_IO_DEFAULT_DOMAIN`；Short.io 报错转成中文可读文案 | 中。**线上若没配 `SHORT_IO_API_KEY`，建短链立即 500** |
| `src/common/controllers/short-link.controller.ts` | 类级加 `JwtOrAdminGuard` | 中。匿名调用由 200 变 401 |
| `src/common/dto/short-link.dto.ts` | `domain` 由「必填 + 类默认值」改为可选，默认值交给 service / env | 低。修掉「env 里的 `SHORT_IO_DEFAULT_DOMAIN` 不生效」的死代码 |
| `src/common/short-link.module.ts` | `imports: [AdminAuthModule]`；`providers` 补 `DauService`、`JwtAuthGuard`、`JwtOrAdminGuard` | 低。不加会 500（守卫拿到 undefined 的 `DauService`） |

### C. 写接口收口

| 文件 | 改了什么 | 风险 |
|---|---|---|
| `src/video/controllers/ingest.controller.ts` | 类级加 `AdminJwtAuthGuard` | 高（部署面）。采集端若匿名调用全挂 |
| `src/video/controllers/test-ingest.controller.ts` | 同上 | 低（测试接口） |
| `src/video/controllers/video.controller.ts` | 移除 `createEpisodeUrl`（`POST /api/video/episode-url`），保留注释说明去向 | 中。用用户 token 调这个接口的调用方会 401 |
| `src/video/modules/video-api.module.ts` | 注册 `VideoCompatAdminController` | 低 |

> 为什么 `POST /api/video/episode-url` 要改为管理员：它是**写操作**，会覆盖任意 `episodeId` 的 `ossUrl` / `cdnUrl`。原实现只要登录就能改，等于全站视频流可被劫持。

### D. 广告埋点

| 文件 | 改了什么 | 风险 |
|---|---|---|
| `src/advertising/controllers/tracking.controller.ts` | 类级 `RateLimitGuard`，三档限流：单事件 100 次/分、批量 10 次/分、转化 20 次/分（按 IP + 路由） | 中。正常用户不会触发；Nginx 若不透传 `X-Forwarded-For`，全体用户共享同一计数 |
| `src/advertising/dto/tracking.dto.ts` | 批量事件数组上限 50 条 | 低。超过返回 400 |

### E. 配置 / 脚本 / 文档

| 文件 | 改了什么 |
|---|---|
| `.env.example` | 标注三把密钥为启动必需项，并提示「占位值会被拒绝启动」 |
| `.gitignore` | 增加 `.env.bak*` / `.env.*.bak` / `*.env.bak` |
| `scripts/test-ingest-isVertical.js` | 原本不带 token，加守卫后必 401。补 `login()`，密码从 `ADMIN_PASSWORD` 读取 |
| `docs/admin-api.md` | 短链认证改为「需要登录」；端口统一到 9090；清理过期表述；补安全修复小节 |
| `docs/frontend-api-guide.md` | 短链 §12.1 认证 + 示例 + 错误码表；两处「需要认证的接口」补短链 |
| `docs/ingest-api-complete-guide.md` | Access Key 算法改 HMAC 说明 + 可复现脚本；端口 8080 → 9090 |
| `docs/admin-security-changes.md` | 修正「ingest 暂不加 token」的过期说明 |
| `docs/environment-configuration.md` | 新增「3.1 安全密钥（三把，缺一即启动失败）」 |
| `docs/development-guide.md` | 本地模板补齐三把密钥 |

---

## 四、部署影响（按严重度）

**必炸**

1. 三把密钥缺失 / 弱值 / 占位值 → 进程拒绝启动
2. `SHORT_IO_API_KEY` 未配 → 建短链 500（旧代码有硬编码兜底，线上很可能一直没配）
3. 采集端匿名调用 ingest → 401
4. `POST /api/video/episode-url` 用用户 token 或 `http://` 地址 → 401 / 400

**可能炸**

5. 前端建短链不带 `Authorization` → 401（游客也有真实 JWT，带上即可）
6. 埋点批量 > 50 条 → 400；同 IP 超频 → 429
7. 轮换 `JWT_SECRET` 且未配 `JWT_SECRET_LEGACY` → 全体用户重新登录

**不会炸**

8. 存量 `accessKey` 不变；`GET /api/video/episode-url/:accessKey` 未改动

---

## 五、accessKey：为什么存量不受影响

| 环节 | 行为 | 位置 |
|---|---|---|
| 读取 | `WHERE access_key = ?` 按列查，不重算 | `url.service.ts:116`、`:169` |
| 再次入库 | existing 分支只更新 url 字段，显式「保持 accessKey 不变」 | `ingest.service.ts:275`、`:406-411` |
| 插入 | `@BeforeInsert` 仅在 key 为空时生成 | `episode-url.entity.ts:94` |
| 启动 | 无批量重建；`DB_SYNCHRONIZE=false`；迁移脚本零命中 `access_key` | `.env:46` |

会变的三种**人为**场景：`removeMissingUrls` 删行后回加、`removeMissingEpisodes` 删剧集后回加、清表重导。

---

## 六、已知遗留（本批次未处理）

| 项 | 状态 | 说明 |
|---|---|---|
| XG-06 Telegram Bot Token | ⚠️ 待人工 | 需去 @BotFather 吊销；代码侧无法处理 |
| XG-07 CORS `origin: true` + credentials | ⏳ 未改 | 需先确定前端域名白名单 |
| XG-08 `ValidationPipe` `whitelist: false` | ⏳ 未改 | 打开前建议跑一轮全量接口回归 |
| accessKey 两套公式 | ⚠️ 待决策 | ingest 用 `externalId:episodeNumber:quality`，`episode-url` 用 `episodeId_quality`，同一集可能得到两个 key。建议统一，未实施 |
| `JWT_REFRESH_SECRET` | ℹ️ 死配置 | `app-config.service.ts:53` 有硬编码默认值，但全库无消费方，无实际风险 |

---

## 七、回滚

```bash
# 代码：只需回退本次改动，不涉及数据修复
git stash            # 或 git checkout -- <file>

# 若已轮换 JWT_SECRET 又想让用户不掉线：保留 JWT_SECRET_LEGACY 即可，无需回滚代码
```

`APP_SECRET` 无需回滚：改回去只会让**后续新插入**的 key 变回旧算法，已入库的值永远不会被重写。

---

## 八、上线验证清单

```bash
# 1) 配置自检（必须全绿）
npm run build && node scripts/preflight-env.js

# 2) 启动后确认三把密钥生效
grep -i "安全配置" <启动日志>   # 不应出现任何 [安全配置] 报错

# 3) 存量链接仍可用（挑一条上线前就存在的 accessKey）
curl -H "Authorization: Bearer <用户token>" \
  http://localhost:8080/api/video/episode-url/<旧key>

# 4) 短链：匿名 401 / 登录 200
curl -X POST http://localhost:8080/api/short-links \
  -H "Content-Type: application/json" -d '{"originalURL":"https://t.me/x"}'
# 期望 401

# 5) 采集：管理员 token 入库 200
ADMIN_PASSWORD=xxx node scripts/test-ingest-isVertical.js
```
