# 🔧 环境变量配置指南

## 📋 概述

本文档详细说明了短剧API项目的环境变量配置，包括开发环境、测试环境和生产环境的配置示例。

## 📁 配置文件位置

- **开发环境**: `.env`
- **生产环境**: `.env.production` 或 `.env`
- **示例文件**: `.env.example`

## 🔑 必需配置项

### 1. 数据库配置 (MySQL)

```bash
# 数据库连接配置
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
DB_DATABASE=short_drama_db

# 数据库连接池配置
DB_MAX_CONNECTIONS=10
DB_MIN_CONNECTIONS=2
DB_ACQUIRE_TIMEOUT=60000
DB_TIMEOUT=60000

# 数据库同步和日志配置
DB_SYNCHRONIZE=false
DB_LOGGING=false
```

### 2. Redis配置

```bash
# Redis基础配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# Redis认证配置 (可选)
REDIS_USERNAME=your_redis_username
REDIS_PASSWORD=your_redis_password

# 或者使用别名
REDIS_USER=your_redis_username
REDIS_PASS=your_redis_password

# Redis缓存配置
REDIS_TTL=300
REDIS_MAX=100
```

### 3. 应用配置

```bash
# 应用端口（拆分）
# 这是代码里的缺省值；本项目当前部署实际用的是 CLIENT_PORT=8080 / ADMIN_PORT=9090
CLIENT_PORT=3000
ADMIN_PORT=8080

# JWT配置
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Telegram Bot配置 (用于用户登录)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_BOT_USERNAME=your_bot_username
```

### 3.1 安全密钥（三把，缺一即启动失败）

> ⚠️ 安全加固后（2026-10），`JWT_SECRET` 单靠一把已经不够了。以下三个变量
> **缺失、少于 16 位、或仍是历史泄露值（如 `very-secret-key` / `default_secret`）时进程直接退出**，
> 不再有静默兜底。

```bash
# 用户 token 签名密钥（两个进程都用）
JWT_SECRET=<openssl rand -base64 48>

# 管理员 token 独立密钥（必填，且必须与 JWT_SECRET 不同）
# 不再回退到 JWT_SECRET —— 否则用户密钥即可签管理员 token
ADMIN_JWT_SECRET=<openssl rand -base64 48>

# 派生播放访问密钥 accessKey（HMAC-SHA256 的密钥）
APP_SECRET=<openssl rand -base64 48>
```

迁移期可选（**迁移完成就删掉**，否则旧 token 永久有效）：

```bash
# JWT_SECRET_LEGACY=<线上旧的 JWT_SECRET>
# ADMIN_JWT_SECRET_LEGACY=<线上旧的 ADMIN_JWT_SECRET>
```

补充说明：

- `ADMIN_JWT_SECRET` 一旦更换，所有 admin token 立即失效，管理员需重新登录（账号不受影响）
- `APP_SECRET` 更换后，**库里已有的 accessKey 不变**（旧播放链接仍可用），
  但同一部剧同清晰度再入库会算出新 key —— 换之前先确认没有外部系统自己算 accessKey
- 校验逻辑在 `src/common/utils/security-env.util.ts`，两个入口 `main.client.ts` / `main.admin.ts` 启动时调用

## 🌍 环境特定配置

### 开发环境 (.env)

```bash
# 开发环境配置
NODE_ENV=development

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_DATABASE=short_drama_dev
DB_SYNCHRONIZE=true
DB_LOGGING=true

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
# 开发环境通常不需要Redis认证
# REDIS_USERNAME=
# REDIS_PASSWORD=

# 应用配置
CLIENT_PORT=3000
ADMIN_PORT=8080
JWT_SECRET=dev_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Telegram Bot (开发环境)
TELEGRAM_BOT_TOKEN=your_dev_bot_token
TELEGRAM_BOT_USERNAME=your_dev_bot_username

# R2 存储配置 (开发环境)
R2_ENDPOINT_URL=https://your_account_id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_dev_r2_access_key
R2_SECRET_ACCESS_KEY=your_dev_r2_secret_key
R2_BUCKET_NAME=admin
R2_PUBLIC_BASE_URL=https://pub-xxxxx.r2.dev

# 假评论功能 (开发环境默认启用)
ENABLE_FAKE_COMMENTS=true
MIN_FAKE_COMMENTS=30
MAX_FAKE_COMMENTS=50
```

