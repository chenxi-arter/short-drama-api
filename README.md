# 短剧API项目

基于 NestJS 框架开发的短剧视频平台后端API服务，提供用户认证、视频管理、评论系统、观看进度等完整功能。

## 项目特性

- 🔐 **用户认证系统** - 支持Telegram登录、JWT认证、Refresh Token机制
- 📺 **视频管理** - 系列剧集、短视频、分类标签管理
- 💬 **评论系统** - 支持普通评论和弹幕评论
- 📊 **观看进度** - 记录用户观看进度，支持断点续播
- 🏷️ **标签系统** - 灵活的内容标签分类
- 🔄 **缓存支持** - Redis缓存提升性能，支持用户名密码认证
- 🛡️ **安全防护** - 请求限流、JWT认证、防爬虫机制
- 📱 **设备管理** - 多设备登录管理和安全监控
- 🔍 **智能搜索** - 精确匹配优先的模糊搜索功能

## 技术栈

- **框架**: NestJS + TypeScript
- **数据库**: MySQL 8.0+
- **缓存**: Redis 6.0+ (支持ACL认证)
- **认证**: JWT + Passport
- **ORM**: TypeORM
- **验证**: class-validator
- **文档**: 内置API文档

## 📋 最新更新 (v2.1 - 2025年9月13日)

### 🎯 播放地址接口优化
- 播放地址数据直接返回在 `data` 字段中，前端无需访问 `data.data`
- 统一返回格式，包含完整的剧集和系列信息

### 🔍 搜索功能改进
- 修复搜索 "test1" 时返回 "test1999" 的问题
- 实现精确匹配优先的搜索算法
- 完全匹配 > 前缀匹配 > 包含匹配的优先级排序

### 🔐 Redis认证支持
- 支持Redis 6.0+的用户名密码认证
- 支持多种环境变量命名方式
- 向后兼容，无认证信息时自动降级

### 📚 详细更新日志
查看 [API变更文档](docs/api-changes-documentation.md) 了解完整的更新内容。

## ⚙️ 环境配置

### 快速配置
1. 复制环境变量模板：`cp .env.example .env`
2. 编辑 `.env` 文件，填入数据库、Redis等配置
3. 参考 [快速配置指南](docs/quick-setup-guide.md) 了解必需配置项

### 详细配置
- [完整环境配置指南](docs/environment-configuration.md) - 详细的环境变量说明
- [快速配置指南](docs/quick-setup-guide.md) - 快速上手指南

## 系统要求

- Node.js >= 18.0.0
- MySQL >= 8.0
- Redis >= 6.0 (可选)
- npm 或 yarn

## 快速开始

### 1. 一键部署（推荐）

```bash
# 克隆项目
git clone <repository-url>
cd short-drama-api

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入数据库等配置信息

# 一键部署
./deploy.sh
```

### 2. 手动部署

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 初始化数据库
mysql -h host -u user -p database < migrations/complete-setup.sql

# 构建项目
npm run build

# 启动服务
npm run start:prod
```

### 3. 开发模式

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env

# 开发模式启动（拆分端口推荐）
ADMIN_PORT=8080 npm run start:admin
CLIENT_PORT=3000 npm run start:client

# 健康检查（可选）
curl -s http://localhost:8080/api/health | jq .
curl -s http://localhost:3000/api/health | jq .

# 一键验证 Ingest 接口（使用内置示例数据）
node scripts/test-ingest-api.js
# 或指定目标地址
API_BASE=http://localhost:8080/api/admin/ingest node scripts/test-ingest-api.js
```

## 环境配置

创建 `.env` 文件并配置以下参数：

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
JWT_REFRESH_SECRET=your_refresh_jwt_secret_key_here

# Redis配置（可选）
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# 应用配置（端口拆分）
CLIENT_PORT=3000
ADMIN_PORT=8080
NODE_ENV=development
APP_SECRET=your_app_secret_for_access_key
```

提示：未配置 MySQL 时，可使用内置 SQLite 内存模式进行本地联调（设置 `DB_TYPE=sqlite` 或不填 `DB_USER/DB_NAME`）。

## 数据库初始化

项目提供完整的数据库初始化脚本：

```bash
# 使用完整初始化脚本（包含测试数据）
mysql -h host -u user -p database < migrations/complete-setup.sql

# 或分步执行
mysql -h host -u user -p database < migrations/init-database.sql
mysql -h host -u user -p database < migrations/create-refresh-tokens-table.sql
mysql -h host -u user -p database < migrations/insert-test-data.sql
```

## API接口

### 主要模块

- **用户认证** (`/api/user`) - Telegram登录、用户信息
- **认证管理** (`/api/user`) - Token刷新、登出、设备管理
- **视频模块** (`/api/video`) - 视频列表、详情、进度、评论
- **首页模块** (`/api/home`) - 推荐内容、分类浏览
- **列表模块** (`/api/list`) - 筛选标签、分类数据

### 认证方式

```bash
# 1. Telegram登录获取Token
POST /api/user/telegram-login

