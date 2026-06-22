# 广告投放系统前端对接API文档

## 📋 项目概述

短剧平台广告投放管理系统，提供完整的广告投放计划管理、事件追踪和数据分析功能。

**后端地址**：
- 管理端API：`http://localhost:9090/api`
- 客户端API：`http://localhost:3000/api`

## 🎯 核心功能模块

### 1. 平台管理
管理多个广告投放平台（抖音、微信、百度、Google等）

### 2. 投放计划管理  
创建和管理广告投放计划，包含预算、目标、时间设置

### 3. 数据分析
提供投放效果分析、平台对比、趋势统计等功能

## 🔌 API接口详情

### 一、平台管理API

#### 1.1 获取平台列表
```http
GET /api/admin/advertising/platforms
```

**查询参数**：
- `enabled` (可选): `true`/`false` - 筛选启用状态

**响应示例**：
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "name": "抖音",
      "code": "tiktok",
      "description": "抖音短视频平台",
      "iconUrl": null,
      "color": "#ff0050",
      "isEnabled": true,
      "sortOrder": 1,
      "config": null,
      "createdAt": "2024-11-15T04:26:25.000Z",
      "updatedAt": "2024-11-15T04:26:25.000Z"
    },
    {
      "id": 2,
      "name": "微信",
      "code": "wechat", 
      "description": "微信生态平台",
      "iconUrl": null,
      "color": "#07c160",
      "isEnabled": true,
      "sortOrder": 2,
      "config": null,
      "createdAt": "2024-11-15T04:26:25.000Z",
      "updatedAt": "2024-11-15T04:26:25.000Z"
    }
  ]
}
```

#### 1.2 创建平台
```http
POST /api/admin/advertising/platforms
```

**请求体**：
```json
{
  "name": "新平台名称",
  "code": "platform_code",
  "description": "平台描述",
  "iconUrl": "https://example.com/icon.png",
  "color": "#1890ff"
}
```

#### 1.3 更新平台
```http
PUT /api/admin/advertising/platforms/:id
```

#### 1.4 更新平台状态
```http
PUT /api/admin/advertising/platforms/:id/status
```

**请求体**：
```json
{
  "isEnabled": true
}
```

#### 1.5 批量更新排序
```http
PUT /api/admin/advertising/platforms/sort
```

**请求体**：
```json
{
  "platforms": [
    { "id": 1, "sortOrder": 1 },
    { "id": 2, "sortOrder": 2 }
  ]
}
```

#### 1.6 删除平台
```http
DELETE /api/admin/advertising/platforms/:id
```

### 二、投放计划管理API

#### 2.1 获取投放计划列表
```http
GET /api/admin/advertising/campaigns
```

**查询参数**：
- `page` (可选): 页码，默认1
- `size` (可选): 每页数量，默认10
- `platform` (可选): 平台代码筛选
- `status` (可选): 状态筛选 (`draft`/`active`/`paused`/`completed`/`cancelled`)
- `keyword` (可选): 关键词搜索

**响应示例**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "抖音推广计划001",
        "description": "针对年轻用户的短剧推广",
        "platformId": 1,
        "platformCode": "tiktok",
        "campaignCode": "TK_20241115_ABC123",
        "targetUrl": "https://m.xgshort.com/",
        "budget": 10000.00,
        "targetClicks": 50000,
        "targetConversions": 1000,
        "startDate": "2024-11-15T00:00:00.000Z",
        "endDate": "2024-12-15T23:59:59.000Z",
        "status": "active",
        "isActive": true,
        "createdBy": "admin",
        "createdAt": "2024-11-15T04:30:00.000Z",
        "updatedAt": "2024-11-15T04:30:00.000Z",
        "platform": {
          "id": 1,
          "name": "抖音",
          "code": "tiktok",
          "color": "#ff0050"
        }
      }
    ],
    "total": 1,
    "page": 1,
    "size": 10,
    "totalPages": 1
  }
}
```