### 生产环境 (.env.production)

```bash
# 生产环境配置
NODE_ENV=production

# 数据库配置
DB_HOST=your_production_db_host
DB_PORT=3306
DB_USERNAME=your_production_db_user
DB_PASSWORD=your_strong_production_password
DB_DATABASE=short_drama_prod
DB_SYNCHRONIZE=false
DB_LOGGING=false

# 数据库连接池 (生产环境建议增加)
DB_MAX_CONNECTIONS=20
DB_MIN_CONNECTIONS=5
DB_ACQUIRE_TIMEOUT=60000
DB_TIMEOUT=60000

# Redis配置 (生产环境建议使用认证)
REDIS_HOST=your_production_redis_host
REDIS_PORT=6379
REDIS_DB=0
REDIS_USERNAME=your_redis_username
REDIS_PASSWORD=Drama@456
REDIS_TTL=600
REDIS_MAX=200

# 应用配置
CLIENT_PORT=3000
ADMIN_PORT=8080
JWT_SECRET=your_very_strong_production_jwt_secret
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

# Telegram Bot (生产环境)
TELEGRAM_BOT_TOKEN=your_production_bot_token
TELEGRAM_BOT_USERNAME=your_production_bot_username

# R2 存储配置 (生产环境)
R2_ENDPOINT_URL=https://your_account_id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_prod_r2_access_key
R2_SECRET_ACCESS_KEY=your_prod_r2_secret_key
R2_BUCKET_NAME=static-storage
R2_PUBLIC_BASE_URL=https://static.656932.com

# 假评论功能 (生产环境建议关闭或减少数量)
ENABLE_FAKE_COMMENTS=false     # 或设为true但降低数量
MIN_FAKE_COMMENTS=10           # 如果启用，建议降低数量
MAX_FAKE_COMMENTS=20           # 如果启用，建议降低数量
```

### 测试环境 (.env.test)

```bash
# 测试环境配置
NODE_ENV=test

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=test_user
DB_PASSWORD=test_password
DB_DATABASE=short_drama_test
DB_SYNCHRONIZE=true
DB_LOGGING=false

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=1
# 测试环境使用不同的数据库

# 应用配置
CLIENT_PORT=3001
ADMIN_PORT=38080
JWT_SECRET=test_jwt_secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=1d

# Telegram Bot (测试环境)
TELEGRAM_BOT_TOKEN=your_test_bot_token
TELEGRAM_BOT_USERNAME=your_test_bot_username

# 假评论功能 (测试环境建议启用)
ENABLE_FAKE_COMMENTS=true
MIN_FAKE_COMMENTS=30
MAX_FAKE_COMMENTS=50
```

## 🔐 安全配置建议

### 1. 密码强度要求

```bash
# 数据库密码 - 建议使用强密码
DB_PASSWORD=MyStr0ng!P@ssw0rd123

# Redis密码 - 建议使用强密码
REDIS_PASSWORD=Drama@456

# JWT密钥 - 建议使用长随机字符串
JWT_SECRET=your_very_long_and_random_jwt_secret_key_at_least_32_characters_long
```

### 2. 环境变量保护

```bash
# 不要在代码中硬编码敏感信息
# 使用环境变量或配置文件

# 生产环境建议使用密钥管理服务
# 如 AWS Secrets Manager, Azure Key Vault 等
```

## 📝 完整配置示例

### .env.example (模板文件)

