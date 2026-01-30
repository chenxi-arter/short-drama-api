# 观看日志归档指南

## 📋 概述

随着系统运行，`watch_logs` 表会持续增长。为了避免表无限增长影响性能，本系统提供了可选的归档功能。

## 📊 数据保留策略

| 数据类型 | 保留时间 | 清理策略 |
|---------|---------|---------|
| **watch_logs** | 默认保留1年 | 可选归档或删除 |
| **watch_progress** | 永久保留 | ❌ **不能清除** |
| **browse_history** | 已废弃 | ⚠️ 定时任务已停用 |

## 🎯 为什么需要归档？

### 问题

- **存储空间**：观看日志会持续增长
  - 估算：1万日活用户 × 每人10次观看 × 每天 = 10万条记录/天
  - 一年：约3650万条记录

- **查询性能**：表越大，查询越慢
  - 影响管理端统计查询速度
  - 影响归档任务执行时间

### 解决方案

**选项1：定期删除旧数据**（推荐）
- 优点：简单，节省存储空间
- 缺点：数据永久丢失
- 适用：不需要长期数据分析的场景

**选项2：归档后删除**
- 优点：保留历史数据供离线分析
- 缺点：需要额外的归档表，操作复杂
- 适用：需要长期数据分析的场景

## 🔧 归档功能使用

### 1. 查看统计信息

```bash
# 查看观看日志统计
curl -X GET "http://localhost:3000/api/admin/dashboard/watch-logs-stats" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**返回示例**：
```json
{
  "code": 200,
  "data": {
    "totalLogs": 5000000,
    "logsOlderThan1Year": 3650000,
    "logsOlderThan6Months": 1825000,
    "logsOlderThan3Months": 912500,
    "oldestLogDate": "2025-01-20",
    "newestLogDate": "2026-01-20"
  },
  "message": "获取观看日志统计成功"
}
```

### 2. 手动归档（直接删除模式）

```bash
# 删除1年前的数据（默认）
curl -X POST "http://localhost:3000/api/admin/dashboard/archive-watch-logs" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "daysToKeep": 365,
    "archiveBeforeDelete": false
  }'
```

### 3. 手动归档（归档后删除模式）

```bash
# 先归档到 watch_logs_archive 表，然后删除
curl -X POST "http://localhost:3000/api/admin/dashboard/archive-watch-logs" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "daysToKeep": 365,
    "archiveBeforeDelete": true
  }'
```

**返回示例**：
```json
{
  "code": 200,
  "data": {
    "success": true,
    "message": "归档任务完成: 归档了 3650000 条记录，删除了 3650000 条记录",
    "archivedCount": 3650000,
    "deletedCount": 3650000,
    "duration": 45000
  },
  "message": "归档任务执行成功"
}
```

## ⏰ 启用定时归档（可选）

如果需要自动归档，可以启用定时任务：

### 1. 编辑服务文件

```typescript
// src/video/services/watch-logs-cleanup.service.ts

// 找到这一行（默认被注释）
// @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)

// 取消注释即可启用（每月1日凌晨执行）
@Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
async scheduledArchiveOldLogs(): Promise<void> {
  // ...
}
```

### 2. 自定义定时任务

```typescript
// 每周日凌晨3点执行
@Cron('0 3 * * 0')

// 每月1日凌晨3点执行
@Cron('0 3 1 * *')

