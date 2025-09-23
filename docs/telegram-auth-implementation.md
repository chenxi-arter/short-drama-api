# Telegram Web App 认证实现说明

## 概述

本项目实现了基于 Telegram Web App 的用户认证系统，用户可以通过 Telegram 小程序直接登录到短剧平台。

## 功能特性

- ✅ Telegram Web App initData 验证
- ✅ 自动用户注册/登录
- ✅ JWT 访问令牌和刷新令牌机制
- ✅ 设备信息记录和IP地址跟踪
- ✅ 安全的HMAC-SHA256签名验证
- ✅ 防重放攻击（时间戳验证）

## 实现架构

### 核心组件

1. **TelegramAuthService** - 负责验证 Telegram Web App 数据
2. **TelegramStrategy** - Passport 认证策略
3. **TelegramAuthGuard** - 认证守卫
4. **AuthController** - 处理登录、刷新、登出等请求

### 认证流程

```
1. 前端获取 Telegram initData
2. 发送 POST /api/auth/telegram/login
3. 后端验证 initData 签名
4. 查找或创建用户
5. 返回 JWT 令牌
6. 使用 JWT 访问受保护资源
```

## API 接口

> 说明
- Telegram 登录推荐统一入口：`POST /api/auth/telegram/login`
- Telegram Bot 登录：`POST /api/auth/telegram/bot-login`

### 登录来源说明

- Web App 登录：使用统一入口 `/api/auth/telegram/login`，传 `initData`
- Bot 登录：使用 `/api/auth/telegram/bot-login`，传 `id/auth_date/hash` 等字段

### 1. Telegram 登录
```http
POST /api/auth/telegram/login
Content-Type: application/json

{
  "initData": "query_id=...&user=...&auth_date=...&hash=...",
  "deviceInfo": "iPhone 14 Pro, iOS 16.0"
}
```

**响应:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "abc123def456...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": {
    "id": 279058397,
    "shortId": "Ab3Cd4Ef5G6",
    "first_name": "Vladislav",
    "last_name": "Kibenko",
    "username": "vdkfrost"
  }
}
```

#### 1.1 Telegram Bot 登录（统一归口到 auth）

当不使用 Web App，而是直接通过 Bot 的 `id/first_name/auth_date/hash` 方式登录时，请使用：

```http
POST /api/auth/telegram/bot-login
Content-Type: application/json

{
  "id": 6702079700,
  "first_name": "随风",
  "last_name": "李",
  "username": "seo99991",
  "auth_date": 1754642628,
  "hash": "cd671f60a4...ae93c07",
  "deviceInfo": "iPhone, iOS 16"
}
```

> 说明：Bot 登录不再使用 `/api/user/telegram-login`，全部统一到 `auth` 模块下，避免接口分散。

### 2. 刷新令牌
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "abc123def456..."
}
```

### 3. 登出
```http
POST /api/auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "refresh_token": "abc123def456..."
}
```

### 4. 全设备登出
```http
POST /api/auth/logout-all
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5. 获取用户信息
```http
GET /api/auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 6. 账号绑定与互通（邮箱 ⇄ Telegram）

系统采用“单用户单记录”的设计，`users` 表中的一条记录可同时具备邮箱登录能力与 Telegram 登录能力：
- 邮箱字段：`email`、`password_hash`
- Telegram 字段：`telegram_id`

当执行绑定时，是在同一条用户记录上写入缺失的登录字段，确保数据互通、行为一致。

#### 6.1 邮箱账号绑定 Telegram（需用户登录）

```http
POST /api/user/bind-telegram
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "id": 6702079700,
  "first_name": "随风",
  "last_name": "李",
  "username": "seo99991",
  "auth_date": 1754642628,
  "hash": "cd671f60a4...ae93c07"
}
```

请求体字段说明（全部来自 Telegram 登录小部件/机器人验证数据）：
- `id`：Telegram 用户 ID（必填）
- `first_name`：名（必填）
- `last_name`：姓（可选）
- `username`：用户名（可选）
- `auth_date`：认证时间戳（必填）
- `hash`：签名（必填，基于 `TELEGRAM_BOT_TOKEN` 验证）