```bash
# ===========================================
# 短剧API项目环境变量配置模板
# ===========================================

# 应用环境
NODE_ENV=development

# ===========================================
# 数据库配置 (MySQL)
# ===========================================
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
DB_DATABASE=short_drama_db

# 数据库连接池配置
DB_MAX_CONNECTIONS=10
DB_MIN_CONNECTIONS=2
DB_ACQUIRE_TIMEOUT=60000
DB_TIMEOUT=60000

# 数据库同步和日志 (开发环境可设为true)
DB_SYNCHRONIZE=false
DB_LOGGING=false

# ===========================================
# Redis配置
# ===========================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# Redis认证配置 (可选，Redis 6.0+支持)
REDIS_USERNAME=your_redis_username
REDIS_PASSWORD=your_redis_password

# Redis缓存配置
REDIS_TTL=300
REDIS_MAX=100

# Redis连接配置 (可选)
REDIS_CONNECT_TIMEOUT=5000
REDIS_LAZY_CONNECT=3000
REDIS_RETRY_ATTEMPTS=3
REDIS_RETRY_DELAY=3000
REDIS_ENABLE_READY_CHECK=true
REDIS_MAX_RETRIES_PER_REQUEST=20000

# ===========================================
# 应用配置
# ===========================================
PORT=3000

# ===========================================
# JWT认证配置
# ===========================================
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# ===========================================
# Telegram Bot配置
# ===========================================
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_BOT_USERNAME=your_bot_username

# ===========================================
# Cloudflare R2 存储配置
# ===========================================
# R2 S3 兼容端点
R2_ENDPOINT_URL=https://your_account_id.r2.cloudflarestorage.com

# R2 访问凭证
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key

# R2 存储桶名称
R2_BUCKET_NAME=your_bucket_name

# R2 公开访问 URL（可选，用于生成公开访问链接）
R2_PUBLIC_BASE_URL=https://static.yourdomain.com

# ===========================================
# 假评论功能配置
# ===========================================
# 是否启用假评论（默认：true，设为false禁用）
ENABLE_FAKE_COMMENTS=true

# 每个剧集的假评论数量范围
MIN_FAKE_COMMENTS=30          # 最少假评论数（默认：30）
MAX_FAKE_COMMENTS=50          # 最多假评论数（默认：50）

# ===========================================
# 其他配置
# ===========================================
# 日志级别
LOG_LEVEL=info

# CORS配置
CORS_ORIGIN=http://localhost:3000

# 文件上传配置
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

## 🚀 部署配置

### Docker环境变量

```bash
# Docker Compose 环境变量示例
version: '3.8'
services:
  app:
    environment:
      - NODE_ENV=production
      - DB_HOST=mysql
      - DB_PORT=3306
      - DB_USERNAME=app_user
      - DB_PASSWORD=secure_password
      - DB_DATABASE=short_drama
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - REDIS_PASSWORD=redis_password
      - JWT_SECRET=your_jwt_secret
      - TELEGRAM_BOT_TOKEN=your_bot_token
      - ENABLE_FAKE_COMMENTS=false
      - MIN_FAKE_COMMENTS=30
      - MAX_FAKE_COMMENTS=50
```

### Kubernetes ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: short-drama-api-config
data:
  NODE_ENV: "production"
  CLIENT_PORT: "3000"
  ADMIN_PORT: "8080"
  DB_HOST: "mysql-service"
  DB_PORT: "3306"
  REDIS_HOST: "redis-service"
  REDIS_PORT: "6379"
  REDIS_TTL: "600"
  LOG_LEVEL: "info"
  ENABLE_FAKE_COMMENTS: "false"
  MIN_FAKE_COMMENTS: "30"
  MAX_FAKE_COMMENTS: "50"
```

## 💬 假评论功能配置详解

### 功能说明

假评论功能用于在真实评论数据较少时，动态生成模拟评论数据，提升用户体验。

**核心特性：**
- 不占用数据库空间（动态生成）
- 同一剧集返回固定内容（基于种子算法）
- 性能影响极小（~1ms/50条评论）
- 可随时启用/禁用

### 配置参数

| 参数名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `ENABLE_FAKE_COMMENTS` | boolean | `true` | 是否启用假评论功能 |
| `MIN_FAKE_COMMENTS` | number | `30` | 每个剧集最少假评论数 |
| `MAX_FAKE_COMMENTS` | number | `50` | 每个剧集最多假评论数 |

### 使用建议

