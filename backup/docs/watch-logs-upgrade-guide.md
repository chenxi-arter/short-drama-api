# 观看时长统计升级指南

## 📋 概述

本次升级解决了观看时长统计不准确的问题，引入了新的观看日志系统，能够准确记录用户的观看行为。

### 问题背景

**旧系统的问题**：
- `watch_progress` 表只记录"观看位置"（stop_at_second），不记录"观看时长"
- 每次更新会覆盖之前的记录，导致数据丢失
- 用户多次观看同一剧集时，无法累计观看时长

**示例**：
```
用户A在某天：
- 上午看剧集1，从0秒看到100秒 → 系统记录：stop_at_second=100
- 下午重看剧集1，从0秒看到50秒 → 系统记录：stop_at_second=50 ❌（覆盖了100）

旧系统以为用户只看了50秒，但实际看了150秒！
```

### 解决方案

**新系统设计**：
- 新增 `watch_logs` 表专门记录观看历史
- 每次观看都新增一条记录，不会覆盖
- 准确记录观看时长（watch_duration）

**示例**：
```
用户A在某天：
- 上午看剧集1，从0秒看到100秒
  → watch_logs 新增：watch_duration=100秒
- 下午重看剧集1，从100秒看到150秒
  → watch_logs 新增：watch_duration=50秒

新系统正确统计：总观看时长 = 100 + 50 = 150秒 ✅
```

---

## 🚀 部署步骤

### 1. 执行数据库迁移

运行迁移脚本创建 `watch_logs` 表：

```bash
# 进入项目目录
cd /Users/mac/work/short-drama-api

# 执行迁移（根据你的数据库配置）
mysql -u your_username -p your_database < migrations/add_watch_logs_table.sql
```

迁移脚本会创建：
- `watch_logs` 表
- 必要的索引（user_id, episode_id, watch_date）
- 外键约束

### 2. 重启应用

```bash
# 如果使用 PM2
pm2 restart short-drama-api

# 或者如果使用 npm
npm run start:prod
```

### 3. 验证部署

#### 3.1 检查表是否创建成功

```sql
-- 检查表结构
DESC watch_logs;

-- 应该看到以下字段：
-- id, user_id, episode_id, watch_duration, start_position, end_position, watch_date, created_at
```

#### 3.2 测试观看日志记录

```bash
# 模拟用户观看
curl -X POST "http://localhost:3000/api/video/progress" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "episodeId": 1,
    "stopAtSecond": 100
  }'

# 检查是否记录了观看日志
```

```sql
SELECT * FROM watch_logs ORDER BY created_at DESC LIMIT 5;
```

#### 3.3 测试统计接口

```bash
# 测试用户数据统计
curl "http://localhost:3000/api/admin/export/user-stats?startDate=2026-01-20&endDate=2026-01-20" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 测试系列明细统计
curl "http://localhost:3000/api/admin/export/series-details?startDate=2026-01-20&endDate=2026-01-20" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## 📊 新旧系统对比

| 特性 | 旧系统 (watch_progress) | 新系统 (watch_logs) |
|------|------------------------|-------------------|
| **记录方式** | 覆盖更新 | 追加记录 |
| **数据保留** | 只保留最新状态 | 保留完整历史 |
| **观看时长统计** | ❌ 不准确 | ✅ 准确 |
| **重复观看** | ❌ 无法累计 | ✅ 可以累计 |
| **用途** | 断点续播 | 统计分析 |

---

## 🔄 数据流程

### 用户观看流程

```
用户观看视频
    ↓
前端上报观看进度 (stopAtSecond: 150)
    ↓
后端接收请求
    ↓
┌─────────────────────────────────────┐
│ WatchProgressService                 │
│                                      │
│ 1. 查询旧的观看进度                    │
│    - 旧记录：stopAtSecond = 100       │
│                                      │
│ 2. 计算观看时长                        │
│    - watchDuration = 150 - 100 = 50  │
│                                      │
│ 3. 更新 watch_progress 表（断点续播）   │
│    - stopAtSecond = 150（覆盖）       │
│                                      │
│ 4. 新增 watch_logs 记录（统计分析）     │
│    - watch_duration = 50             │
│    - start_position = 100            │
│    - end_position = 150              │
│    - watch_date = 2026-01-20         │
└─────────────────────────────────────┘
```

### 统计查询流程

```
管理端请求统计数据
    ↓
AdminExportController
    ↓
┌─────────────────────────────────────┐
│ 优先使用 watch_logs                  │
│ ↓                                    │
│ 查询 watch_logs 表                   │
│ - 有数据？→ 使用 watch_logs ✅        │
│ - 无数据？→ 降级到 watch_progress ⚠️  │
│ ↓                                    │
│ 计算平均观看时长                      │
│ = SUM(watch_duration) / COUNT(DISTINCT user_id) │
└─────────────────────────────────────┘
    ↓
