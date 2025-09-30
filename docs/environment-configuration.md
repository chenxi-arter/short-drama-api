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
```

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