# 2. 使用Token访问API
Authorization: Bearer <your_jwt_token>

# 3. Token过期时刷新
POST /api/user/refresh
```

### 📚 完整文档

详细的技术文档和使用指南请查看：
- 📖 [文档中心](./docs/README.md) - 完整的项目文档索引
- 🚀 [快速开始](./docs/development-guide.md) - 开发环境搭建指南
- 📋 [API接口文档](./docs/api-summary-documentation.md) - 详细的接口说明
- 🛠️ [部署指南](./docs/deployment-guide.md) - 生产环境部署方案
- 🧪 [测试指南](./docs/api-testing-guide.md) - API测试和验证方法

## 项目脚本

```bash
# 开发
npm run start:dev      # 开发模式（热重载）
npm run start:debug    # 调试模式

# 构建
npm run build          # 构建项目
npm run start:prod     # 生产模式

# 代码质量
npm run lint           # 代码检查
npm run format         # 代码格式化

# 测试
npm run test           # 单元测试
npm run test:e2e       # 端到端测试
npm run test:cov       # 测试覆盖率
```

## 生产部署

### 使用PM2部署

```bash
# 安装PM2
npm install -g pm2

# 使用项目配置启动
pm2 start ecosystem.config.js

# 保存PM2配置
pm2 save

# 设置开机自启
pm2 startup
```

### 使用Docker部署

```bash
# 构建镜像
docker build -t short-drama-api .

# 使用docker-compose
docker-compose up -d
```

### 部署脚本选项

```bash
./deploy.sh --help          # 查看帮助
./deploy.sh --check-only    # 仅检查环境
./deploy.sh --skip-db       # 跳过数据库初始化
./deploy.sh --dev           # 开发模式部署
```

## 项目结构

```
src/
├── auth/                 # 认证模块
│   ├── dto/             # 数据传输对象
│   ├── entity/          # 实体类
│   ├── guards/          # 守卫
│   ├── strategies/      # 认证策略
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── user/                # 用户模块
├── video/               # 视频模块
├── cache/               # 缓存模块
├── common/              # 公共模块
└── main.ts              # 应用入口

migrations/              # 数据库迁移
├── complete-setup.sql   # 完整初始化脚本
├── init-database.sql    # 基础表结构
├── create-refresh-tokens-table.sql
└── insert-test-data.sql # 测试数据

docs/                    # 项目文档
├── api-test-examples.md
├── token-expiration-guide.md
└── redis-cache-guide.md
```

## 功能特性

### 🔐 认证系统
- Telegram OAuth登录
- JWT访问令牌
- Refresh Token机制
- 多设备登录管理
- IP地址安全监控

### 📺 内容管理
- 系列剧集管理
- 短视频内容
- 分类标签系统
- 内容推荐算法
- 观看进度记录

### 💬 互动功能
- 评论系统
- 弹幕功能
- 点赞统计
- 用户活跃度分析

### 🛡️ 安全防护
- 请求频率限制
- 反爬虫机制
- JWT安全验证
- 设备异常检测

## 文档资源

- 📖 [完整部署指南](DEPLOYMENT.md)
- 🔧 [API接口文档](migrations/API文档.md)
- 🔄 [缓存使用指南](docs/redis-cache-guide.md)
- 🔑 [Token机制说明](docs/token-expiration-guide.md)
- 📝 [API测试示例](docs/api-test-examples.md)

## 故障排除

### 常见问题

1. **数据库连接失败**
   ```bash
   # 检查数据库服务
   systemctl status mysql
   # 测试连接
   mysql -h host -u user -p
   ```

2. **端口占用**
   ```bash
   # 查看端口占用
   lsof -i :8080
   # 修改端口
   echo "PORT=8081" >> .env
   ```

3. **JWT认证失败**
   ```bash
   # 检查JWT密钥配置
   grep JWT_SECRET .env
   ```

### 日志查看

```bash
# PM2日志
pm2 logs

# 应用日志
tail -f logs/application.log

# 数据库日志
sudo tail -f /var/log/mysql/error.log
```

## 维护和监控

### 定期维护

```bash
# 清理过期Token
mysql -e "DELETE FROM refresh_tokens WHERE expires_at < NOW();"

# 数据库备份
mysqldump -h host -u user -p database > backup.sql

# 日志轮转
logrotate /etc/logrotate.d/short-drama-api
```

### 性能监控

- 应用响应时间
- 数据库连接数
- Redis缓存命中率
- 内存使用情况
- 错误率统计

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 联系方式

如有问题或建议，请通过以下方式联系：

- 📧 Email: your-email@example.com
- 💬 Issues: [GitHub Issues](https://github.com/your-repo/issues)
- 📚 文档: [项目文档](docs/)