**开发/测试环境：**
```bash
ENABLE_FAKE_COMMENTS=true      # 建议启用
MIN_FAKE_COMMENTS=30
MAX_FAKE_COMMENTS=50
```

**生产环境（新平台）：**
```bash
ENABLE_FAKE_COMMENTS=true      # 可以启用
MIN_FAKE_COMMENTS=10           # 降低数量，更真实
MAX_FAKE_COMMENTS=20
```

**生产环境（成熟平台）：**
```bash
ENABLE_FAKE_COMMENTS=false     # 建议关闭
```

### 技术细节

- **数据来源**: 500+条真实短剧用户评论模板
- **昵称库**: 50+个短剧风格的用户昵称
- **时间范围**: 最近60天（从当前时间往前推）
- **ID范围**: 使用负数ID（-1000000开始），不与真实评论冲突

### 性能数据

假设25万剧集，每个30-50条假评论：

| 指标 | 数值 |
|------|------|
| 评论总数显示 | 750万 - 1250万条 |
| 数据库占用 | 0 MB |
| 内存占用 | ~100 KB |
| 生成耗时 | ~1ms/50条 |
| API延迟增加 | < 10% |

## 🧹 游客数据清理配置详解

### 功能说明

定时**硬删除**长期不活跃的游客用户及其全部关联数据（评论、点赞、观看进度、观看日志、
收藏、点赞点踩、登录态、每日在线记录、广告事件）。

与 `POST /api/auth/admin/clean-inactive-guests`（只把 `is_active` 置 0，可恢复）不是一回事，
本功能删掉就**不可恢复**，所以默认关闭。

### 配置参数

| 参数名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `GUEST_PURGE_ENABLED` | boolean | `false` | 是否启用每日定时清理；只有 `true` 才会真正执行 |
| `GUEST_PURGE_INACTIVE_MONTHS` | number | `3` | 判定周期（月），按月=30天折算。**下限 2 个月**，更小的值会被自动抬到 2 |
| `GUEST_PURGE_BATCH_SIZE` | number | `200` | 每批删除条数，上限 1000 |
| `GUEST_PURGE_MAX_PER_RUN` | number | `5000` | 单次运行最多删多少个用户，超出的留到下次 |

### 为什么不能低于 2 个月（60 天）

这直接关系到「最近 35 天的数据准不准」：

1. DAU 的计算是三路 SQL 取并集（`users.created_at` / `user_online_daily.duration>0` / `watch_logs.watch_date`），
   再和 Redis HyperLogLog（`dau:YYYYMMDD`）取 `Math.max`
2. **HLL 的 key 只保留 35 天**。超过 35 天的日期没有任何兜底，完全依赖上面三张表
3. 一旦阈值压到 35 天以内，被删的用户就可能带着「最近 35 天内」的记录被删掉，
   这些日期的 DAU、在线时长会出现**永久缺口**，HLL 也补不回来
4. 反过来，只要阈值 ≥ 35 天，判定条件「cutoff 之后零活动」就保证了
   被删用户在最近 35 天里**一条记录都没有** —— 最近 35 天的统计天然准确，不需要任何额外处理

所以代码里把下限锁在 60 天，比 35 天留了 25 天余量。`preview` 返回的
`affectsRecent35Days` 字段专门用来确认这一点（恒为 `false`）。

### 「不活跃」怎么判定

`users` 表没有 `last_login_at` 列，所以最后活跃时间由业务表反推。
下列条件**同时满足**才会被删：

1. `is_guest = 1` 且 `email` 为 NULL 且 `telegram_id` 为 NULL（转正用户永不触碰）
2. `created_at` 早于截止日
3. 以下各表在截止日之后**都没有记录**：
   - `user_online_daily.date`（每日在线心跳）
   - `watch_progress.updated_at`（看剧进度）
   - `watch_logs.watch_date`（观看日志）
   - `refresh_tokens.created_at`（登录态签发时间）

只要有一个活动痕迹落在阈值内，就不会被删——宁可漏删，不会误删活跃用户。

### 使用建议

**第一次上线：先别开开关，用预览接口看命中量**

