# 📊 管理后台 - 数据分析API文档

## 概述

本文档描述管理后台的高级数据分析接口，包括用户活跃度、留存率、播放统计等核心指标。

**基础路径**: `/api/admin/dashboard`

## 📈 核心指标接口

### 1. 综合数据统计

**获取所有核心指标的综合统计**

```
GET /api/admin/dashboard/stats
```

**响应示例：**
```json
{
  "code": 200,
  "message": "数据统计获取成功",
  "timestamp": "2025-11-04T13:30:00.000Z",
  "data": {
    "activeUsers": {
      "dau": 1250,              // 日活跃用户数
      "wau": 5430,              // 周活跃用户数
      "mau": 18900,             // 月活跃用户数
      "dau7DayAvg": 1180,       // 7天平均DAU
      "sticky": 6.61            // 粘性系数 (DAU/MAU * 100)
    },
    "retention": {
      "day1": {
        "totalUsers": 120,       // 昨天注册的用户总数
        "retainedUsers": 45,     // 次日回访的用户数
        "retentionRate": 37.5    // 次日留存率 (%)
      },
      "day7": {
        "totalUsers": 850,       // 7天前注册的用户总数
        "retainedUsers": 210,    // 7日后仍活跃的用户数
        "retentionRate": 24.71   // 7日留存率 (%)
      }
    },
    "content": {
      "totalPlayCount": 1234567,           // 总播放次数
      "uniqueWatchedEpisodes": 45000,     // 被观看的唯一剧集数
      "averagePlayCountPerEpisode": 27    // 每剧集平均播放次数
    },
    "watching": {
      "averageWatchProgress": 320,        // 平均观看进度（秒）
      "averageWatchPercentage": 65.8,     // 平均观看百分比 (%)
      "totalWatchTime": 45678900,         // 总观看时长（秒）
      "completionRate": 42.5              // 完播率 (%)
    },
    "registration": {
      "today": 45,              // 今日新增注册
      "yesterday": 52,          // 昨日新增注册
      "last7Days": 380,         // 最近7天新增
      "last30Days": 1580        // 最近30天新增
    }
  }
}
```

**字段说明：**

| 字段 | 说明 | 计算方式 |
|------|------|----------|
| `dau` | 日活跃用户数 | 当天有观看行为的唯一用户数 |
| `wau` | 周活跃用户数 | 最近7天有观看行为的唯一用户数 |
| `mau` | 月活跃用户数 | 最近30天有观看行为的唯一用户数 |
| `dau7DayAvg` | 7天平均DAU | 最近7天DAU的平均值 |
| `sticky` | 粘性系数 | DAU/MAU × 100，衡量用户活跃度 |
| `retentionRate` | 留存率 | 回访用户数/注册用户数 × 100 |
| `completionRate` | 完播率 | 观看进度≥90%的记录数/总记录数 × 100 |

---

### 2. 活跃用户统计

**获取DAU/WAU/MAU详细数据**

```
GET /api/admin/dashboard/active-users
```

**响应示例：**
```json
{
  "code": 200,
  "message": "活跃用户统计获取成功",
  "timestamp": "2025-11-04T13:30:00.000Z",
  "data": {
    "dau": 1250,           // 今日活跃用户数
    "wau": 5430,           // 本周活跃用户数
    "mau": 18900,          // 本月活跃用户数
    "dau7DayAvg": 1180,    // 7天平均DAU
    "sticky": 6.61         // 粘性系数 (DAU/MAU * 100)
  }
}
```

**使用场景：**
- 监控平台日常活跃度
- 分析用户增长趋势
- 评估运营活动效果

---

### 3. 用户留存率

**获取指定队列的留存率**

```
GET /api/admin/dashboard/retention?retentionDays=1&cohortDate=2025-11-03
```

**请求参数：**

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `retentionDays` | number | 否 | 1 | 留存天数（1=次日留存，7=7日留存）|
| `cohortDate` | string | 否 | 昨天 | 队列日期（格式：YYYY-MM-DD）|

