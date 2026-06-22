# 系列明细数据导出接口文档

## 📋 概述

新增系列明细数据导出功能，支持按日期范围和分类筛选，导出每个系列在每一天的汇总数据。

---

## 🔌 API 接口

### 获取系列明细数据

**接口**: `GET /api/admin/export/series-details`

**描述**: 获取指定日期范围内，每个系列每天的汇总统计数据

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| startDate | string | ✅ | 开始日期，格式：YYYY-MM-DD |
| endDate | string | ✅ | 结束日期，格式：YYYY-MM-DD |
| categoryId | number | ❌ | 分类ID，不传则返回所有分类 |

**请求示例**:
```bash
GET /api/admin/export/series-details?startDate=2025-11-01&endDate=2025-11-17&categoryId=1
```

**响应格式**:
```json
{
  "code": 200,
  "message": "success",
  "timestamp": "2025-11-17T12:00:00Z",
  "data": [
    {
      "date": "2025-11-10",
      "seriesId": 3152,
      "seriesTitle": "霸道总裁爱上我",
      "categoryName": "短剧",
      "episodeCount": 100,
      "playCount": 15234,
      "completionRate": 0.6523,
      "avgWatchDuration": 829,
      "likeCount": 1234,
      "dislikeCount": 56,
      "shareCount": 234,
      "favoriteCount": 567,
      "commentCount": 89
    },
    {
      "date": "2025-11-11",
      "seriesId": 3152,
      "seriesTitle": "霸道总裁爱上我",
      "categoryName": "短剧",
      "episodeCount": 100,
      "playCount": 18456,
      "completionRate": 0.6789,
      "avgWatchDuration": 845,
      "likeCount": 1456,
      "dislikeCount": 67,
      "shareCount": 289,
      "favoriteCount": 678,
      "commentCount": 102
    }
  ]
}
```

---

## 📊 数据字段说明

### SeriesDetailData 类型

| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| date | string | 日期 | "2025-11-10" |
| seriesId | number | 系列ID | 3152 |
| seriesTitle | string | 系列名称 | "霸道总裁爱上我" |
| categoryName | string | 分类名称 | "短剧" / "电视剧" / "电影" |
| episodeCount | number | 该系列的剧集总数 | 100 |
| playCount | number | 播放量（该系列所有剧集的总和） | 15234 |
| completionRate | number | 完播率（0-1之间的小数） | 0.6523 |
| avgWatchDuration | number | 平均观看时长（秒） | 829 |
| likeCount | number | 点赞数 | 1234 |
| dislikeCount | number | 踩数 | 56 |
| shareCount | number | 分享数 | 234 |
| favoriteCount | number | 收藏数 | 567 |
| commentCount | number | 评论数 | 89 |

---

## 💾 数据库查询逻辑（实际实现）

### 数据来源表

实际使用的数据库表：

1. **series** - 系列基本信息
2. **episodes** - 剧集信息
3. **categories** - 分类信息
4. **watch_progress** - 观看进度（用于统计播放量、完播率、平均观看时长）
5. **episode_reactions** - 点赞/踩记录
6. **favorites** - 收藏记录
7. **comments** - 评论记录（通过 episode_short_id 关联）

### 查询步骤

```typescript
// 1. 获取符合条件的系列（含分类和剧集信息）
SELECT series.*, category.*, episodes.*
FROM series
LEFT JOIN categories ON series.category_id = categories.id
LEFT JOIN episodes ON episodes.series_id = series.id
WHERE (:categoryId IS NULL OR series.category_id = :categoryId)

// 2. 按日期和系列统计观看数据
SELECT 
  DATE(wp.updated_at) as date,
  episode.series_id as seriesId,
  COUNT(*) as playCount,
  AVG(wp.stop_at_second) as avgDuration,
  AVG(CASE WHEN wp.stop_at_second >= episode.duration * 0.9 THEN 1 ELSE 0 END) as completionRate
FROM watch_progress wp
INNER JOIN episodes episode ON wp.episode_id = episode.id
WHERE wp.updated_at BETWEEN :start AND :end
  AND episode.series_id IN (:seriesIds)
GROUP BY date, episode.series_id

// 3. 按日期和系列统计点赞/踩数
SELECT 
  DATE(r.created_at) as date,
  episode.series_id as seriesId,
  SUM(CASE WHEN r.reaction_type = 'like' THEN 1 ELSE 0 END) as likeCount,
  SUM(CASE WHEN r.reaction_type = 'dislike' THEN 1 ELSE 0 END) as dislikeCount
FROM episode_reactions r
INNER JOIN episodes episode ON r.episode_id = episode.id
WHERE r.created_at BETWEEN :start AND :end
  AND episode.series_id IN (:seriesIds)
GROUP BY date, episode.series_id

// 4. 按日期和系列统计收藏数
SELECT 
  DATE(f.created_at) as date,
  f.series_id as seriesId,
  COUNT(*) as favoriteCount
FROM favorites f
WHERE f.created_at BETWEEN :start AND :end
  AND f.series_id IN (:seriesIds)
GROUP BY date, f.series_id

// 5. 按日期统计评论数（通过 episode_short_id 关联）
SELECT 
  DATE(c.created_at) as date,
  c.episode_short_id as episodeShortId,
  COUNT(*) as commentCount
FROM comments c
WHERE c.created_at BETWEEN :start AND :end
  AND c.episode_short_id IN (:episodeShortIds)
GROUP BY date, c.episode_short_id
```

