# 运维数据导出接口文档

## 📋 概述

本文档提供运维人员导出Excel所需的统计数据接口，支持按日期范围筛选，返回格式化的数据便于直接导入Excel。

**基础URL**: `http://localhost:8080/api/admin/export`

---

## 📊 接口列表

### 1. 播放数据统计

**接口**: `GET /api/admin/export/play-stats`

**说明**: 获取指定日期范围内的播放数据统计，包括播放量、完播率、平均观看时长、点赞数、分享数、收藏数。

**请求参数**:

| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| startDate | string | 是 | 开始日期 | 2025-11-01 |
| endDate | string | 是 | 结束日期 | 2025-11-30 |

**返回数据**:

```json
{
  "code": 200,
  "data": [
    {
      "date": "11月1日",
      "playCount": 1000,           // 播放量
      "completionRate": 0.65,      // 完播率（0-1之间的小数）
      "avgWatchDuration": 180,     // 平均观看时长（秒）
      "likeCount": 50,             // 点赞数
      "shareCount": 0,             // 分享数（暂无数据）
      "favoriteCount": 30          // 收藏数
    },
    {
      "date": "11月2日",
      "playCount": 1200,
      "completionRate": 0.68,
      "avgWatchDuration": 195,
      "likeCount": 60,
      "shareCount": 0,
      "favoriteCount": 35
    }
  ],
  "message": "播放数据统计获取成功",
  "timestamp": "2025-11-10T08:00:00.000Z"
}
```

**Excel表格对应**:

| 日期 | 播放量 | 完播率 | 平均观看时长 | 点赞 | 分享 | 收藏 |
|------|--------|--------|--------------|------|------|------|
| 11月1日 | 1000 | 65% | 180秒 | 50 | 0 | 30 |
| 11月2日 | 1200 | 68% | 195秒 | 60 | 0 | 35 |

**使用示例**:

```bash
# 获取11月份的播放数据
curl "http://localhost:8080/api/admin/export/play-stats?startDate=2025-11-01&endDate=2025-11-30"
```

---

### 2. 用户数据统计

**接口**: `GET /api/admin/export/user-stats`

**说明**: 获取指定日期范围内的用户数据统计，包括新增用户、次日留存率、日活、平均观影时长、新增来源。

**请求参数**:

| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| startDate | string | 是 | 开始日期 | 2025-11-01 |
| endDate | string | 是 | 结束日期 | 2025-11-30 |

**返回数据**:

```json
{
  "code": 200,
  "data": [
    {
      "date": "11月1日",
      "newUsers": 100,             // 总新增用户数
      "nextDayRetention": 0.45,    // 次日留存率（0-1之间的小数）
      "dau": 500,                  // 日活跃用户数
      "avgWatchDuration": 180,     // 平均观影时长（秒）
      "newUserSource": "自然增长"   // 新增来源
    },
    {
      "date": "11月2日",
      "newUsers": 120,
      "nextDayRetention": 0.48,
      "dau": 550,
      "avgWatchDuration": 195,
      "newUserSource": "自然增长"
    }
  ],
  "message": "用户数据统计获取成功",
  "timestamp": "2025-11-10T08:00:00.000Z"
}
```

**Excel表格对应**:

| 日期 | 总新增 | 次日留存 | 日活 | 平均观影时长 | 新增来源 |
|------|--------|----------|------|--------------|----------|
| 11月1日 | 100 | 45% | 500 | 180秒 | 自然增长 |
| 11月2日 | 120 | 48% | 550 | 195秒 | 自然增长 |

**使用示例**:

```bash
# 获取11月份的用户数据
curl "http://localhost:8080/api/admin/export/user-stats?startDate=2025-11-01&endDate=2025-11-30"
```

---

## 📝 字段说明

### 重要说明