**响应示例：**
```json
{
  "code": 200,
  "message": "留存率统计获取成功",
  "timestamp": "2025-11-04T13:30:00.000Z",
  "data": {
    "totalUsers": 120,        // 该日注册的用户总数
    "retainedUsers": 45,      // 留存的用户数
    "retentionRate": 37.5     // 留存率 (%)
  }
}
```

**示例用法：**
```bash
# 查看昨天注册用户的次日留存率
curl 'http://localhost:8080/api/admin/dashboard/retention?retentionDays=1'

# 查看2025-11-01注册用户的7日留存率
curl 'http://localhost:8080/api/admin/dashboard/retention?retentionDays=7&cohortDate=2025-11-01'
```

---

### 4. 留存率趋势

**获取最近N天的留存率趋势数据**

```
GET /api/admin/dashboard/retention-trend?days=7&retentionDays=1
```

**请求参数：**

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `days` | number | 否 | 7 | 统计最近N天 |
| `retentionDays` | number | 否 | 1 | 留存天数（1或7）|

**响应示例：**
```json
{
  "code": 200,
  "message": "留存率趋势获取成功",
  "timestamp": "2025-11-04T13:30:00.000Z",
  "data": [
    {
      "date": "2025-10-28",
      "totalUsers": 85,
      "retainedUsers": 32,
      "retentionRate": 37.65
    },
    {
      "date": "2025-10-29",
      "totalUsers": 92,
      "retainedUsers": 35,
      "retentionRate": 38.04
    },
    {
      "date": "2025-10-30",
      "totalUsers": 78,
      "retainedUsers": 28,
      "retentionRate": 35.90
    }
  ]
}
```

**使用场景：**
- 绘制留存率趋势图表
- 分析运营活动对留存的影响
- 对比不同时期的用户质量

---

### 5. 内容播放统计

**获取内容播放相关的统计数据**

```
GET /api/admin/dashboard/content-stats
```

**响应示例：**
```json
{
  "code": 200,
  "message": "内容播放统计获取成功",
  "timestamp": "2025-11-04T13:30:00.000Z",
  "data": {
    "totalPlayCount": 1234567,           // 总播放次数
    "uniqueWatchedEpisodes": 45000,      // 被观看过的剧集数
    "averagePlayCountPerEpisode": 27,    // 每剧集平均播放次数
    "top10Episodes": [
      {
        "episodeId": 12345,
        "shortId": "6JswefD4QXK",
        "title": "热门剧集 第01集",
        "playCount": 89450
      },
      // ... 更多
    ]
  }
}
```

**使用场景：**
- 分析内容热度
- 识别爆款内容
- 优化内容推荐策略

---

### 6. 观看统计（完播率+平均时长）

**获取用户观看行为统计**

```
GET /api/admin/dashboard/watch-stats
```

**响应示例：**
```json
{
  "code": 200,
  "message": "观看统计获取成功",
  "timestamp": "2025-11-04T13:30:00.000Z",
  "data": {
    "averageWatchProgress": 320,        // 平均观看进度（秒）
    "averageWatchPercentage": 65.8,     // 平均观看百分比 (%)
    "totalWatchTime": 45678900,         // 总观看时长（秒）
    "totalWatchRecords": 125000,        // 总观看记录数
    "completedRecords": 53125,          // 完播记录数（≥90%）
    "completionRate": 42.5              // 完播率 (%)
  }
}
```

**字段说明：**
- `averageWatchProgress`: 所有观看记录的平均观看进度（秒）
- `averageWatchPercentage`: 所有观看记录的平均观看百分比
- `totalWatchTime`: 所有用户的累计观看时长（秒），可转换为小时/天
- `completionRate`: 观看进度≥90%的记录占比

**使用场景：**
- 评估内容质量（完播率高=内容吸引人）
- 分析用户观看习惯
- 优化内容时长

---

## 📊 数据指标解释

### DAU/WAU/MAU

**定义：**
- **DAU** (Daily Active Users): 日活跃用户数，当天有观看行为的唯一用户数
- **WAU** (Weekly Active Users): 周活跃用户数，最近7天有观看行为的唯一用户数
- **MAU** (Monthly Active Users): 月活跃用户数，最近30天有观看行为的唯一用户数