成功响应（示例）：
```json
{
  "success": true,
  "message": "Telegram账号绑定成功，现在可以使用邮箱或Telegram登录",
  "user": {
    "id": 1234567890,
    "shortId": "Ab3Cd4Ef5G6",
    "email": "user@example.com",
    "username": "username123",
    "firstName": "张",
    "lastName": "三",
    "telegramId": 6702079700,
    "isActive": true
  }
}
```

失败场景（示例）：
- 401 `Telegram数据验证失败`（hash 无效或过期）
- 409 `该账号已经绑定了Telegram`（当前用户已有关联）
- 409 `该Telegram账号已被其他用户绑定`（要绑定的 `telegram_id` 被占用）

#### 6.2 Telegram 账号绑定邮箱（需用户登录）

```http
POST /api/user/bind-email
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "P@ssw0rd",
  "confirmPassword": "P@ssw0rd"
}
```

校验规则：
- `email` 有效且未被其他账号占用
- `password` 与 `confirmPassword` 一致
- 密码强度：长度 6-20，且包含至少一个字母与一个数字

成功响应（示例）：
```json
{
  "success": true,
  "message": "邮箱绑定成功，现在可以使用邮箱或Telegram登录",
  "user": {
    "id": 1234567890,
    "shortId": "Ab3Cd4Ef5G6",
    "email": "user@example.com",
    "username": "user_6702079700",
    "firstName": "随风",
    "lastName": "李",
    "telegramId": 6702079700,
    "isActive": true
  }
}
```

失败场景（示例）：
- 400 `密码和确认密码不匹配` / 密码强度不满足
- 401 `用户不存在`（token 无效）
- 409 `该账号已绑定邮箱`（当前用户已有关联邮箱）
- 409 `该邮箱已被其他账号使用`

## 环境配置

在 `.env` 文件中添加以下配置：

```env
# Telegram Bot 配置
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_BOT_USERNAME=your_bot_username

# JWT 配置
JWT_SECRET=your-jwt-secret-here
JWT_EXPIRES_IN=1h
```

## 安全考虑

1. **签名验证**: 使用 HMAC-SHA256 验证 initData 完整性
2. **时间戳检查**: 拒绝超过24小时的旧数据
3. **IP地址跟踪**: 记录登录IP，检测异常活动
4. **令牌轮换**: 支持刷新令牌机制
5. **设备管理**: 支持单设备或全设备登出

## 测试

使用提供的测试脚本：

```bash
cd src/auth
node test-telegram-auth.js
```

测试脚本会：
1. 生成有效的 initData
2. 测试登录接口
3. 测试受保护资源访问
4. 测试令牌刷新
5. 测试登出功能

## 前端集成

### HTML5/JavaScript 示例

```javascript
// 在 Telegram Web App 中获取 initData
const initData = window.Telegram.WebApp.initData;

// 发送登录请求
const response = await fetch('/api/auth/telegram/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    initData: initData,
    deviceInfo: navigator.userAgent
  })
});

const tokens = await response.json();
localStorage.setItem('access_token', tokens.access_token);
localStorage.setItem('refresh_token', tokens.refresh_token);
```

### 使用访问令牌

```javascript
// 在后续请求中使用访问令牌
const response = await fetch('/api/protected-resource', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  }
});
```

## 故障排除

### 常见错误

1. **"initData hash验证失败"**
   - 检查 TELEGRAM_BOT_TOKEN 是否正确
   - 确认 initData 格式正确
   - 验证时间戳是否在有效范围内

2. **"找不到模块"错误**
   - 运行 `npm install` 确保依赖安装完整
   - 检查 TypeScript 编译状态

3. **"用户账号已被禁用"**
   - 检查数据库中用户的 `is_active` 字段
   - 确认用户未被管理员禁用

### 调试技巧

1. 启用详细日志：设置 `NODE_ENV=development`
2. 检查网络请求和响应
3. 验证环境变量配置
4. 使用测试脚本验证后端功能

## 扩展功能

### 可选实现

1. **多因素认证**: 结合短信或邮箱验证
2. **设备指纹**: 增强设备识别
3. **地理位置验证**: 基于IP地址的地理位置检查
4. **会话管理**: 详细的会话跟踪和管理
5. **审计日志**: 记录所有认证相关操作

### 与其他系统集成

- 可以与现有的用户系统集成
- 支持角色和权限管理
- 兼容其他认证方式（如传统用户名密码）
