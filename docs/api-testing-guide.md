# 🧪 API测试指南

## 📋 概述

本指南提供短剧API项目的完整测试方案，包括接口测试、性能测试和安全测试的详细步骤和示例。

## 🛠️ 测试工具

### 推荐工具
- **Postman** - 图形化API测试工具
- **curl** - 命令行HTTP客户端
- **Apifox** - 国产API测试工具
- **Jest** - 单元测试和集成测试
- **Artillery** - 性能测试工具

## 🚀 快速开始

### 1. 环境准备

确保API服务已启动：
```bash
# 开发环境
npm run start:dev

# 生产环境
npm run start:prod
```

默认服务地址：`http://localhost:3000`

### 2. 基础健康检查

```bash
# 检查服务状态
curl http://localhost:3000/health

# 预期响应
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    },
    "redis": {
      "status": "up"
    }
  }
}
```

## 🔐 认证测试

### 1. 获取访问令牌

**注意**: 当前系统使用Telegram登录，需要先通过Telegram Bot获取用户信息。

```bash
# 模拟Telegram登录（需要实际的Telegram用户数据）
curl -X POST http://localhost:3000/user/telegram-login \
  -H "Content-Type: application/json" \
  -d '{
    "id": 123456789,
    "first_name": "Test",
    "last_name": "User",
    "username": "testuser",
    "auth_date": 1640995200,
    "hash": "telegram_hash_here"
  }'
```

**响应示例**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "refresh_token_string_here",
  "user": {
    "id": 123456789,
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "username": "testuser",
    "first_name": "Test",
    "last_name": "User"
  }
}
```

### 2. 令牌刷新测试

```bash
# 刷新访问令牌
curl -X POST http://localhost:3000/user/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "your_refresh_token_here"
  }'
```

### 3. 令牌验证测试

```bash
# 验证刷新令牌
curl -X POST http://localhost:3000/user/verify-refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "your_refresh_token_here"
  }'
```

## 📺 视频接口测试

### 1. 获取视频列表

```bash
# 获取首页视频列表
curl -X GET "http://localhost:3000/home/getvideos?catid=1&page=1" \
  -H "Authorization: Bearer your_access_token_here"
```

**响应结构**:
```json
{
  "data": {
    "list": [
      {
        "type": 0,
        "name": "轮播图",
        "filters": null,
        "banners": [
          {
            "showURL": "https://example.com/banner.jpg",
            "title": "视频标题",
            "id": 1001,
            "channeID": 1,
            "url": "1001"
          }
        ],
        "list": []
      },
      {
        "type": 1001,
        "name": "搜索",
        "filters": [...],
        "list": [...]
      }
    ]
  }
}
```

### 2. 获取视频详情

```bash
# 通过ID获取视频详情
curl -X GET "http://localhost:3000/video/details/1001" \
  -H "Authorization: Bearer your_access_token_here"

# 通过UUID获取视频详情（推荐）
curl -X GET "http://localhost:3000/video/details/uuid/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer your_access_token_here"
```

### 3. 获取播放地址

```bash
# 获取剧集播放URL
curl -X GET "http://localhost:3000/video/episode-url/1001?access_key=your_access_key" \
  -H "Authorization: Bearer your_access_token_here"
```

### 4. 更新观看进度

```bash
# 更新观看进度
curl -X POST http://localhost:3000/video/watch-progress \
  -H "Authorization: Bearer your_access_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "episode_id": 1001,
    "progress_seconds": 120,
    "total_seconds": 1800
  }'
```

## 🏷️ 分类和筛选测试

### 1. 获取分类列表

```bash
# 获取所有分类
curl -X GET http://localhost:3000/categories \
  -H "Authorization: Bearer your_access_token_here"
```

### 2. 获取筛选选项

```bash
# 获取筛选数据
curl -X GET http://localhost:3000/filter/data \
  -H "Authorization: Bearer your_access_token_here"
```

### 3. 筛选搜索

```bash
# 按条件筛选视频
curl -X GET "http://localhost:3000/video/filter?type=1&region=2&year=2024&page=1&limit=20" \
  -H "Authorization: Bearer your_access_token_here"
```

## 💬 评论系统测试

### 1. 发表评论

```bash
# 发表普通评论
curl -X POST http://localhost:3000/comments \
  -H "Authorization: Bearer your_access_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "episode_id": 1001,
    "content": "这部剧很好看！",
    "comment_type": "normal"
  }'

# 发表弹幕评论
curl -X POST http://localhost:3000/comments \
  -H "Authorization: Bearer your_access_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "episode_id": 1001,
    "content": "精彩！",
    "comment_type": "danmaku",
    "timestamp_seconds": 120
  }'
```

### 2. 获取评论列表

```bash
# 获取剧集评论
curl -X GET "http://localhost:3000/comments/episode/1001?page=1&limit=20" \
  -H "Authorization: Bearer your_access_token_here"
```

## 🎯 轮播图测试

### 1. 获取轮播图

```bash
# 获取活跃轮播图
curl -X GET http://localhost:3000/banners \
  -H "Authorization: Bearer your_access_token_here"