**所有数据都是汇总统计**：
- **播放量 (playCount)**: 统计当天所有观看记录的总数，包括同一用户多次观看同一剧集
- **点赞数 (likeCount)**: 统计当天所有剧集收到的点赞总数
- **收藏数 (favoriteCount)**: 统计当天所有系列被收藏的总次数
- **完播率 (completionRate)**: 基于所有观看记录计算，观看进度≥90%算完播

**示例**：
- 如果用户A在11月10日观看了剧集1、剧集2、剧集3
- 用户B在11月10日观看了剧集1、剧集2
- 那么11月10日的播放量 = 5（不是2个不同的剧集，而是5次观看记录）

### 播放数据字段

| 字段 | 类型 | 说明 | 计算方式 |
|------|------|------|----------|
| date | string | 日期 | 格式：11月1日 |
| playCount | number | 播放量 | 当天所有观看记录的总数（包括重复观看） |
| completionRate | number | 完播率 | 观看进度≥90%的次数 / 总观看次数 |
| avgWatchDuration | number | 平均观看时长 | 所有观看记录的平均时长（秒） |
| likeCount | number | 点赞数 | 当天所有剧集的点赞总数 |
| shareCount | number | 分享数 | 暂无数据，返回0 |
| favoriteCount | number | 收藏数 | 当天所有系列的收藏总数 |

### 用户数据字段

| 字段 | 类型 | 说明 | 计算方式 |
|------|------|------|----------|
| date | string | 日期 | 格式：11月1日 |
| newUsers | number | 总新增 | 当天注册的用户数 |
| nextDayRetention | number | 次日留存率 | 当天注册且次日活跃的用户数 / 当天注册总数 |
| dau | number | 日活 | 当天有观看行为的不同用户数 |
| avgWatchDuration | number | 平均观影时长 | 当天所有用户的平均观看时长（秒） |
| newUserSource | string | 新增来源 | 固定值"自然增长"（后续可扩展） |

---

## 🔢 数据格式转换

### 完播率转换为百分比

```javascript
// API返回: 0.65
// Excel显示: 65%
const completionRatePercent = (completionRate * 100).toFixed(2) + '%';
```

### 次日留存率转换为百分比

```javascript
// API返回: 0.45
// Excel显示: 45%
const retentionPercent = (nextDayRetention * 100).toFixed(2) + '%';
```

### 时长转换为分钟

```javascript
// API返回: 180秒
// Excel显示: 3分钟
const durationMinutes = Math.round(avgWatchDuration / 60);
```

---

## 💡 使用场景

### 场景1：导出月度报表

```bash
# 获取整个11月的数据
curl "http://localhost:8080/api/admin/export/play-stats?startDate=2025-11-01&endDate=2025-11-30" > play_stats_nov.json
curl "http://localhost:8080/api/admin/export/user-stats?startDate=2025-11-01&endDate=2025-11-30" > user_stats_nov.json
```

### 场景2：导出周报数据

```bash
# 获取本周的数据（11月4日-11月10日）
curl "http://localhost:8080/api/admin/export/play-stats?startDate=2025-11-04&endDate=2025-11-10"
curl "http://localhost:8080/api/admin/export/user-stats?startDate=2025-11-04&endDate=2025-11-10"
```

### 场景3：对比分析

```bash
# 获取上月数据
curl "http://localhost:8080/api/admin/export/play-stats?startDate=2025-10-01&endDate=2025-10-31"

# 获取本月数据
curl "http://localhost:8080/api/admin/export/play-stats?startDate=2025-11-01&endDate=2025-11-30"
```

---

## 📊 Excel导入示例

### 使用Python导入Excel

```python
import requests
import pandas as pd
from datetime import datetime

# 获取数据
response = requests.get(
    'http://localhost:8080/api/admin/export/play-stats',
    params={
        'startDate': '2025-11-01',
        'endDate': '2025-11-30'
    }
)

data = response.json()['data']

# 转换数据格式
df = pd.DataFrame(data)
df['completionRate'] = df['completionRate'].apply(lambda x: f"{x*100:.2f}%")
df['avgWatchDuration'] = df['avgWatchDuration'].apply(lambda x: f"{x//60}分{x%60}秒")

# 导出到Excel
df.to_excel('播放数据统计.xlsx', index=False, sheet_name='播放数据')
print("导出成功！")
```