**粘性系数 (Sticky):**
```
粘性系数 = (DAU / MAU) × 100
```
- 粘性系数越高，说明用户越活跃
- 一般认为 > 20% 为优秀，> 10% 为良好

### 留存率

**次日留存率：**
```
次日留存率 = (第N天注册且第N+1天活跃的用户数 / 第N天注册的用户总数) × 100
```

**7日留存率：**
```
7日留存率 = (第N天注册且第N+7天活跃的用户数 / 第N天注册的用户总数) × 100
```

**行业参考值：**
- 次日留存率：30-50% 为优秀
- 7日留存率：20-35% 为优秀

### 完播率

**定义：**
```
完播率 = (观看进度 ≥ 90% 的记录数 / 总观看记录数) × 100
```

**行业参考值：**
- 短剧平台：40-60% 为优秀
- 长视频平台：20-40% 为优秀

---

## 🔧 使用示例

### 示例1：监控日常运营

```bash
# 查看今日核心指标
curl 'http://localhost:8080/api/admin/dashboard/stats'
```

### 示例2：分析用户质量

```bash
# 查看最近7天的次日留存率趋势
curl 'http://localhost:8080/api/admin/dashboard/retention-trend?days=7&retentionDays=1'

# 查看最近7天的7日留存率趋势
curl 'http://localhost:8080/api/admin/dashboard/retention-trend?days=7&retentionDays=7'
```

### 示例3：评估内容质量

```bash
# 查看内容播放统计
curl 'http://localhost:8080/api/admin/dashboard/content-stats'

# 查看完播率和观看时长
curl 'http://localhost:8080/api/admin/dashboard/watch-stats'
```

### 示例4：监控用户增长

```bash
# 查看活跃用户数
curl 'http://localhost:8080/api/admin/dashboard/active-users'
```

---

## 📊 前端图表建议

### 1. 核心指标卡片

建议在管理后台首页展示以下卡片：

```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ DAU         │ WAU         │ MAU         │ 粘性系数    │
│ 1,250       │ 5,430       │ 18,900      │ 6.61%       │
│ ↑ 5.2%      │ ↑ 3.8%      │ ↑ 12.5%     │ ↓ 0.3%      │
└─────────────┴─────────────┴─────────────┴─────────────┘

┌─────────────┬─────────────┬─────────────┬─────────────┐
│ 次日留存    │ 7日留存     │ 完播率      │ 今日新增    │
│ 37.5%       │ 24.7%       │ 42.5%       │ 45人        │
│ ↑ 2.1%      │ ↓ 1.2%      │ ↑ 3.5%      │ ↓ 13.5%     │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

### 2. 趋势图表

**留存率趋势图 (折线图):**
```javascript
// 使用 retention-trend 接口数据
const chartData = {
  labels: data.map(item => item.date),
  datasets: [{
    label: '次日留存率',
    data: data.map(item => item.retentionRate)
  }]
};
```

**活跃用户趋势图 (面积图):**
```javascript
// 使用 timeseries 接口数据
const chartData = {
  labels: data.series.map(item => item.date),
  datasets: [
    { label: 'DAU', data: data.series.map(item => item.playActive) },
    { label: '新增用户', data: data.series.map(item => item.newUsers) }
  ]
};
```

### 3. Top榜单表格

**热门剧集排行：**
```javascript
// 使用 content-stats 接口中的 top10Episodes
<table>
  <thead>
    <tr><th>排名</th><th>剧集</th><th>播放量</th></tr>
  </thead>
  <tbody>
    {top10Episodes.map((ep, idx) => (
      <tr key={ep.episodeId}>
        <td>{idx + 1}</td>
        <td>{ep.title}</td>
        <td>{ep.playCount.toLocaleString()}</td>
      </tr>
    ))}
  </tbody>
</table>
```

---

## 🎯 数据分析实战

### 场景1：评估运营活动效果

**问题**: 上周做了一次推广活动，效果如何？

**分析步骤：**
1. 查看活动期间的新增注册数
2. 查看DAU变化趋势
3. 查看活动用户的次日留存率

```bash
# 查看最近7天趋势
curl 'http://localhost:8080/api/admin/dashboard/timeseries?from=2025-10-28&to=2025-11-04'

