# 广告投放计划管理系统

## 📋 概述

本模块实现了完整的广告投放计划管理系统，支持多平台广告投放和效果追踪。系统包含平台管理、投放计划管理、事件追踪、转化分析等核心功能。

## 🏗️ 系统架构

```
src/advertising/
├── entity/                 # 数据库实体
│   ├── advertising-platform.entity.ts
│   ├── advertising-campaign.entity.ts
│   ├── advertising-event.entity.ts
│   ├── advertising-conversion.entity.ts
│   ├── advertising-campaign-stats.entity.ts
│   └── index.ts
├── dto/                    # 数据传输对象
│   ├── platform.dto.ts
│   ├── campaign.dto.ts
│   ├── tracking.dto.ts
│   ├── analytics.dto.ts
│   └── index.ts
├── services/               # 业务逻辑服务
│   ├── platform.service.ts
│   ├── campaign.service.ts
│   ├── tracking.service.ts
│   ├── analytics.service.ts
│   └── index.ts
├── controllers/            # 控制器
│   ├── admin-platform.controller.ts
│   ├── admin-campaign.controller.ts
│   ├── admin-analytics.controller.ts
│   ├── tracking.controller.ts
│   └── index.ts
├── utils/                  # 工具函数
│   └── campaign-utils.ts
├── advertising.module.ts   # 模块定义
└── README.md              # 本文档
```

## 🗄️ 数据库设计

### 核心表结构

1. **advertising_platforms** - 广告投放平台表
2. **advertising_campaigns** - 广告投放计划表
3. **advertising_events** - 广告事件追踪表
4. **advertising_conversions** - 广告转化追踪表
5. **advertising_campaign_stats** - 广告统计缓存表

详细的数据库设计请参考 `/migrations/add_advertising_system.sql`

## 🔌 API 接口

### 管理端接口（Admin）

#### 平台管理
- `GET /api/admin/advertising/platforms` - 获取平台列表
- `POST /api/admin/advertising/platforms` - 创建平台
- `PUT /api/admin/advertising/platforms/:id` - 更新平台
- `DELETE /api/admin/advertising/platforms/:id` - 删除平台
- `PUT /api/admin/advertising/platforms/:id/status` - 更新平台状态
- `PUT /api/admin/advertising/platforms/sort` - 更新平台排序

#### 投放计划管理
- `GET /api/admin/advertising/campaigns` - 获取投放计划列表
- `POST /api/admin/advertising/campaigns` - 创建投放计划
- `PUT /api/admin/advertising/campaigns/:id` - 更新投放计划
- `DELETE /api/admin/advertising/campaigns/:id` - 删除投放计划
- `PUT /api/admin/advertising/campaigns/:id/status` - 更新计划状态
- `GET /api/admin/advertising/campaigns/:id/stats` - 获取投放计划统计

#### 数据分析
- `GET /api/admin/advertising/dashboard` - 获取仪表盘概览
- `GET /api/admin/advertising/platform-comparison` - 获取平台对比数据

### 客户端接口（Client）

#### 事件追踪
- `POST /api/tracking/advertising/event` - 记录单个事件
- `POST /api/tracking/advertising/events/batch` - 批量记录事件
- `POST /api/tracking/advertising/conversion` - 记录转化事件

## 🚀 使用示例

### 1. 创建投放计划

```bash
curl -X POST http://localhost:8080/api/admin/advertising/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "name": "抖音推广计划001",
    "description": "针对年轻用户的短剧推广",
    "platform": "tiktok",
    "targetUrl": "https://m.xgshort.com/",
    "budget": 10000.00,
    "targetClicks": 50000,
    "targetConversions": 1000,
    "startDate": "2024-11-15T00:00:00Z",
    "endDate": "2024-12-15T23:59:59Z"
  }'
```

### 2. 记录点击事件

```bash
curl -X POST http://localhost:3000/api/tracking/advertising/event \
  -H "Content-Type: application/json" \
  -d '{
    "campaignCode": "TK_20241115_ABC123",
    "eventType": "click",
    "sessionId": "session_1700000000_abc123",
    "deviceId": "device_1700000000_def456",
    "referrer": "https://www.tiktok.com/",
    "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)"
  }'
```