### 使用Node.js导入Excel

```javascript
const axios = require('axios');
const XLSX = require('xlsx');

async function exportToExcel() {
  // 获取播放数据
  const playResponse = await axios.get('http://localhost:8080/api/admin/export/play-stats', {
    params: {
      startDate: '2025-11-01',
      endDate: '2025-11-30'
    }
  });

  // 获取用户数据
  const userResponse = await axios.get('http://localhost:8080/api/admin/export/user-stats', {
    params: {
      startDate: '2025-11-01',
      endDate: '2025-11-30'
    }
  });

  // 创建工作簿
  const wb = XLSX.utils.book_new();

  // 添加播放数据表
  const playData = playResponse.data.data.map(item => ({
    '日期': item.date,
    '播放量': item.playCount,
    '完播率': `${(item.completionRate * 100).toFixed(2)}%`,
    '平均观看时长': `${Math.round(item.avgWatchDuration / 60)}分钟`,
    '点赞': item.likeCount,
    '分享': item.shareCount,
    '收藏': item.favoriteCount
  }));
  const playSheet = XLSX.utils.json_to_sheet(playData);
  XLSX.utils.book_append_sheet(wb, playSheet, '播放数据');

  // 添加用户数据表
  const userData = userResponse.data.data.map(item => ({
    '日期': item.date,
    '总新增': item.newUsers,
    '次日留存': `${(item.nextDayRetention * 100).toFixed(2)}%`,
    '日活': item.dau,
    '平均观影时长': `${Math.round(item.avgWatchDuration / 60)}分钟`,
    '新增来源': item.newUserSource
  }));
  const userSheet = XLSX.utils.json_to_sheet(userData);
  XLSX.utils.book_append_sheet(wb, userSheet, '用户数据');

  // 保存文件
  XLSX.writeFile(wb, '运营数据统计.xlsx');
  console.log('导出成功！');
}

exportToExcel();
```

---

## ⚠️ 注意事项

1. **日期格式**: 必须使用 `YYYY-MM-DD` 格式，例如 `2025-11-01`
2. **时间范围**: 建议单次查询不超过3个月的数据，避免性能问题
3. **次日留存率**: 需要等到次日才能计算，当天的留存率为0
4. **完播率计算**: 观看进度达到视频时长的90%即算完播
5. **分享数据**: 目前系统暂无分享功能，该字段固定返回0
6. **新增来源**: 目前固定返回"自然增长"，后续可扩展渠道追踪

---

## 🔧 错误处理

### 错误响应格式

```json
{
  "code": 500,
  "data": null,
  "message": "获取播放数据失败: Invalid date format",
  "timestamp": "2025-11-10T08:00:00.000Z"
}
```

### 常见错误

| 错误信息 | 原因 | 解决方案 |
|----------|------|----------|
| Invalid date format | 日期格式错误 | 使用 YYYY-MM-DD 格式 |
| Missing required parameter | 缺少必填参数 | 检查 startDate 和 endDate |
| Date range too large | 日期范围过大 | 缩小查询范围至3个月内 |

---

## 📈 性能优化建议

1. **分批查询**: 对于大范围数据，建议按月分批查询
2. **缓存结果**: 历史数据可以缓存，避免重复查询
3. **异步处理**: 使用异步方式处理大量数据导出
4. **定时任务**: 建议设置定时任务在凌晨自动生成报表

---

## 🚀 后续扩展计划

- [ ] 支持按小时粒度统计
- [ ] 添加分享功能数据统计
- [ ] 支持多渠道来源追踪
- [ ] 添加数据对比功能
- [ ] 支持自定义导出字段
- [ ] 添加数据可视化图表

---

## 📞 技术支持

如有问题，请联系技术团队或查看完整API文档。