# 查看活动日注册用户的次日留存
curl 'http://localhost:8080/api/admin/dashboard/retention?retentionDays=1&cohortDate=2025-11-01'
```

### 场景2：识别优质内容

**问题**: 哪些内容最受欢迎？

**分析步骤：**
1. 查看播放量Top10
2. 查看完播率
3. 交叉分析（高播放+高完播=优质内容）

```bash
# 查看Top10热门剧集
curl 'http://localhost:8080/api/admin/dashboard/content-stats'

# 查看完播率
curl 'http://localhost:8080/api/admin/dashboard/watch-stats'
```

### 场景3：用户流失分析

**问题**: 用户在哪个阶段流失最严重？

**分析步骤：**
1. 对比次日留存和7日留存
2. 分析平均观看时长
3. 查看完播率

```bash
# 查看综合统计
curl 'http://localhost:8080/api/admin/dashboard/stats'
```

**分析示例：**
- 次日留存35%，7日留存25% → 第1-7天流失10%
- 平均观看进度200秒，完播率30% → 大部分用户看了一半就离开
- 改进方向：优化前200秒的内容质量，增加吸引力

---

## 📝 最佳实践

### 1. 定时监控

建议每天查看以下指标：
- [ ] DAU（日活跃用户数）
- [ ] 昨日新增注册数
- [ ] 昨日用户的次日留存率
- [ ] 总播放量变化

### 2. 周度分析

每周查看：
- [ ] WAU 和 MAU 趋势
- [ ] 7日留存率
- [ ] Top10 热门内容变化
- [ ] 完播率变化

### 3. 数据对比

- 同比对比：与上周/上月同期对比
- 环比对比：与昨日/上周对比
- 趋势分析：观察是否持续增长/下降

---

## ⚡ 性能说明

### 查询性能

| 接口 | 平均响应时间 | 数据库查询次数 | 说明 |
|------|--------------|----------------|------|
| `/stats` | 500-1000ms | 15+ | 综合接口，查询最多 |
| `/active-users` | 200-400ms | 3 | 并发查询DAU/WAU/MAU |
| `/retention` | 100-300ms | 2 | 单次留存率计算 |
| `/retention-trend` | 700-1500ms | 2×N | N天的留存率计算 |
| `/content-stats` | 50-150ms | 2 | 播放统计 |
| `/watch-stats` | 50-100ms | 2 | 观看统计 |

### 优化建议

**1. 使用缓存：**
```typescript
// 建议对stats接口添加缓存（5-15分钟）
@CacheTTL(300) // 5分钟缓存
@Get('stats')
async getStats() {
  // ...
}
```

**2. 异步刷新：**
- 使用定时任务（如每5分钟）预先计算统计数据
- 存储到Redis，接口直接读取
- 适合数据量大的场景

**3. 数据库索引：**
确保以下字段有索引：
- `users.created_at`
- `watch_progress.user_id`
- `watch_progress.updated_at`
- `watch_progress.watch_percentage`
- `episodes.play_count`

---

## 🔍 故障排除

### 问题1：查询超时

**原因**: 数据量过大，查询时间过长

**解决方案:**
```sql
-- 添加必要的索引
CREATE INDEX idx_watch_progress_user_updated ON watch_progress(user_id, updated_at);
CREATE INDEX idx_watch_progress_percentage ON watch_progress(watch_percentage);
CREATE INDEX idx_users_created ON users(created_at);
```

### 问题2：留存率为0

**原因**: 
- 新平台，用户数据不足
- 队列日期选择的用户还没到留存日期

**解决方案:**
- 选择更早的队列日期
- 确保用户有足够的时间产生留存行为

### 问题3：数据不准确

**原因**: 
- 活跃定义基于 `watch_progress.updated_at`
- 如果用户只浏览不观看，不会被统计为活跃

**解决方案:**
- 可以修改 `AnalyticsService` 的查询条件
- 将 `browse_history` 也纳入活跃统计

---

## 📞 技术支持

如遇问题，请参考：
- [管理后台API文档](./admin-api.md)
- [数据库设计文档](./database-schema-documentation.md)
- [部署指南](./deployment-guide.md)

---

*文档版本: v1.0*  
*最后更新: 2025-11-04*


