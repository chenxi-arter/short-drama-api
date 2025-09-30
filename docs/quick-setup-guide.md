# 🚀 快速配置指南

## 📋 环境变量配置

### 1. 复制配置文件

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑配置文件
nano .env
# 或使用其他编辑器
vim .env
```

### 2. 必需配置项

#### 数据库配置 (MySQL)
```bash
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
DB_DATABASE=short_drama_db
```

#### JWT认证配置
```bash
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
```

#### Telegram Bot配置
```bash
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_BOT_USERNAME=your_bot_username
```

### 3. 可选配置项

#### Redis配置 (用于缓存)
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# Redis认证 (Redis 6.0+支持)
REDIS_USERNAME=your_redis_username
REDIS_PASSWORD=your_redis_password
```

#### 应用配置（端口拆分）
```bash
CLIENT_PORT=3000
ADMIN_PORT=8080
NODE_ENV=development
```

## 🔧 不同环境配置示例

### 开发环境
```bash
NODE_ENV=development
DB_HOST=localhost
DB_USERNAME=root
DB_PASSWORD=password
DB_SYNCHRONIZE=true
DB_LOGGING=true
REDIS_HOST=localhost
REDIS_PORT=6379
# 开发环境通常不需要Redis认证
```

### 生产环境（端口示例）
```bash
NODE_ENV=production
DB_HOST=your_production_db_host
DB_USERNAME=your_production_db_user
DB_PASSWORD=your_strong_production_password
DB_SYNCHRONIZE=false
DB_LOGGING=false
REDIS_HOST=your_production_redis_host
REDIS_USERNAME=your_redis_username
REDIS_PASSWORD=Drama@456
CLIENT_PORT=3000
ADMIN_PORT=8080
```

## ⚠️ 重要注意事项

1. **安全配置**
   - 生产环境必须使用强密码
   - JWT密钥至少32位字符
   - 不要将 `.env` 文件提交到版本控制

2. **Redis认证**
   - 支持 `REDIS_USERNAME`/`REDIS_USER` 两种命名
   - 支持 `REDIS_PASSWORD`/`REDIS_PASS` 两种命名
   - 没有认证信息时自动降级

3. **数据库配置**
   - 确保数据库用户有足够权限
   - 生产环境建议使用连接池
   - 开发环境可开启同步和日志

## 🔍 配置验证

启动应用后检查日志，确保：
- 数据库连接成功
- Redis连接成功（如果配置）
- JWT配置正确
- Telegram Bot配置正确

## 📚 详细文档

- [完整环境配置指南](environment-configuration.md)
- [API变更文档](api-changes-documentation.md)
- [部署指南](deployment-guide.md)

---

*最后更新: 2025年9月13日*
