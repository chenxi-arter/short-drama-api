# Dashboard 轮播图统计接口文档

## 📋 问题描述

前端Dashboard页面的"轮播统计（24h/累计）"区域显示数据为0：
- 总曝光: 0
- 总点击: 0
- 平均点击率: 0%

## 🔌 相关API接口

### 1. Dashboard概览接口 ⭐

**接口**: `GET /api/admin/dashboard/overview`

**用途**: 获取Dashboard首页的概览数据，包括轮播图统计

**请求参数**:
```typescript
{
  from?: string;  // 开始日期 YYYY-MM-DD (可选)
  to?: string;    // 结束日期 YYYY-MM-DD (可选)
}
```

**前端调用代码**:
```typescript
// 位置: /src/pages/DashboardPage.tsx 第45行
const ov = await DashboardAPI.overview();
setOverview(ov);
```

**预期返回格式**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "users": {
      "total": 1250,
      "new24h": 45,
      "activeLogins": 320
    },
    "series": {
      "total": 156
    },
    "episodes": {
      "total": 3420
    },
    "banners": {
      "total": 8,
      "totalImpressions": 125430,    // ⭐ 总曝光数
      "totalClicks": 8765            // ⭐ 总点击数
    },
    "comments": {
      "total": 5680,
      "new24h": 234
    },
    "plays": {
      "totalPlayCount": 456789,
      "last24hVisits": 12345
    }
  }
}
```

**关键字段说明**:
```typescript
{
  banners: {
    total: number;              // 轮播图总数
    totalImpressions: number;   // 总曝光数（累计）⭐
    totalClicks: number;        // 总点击数（累计）⭐
  }
}
```

**前端显示逻辑**:
```typescript
// 位置: /src/pages/DashboardPage.tsx 第222-249行

// 总曝光
<Statistic 
  title="总曝光" 
  value={overview?.banners.totalImpressions ?? 0}
  prefix={<EyeOutlined />}
/>

// 总点击
<Statistic 
  title="总点击" 
  value={overview?.banners.totalClicks ?? 0}
  prefix={<PictureOutlined />}
/>

// 平均点击率
<Statistic 
  title="平均点击率" 
  value={
    overview?.banners.totalImpressions 
      ? ((overview?.banners.totalClicks || 0) / overview.banners.totalImpressions * 100).toFixed(2)
      : 0
  }
  suffix="%"
/>
```

---

### 2. 轮播图列表接口

**接口**: `GET /api/admin/banners`

**用途**: 获取轮播图列表（用于获取第一个轮播图ID）

**请求参数**:
```typescript
{
  page: number;   // 页码
  size: number;   // 每页数量
}
```

**前端调用**:
```typescript
// 位置: /src/pages/DashboardPage.tsx 第49行
const bl = await BannersAPI.list(1, 1);  // 获取第一条轮播图
const firstBanner = bl?.items?.[0];
```

---

### 3. 轮播图统计接口

**接口**: `GET /api/admin/banners/:id/stats`

**用途**: 获取单个轮播图的时间序列统计数据

**请求参数**:
```typescript
{
  from: string;   // 开始日期 YYYY-MM-DD
  to: string;     // 结束日期 YYYY-MM-DD
}
```

**前端调用**:
```typescript
// 位置: /src/pages/DashboardPage.tsx 第61行
if (firstBanner?.id != null) {
  const stats = await BannersAPI.stats(firstBanner.id, { from, to });
  // 用于绘制趋势图
}
```

**预期返回格式**:
```json
[
  {
    "date": "2025-11-10",
    "impressions": 8500,
    "clicks": 595
  },
  {
    "date": "2025-11-11",
    "impressions": 9200,
    "clicks": 644
  },
  {
    "date": "2025-11-12",
    "impressions": 8800,
    "clicks": 616
  }
]
```

---

## 🐛 问题诊断

### 当前状态
- ✅ 接口路径正确: `/api/admin/dashboard/overview`
- ❌ 返回数据中 `banners.totalImpressions` 和 `banners.totalClicks` 为 0

### 可能的原因

#### 1. 后端未统计轮播图数据
后端可能只返回了 `banners.total`，但没有计算 `totalImpressions` 和 `totalClicks`。

#### 2. 数据库中没有轮播图点击记录
如果 `banner_stats` 或 `banner_clicks` 表为空，统计结果就是0。

#### 3. 统计逻辑有误
后端可能没有正确聚合轮播图的曝光和点击数据。

---

## 🔧 后端实现建议

### 数据库表结构

#### 轮播图表 (banners)
```sql
CREATE TABLE banners (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255),
  image_url VARCHAR(500),
  link_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 轮播图统计表 (banner_stats)
```sql
CREATE TABLE banner_stats (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  banner_id INT NOT NULL,
  event_type ENUM('impression', 'click') NOT NULL,
  user_id INT,
  session_id VARCHAR(100),
  device_id VARCHAR(100),
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_banner_event (banner_id, event_type),
  INDEX idx_created_at (created_at)
);
```

