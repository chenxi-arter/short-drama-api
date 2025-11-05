# 📊 Analytics API 数据真实性验证报告

## 概述

本文档验证管理后台 Analytics API 返回的数据是否真实，以及是否会根据前端接口的使用而变化。

## ✅ 数据来源分析

### 1. DAU/WAU/MAU（日/周/月活跃用户数）

**数据来源：**
- 表：`watch_progress`
- 字段：`updated_at`
- 逻辑：统计 `updated_at` 在指定时间范围内的唯一 `user_id` 数量

**前端接口依赖：**
- ✅ `POST /api/video/progress` - 保存观看进度
- ✅ 当用户观看视频时，前端调用此接口更新 `watch_progress.updated_at`
- ✅ **数据会实时变化**：用户每次观看都会更新 `updated_at`，从而影响 DAU/WAU/MAU

**验证：**
```typescript
// 在 AnalyticsService.getDAU() 中
const result = await this.wpRepo
  .createQueryBuilder('wp')
  .select('COUNT(DISTINCT wp.user_id)', 'count')
  .where('wp.updated_at BETWEEN :start AND :end', {
    start: startOfDay,
    end: endOfDay,
  })
  .getRawOne();
```

---

### 2. 留存率（Retention Rate）

**数据来源：**
- 表：`users`（注册时间） + `watch_progress`（活跃行为）
- 逻辑：
  1. 获取指定日期注册的所有用户
  2. 统计这些用户在 N 天后（1日或7日）是否有观看行为

**前端接口依赖：**
- ✅ `POST /api/auth/register` - 用户注册（记录注册时间）
- ✅ `POST /api/video/progress` - 用户观看（记录活跃时间）
- ✅ **数据会实时变化**：新用户注册和观看行为都会影响留存率

**验证：**
```typescript
// 1. 获取队列用户（注册时间）
const cohortUsers = await this.userRepo
  .where('u.created_at BETWEEN :start AND :end', {...})

// 2. 统计留存用户（在留存日有观看行为）
const retainedResult = await this.wpRepo
  .where('wp.user_id IN (:...userIds)', { userIds })
  .andWhere('wp.updated_at BETWEEN :start AND :end', {...})
```

---

### 3. 播放量（Play Count）

**数据来源：**
- 表：`episodes`
- 字段：`play_count`
- 逻辑：统计所有剧集的 `play_count` 总和

**前端接口依赖：**
- ✅ `POST /api/video/episode/activity` (type: "play") - 播放计数
- ✅ **数据会实时变化**：每次播放都会增加 `play_count`

**验证：**
```typescript
// 在 EpisodeService.incrementPlayCount() 中
await this.episodeRepo.increment({ id: episodeId }, 'playCount', 1);
```

---

### 4. 完播率（Completion Rate）

**数据来源：**
- 表：`watch_progress` + `episodes`（JOIN）
- 逻辑：统计 `stop_at_second / duration >= 0.9` 的记录占比

**前端接口依赖：**
- ✅ `POST /api/video/progress` - 保存观看进度
- ✅ **数据会实时变化**：用户观看进度更新会影响完播率

**⚠️ 修复前的问题：**
- ❌ 原代码使用了不存在的 `watch_percentage` 字段
- ✅ **已修复**：通过 JOIN `episodes` 表计算百分比

**修复后的代码：**
```typescript
const completedResult = await this.wpRepo
  .createQueryBuilder('wp')
  .innerJoin('wp.episode', 'ep')
  .where('ep.duration > 0')
  .andWhere('(wp.stopAtSecond / ep.duration) >= :threshold', { threshold: 0.9 })
  .getCount();
```

---

### 5. 平均观看时长（Average Watch Duration）

**数据来源：**
- 表：`watch_progress` + `episodes`（JOIN）
- 字段：`stop_at_second`（观看进度秒数）

**前端接口依赖：**
- ✅ `POST /api/video/progress` - 保存观看进度
- ✅ **数据会实时变化**：用户观看进度更新会影响平均值

**⚠️ 修复前的问题：**
- ❌ 原代码使用了不存在的 `watch_progress` 和 `watch_percentage` 字段
- ✅ **已修复**：使用 `stopAtSecond` 并通过 JOIN 计算百分比

**修复后的代码：**
```typescript
const result = await this.wpRepo
  .createQueryBuilder('wp')
  .innerJoin('wp.episode', 'ep')
  .select('AVG(wp.stopAtSecond)', 'avgProgress')
  .addSelect('AVG(CASE WHEN ep.duration > 0 THEN (wp.stopAtSecond / ep.duration * 100) ELSE 0 END)', 'avgPercentage')
  .addSelect('SUM(wp.stopAtSecond)', 'totalTime')
  .where('ep.duration > 0')
  .getRawOne();
```

