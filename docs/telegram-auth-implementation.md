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