### 统计SQL示例

```sql
-- 获取所有轮播图的总曝光和总点击
SELECT 
  COUNT(DISTINCT CASE WHEN event_type = 'impression' THEN id END) as totalImpressions,
  COUNT(DISTINCT CASE WHEN event_type = 'click' THEN id END) as totalClicks
FROM banner_stats;

-- 或者按banner_id分组后汇总
SELECT 
  SUM(impressions) as totalImpressions,
  SUM(clicks) as totalClicks
FROM (
  SELECT 
    banner_id,
    COUNT(CASE WHEN event_type = 'impression' THEN 1 END) as impressions,
    COUNT(CASE WHEN event_type = 'click' THEN 1 END) as clicks
  FROM banner_stats
  GROUP BY banner_id
) as banner_totals;
```

### 后端代码示例 (Node.js)

```javascript
// GET /api/admin/dashboard/overview
async function getDashboardOverview(req, res) {
  try {
    // 获取轮播图总数
    const totalBanners = await db.query(
      'SELECT COUNT(*) as total FROM banners WHERE is_active = true'
    );

    // 获取总曝光和总点击
    const bannerStats = await db.query(`
      SELECT 
        COUNT(CASE WHEN event_type = 'impression' THEN 1 END) as totalImpressions,
        COUNT(CASE WHEN event_type = 'click' THEN 1 END) as totalClicks
      FROM banner_stats
    `);

    const overview = {
      users: { /* ... */ },
      series: { /* ... */ },
      episodes: { /* ... */ },
      banners: {
        total: totalBanners[0].total,
        totalImpressions: bannerStats[0].totalImpressions || 0,
        totalClicks: bannerStats[0].totalClicks || 0
      },
      comments: { /* ... */ },
      plays: { /* ... */ }
    };

    res.json({
      code: 200,
      message: 'success',
      data: overview
    });
  } catch (error) {
    console.error('获取概览数据失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message
    });
  }
}
```

---

## 🧪 快速测试方案

### 方案1: 插入测试数据（推荐）

```sql
-- 假设已有轮播图ID为1
-- 插入曝光记录
INSERT INTO banner_stats (banner_id, event_type, created_at) VALUES
(1, 'impression', NOW() - INTERVAL 1 DAY),
(1, 'impression', NOW() - INTERVAL 1 DAY),
(1, 'impression', NOW() - INTERVAL 2 DAY),
(1, 'impression', NOW() - INTERVAL 2 DAY),
(1, 'impression', NOW() - INTERVAL 3 DAY);

-- 插入点击记录
INSERT INTO banner_stats (banner_id, event_type, created_at) VALUES
(1, 'click', NOW() - INTERVAL 1 DAY),
(1, 'click', NOW() - INTERVAL 2 DAY),
(1, 'click', NOW() - INTERVAL 3 DAY);

-- 验证数据
SELECT 
  COUNT(CASE WHEN event_type = 'impression' THEN 1 END) as impressions,
  COUNT(CASE WHEN event_type = 'click' THEN 1 END) as clicks
FROM banner_stats;
```

### 方案2: 直接测试接口

```bash
# 测试概览接口
curl http://localhost:9090/api/admin/dashboard/overview

# 期望返回
{
  "code": 200,
  "data": {
    "banners": {
      "total": 8,
      "totalImpressions": 5,
      "totalClicks": 3
    }
  }
}
```

---

## ✅ 验证清单

更新后端代码后，请验证：

- [ ] `/api/admin/dashboard/overview` 返回 `banners.totalImpressions`
- [ ] `/api/admin/dashboard/overview` 返回 `banners.totalClicks`
- [ ] 数值不为0（如果有测试数据）
- [ ] 前端Dashboard页面显示正确的曝光和点击数
- [ ] 平均点击率计算正确（点击数/曝光数 * 100%）

---

## 📞 给后端的说明

**问题**: Dashboard首页的"轮播统计"显示为0

**原因**: `/api/admin/dashboard/overview` 接口返回的数据中，`banners.totalImpressions` 和 `banners.totalClicks` 字段缺失或为0

**需要**: 
1. 确保接口返回 `banners.totalImpressions` 字段（总曝光数）
2. 确保接口返回 `banners.totalClicks` 字段（总点击数）
3. 如果数据库没有数据，可以先插入测试数据验证

**测试命令**:
```bash
curl http://localhost:9090/api/admin/dashboard/overview | jq '.data.banners'
```

**期望输出**:
```json
{
  "total": 8,
  "totalImpressions": 125430,
  "totalClicks": 8765
}
```

---

## 📝 相关文件

- 前端页面: `/src/pages/DashboardPage.tsx`
- API定义: `/src/api/admin.ts` (第244-246行)
- 后端路由: `/api/admin/dashboard/overview`

---

**优先级**: P1（高优先级）  
**文档版本**: v1.0  
**创建时间**: 2025-11-18
