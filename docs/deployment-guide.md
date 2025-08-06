# 🚀 短剧API部署指南

## 📋 概述

本指南提供短剧API项目的完整部署方案，包括开发环境、测试环境和生产环境的部署步骤。

## 🛠️ 系统要求

### 最低配置
- **操作系统**: Linux (Ubuntu 20.04+) / macOS / Windows
- **Node.js**: >= 18.0.0
- **MySQL**: >= 8.0
- **Redis**: >= 6.0 (可选，用于缓存)
- **内存**: >= 2GB
- **存储**: >= 10GB

### 推荐配置
- **CPU**: 2核心以上
- **内存**: >= 4GB
- **存储**: >= 20GB SSD
- **网络**: 稳定的互联网连接

## 🚀 快速部署

### 方式一：一键部署脚本（推荐）

```bash
# 1. 克隆项目
git clone <repository-url>
cd short-drama-api

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入数据库等配置信息

# 3. 执行一键部署
chmod +x deploy.sh
./deploy.sh
```

### 方式二：手动部署

#### 1. 环境准备

**安装 Node.js**
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# macOS
brew install node@18
```

**安装 MySQL**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation

# CentOS/RHEL
sudo yum install mysql-server
sudo systemctl start mysqld
sudo mysql_secure_installation

# macOS
brew install mysql
brew services start mysql
```

**安装 Redis（可选）**
```bash
# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis

# CentOS/RHEL
sudo yum install redis
sudo systemctl start redis

# macOS
brew install redis
brew services start redis
```

#### 2. 项目配置

**克隆项目**
```bash
git clone <repository-url>
cd short-drama-api
```

**安装依赖**
```bash
npm install
# 或使用 yarn
yarn install
```

**环境配置**
```bash
cp .env.example .env
```

编辑 `.env` 文件：
```env
# 应用配置
PORT=3000
NODE_ENV=production

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASS=your_password
DB_NAME=short_drama

# JWT配置
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# Redis配置（可选）
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TTL=300

# 限流配置
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# CORS配置
CORS_ORIGIN=*
```

#### 3. 数据库初始化

**创建数据库**
```sql
CREATE DATABASE short_drama CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'your_username'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON short_drama.* TO 'your_username'@'localhost';
FLUSH PRIVILEGES;
```

**运行迁移**
```bash
# 如果有完整的SQL文件
mysql -h localhost -u your_username -p short_drama < migrations/complete-setup.sql

# 或者使用TypeORM迁移（如果配置了）
npm run migration:run
```

#### 4. 构建和启动

**构建项目**
```bash
npm run build
```

**启动服务**
```bash
# 生产模式
npm run start:prod

# 开发模式
npm run start:dev
```

## 🐳 Docker 部署

### 使用 Docker Compose（推荐）

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
      - DB_HOST=mysql
      - REDIS_HOST=redis
    depends_on:
      - mysql
      - redis
    volumes:
      - ./logs:/app/logs

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: short_drama
      MYSQL_USER: apiuser
      MYSQL_PASSWORD: apipassword
    volumes:
      - mysql_data:/var/lib/mysql
      - ./migrations:/docker-entrypoint-initdb.d
    ports:
      - "3306:3306"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  mysql_data:
  redis_data:
```

**启动服务**
```bash
docker-compose up -d
```

### 单独使用 Docker

**构建镜像**
```bash
docker build -t short-drama-api .
```

**运行容器**
```bash
docker run -d \
  --name short-drama-api \
  -p 3000:3000 \
  -e DB_HOST=your_db_host \
  -e DB_USER=your_db_user \
  -e DB_PASS=your_db_pass \
  short-drama-api
```

## 🔧 生产环境配置

### 1. 进程管理（PM2）

**安装 PM2**
```bash
npm install -g pm2
```

**创建 PM2 配置文件** `ecosystem.config.js`：
```javascript
module.exports = {
  apps: [{
    name: 'short-drama-api',
    script: 'dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G'
  }]
};
```

**启动应用**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 2. 反向代理（Nginx）

**安装 Nginx**
```bash
# Ubuntu/Debian
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