### 3. 记录转化事件

```bash
curl -X POST http://localhost:3000/api/tracking/advertising/conversion \
  -H "Content-Type: application/json" \
  -d '{
    "campaignCode": "TK_20241115_ABC123",
    "conversionType": "register",
    "userId": 12345,
    "sessionId": "session_1700000000_abc123",
    "deviceId": "device_1700000000_def456"
  }'
```

## 🔧 配置说明

### 环境变量

```bash
# 地理位置服务配置
GEO_IP_API_KEY=your_api_key
GEO_IP_SERVICE_URL=http://ip-api.com/json/

# 统计缓存更新频率（分钟）
STATS_CACHE_UPDATE_INTERVAL=60
```

### 模块集成

系统已自动集成到以下模块：
- **AdminModule** - 管理端功能
- **ClientAppModule** - 客户端追踪功能

## 📊 核心功能

### 1. 平台管理
- 支持多个广告平台（抖音、微信、百度、Google等）
- 平台状态管理和排序
- 平台特有配置支持

### 2. 投放计划管理
- 完整的计划生命周期管理
- 自动生成唯一计划代码
- 预算和目标设置
- 时间范围控制

### 3. 事件追踪
- 支持多种事件类型（点击、浏览、注册、播放等）
- 自动获取地理位置信息
- 批量事件处理
- 高并发优化

### 4. 转化分析
- 转化路径追踪
- 归因模型支持
- 转化耗时计算
- 重复转化防护

### 5. 数据统计
- 实时统计计算
- 缓存机制优化
- 多维度数据分析
- 仪表盘展示

## 🛠️ 工具函数

### CampaignUtils 类

```typescript
// 生成计划代码
const code = CampaignUtils.generateCampaignCode('tiktok');
// 输出: TK_20241115_ABC123

// 获取地理位置
const location = await CampaignUtils.getLocationFromIp('1.2.3.4');

// 计算转化率
const rate = CampaignUtils.calculateConversionRate(100, 5000); // 0.02

// 计算CPC
const cpc = CampaignUtils.calculateCPC(1000, 5000); // 0.2

// 计算CPA
const cpa = CampaignUtils.calculateCPA(1000, 100); // 10
```

## 🚨 注意事项

### 1. 数据安全
- 不记录用户敏感信息
- IP地址脱敏处理
- 定期清理过期数据

### 2. 性能优化
- 事件追踪接口快速响应（<100ms）
- 使用异步处理和消息队列
- 统计数据缓存机制

### 3. 容错处理
- 追踪失败不影响用户正常使用
- 实现重试机制
- 监控和告警机制

### 4. 数据一致性
- 转化事件去重处理
- 统计数据定期校验
- 异常数据清理机制

## 📈 监控指标

### 系统指标
- 事件追踪接口响应时间
- 事件处理队列长度
- 数据库连接池状态
- 缓存命中率

### 业务指标
- 每日事件数量
- 转化率趋势
- 异常事件比例
- 数据延迟情况

## 🔄 部署说明

### 1. 数据库迁移

```bash
# 执行数据库迁移
mysql -u username -p database_name < migrations/add_advertising_system.sql
```

### 2. 启动服务

系统会自动随主应用启动，无需额外配置。

### 3. 验证部署

```bash
# 检查平台列表
curl http://localhost:8080/api/admin/advertising/platforms

# 测试事件追踪
curl -X POST http://localhost:3000/api/tracking/advertising/event \
  -H "Content-Type: application/json" \
  -d '{"campaignCode": "test", "eventType": "click"}'
```

## 🔮 后续优化

1. **队列处理** - 实现Redis/RabbitMQ消息队列处理高并发事件
2. **实时统计** - 基于流处理的实时数据统计
3. **A/B测试** - 支持投放计划A/B测试功能
4. **智能优化** - 基于机器学习的投放优化建议
5. **多语言支持** - 国际化支持

## 📞 技术支持

如有问题或建议，请联系开发团队。