#### 2.2 创建投放计划
```http
POST /api/admin/advertising/campaigns
```

**请求体**：
```json
{
  "name": "抖音推广计划001",
  "description": "针对年轻用户的短剧推广",
  "platform": "tiktok",
  "targetUrl": "https://m.xgshort.com/",
  "budget": 10000.00,
  "targetClicks": 50000,
  "targetConversions": 1000,
  "startDate": "2024-11-15T00:00:00Z",
  "endDate": "2024-12-15T23:59:59Z"
}
```

**字段说明**：
- `name`: 计划名称（必填）
- `description`: 计划描述（可选）
- `platform`: 平台代码（必填）
- `targetUrl`: 目标落地页URL（必填）
- `budget`: 预算金额（可选）
- `targetClicks`: 目标点击量（可选）
- `targetConversions`: 目标转化量（可选）
- `startDate`: 开始时间（必填）
- `endDate`: 结束时间（可选）

#### 2.3 获取单个投放计划
```http
GET /api/admin/advertising/campaigns/:id
```

#### 2.4 更新投放计划
```http
PUT /api/admin/advertising/campaigns/:id
```

#### 2.5 更新计划状态
```http
PUT /api/admin/advertising/campaigns/:id/status
```

**请求体**：
```json
{
  "status": "active"
}
```

**状态枚举**：
- `draft`: 草稿
- `active`: 激活
- `paused`: 暂停
- `completed`: 完成
- `cancelled`: 取消

#### 2.6 删除投放计划
```http
DELETE /api/admin/advertising/campaigns/:id
```

#### 2.7 获取计划统计数据
```http
GET /api/admin/advertising/campaigns/:id/stats
```

**查询参数**：
- `from` (可选): 开始日期 `2024-11-01`
- `to` (可选): 结束日期 `2024-11-30`

**响应示例**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "overview": {
      "totalClicks": 12500,
      "totalViews": 50000,
      "totalConversions": 250,
      "conversionRate": 0.02,
      "cost": 5000.00,
      "cpc": 0.40,
      "cpa": 20.00
    },
    "timeline": [
      {
        "date": "2024-11-15",
        "clicks": 500,
        "views": 2000,
        "conversions": 10
      }
    ]
  }
}
```

### 三、数据分析API

#### 3.1 获取仪表盘数据
```http
GET /api/admin/advertising/dashboard
```

**查询参数**：
- `from` (可选): 开始日期
- `to` (可选): 结束日期

**响应示例**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "totalCampaigns": 15,
    "activeCampaigns": 8,
    "totalSpend": 50000.00,
    "totalClicks": 125000,
    "totalConversions": 2500,
    "avgConversionRate": 0.02,
    "platformStats": [
      {
        "platform": "tiktok",
        "campaigns": 5,
        "clicks": 50000,
        "conversions": 1000,
        "spend": 20000.00
      }
    ],
    "recentEvents": [
      {
        "id": 1,
        "campaignCode": "TK_20241115_ABC123",
        "eventType": "click",
        "eventTime": "2024-11-15T04:30:00.000Z"
      }
    ]
  }
}
```

#### 3.2 获取平台对比数据
```http
GET /api/admin/advertising/platform-comparison
```

**查询参数**：
- `from` (可选): 开始日期
- `to` (可选): 结束日期

**响应示例**：
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "platform": "tiktok",
      "clicks": 50000,
      "conversions": 1000,
      "conversionRate": 0.02,
      "cost": 20000.00,
      "cpc": 0.40,
      "cpa": 20.00
    },
    {
      "platform": "wechat",
      "clicks": 30000,
      "conversions": 900,
      "conversionRate": 0.03,
      "cost": 15000.00,
      "cpc": 0.50,
      "cpa": 16.67
    }
  ]
}
```

## 🎨 前端页面设计建议

### 1. 平台管理页面
**路由**: `/admin/advertising/platforms`

**功能组件**：
- 平台列表卡片/表格
- 新增平台按钮 + 弹窗表单
- 编辑平台功能
- 启用/禁用开关
- 拖拽排序功能

**UI建议**：
```jsx
// 平台卡片示例
<Card>
  <div style={{ backgroundColor: platform.color }}>
    <Icon src={platform.iconUrl} />
  </div>
  <h3>{platform.name}</h3>
  <p>{platform.description}</p>
  <Switch checked={platform.isEnabled} />
  <Button>编辑</Button>