返回统计结果
```

---

## 📝 代码变更说明

### 新增文件

1. **实体类**：`src/video/entity/watch-log.entity.ts`
   - 定义 `watch_logs` 表结构
   - 包含索引和外键约束

2. **服务类**：`src/video/services/watch-log.service.ts`
   - 提供观看日志的 CRUD 操作
   - 提供统计查询方法

3. **迁移脚本**：`migrations/add_watch_logs_table.sql`
   - 创建数据库表

4. **文档**：
   - `docs/watch-logs-upgrade-guide.md`（本文档）
   - 更新了 `docs/series-details-verification-guide.md`

### 修改文件

1. **`src/video/services/watch-progress.service.ts`**
   - 在更新观看进度时同时记录观看日志
   - 计算观看时长（本次位置 - 上次位置）

2. **`src/video/modules/video-api.module.ts`**
   - 注册 `WatchLog` 实体
   - 注册 `WatchLogService` 服务

3. **`src/admin/admin.module.ts`**
   - 注册 `WatchLog` 实体
   - 注册 `WatchLogService` 服务

4. **`src/admin/controllers/admin-export.controller.ts`**
   - 修改统计逻辑，优先使用 `watch_logs`
   - 实现优雅降级到 `watch_progress`

5. **`src/admin/services/export-optimization.service.ts`**
   - 更新 SQL 查询，使用新的计算公式

6. **`src/admin/services/analytics.service.ts`**
   - 更新平均观看时长的计算逻辑

---

## 🎯 关键指标变化

### 平均观看时长

**旧公式**：
```sql
AVG(stop_at_second)  -- 所有观看记录的平均进度
```

**新公式**：
```sql
SUM(watch_duration) / COUNT(DISTINCT user_id)  -- 总观看时长 / 活跃用户数
```

**影响**：
- 更准确地反映用户投入度
- 能够累计用户的多次观看
- 更符合业务需求

---

## ⚠️ 注意事项

### 1. 历史数据

- **2026年1月之前**的数据：使用 `watch_progress` 表（可能不够准确）
- **2026年1月之后**的数据：使用 `watch_logs` 表（准确）
- 系统会自动判断使用哪个表，无需手动干预

### 2. 性能影响

- 每次更新观看进度会多插入一条 `watch_logs` 记录
- 已添加必要的索引优化查询性能
- 建议定期清理过期的观看日志（例如：保留最近1年的数据）

### 3. 存储空间

- `watch_logs` 表会持续增长
- 预估：每天1万个活跃用户，每人平均观看10次 = 每天10万条记录
- 建议：定期归档或清理超过1年的旧数据

### 4. 前端无需改动

- 前端上报接口保持不变
- 仍然只需上报 `stopAtSecond`
- 后端会自动计算并记录观看时长

---

## 🔍 数据清理建议

为了避免 `watch_logs` 表无限增长，建议定期清理旧数据：

```sql
-- 删除1年前的观看日志
DELETE FROM watch_logs 
WHERE watch_date < DATE_SUB(CURDATE(), INTERVAL 1 YEAR);

-- 或者归档到历史表
INSERT INTO watch_logs_archive 
SELECT * FROM watch_logs 
WHERE watch_date < DATE_SUB(CURDATE(), INTERVAL 1 YEAR);

DELETE FROM watch_logs 
WHERE watch_date < DATE_SUB(CURDATE(), INTERVAL 1 YEAR);
```

可以设置定时任务（cron）每月执行一次。

---

## 📞 问题排查

### 问题1：watch_logs 表没有数据

**排查步骤**：
1. 检查迁移是否执行成功：`SHOW TABLES LIKE 'watch_logs';`
2. 检查应用是否重启
3. 模拟观看行为，检查日志是否有报错
4. 查看应用日志：`pm2 logs short-drama-api`

### 问题2：统计数据仍然不准确

**排查步骤**：
1. 确认统计的日期范围（是否包含新数据）
2. 检查 watch_logs 是否有对应日期的数据
3. 查看统计接口返回的数据来源（是 watch_logs 还是 watch_progress）

### 问题3：性能下降

**排查步骤**：
1. 检查索引是否创建成功：`SHOW INDEX FROM watch_logs;`
2. 分析慢查询：`EXPLAIN SELECT ...`
3. 考虑增加缓存或优化查询

---

## ✅ 验收标准

1. ✅ `watch_logs` 表创建成功
2. ✅ 用户观看视频时，`watch_logs` 表有新记录
3. ✅ 用户多次观看同一剧集，观看时长能够累计
4. ✅ 统计接口返回的平均观看时长准确
5. ✅ 历史数据的统计仍然可用（降级到 watch_progress）
6. ✅ 文档更新完整，说明清晰

---

## 📚 相关文档

- [系列明细数据统计参数说明](./series-details-verification-guide.md)
- [观看日志归档指南](./watch-logs-archive-guide.md)
- `watch_logs` 表结构：`src/video/entity/watch-log.entity.ts`
- WatchLogService API：`src/video/services/watch-log.service.ts`
- WatchLogsCleanupService API：`src/video/services/watch-logs-cleanup.service.ts`

---

## 🎉 总结

本次升级从根本上解决了观看时长统计不准确的问题：

✅ **准确性**：能够准确记录每次观看行为，不会丢失数据  
✅ **完整性**：保留完整的观看历史，支持更丰富的数据分析  
✅ **兼容性**：优雅降级策略，保证历史数据仍然可用  
✅ **可扩展性**：为未来更多的用户行为分析打下基础  

从现在开始，所有新的观看数据都会被准确记录，统计结果将更加可靠！🚀