**配置 Nginx** `/etc/nginx/sites-available/short-drama-api`：
```nginx
server {
    listen 80;
    server_name your-domain.com;

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

    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**启用配置**
```bash
sudo ln -s /etc/nginx/sites-available/short-drama-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. SSL 证书（Let's Encrypt）

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加：0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 监控和日志

### 1. 应用监控

**PM2 监控**
```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs

# 监控面板
pm2 monit
```

### 2. 系统监控

**安装监控工具**
```bash
# htop - 进程监控
sudo apt install htop

# iotop - IO监控
sudo apt install iotop

# netstat - 网络监控
sudo apt install net-tools
```

### 3. 日志管理

**日志轮转配置** `/etc/logrotate.d/short-drama-api`：
```
/path/to/your/app/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reload short-drama-api
    endscript
}
```

## 🔒 安全配置

### 1. 防火墙配置

```bash
# UFW (Ubuntu)
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# firewalld (CentOS)
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 2. 数据库安全

```sql
-- 删除匿名用户
DELETE FROM mysql.user WHERE User='';

-- 删除测试数据库
DROP DATABASE IF EXISTS test;

-- 禁用远程root登录
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');

-- 刷新权限
FLUSH PRIVILEGES;
```

## 🚨 故障排除

### 常见问题

**1. 端口被占用**
```bash
# 查看端口占用
sudo netstat -tlnp | grep :3000
# 或
sudo lsof -i :3000

# 杀死进程
sudo kill -9 <PID>
```

**2. 数据库连接失败**
```bash
# 检查MySQL状态
sudo systemctl status mysql

# 测试连接
mysql -h localhost -u username -p
```

**3. Redis连接失败**
```bash
# 检查Redis状态
sudo systemctl status redis

# 测试连接
redis-cli ping
```

**4. 权限问题**
```bash
# 修复文件权限
sudo chown -R $USER:$USER /path/to/your/app
sudo chmod -R 755 /path/to/your/app
```

### 日志查看

```bash
# 应用日志
pm2 logs short-drama-api

# 系统日志
sudo journalctl -u nginx
sudo journalctl -u mysql

# 错误日志
tail -f /var/log/nginx/error.log
tail -f /var/log/mysql/error.log
```

## 📈 性能优化

### 1. 数据库优化

```sql
-- 添加索引
CREATE INDEX idx_series_category ON series(category_id);
CREATE INDEX idx_episodes_series ON episodes(series_id);
CREATE INDEX idx_users_username ON users(username);

-- 优化查询缓存
SET GLOBAL query_cache_size = 268435456;
SET GLOBAL query_cache_type = ON;
```

### 2. Redis 缓存

```bash
# Redis 配置优化
echo 'maxmemory 256mb' >> /etc/redis/redis.conf
echo 'maxmemory-policy allkeys-lru' >> /etc/redis/redis.conf
sudo systemctl restart redis
```

### 3. Node.js 优化

```bash
# 增加内存限制
node --max-old-space-size=4096 dist/main.js

# 启用集群模式
pm2 start ecosystem.config.js
```

## 📝 维护清单

### 日常维护
- [ ] 检查应用状态 (`pm2 status`)
- [ ] 查看错误日志
- [ ] 监控系统资源使用
- [ ] 检查数据库连接
- [ ] 验证API接口响应

### 周期维护
- [ ] 更新系统包 (`sudo apt update && sudo apt upgrade`)
- [ ] 清理日志文件
- [ ] 备份数据库
- [ ] 检查SSL证书有效期
- [ ] 性能监控和优化

### 安全维护
- [ ] 更新依赖包 (`npm audit fix`)
- [ ] 检查安全漏洞
- [ ] 审查访问日志
- [ ] 更新密码和密钥
- [ ] 防火墙规则检查

---

## 📞 技术支持

如果在部署过程中遇到问题，请：

1. 查看相关日志文件
2. 检查配置文件是否正确
3. 确认系统要求是否满足
4. 参考故障排除章节

更多技术文档请参考：
- [API接口文档](./api-summary-documentation.md)
- [数据库设计文档](./database-schema-documentation.md)
- [Redis缓存指南](./redis-cache-guide.md)
- [健壮性实现指南](./robustness-implementation-guide.md)