```bash
# 1. 看会删多少（不写库）
curl -H "Authorization: Bearer <admin_token>" \
  "http://127.0.0.1:9090/api/admin/users/guest-purge/preview?inactiveMonths=3"

# 2. 确认量级合理后再真删（先小批量试）
curl -X POST -H "Authorization: Bearer <admin_token>" -H "Content-Type: application/json" \
  -d '{"inactiveMonths":3,"maxPerRun":200,"dryRun":false}' \
  "http://127.0.0.1:9090/api/admin/users/guest-purge/run"

# 3. 观察几天没问题，再打开定时开关
```

```bash
# 生产环境（确认无误后）
GUEST_PURGE_ENABLED=true
GUEST_PURGE_INACTIVE_MONTHS=3
GUEST_PURGE_BATCH_SIZE=200
GUEST_PURGE_MAX_PER_RUN=5000
```

**保守场景**（不确定前端有没有打心跳，怕误删）：
```bash
GUEST_PURGE_ENABLED=true
GUEST_PURGE_INACTIVE_MONTHS=6    # 拉长到半年，风险更低
```

### 技术细节

- 定时任务时间：每天 **04:30（Asia/Shanghai）**，只在 **admin 进程**执行
  - `AdminAppModule` 为此开启了 `ScheduleModule.forRoot()`（此前没开，`@Cron` 不会触发）
  - 副作用处理：admin 进程也加载了 `UserModule`，开启 ScheduleModule 会连带激活
    `UserService` 每 5 分钟刷在线时长的任务。`main.admin.ts` 会把 `APP_PROCESS_ROLE` 置为
    `admin`，该任务检测到后直接跳过，避免和 client 进程重复累加在线时长
  - 所以改完 `GUEST_PURGE_ENABLED` 后，**要重启 admin 进程**，定时任务才会读到这个值
- 删除顺序（单批一个事务）：
  `comment_likes`(自己点的) → `comment_likes`(自己评论收到的) → `comments.reply_to_user_id` 置空
  → `comments` → `watch_progress` → `watch_logs` → `browse_history` → `favorites`
  → `episode_reactions` → `refresh_tokens` → `user_online_daily`
  → `advertising_events` → `advertising_conversions` → `users`
- 最终 `DELETE FROM users` 上额外挂了 `is_guest = 1` 条件，防止「选中后刚好转正」被误删
- 每批完成后清理 Redis 的 `online:last:{id}` / `online:{today}` / `online:{yesterday}`
- 别人回复该用户的评论**不会删**，只是把 `reply_to_user_id` 置空

## ⚠️ 注意事项

### 1. 敏感信息保护
- 永远不要将 `.env` 文件提交到版本控制系统
- 使用 `.env.example` 作为模板
- 生产环境使用密钥管理服务

### 2. 环境隔离
- 不同环境使用不同的数据库
- 开发、测试、生产环境使用不同的Redis数据库
- JWT密钥在不同环境中应该不同

### 3. 配置验证
- 应用启动时会验证必需的配置项
- 缺少必需配置会导致启动失败
- 建议使用配置验证工具

### 4. 假评论使用建议
- 新平台可以启用假评论功能
- 真实评论增长后建议逐步关闭
- 生产环境使用需考虑法律合规性
- 建议向用户说明或标注"示例评论"

## 🔧 故障排除

### 常见问题

1. **数据库连接失败**
   ```bash
   # 检查数据库配置
   DB_HOST=localhost
   DB_PORT=3306
   DB_USERNAME=root
   DB_PASSWORD=password
   ```

2. **Redis连接失败**
   ```bash
   # 检查Redis配置
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=your_password
   ```

3. **JWT认证失败**
   ```bash
   # 检查JWT配置
   JWT_SECRET=your_secret_key
   JWT_EXPIRES_IN=7d
   ```

### 配置检查命令

```bash
# 检查环境变量是否加载
npm run config:check

# 测试数据库连接
npm run db:test

# 测试Redis连接
npm run redis:test
```

---

*最后更新: 2025年9月13日*
*版本: v2.1*