### 数据聚合

- 所有查询结果按 `date + seriesId` 作为key合并
- 评论数通过 `episode_short_id` 映射到 `series_id` 后聚合
- 最终按日期降序、播放量降序排序

---

## 🎯 业务逻辑说明

### 1. 数据汇总规则
- **按系列汇总**: 每个系列在每一天的所有剧集数据汇总为一条记录
- **播放量**: 该系列所有剧集在当天的播放次数总和
- **完播率**: 该系列所有剧集在当天的平均完播率
- **平均观看时长**: 该系列所有剧集在当天的平均观看时长

### 2. 分类筛选
- 如果传入 `categoryId`，只返回该分类下的系列数据
- 如果不传 `categoryId`，返回所有分类的系列数据

### 3. 日期范围
- 支持跨天查询，返回每一天的数据
- 如果某个系列在某天没有数据，则不返回该系列该天的记录

### 4. 剧集数量
- `episodeCount` 字段表示该系列的剧集总数（不是当天的数据）
- 用于帮助运营人员了解系列规模

---

## 📤 前端导出格式

### CSV 文件格式

**文件名**: `系列明细数据_20251101_20251117.csv`

**表头**:
```
日期,系列名称,分类,剧集数,播放量,完播率,平均观看时长,点赞,踩,分享,收藏,评论
```

**数据示例**:
```csv
日期,系列名称,分类,剧集数,播放量,完播率,平均观看时长,点赞,踩,分享,收藏,评论
2025-11-10,霸道总裁爱上我,短剧,100,15234,65.23%,13分49秒,1234,56,234,567,89
2025-11-11,霸道总裁爱上我,短剧,100,18456,67.89%,14分5秒,1456,67,289,678,102
2025-11-10,穿越之王妃驾到,短剧,80,12345,58.90%,11分23秒,987,34,156,432,67
```

---

## 🧪 测试用例

### 测试1: 获取所有分类的系列数据
```bash
curl -X GET "http://localhost:9090/api/admin/export/series-details?startDate=2025-11-01&endDate=2025-11-17"
```

**预期结果**: 返回所有分类的系列明细数据

### 测试2: 按分类筛选
```bash
curl -X GET "http://localhost:9090/api/admin/export/series-details?startDate=2025-11-01&endDate=2025-11-17&categoryId=1"
```

**预期结果**: 只返回分类ID为1的系列数据

### 测试3: 单日查询
```bash
curl -X GET "http://localhost:9090/api/admin/export/series-details?startDate=2025-11-10&endDate=2025-11-10"
```

**预期结果**: 只返回11月10日的数据

### 测试4: 无数据情况
```bash
curl -X GET "http://localhost:9090/api/admin/export/series-details?startDate=2099-01-01&endDate=2099-01-31"
```

**预期结果**: 
```json
{
  "code": 200,
  "message": "success",
  "timestamp": "2025-11-17T12:00:00Z",
  "data": []
}
```

---

## ⚠️ 注意事项

1. **性能优化**
   - 建议对 `play_logs.created_at` 和 `series.category_id` 建立索引
   - 大数据量时考虑分页或限制日期范围

2. **数据准确性**
   - 确保 `play_logs` 表中的 `is_completed` 字段正确记录
   - 确保 `interactions` 表中的 `type` 字段包含 'like', 'dislike', 'share', 'favorite'

3. **时区处理**
   - 统一使用服务器时区或 UTC 时区
   - 前端传入的日期格式为 YYYY-MM-DD

4. **错误处理**
   - 日期格式错误: 返回 400 Bad Request
   - 分类不存在: 仍然返回空数组，不报错
   - 数据库查询失败: 返回 500 Internal Server Error

---

## 🚀 部署清单

- [x] 实现 `GET /api/admin/export/series-details` 接口
- [x] 基于现有数据库表结构实现查询逻辑
- [x] 更新 API 文档
- [ ] 添加数据库索引优化查询性能（可选）
- [ ] 编写单元测试（可选）
- [ ] 通知前端团队接口已就绪

## 📝 实现说明

**实现位置**: `/src/admin/controllers/admin-export.controller.ts`

**方法**: `getSeriesDetails()`

**特点**:
- ✅ 基于现有数据库表（watch_progress, episode_reactions, favorites, comments）
- ✅ 支持按分类筛选
- ✅ 支持日期范围查询
- ✅ 自动聚合系列下所有剧集的数据
- ✅ 完播率计算：观看时长 >= 剧集时长 * 90%
- ✅ 评论数通过 episode_short_id 关联统计
- ⚠️ shareCount 暂时返回 0（数据库中暂无分享记录表）

---

## 📞 联系方式

如有疑问，请联系前端团队。

**优先级**: P1（高优先级）  
**预计完成时间**: 1-2个工作日
