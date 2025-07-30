# 短剧API项目部署指南

## 项目概述

这是一个基于 NestJS 的短剧API服务，提供用户认证、视频管理、评论系统等功能。

## 系统要求

- Node.js >= 18.0.0
- MySQL >= 8.0
- Redis >= 6.0 (可选，用于缓存)
- npm 或 yarn

## 快速部署

### 1. 克隆项目

```bash
git clone <repository-url>
cd short-drama-api
```

### 2. 安装依赖

```bash
npm install
```

### 3. 环境配置

创建 `.env` 文件，参考以下配置：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASS=your_password
DB_NAME=short_drama

# JWT配置
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Redis配置 (可选)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# 应用配置
PORT=3000
NODE_ENV=production
```

### 4. 数据库初始化

#### 方式一：使用MySQL命令行

```bash
# 连接到MySQL
mysql -h your_host -P 3306 -u your_username -p

# 创建数据库
CREATE DATABASE short_drama CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 使用数据库
USE short_drama;

# 执行初始化脚本
source /path/to/migrations/init-database.sql;

# 创建refresh_tokens表（新增功能）
source /path/to/migrations/create-refresh-tokens-table.sql;

# 插入测试数据（可选）
source /path/to/migrations/insert-test-data.sql;
```

#### 方式二：使用脚本文件

```bash
# 进入migrations目录
cd migrations

# 执行数据库初始化
mysql -h your_host -P 3306 -u your_username -p your_database < init-database.sql

# 创建refresh_tokens表
mysql -h your_host -P 3306 -u your_username -p your_database < create-refresh-tokens-table.sql

# 插入测试数据（可选）
./run-test-data.sh your_database your_username
```

### 5. 启动应用

```bash
# 开发模式
npm run start:dev

# 生产模式
npm run build
npm run start:prod
```

## 详细配置说明

### 环境变量详解

| 变量名 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| DB_HOST | 数据库主机地址 | localhost | ✓ |
| DB_PORT | 数据库端口 | 3306 | ✓ |
| DB_USER | 数据库用户名 | - | ✓ |
| DB_PASS | 数据库密码 | - | ✓ |
| DB_NAME | 数据库名称 | - | ✓ |
| JWT_SECRET | JWT密钥 | - | ✓ |
| JWT_EXPIRES_IN | JWT过期时间 | 7d | ✓ |
| REDIS_HOST | Redis主机地址 | localhost | ✗ |
| REDIS_PORT | Redis端口 | 6379 | ✗ |
| REDIS_PASSWORD | Redis密码 | - | ✗ |
| PORT | 应用端口 | 3000 | ✗ |
| NODE_ENV | 运行环境 | development | ✗ |

### 数据库表结构

项目包含以下主要数据表：

- `users` - 用户表
- `categories` - 分类表
- `tags` - 标签表
- `series` - 系列表
- `episodes` - 剧集表
- `videos` - 短视频表
- `comments` - 评论表
- `watch_progress` - 观看进度表
- `refresh_tokens` - 刷新令牌表（新增）

### API功能模块

1. **用户认证模块** (`/api/user`)
   - Telegram登录
   - JWT认证
   - Refresh Token机制

2. **视频模块** (`/api/video`)
   - 视频列表
   - 视频详情
   - 观看进度
   - 评论功能

3. **首页模块** (`/api/home`)
   - 推荐视频
   - 分类浏览

4. **列表模块** (`/api/list`)
   - 筛选标签
   - 分类数据

5. **认证模块** (`/api/auth`)
   - Token刷新
   - 登出功能
   - 设备管理

## 生产环境部署

### 使用PM2部署

1. 安装PM2
```bash
npm install -g pm2
```

2. 使用项目配置文件
```bash
pm2 start ecosystem.config.js
```

3. 查看状态
```bash
pm2 status
pm2 logs
```

### 使用Docker部署

创建 `Dockerfile`：

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

创建 `docker-compose.yml`：

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    depends_on:
      - mysql
      - redis

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: short_drama
      MYSQL_USER: drama
      MYSQL_PASSWORD: Drama@123
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./migrations:/docker-entrypoint-initdb.d

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"

volumes:
  mysql_data:
```

部署命令：
```bash
docker-compose up -d
```

## 数据库迁移

### 新服务器首次部署

1. 执行 `init-database.sql` - 创建所有基础表
2. 执行 `create-refresh-tokens-table.sql` - 创建refresh_tokens表
3. 执行 `insert-test-data.sql` - 插入测试数据（可选）

### 现有数据库升级

如果是从旧版本升级，只需执行：
```bash
mysql -h host -u user -p database < migrations/create-refresh-tokens-table.sql
```

## 健康检查

部署完成后，可以通过以下方式验证服务状态：

```bash
# 检查服务是否启动
curl http://localhost:3000

# 检查数据库连接
curl http://localhost:3000/api/test

# 查看数据统计
mysql -h host -u user -p database < migrations/check-data-stats.sql
```

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查数据库服务是否启动
   - 验证连接参数是否正确
   - 确认防火墙设置

2. **JWT认证失败**
   - 检查JWT_SECRET是否设置
   - 验证token是否过期

3. **端口占用**
   - 使用 `lsof -i :3000` 查看端口占用
   - 修改PORT环境变量

4. **依赖安装失败**
   - 清除缓存：`npm cache clean --force`
   - 删除node_modules重新安装

### 日志查看

```bash
# PM2日志
pm2 logs

# Docker日志
docker-compose logs -f

# 应用日志
tail -f logs/application.log
```

## 安全建议

1. **生产环境配置**
   - 使用强密码
   - 定期更换JWT密钥
   - 启用HTTPS
   - 配置防火墙

2. **数据库安全**
   - 限制数据库访问IP
   - 定期备份数据
   - 使用专用数据库用户

3. **应用安全**
   - 定期更新依赖
   - 启用请求限流
   - 配置CORS策略

## 维护和监控

1. **定期任务**
   - 清理过期refresh_tokens
   - 数据库备份
   - 日志轮转

2. **监控指标**
   - 应用响应时间
   - 数据库连接数
   - 内存使用率
   - 错误率统计

## 联系支持

如有问题，请查看：
- 项目文档：`docs/` 目录
- API文档：`migrations/API文档.md`
- 缓存指南：`docs/redis-cache-guide.md`
- Token指南：`docs/token-expiration-guide.md`