// 每季度第一天凌晨3点执行
@Cron('0 3 1 1,4,7,10 *')
```

## 📝 归档表结构

如果选择归档模式，系统会自动创建归档表：

```sql
CREATE TABLE IF NOT EXISTS watch_logs_archive (
  id bigint NOT NULL,
  user_id bigint NOT NULL,
  episode_id int NOT NULL,
  watch_duration int NOT NULL DEFAULT 0,
  start_position int NOT NULL DEFAULT 0,
  end_position int NOT NULL DEFAULT 0,
  watch_date date NOT NULL,
  created_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_user_watch_date (user_id, watch_date),
  KEY idx_episode_watch_date (episode_id, watch_date),
  KEY idx_watch_date (watch_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

## 🎯 推荐策略

### 小型应用（<1万日活）

**策略**：每半年手动清理一次
```bash
# 保留最近180天的数据
curl -X POST "http://localhost:3000/api/admin/dashboard/archive-watch-logs" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"daysToKeep": 180, "archiveBeforeDelete": false}'
```

### 中型应用（1万-10万日活）

**策略**：每季度手动清理一次
```bash
# 保留最近1年的数据
curl -X POST "http://localhost:3000/api/admin/dashboard/archive-watch-logs" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"daysToKeep": 365, "archiveBeforeDelete": false}'
```

### 大型应用（>10万日活）

**策略**：启用每月自动归档
```typescript
// 取消注释定时任务
@Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
async scheduledArchiveOldLogs(): Promise<void> {
  await this.archiveOldLogs(365, true); // 保留1年，归档后删除
}
```

## ⚠️ 注意事项

### 1. 备份数据

归档前建议先备份数据：

```bash
# 备份 watch_logs 表
mysqldump -u username -p database_name watch_logs > watch_logs_backup.sql
```

### 2. 测试归档

在生产环境执行前，先在测试环境测试：

```bash
# 先查看统计
curl -X GET "http://localhost:3000/api/admin/dashboard/watch-logs-stats"

# 小范围测试（只删除2年前的数据）
curl -X POST "http://localhost:3000/api/admin/dashboard/archive-watch-logs" \
  -d '{"daysToKeep": 730, "archiveBeforeDelete": false}'
```

### 3. 性能影响

- 归档任务会扫描大量数据，建议在低峰期执行
- 大表归档可能需要几十分钟到几小时
- 归档期间可能会影响查询性能

### 4. 数据恢复

如果选择归档模式，可以从归档表恢复数据：

```sql
-- 从归档表恢复数据
INSERT INTO watch_logs
SELECT * FROM watch_logs_archive
WHERE watch_date >= '2025-01-01';
```

## 🔍 监控建议

### 1. 监控表大小

```sql
-- 查看表大小
SELECT 
  table_name AS 'Table',
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.TABLES
WHERE table_schema = 'your_database'
  AND table_name IN ('watch_logs', 'watch_logs_archive')
ORDER BY (data_length + index_length) DESC;
```

### 2. 监控数据增长

```sql
-- 查看每日数据增长
SELECT 
  watch_date,
  COUNT(*) as daily_count
FROM watch_logs
WHERE watch_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY watch_date
ORDER BY watch_date DESC;
```

## 📚 相关文档

- [观看时长统计升级指南](./watch-logs-upgrade-guide.md)
- [系列明细数据统计参数说明](./series-details-verification-guide.md)

## ❓ FAQ

### Q1: 归档会影响统计功能吗？

**A**: 不会。统计功能只使用最近的数据（通常是最近几个月），归档1年前的数据不会影响统计。

### Q2: 可以恢复已删除的数据吗？

**A**: 
- 如果选择了归档模式（`archiveBeforeDelete: true`），可以从 `watch_logs_archive` 表恢复
- 如果直接删除（`archiveBeforeDelete: false`），数据无法恢复，建议提前备份

### Q3: 多久归档一次比较合适？

**A**: 
- **手动归档**：建议每季度或每半年执行一次
- **自动归档**：建议每月1日凌晨执行
- 具体频率取决于数据增长速度和存储空间

### Q4: 归档任务会锁表吗？

**A**: 
- DELETE 操作会加表锁，但不会长时间锁表
- 建议在低峰期执行
- 如果担心锁表，可以分批删除：
  ```typescript
  // 分批删除，每次1万条
  for (let i = 0; i < totalCount; i += 10000) {
    await this.watchLogRepo.query(`
      DELETE FROM watch_logs 
      WHERE watch_date < ? 
      LIMIT 10000
    `, [cutoffDate]);
  }
  ```

### Q5: browse_history 表可以删除吗？

**A**: 
- 可以，`browse_history` 表已经废弃，不再使用
- 观看记录现在统一从 `watch_progress` 表获取
- 删除前建议备份数据

---

## ✅ 最佳实践总结

1. ✅ **定期查看统计**：每月检查一次表大小和数据分布
2. ✅ **测试后执行**：在测试环境验证归档逻辑后再在生产环境执行
3. ✅ **备份重要数据**：归档前先备份数据
4. ✅ **低峰期执行**：归档任务在凌晨执行，避免影响业务
5. ✅ **监控执行结果**：检查日志确认归档是否成功

祝你归档顺利！🎉