</Card>
```

### 2. 投放计划管理页面
**路由**: `/admin/advertising/campaigns`

**功能组件**：
- 计划列表表格（支持分页、筛选、搜索）
- 新增计划按钮 + 多步骤表单
- 批量操作（启用/暂停/删除）
- 状态标签和进度条
- 快速筛选器（平台、状态）

**表格列建议**：
- 计划名称
- 平台（带颜色标识）
- 计划代码
- 状态
- 预算/花费
- 点击量/目标
- 转化率
- 开始/结束时间
- 操作按钮

### 3. 计划详情页面
**路由**: `/admin/advertising/campaigns/:id`

**功能组件**：
- 计划基本信息卡片
- 关键指标卡片（点击量、转化率、CPC、CPA）
- 趋势图表（时间线数据）
- 编辑计划按钮
- 状态操作按钮

### 4. 数据分析仪表盘
**路由**: `/admin/advertising/dashboard`

**功能组件**：
- 关键指标卡片网格
- 时间范围选择器
- 平台对比图表（柱状图/饼图）
- 趋势折线图
- 实时事件流
- 数据导出功能

## 📊 图表组件建议

### 1. 关键指标卡片
```jsx
<MetricCard
  title="总点击量"
  value={125000}
  change="+12.5%"
  trend="up"
  icon="click"
/>
```

### 2. 趋势图表
```jsx
<LineChart
  data={timelineData}
  xField="date"
  yField="clicks"
  seriesField="type"
/>
```

### 3. 平台对比图表
```jsx
<ColumnChart
  data={platformData}
  xField="platform"
  yField="conversions"
  colorField="platform"
/>
```

## 🔧 前端实现要点

### 1. 状态管理
建议使用状态管理库（Redux/Zustand）管理：
- 平台列表数据
- 投放计划列表和筛选条件
- 用户权限信息
- 全局loading状态

### 2. 表单验证
关键表单字段验证规则：
- 计划名称：必填，1-255字符
- 平台选择：必选
- 目标URL：必填，有效URL格式
- 开始时间：必填，不能早于当前时间
- 预算：可选，大于0的数字

### 3. 权限控制
不同角色的功能权限：
- 管理员：所有功能
- 运营：查看和编辑计划
- 只读：仅查看数据

### 4. 响应式设计
- 移动端适配
- 表格在小屏幕下的处理
- 图表的响应式展示

## 🚀 开发环境

**后端服务**：
- 管理端：`http://localhost:9090`
- 客户端：`http://localhost:3000`

**测试数据**：
- 已预置7个广告平台
- 可使用测试脚本创建示例数据

**API测试**：
```bash
# 在后端项目根目录执行
./test-advertising-api.sh
```

## 📝 开发注意事项

### 1. 错误处理
统一的错误处理机制：
```javascript
// API响应格式
{
  "code": 200,     // 200成功，400客户端错误，500服务器错误
  "message": "success",
  "data": {}
}
```

### 2. 加载状态
- 列表加载骨架屏
- 按钮loading状态
- 图表数据加载提示

### 3. 用户体验
- 操作成功/失败提示
- 确认删除弹窗
- 表单自动保存草稿
- 快捷键支持

### 4. 性能优化
- 列表虚拟滚动（大数据量）
- 图表懒加载
- 接口防抖处理
- 缓存机制

## 📞 技术支持

**后端开发**：所有API已实现并测试通过  
**接口文档**：本文档  
**测试环境**：已部署并可用  

如有问题请随时沟通！🚀