```

## 📊 性能测试

### 1. 使用Artillery进行负载测试

**安装Artillery**:
```bash
npm install -g artillery
```

**创建测试配置** `load-test.yml`:
```yaml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 20
  defaults:
    headers:
      Authorization: 'Bearer your_access_token_here'

scenarios:
  - name: "API Load Test"
    flow:
      - get:
          url: "/health"
      - get:
          url: "/home/getvideos?catid=1&page=1"
      - get:
          url: "/categories"
      - get:
          url: "/filter/data"
```

**运行测试**:
```bash
artillery run load-test.yml
```

### 2. 并发测试脚本

```bash
#!/bin/bash
# concurrent-test.sh

API_BASE="http://localhost:3000"
TOKEN="your_access_token_here"
CONCURRENT_USERS=50

for i in $(seq 1 $CONCURRENT_USERS); do
  {
    curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/home/getvideos?catid=1&page=1" > /dev/null
    echo "User $i completed"
  } &
done

wait
echo "All $CONCURRENT_USERS concurrent requests completed"
```

## 🔒 安全测试

### 1. 认证安全测试

```bash
# 测试无效令牌
curl -X GET http://localhost:3000/video/details/1001 \
  -H "Authorization: Bearer invalid_token"

# 测试过期令牌
curl -X GET http://localhost:3000/video/details/1001 \
  -H "Authorization: Bearer expired_token"

# 测试无认证访问
curl -X GET http://localhost:3000/video/details/1001
```

### 2. 输入验证测试

```bash
# 测试SQL注入
curl -X GET "http://localhost:3000/video/details/1'; DROP TABLE users; --" \
  -H "Authorization: Bearer your_access_token_here"

# 测试XSS
curl -X POST http://localhost:3000/comments \
  -H "Authorization: Bearer your_access_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "episode_id": 1001,
    "content": "<script>alert('xss')</script>",
    "comment_type": "normal"
  }'
```

### 3. 限流测试

```bash
#!/bin/bash
# rate-limit-test.sh

API_BASE="http://localhost:3000"
TOKEN="your_access_token_here"

# 快速发送多个请求测试限流
for i in $(seq 1 200); do
  curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/health"
  echo "Request $i sent"
done
```

## 🧪 自动化测试

### 1. Jest集成测试

**创建测试文件** `test/api.e2e-spec.ts`:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('API Integration Tests', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/health (GET)', () => {
    it('should return health status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
        });
    });
  });

  describe('/home/getvideos (GET)', () => {
    it('should return video list', () => {
      return request(app.getHttpServer())
        .get('/home/getvideos?catid=1&page=1')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
          expect(res.body.data.list).toBeInstanceOf(Array);
        });
    });
  });
});
```

**运行测试**:
```bash
npm run test:e2e
```

### 2. Postman集合

**导出Postman集合**:
1. 在Postman中创建新集合
2. 添加所有API请求
3. 设置环境变量（base_url, access_token等）
4. 导出为JSON文件

**使用Newman运行**:
```bash
# 安装Newman
npm install -g newman

# 运行Postman集合
newman run api-collection.json -e environment.json
```

## 📈 监控和报告

### 1. 测试报告生成

```bash
# Jest测试报告
npm run test:cov

# Artillery报告
artillery run --output report.json load-test.yml
artillery report report.json
```

### 2. 性能监控

```bash
# 监控API响应时间
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/health
```

**curl-format.txt**:
```
     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n
```

## 🐛 常见问题排查

### 1. 认证失败

**问题**: 401 Unauthorized
**解决**:
- 检查令牌是否有效
- 确认令牌格式正确
- 验证令牌是否过期

### 2. 数据库连接错误

**问题**: 500 Internal Server Error
**解决**:
- 检查数据库服务状态
- 验证连接配置
- 查看应用日志

### 3. 限流触发

**问题**: 429 Too Many Requests
**解决**:
- 降低请求频率
- 检查限流配置
- 等待限流窗口重置

## 📝 测试清单

### 功能测试
- [ ] 用户认证流程
- [ ] 视频列表获取
- [ ] 视频详情查看
- [ ] 播放地址获取
- [ ] 观看进度更新
- [ ] 评论发表和查看
- [ ] 分类和筛选
- [ ] 轮播图显示

### 性能测试
- [ ] 响应时间测试
- [ ] 并发用户测试
- [ ] 负载压力测试
- [ ] 内存使用监控
- [ ] 数据库性能测试

### 安全测试
- [ ] 认证绕过测试
- [ ] 输入验证测试
- [ ] SQL注入测试
- [ ] XSS攻击测试
- [ ] 限流机制测试

### 兼容性测试
- [ ] 不同浏览器测试
- [ ] 移动设备测试
- [ ] API版本兼容性
- [ ] 数据格式兼容性

---

## 📞 技术支持

测试过程中如遇问题，请参考：
- [API接口文档](./api-summary-documentation.md)
- [部署指南](./deployment-guide.md)
- [健壮性实现指南](./robustness-implementation-guide.md)
- [数据库设计文档](./database-schema-documentation.md)