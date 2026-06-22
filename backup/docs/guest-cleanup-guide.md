# 游客清理功能使用指南

## 概述

游客清理功能采用**软删除策略**，将长期不活跃的游客标记为不活跃状态，而不是直接删除数据。这样既能清理系统，又能保留数据用于分析，且可以随时恢复。

## 核心特性

✅ **软删除** - 只标记为不活跃，不删除数据  
✅ **可恢复** - 被清理的游客可以随时恢复  
✅ **数据保留** - 所有关联数据（观看、收藏、评论）完整保留  
✅ **灵活配置** - 可自定义不活跃天数阈值  
✅ **自动化** - 支持定时任务自动清理  

## 清理策略说明

### 清理条件

游客会被标记为不活跃，当满足以下**所有条件**：

1. ✅ 是游客用户 (`is_guest = 1`)
2. ✅ 当前是活跃状态 (`is_active = 1`)
3. ✅ 创建时间超过指定天数（默认90天）
4. ✅ 最近N天无任何活动（默认30天无观看记录）

### 清理结果

- 用户的 `is_active` 字段从 `1` 改为 `0`
- 用户数据保留，user_id 不变
- 所有关联数据保留（观看进度、收藏、评论等）
- 可以随时恢复为活跃状态

## API接口

### 1. 清理不活跃游客

**接口**: `POST /api/auth/admin/clean-inactive-guests`

**参数**:
- `inactiveDays` (可选): 不活跃天数阈值，默认90天
- `recentActivityDays` (可选): 最近活跃天数，默认30天

**示例**:
```bash
# 使用默认参数（90天未活跃，30天无活动）
curl -X POST http://localhost:3000/api/auth/admin/clean-inactive-guests

# 自定义参数（60天未活跃，15天无活动）
curl -X POST "http://localhost:3000/api/auth/admin/clean-inactive-guests?inactiveDays=60&recentActivityDays=15"
```

**响应示例**:
```json
{
  "success": true,
  "deactivated": 156,
  "message": "已将 156 个不活跃游客标记为不活跃状态",
  "details": {
    "inactiveDays": 90,
    "recentActivityDays": 30,
    "cutoffDate": "2025-10-05T00:00:00.000Z",
    "recentDate": "2025-12-04T00:00:00.000Z"
  }
}
```

### 2. 获取游客统计信息

**接口**: `GET /api/auth/admin/guest-statistics`

**示例**:
```bash
curl http://localhost:3000/api/auth/admin/guest-statistics
```

**响应示例**:
```json
{
  "totalGuests": 5000,
  "activeGuests": 3200,
  "inactiveGuests": 1800,
  "convertedGuests": 450,
  "recentGuests": 320,
  "conversionRate": "9.00%"
}
```

**字段说明**:
- `totalGuests`: 总游客数（包括活跃和不活跃）
- `activeGuests`: 活跃游客数
- `inactiveGuests`: 不活跃游客数
- `convertedGuests`: 已转正式用户的数量
- `recentGuests`: 最近30天创建的游客数
- `conversionRate`: 游客转化率

### 3. 恢复不活跃游客

**接口**: `POST /api/auth/admin/reactivate-guest/:userId`

**示例**:
```bash
# 恢复用户ID为12345的游客
curl -X POST http://localhost:3000/api/auth/admin/reactivate-guest/12345
```

**响应示例**:
```json
{
  "success": true,
  "message": "游客已恢复为活跃状态",
  "userId": 12345
}
```

## 定时任务配置

### 启用定时任务

如果需要自动清理，需要在 AuthModule 中注册定时任务服务：

```typescript
// src/auth/auth.module.ts
import { GuestCleanupService } from './guest-cleanup.service';

@Module({
  // ...
  providers: [
    // ... 其他服务
    GuestCleanupService, // 添加这一行
  ],
})
export class AuthModule {}
```

### 定时任务说明

**每日清理任务**:
- 执行时间: 每天凌晨3点
- 清理条件: 90天未活跃，30天无活动
- 自动记录日志

**每周统计任务**:
- 执行时间: 每周一凌晨4点
- 记录游客统计数据
- 可用于监控和分析

### 自定义定时任务

修改 `guest-cleanup.service.ts` 中的 Cron 表达式：

```typescript
// 每天凌晨2点执行
@Cron('0 2 * * *')
async handleDailyCleanup() { ... }

// 每周日凌晨执行
@Cron('0 3 * * 0')
async handleWeeklyCleanup() { ... }

// 每月1号凌晨执行
@Cron('0 4 1 * *')
async handleMonthlyCleanup() { ... }
```

## 测试脚本

### 运行测试

```bash
# 完整测试
node scripts/test-guest-cleanup.js

# 指定API地址
API_BASE=http://localhost:8080/api node scripts/test-guest-cleanup.js

# 测试恢复功能
node scripts/test-guest-cleanup.js --reactivate 12345

# 查看帮助
node scripts/test-guest-cleanup.js --help
```

### 测试内容

