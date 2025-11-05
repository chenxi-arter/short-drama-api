# 🧪 Analytics API 测试指南

## 快速测试

### 1. 启动服务

```bash
# 启动 Admin 服务
npm run start:admin

# 在另一个终端运行测试脚本
./test-analytics-api.sh
```

---

## 手动测试步骤

### 测试1: 综合统计数据

```bash
curl http://localhost:8080/api/admin/dashboard/stats | jq
```

**预期结果：**
```json
{
  "code": 200,
  "data": {
    "activeUsers": {
      "dau": 1250,
      "wau": 5430,
      "mau": 18900,
      "dau7DayAvg": 1180,
      "sticky": 6.61
    },
    "watching": {
      "averageWatchProgress": 320,
      "averageWatchPercentage": 65.8,
      "totalWatchTime": 45678900,
      "completionRate": 42.5
    }
  }
}
```

**验证点：**
- ✅ `completionRate` 有值（修复前会报错）
- ✅ `averageWatchProgress` 有值（修复前会报错）
- ✅ `averageWatchPercentage` 有值（修复前会报错）

---

### 测试2: 完播率和观看统计（重点测试）

```bash
curl http://localhost:8080/api/admin/dashboard/watch-stats | jq
```

**预期结果：**
```json
{
  "code": 200,
  "data": {
    "averageWatchProgress": 320,
    "averageWatchPercentage": 65.8,
    "totalWatchTime": 45678900,
    "totalWatchRecords": 125000,
    "completedRecords": 53125,
    "completionRate": 42.5
  }
}
```

**验证点：**
- ✅ 接口返回成功（code: 200）
- ✅ 所有字段都有值
- ✅ `completionRate` 计算正确：`completedRecords / totalWatchRecords * 100`
- ✅ `averageWatchPercentage` 计算正确：基于 `stop_at_second / duration`

---

### 测试3: 活跃用户统计

```bash
curl http://localhost:8080/api/admin/dashboard/active-users | jq
```

**验证点：**
- ✅ DAU/WAU/MAU 有值
- ✅ 粘性系数计算正确：`DAU / MAU * 100`

---

### 测试4: 内容播放统计

```bash
curl http://localhost:8080/api/admin/dashboard/content-stats | jq
```

**验证点：**
- ✅ 总播放量有值
- ✅ 被观看的剧集数有值
- ✅ Top10 剧集列表返回正确

---

### 测试5: 留存率统计

```bash
# 次日留存
curl "http://localhost:8080/api/admin/dashboard/retention?retentionDays=1" | jq

# 7日留存
curl "http://localhost:8080/api/admin/dashboard/retention?retentionDays=7" | jq
```

**验证点：**
- ✅ 留存率计算正确
- ✅ 数据会随用户行为变化

---

## 数据库验证

### 验证完播率计算是否正确

```sql
-- 总观看记录数
SELECT COUNT(*) as total_records FROM watch_progress;

-- 完播记录数（观看进度 >= 90%）
SELECT COUNT(*) as completed_records
FROM watch_progress wp
INNER JOIN episodes ep ON wp.episode_id = ep.id
WHERE ep.duration > 0
  AND (wp.stop_at_second / ep.duration) >= 0.9;

-- 完播率
SELECT 
  COUNT(*) as total_records,
  SUM(CASE WHEN ep.duration > 0 AND (wp.stop_at_second / ep.duration) >= 0.9 THEN 1 ELSE 0 END) as completed_records,
  ROUND(SUM(CASE WHEN ep.duration > 0 AND (wp.stop_at_second / ep.duration) >= 0.9 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as completion_rate
FROM watch_progress wp
INNER JOIN episodes ep ON wp.episode_id = ep.id
WHERE ep.duration > 0;
```

### 验证平均观看时长计算是否正确

```sql
-- 平均观看进度（秒）
SELECT 
  AVG(wp.stop_at_second) as avg_progress,
  AVG(CASE WHEN ep.duration > 0 THEN (wp.stop_at_second / ep.duration * 100) ELSE 0 END) as avg_percentage,
  SUM(wp.stop_at_second) as total_time
FROM watch_progress wp
INNER JOIN episodes ep ON wp.episode_id = ep.id
WHERE ep.duration > 0;
```

---

## 前端接口关联测试

### 测试数据变化

1. **模拟用户观看行为**
```bash
# 需要先登录获取 token
TOKEN="your_access_token"
EPISODE_SHORT_ID="6JswefD4QXK"

# 保存观看进度
curl -X POST http://localhost:3000/api/video/progress \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"episodeIdentifier\": \"$EPISODE_SHORT_ID\", \"stopAtSecond\": 120}"
```

2. **查看统计数据变化**
```bash
# 查看 DAU（应该包含刚才观看的用户）
curl http://localhost:8080/api/admin/dashboard/active-users | jq .data.dau

# 查看完播率（如果观看进度 >= 90%，完播率应该变化）
curl http://localhost:8080/api/admin/dashboard/watch-stats | jq .data.completionRate
```

3. **模拟播放计数**
```bash
# 播放计数
curl -X POST http://localhost:3000/api/video/episode/activity \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"shortId\": \"$EPISODE_SHORT_ID\", \"type\": \"play\"}"

# 查看播放量变化
curl http://localhost:8080/api/admin/dashboard/content-stats | jq .data.totalPlayCount
```

---

## 错误排查

### 问题1: 接口返回 500 错误

**可能原因：**
- 数据库连接失败
- SQL 查询错误（已修复）

**检查：**
```bash
# 查看服务日志
tail -f logs/admin.error.log

# 检查数据库连接
# 查看 .env 文件中的数据库配置
```

### 问题2: 完播率为 0

**可能原因：**
- 没有观看记录
- 剧集时长（duration）为 0

**检查：**
```sql
-- 检查是否有观看记录
SELECT COUNT(*) FROM watch_progress;

-- 检查剧集时长
SELECT COUNT(*) FROM episodes WHERE duration > 0;
```

### 问题3: 平均观看时长为 0

**可能原因：**
- 没有观看记录
- 所有记录的 `stop_at_second` 都是 0

**检查：**
```sql
SELECT AVG(stop_at_second) FROM watch_progress;
```

---

## 修复验证清单

- [x] ✅ 修复 `getCompletionRate()` 使用不存在的 `watch_percentage` 字段
- [x] ✅ 修复 `getAverageWatchDuration()` 使用错误的字段名
- [x] ✅ 通过 JOIN `episodes` 表计算百分比
- [x] ✅ 添加 `duration > 0` 的检查，避免除零错误
- [ ] ⏳ 测试接口返回正常
- [ ] ⏳ 验证数据准确性
- [ ] ⏳ 验证数据会随前端接口变化

---

## 下一步

1. **启动服务并运行测试**
   ```bash
   npm run start:admin
   ./test-analytics-api.sh
   ```

2. **验证数据准确性**
   - 对比 API 返回值和数据库查询结果
   - 验证计算公式是否正确

3. **验证数据变化**
   - 模拟用户行为
   - 观察统计数据变化

---

*文档版本: v1.0*  
*最后更新: 2025-11-04*


