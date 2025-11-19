# 部署指南 / Deployment Guide

## 📋 目录

- [系统要求](#系统要求)
- [部署方式](#部署方式)
- [Docker部署（推荐）](#docker部署推荐)
- [手动部署](#手动部署)
- [环境变量配置](#环境变量配置)
- [常见问题](#常见问题)

---

## 系统要求

### 最低配置
- **CPU**: 2核
- **内存**: 4GB
- **硬盘**: 20GB
- **操作系统**: Linux (Ubuntu 20.04+, CentOS 7+) / macOS

### 推荐配置
- **CPU**: 4核+
- **内存**: 8GB+
- **硬盘**: 50GB+

### 依赖服务
- **MySQL**: 8.0+
- **Redis**: 6.0+
- **Node.js**: 18+ (如果手动部署)
- **Docker**: 20.10+ (如果使用Docker部署)

---

## 部署方式

### 方式1: Docker部署（推荐）⭐⭐⭐⭐⭐

**优点**:
- ✅ 环境一致性
- ✅ 快速部署
- ✅ 易于管理
- ✅ 自动重启

**适用场景**: 生产环境、测试环境

### 方式2: 手动部署

**优点**:
- ✅ 更灵活的配置
- ✅ 便于调试

**适用场景**: 开发环境

---

## Docker部署（推荐）

### 1. 准备工作

#### 1.1 安装Docker和Docker Compose

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io docker-compose

# CentOS/RHEL
sudo yum install docker docker-compose

# 启动Docker
sudo systemctl start docker
sudo systemctl enable docker
```

#### 1.2 克隆代码

```bash
git clone <your-repo-url>
cd short-drama-api
```

### 2. 配置环境变量

#### 2.1 复制环境变量模板

```bash
cp .env.example .env
```

#### 2.2 编辑 `.env` 文件

```bash
nano .env
```

**必须修改的配置**:

```env
# 数据库配置
DATABASE_HOST=your-mysql-host
DATABASE_PORT=3306
DATABASE_USERNAME=your-username
DATABASE_PASSWORD=your-password
DATABASE_NAME=short_drama

# Redis配置
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# JWT密钥（必须修改为随机字符串）
JWT_SECRET=your-very-long-random-secret-key-change-this

# Telegram Bot配置（如果使用）
TELEGRAM_BOT_TOKEN=your-bot-token
```

### 3. 构建和启动

#### 3.1 构建镜像

```bash
docker-compose build
```

#### 3.2 启动服务

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 查看特定服务的日志
docker-compose logs -f client-api
docker-compose logs -f admin-api
```

#### 3.3 验证部署

```bash
# 检查服务状态
docker-compose ps

# 测试客户端API
curl http://localhost:3000/health

# 测试管理后台API
curl http://localhost:8080/health
```

### 4. 数据库迁移

```bash
# 进入MySQL容器或连接到MySQL服务器
mysql -h your-mysql-host -u your-username -p

# 执行迁移脚本
source production-migrations/01_initial_schema.sql
source production-migrations/02_add_indexes.sql
source production-migrations/03_add_fake_comments.sql
source production-migrations/04_add_comment_like_count.sql
source production-migrations/05_add_comment_likes.sql
```

### 5. 常用命令

```bash
# 停止服务
docker-compose stop

# 启动服务
docker-compose start

# 重启服务
docker-compose restart

# 停止并删除容器
docker-compose down

# 查看日志
docker-compose logs -f

# 进入容器
docker-compose exec client-api sh
docker-compose exec admin-api sh

# 更新代码后重新部署
git pull
docker-compose build
docker-compose up -d
```

---

## 手动部署

### 1. 安装Node.js

```bash
# 使用nvm安装Node.js 18+
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

### 2. 安装依赖

```bash
cd short-drama-api
npm install
```

### 3. 配置环境变量

```bash
cp .env.example .env
nano .env
```

### 4. 编译代码

```bash
npm run build
```

### 5. 数据库迁移

参考Docker部署中的数据库迁移步骤

### 6. 启动服务

#### 使用PM2（推荐）

```bash
# 安装PM2
npm install -g pm2

# 启动客户端API
pm2 start dist/src/main.client.js --name short-drama-client

# 启动管理后台API
pm2 start dist/src/main.admin.js --name short-drama-admin

# 查看状态
pm2 status

# 查看日志
pm2 logs

# 设置开机自启
pm2 startup
pm2 save
```

#### 直接启动

```bash
# 启动客户端API
npm run start:client

# 启动管理后台API
npm run start:admin
```

---

## 环境变量配置

### 必需配置

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `DATABASE_HOST` | MySQL主机地址 | `localhost` |
| `DATABASE_PORT` | MySQL端口 | `3306` |
| `DATABASE_USERNAME` | MySQL用户名 | `root` |
| `DATABASE_PASSWORD` | MySQL密码 | `your-password` |
| `DATABASE_NAME` | 数据库名称 | `short_drama` |
| `REDIS_HOST` | Redis主机地址 | `localhost` |
| `REDIS_PORT` | Redis端口 | `6379` |
| `JWT_SECRET` | JWT密钥 | `your-secret-key` |

### 可选配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `PORT` | 服务端口 | `3000` |
| `REDIS_PASSWORD` | Redis密码 | 空 |
| `REDIS_DB` | Redis数据库编号 | `0` |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot Token | 空 |

---

## Nginx反向代理配置

### 安装Nginx

```bash
sudo apt-get install nginx
```

### 配置文件

创建 `/etc/nginx/sites-available/short-drama`:

```nginx
# 客户端API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# 管理后台API
server {
    listen 80;
    server_name admin.yourdomain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 启用配置

```bash
sudo ln -s /etc/nginx/sites-available/short-drama /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## SSL证书配置（HTTPS）

### 使用Let's Encrypt

```bash
# 安装certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d api.yourdomain.com -d admin.yourdomain.com

# 自动续期
sudo certbot renew --dry-run
```

---

## 常见问题

### 1. 端口被占用

```bash
# 查看占用端口的进程
lsof -ti:3000
lsof -ti:8080

# 杀死进程
kill -9 $(lsof -ti:3000)
```

### 2. 数据库连接失败

- 检查MySQL是否运行
- 检查数据库配置是否正确
- 检查防火墙设置

### 3. Redis连接失败

- 检查Redis是否运行
- 检查Redis配置是否正确
- 检查Redis密码

### 4. Docker容器无法启动

```bash
# 查看详细日志
docker-compose logs

# 重新构建
docker-compose build --no-cache
docker-compose up -d
```

### 5. 内存不足

- 增加服务器内存
- 优化数据库查询
- 启用Redis缓存

---

## 监控和维护

### 查看日志

```bash
# Docker方式
docker-compose logs -f --tail=100

# PM2方式
pm2 logs

# 系统日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 性能监控

```bash
# 使用PM2监控
pm2 monit

# 查看资源使用
docker stats
```

### 备份

```bash
# 备份数据库
mysqldump -h your-host -u your-user -p short_drama > backup.sql

# 备份代码
tar -czf short-drama-backup.tar.gz /path/to/short-drama-api
```

---

## 安全建议

1. ✅ 修改默认的JWT_SECRET
2. ✅ 使用强密码
3. ✅ 启用HTTPS
4. ✅ 配置防火墙
5. ✅ 定期更新系统和依赖
6. ✅ 限制数据库访问权限
7. ✅ 启用日志审计

---

## 支持

如有问题，请查看:
- 项目README.md
- LEGAL_DISCLAIMER.md
- GitHub Issues

---

**注意**: 本系统仅提供技术框架，使用者需确保遵守所在地区的法律法规。