---

## 📋 数据关联性总结

| 指标 | 数据表 | 前端接口 | 实时变化 |
|------|--------|---------|---------|
| **DAU/WAU/MAU** | `watch_progress` | `POST /api/video/progress` | ✅ 是 |
| **留存率** | `users` + `watch_progress` | `POST /api/auth/register`<br>`POST /api/video/progress` | ✅ 是 |
| **播放量** | `episodes.play_count` | `POST /api/video/episode/activity` (type: "play") | ✅ 是 |
| **完播率** | `watch_progress` + `episodes` | `POST /api/video/progress` | ✅ 是 |
| **平均观看时长** | `watch_progress` + `episodes` | `POST /api/video/progress` | ✅ 是 |
| **新增注册数** | `users` | `POST /api/auth/register` | ✅ 是 |

---

## 🔍 数据真实性验证

### ✅ 已验证的真实性

1. **DAU/WAU/MAU**
   - ✅ 基于真实的用户观看行为（`watch_progress.updated_at`）
   - ✅ 会随用户观看而变化

2. **留存率**
   - ✅ 基于真实的用户注册和观看数据
   - ✅ 会随新用户注册和观看行为而变化

3. **播放量**
   - ✅ 基于真实的播放计数（`episodes.play_count`）
   - ✅ 每次播放都会增加计数

4. **完播率**（已修复）
   - ✅ 基于真实的观看进度数据
   - ✅ 通过 JOIN `episodes` 表计算百分比

5. **平均观看时长**（已修复）
   - ✅ 基于真实的观看进度数据（`stop_at_second`）
   - ✅ 通过 JOIN `episodes` 表计算百分比

---

## ⚠️ 已修复的问题

### 问题1：完播率查询错误

**问题：**
```typescript
// ❌ 错误：使用了不存在的字段
.where('wp.watch_percentage >= :threshold', { threshold: 90 })
```

**修复：**
```typescript
// ✅ 正确：通过 JOIN 计算百分比
.innerJoin('wp.episode', 'ep')
.where('ep.duration > 0')
.andWhere('(wp.stopAtSecond / ep.duration) >= :threshold', { threshold: 0.9 })
```

### 问题2：平均观看时长查询错误

**问题：**
```typescript
// ❌ 错误：使用了不存在的字段
.select('AVG(wp.watch_progress)', 'avgProgress')
.addSelect('AVG(wp.watch_percentage)', 'avgPercentage')
```

**修复：**
```typescript
// ✅ 正确：使用正确的字段名并计算百分比
.innerJoin('wp.episode', 'ep')
.select('AVG(wp.stopAtSecond)', 'avgProgress')
.addSelect('AVG(CASE WHEN ep.duration > 0 THEN (wp.stopAtSecond / ep.duration * 100) ELSE 0 END)', 'avgPercentage')
```

---

## 📊 测试建议

### 1. 功能测试

```bash
# 1. 查看当前统计数据
curl http://localhost:8080/api/admin/dashboard/stats

# 2. 模拟用户观看行为
curl -X POST http://localhost:3000/api/video/progress \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"episodeIdentifier": "6JswefD4QXK", "stopAtSecond": 120}'

# 3. 再次查看统计数据（应该会变化）
curl http://localhost:8080/api/admin/dashboard/stats
```

### 2. 数据一致性测试

- ✅ 验证 DAU 是否包含当天有观看行为的用户
- ✅ 验证播放量是否等于所有 `episodes.play_count` 的总和
- ✅ 验证完播率是否等于 `stop_at_second / duration >= 0.9` 的记录占比

---

## ✅ 结论

1. **数据是真实的**：所有指标都基于真实的数据库记录
2. **数据会实时变化**：前端接口的使用会直接影响统计数据
3. **已修复问题**：完播率和平均观看时长的查询错误已修复
4. **数据关联正确**：各指标与前端接口的对应关系清晰

---

## 📝 后续建议

1. **添加缓存**：对于高频查询的统计接口，建议添加缓存（5-15分钟）
2. **添加索引**：确保 `watch_progress.updated_at` 和 `users.created_at` 有索引
3. **监控告警**：设置数据异常告警（如 DAU 突然下降）
4. **定期校验**：定期验证统计数据与实际数据的准确性

---

*文档版本: v1.0*  
*最后更新: 2025-11-04*