1. 获取清理前的统计信息
2. 执行清理操作（使用测试参数）
3. 获取清理后的统计信息
4. 对比清理前后的数据变化
5. 测试恢复功能（可选）

## 使用场景

### 场景1: 定期维护

**推荐配置**:
- 不活跃天数: 90天
- 最近活跃天数: 30天
- 执行频率: 每天一次

```bash
# 手动执行
curl -X POST http://localhost:3000/api/auth/admin/clean-inactive-guests

# 或启用定时任务自动执行
```

### 场景2: 快速清理

**适用于**: 系统资源紧张，需要快速清理

```bash
# 清理60天未活跃的游客
curl -X POST "http://localhost:3000/api/auth/admin/clean-inactive-guests?inactiveDays=60&recentActivityDays=15"
```

### 场景3: 保守清理

**适用于**: 希望保留更多用户数据

```bash
# 清理180天未活跃的游客
curl -X POST "http://localhost:3000/api/auth/admin/clean-inactive-guests?inactiveDays=180&recentActivityDays=60"
```

## 数据查询

### 查询不活跃游客

```sql
-- 查询所有不活跃游客
SELECT id, nickname, created_at, is_active
FROM users
WHERE is_guest = 1 AND is_active = 0
ORDER BY created_at DESC;

-- 统计不活跃游客数量
SELECT COUNT(*) as inactive_count
FROM users
WHERE is_guest = 1 AND is_active = 0;
```

### 查询可清理的游客

```sql
-- 查询符合清理条件的游客（90天未活跃，30天无活动）
SELECT u.id, u.nickname, u.created_at, 
       MAX(wp.updated_at) as last_activity
FROM users u
LEFT JOIN watch_progress wp ON u.id = wp.user_id
WHERE u.is_guest = 1 
  AND u.is_active = 1
  AND u.created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)
GROUP BY u.id
HAVING last_activity IS NULL 
   OR last_activity < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

### 恢复所有不活跃游客

```sql
-- 批量恢复所有不活跃游客（慎用）
UPDATE users 
SET is_active = 1 
WHERE is_guest = 1 AND is_active = 0;
```

## 监控建议

### 关键指标

1. **清理数量**: 每次清理的游客数量
2. **活跃率**: 活跃游客 / 总游客
3. **转化率**: 已转正游客 / 总游客
4. **清理趋势**: 每日/每周清理数量变化

### 监控查询

```sql
-- 每日清理统计
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_guests,
  SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_guests,
  ROUND(SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as inactive_rate
FROM users
WHERE is_guest = 1
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 30;
```

## 最佳实践

### 1. 清理频率

- **推荐**: 每天凌晨执行一次
- **原因**: 避免高峰期影响性能，及时清理不活跃用户

### 2. 参数配置

- **不活跃天数**: 90-180天（根据业务需求）
- **最近活跃天数**: 30-60天
- **原则**: 宁可保守，不要激进

### 3. 监控告警

设置告警阈值：
- 单次清理数量 > 1000：可能参数设置有误
- 活跃率 < 30%：需要优化用户留存策略
- 转化率 < 5%：需要优化转化引导

### 4. 数据备份

在大规模清理前：
```bash
# 备份用户表
mysqldump -u user -p database users > users_backup_$(date +%Y%m%d).sql
```

## 常见问题

### Q1: 清理会删除用户数据吗？
A: 不会。只是将 `is_active` 改为 0，所有数据都保留。

### Q2: 清理后用户还能登录吗？
A: 不能。不活跃用户无法登录，但可以通过管理接口恢复。

### Q3: 清理会影响统计数据吗？
A: 不会。历史数据完整保留，统计不受影响。

### Q4: 如何恢复误清理的用户？
A: 使用恢复接口或直接更新数据库：
```sql
UPDATE users SET is_active = 1 WHERE id = <user_id>;
```

### Q5: 定时任务会影响性能吗？
A: 不会。任务在凌晨低峰期执行，且使用索引查询，性能影响很小。

## 故障排查

### 清理失败

**检查项**:
1. 数据库连接是否正常
2. watch_progress 表是否存在
3. 是否有足够的数据库权限

**日志查看**:
```bash
# 查看应用日志
tail -f logs/application.log | grep "GuestService"

# 查看PM2日志
pm2 logs | grep "clean"
```

### 统计数据异常

**可能原因**:
1. 数据库索引缺失
2. 数据量过大导致查询超时
3. 缓存未更新

**解决方案**:
```sql
-- 检查索引
SHOW INDEX FROM users WHERE Key_name LIKE '%guest%';

-- 重建索引
ALTER TABLE users ADD INDEX idx_is_guest (is_guest);
ALTER TABLE users ADD INDEX idx_guest_token (guest_token);
```

## 总结

游客清理功能提供了安全、灵活的用户管理方案：

- ✅ 软删除策略，数据可恢复
- ✅ 灵活配置，适应不同场景
- ✅ 自动化支持，减少人工操作
- ✅ 完整监控，及时发现问题

**建议**: 先在测试环境验证，确认无误后再在生产环境启用定时任务。
