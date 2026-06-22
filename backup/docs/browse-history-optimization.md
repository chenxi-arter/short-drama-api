# 浏览记录系统优化方案

## 优化目标

1. **限制记录数量**：每个用户最多保留100条浏览记录
2. **同系列去重**：同一个系列的浏览记录只保留最新的一条
3. **自动清理机制**：每天定时检查并清理超量记录
4. **查询性能优化**：提高获取浏览记录的查询效率

## 实现方案

### 1. 数据库索引优化

创建了 `migrations/browse_history_optimization.sql` 文件，添加以下索引：

```sql
-- 复合索引：快速查找重复记录 (userId, seriesId, browseType)
CREATE INDEX IF NOT EXISTS idx_browse_history_user_series_type 
ON browse_history (user_id, series_id, browse_type);

-- 复合索引：按用户和时间排序 (userId, updatedAt)
CREATE INDEX IF NOT EXISTS idx_browse_history_user_updated 
ON browse_history (user_id, updated_at DESC);

-- 索引：按更新时间排序，用于全局清理任务
CREATE INDEX IF NOT EXISTS idx_browse_history_updated_at 
ON browse_history (updated_at DESC);

-- 索引：用于统计查询
CREATE INDEX IF NOT EXISTS idx_browse_history_user_id 
ON browse_history (user_id);
```

### 2. 记录逻辑优化

#### 修改 `BrowseHistoryService.recordBrowseHistory()` 方法：

- **同系列去重**：移除 `browseType` 查询条件，确保同系列只保留一条记录
- **更新而非新建**：如果存在同系列记录，则更新现有记录而不是创建新记录
- **实时限制检查**：创建新记录前检查用户记录数量，超过100条时自动删除最旧的记录

```typescript
// 优化前：按 (userId, seriesId, browseType) 查找
let browseHistory = await this.browseHistoryRepo.findOne({
  where: { userId, seriesId, browseType }
});

// 优化后：按 (userId, seriesId) 查找，确保同系列只保留一条
let browseHistory = await this.browseHistoryRepo.findOne({
  where: { userId, seriesId }
});
```

### 3. 查询逻辑优化

#### 修改 `getUserBrowseHistory()` 和 `getRecentBrowsedSeries()` 方法：

- **去重查询**：使用子查询确保每个系列只返回最新的一条记录
- **性能优化**：先获取最新记录ID，再进行关联查询

```typescript
// 先获取每个系列的最新浏览记录ID
const latestRecordIds = await this.browseHistoryRepo
  .createQueryBuilder('bh')
  .select('MAX(bh.id)', 'maxId')
  .addSelect('bh.seriesId')
  .where('bh.userId = :userId', { userId })
  .groupBy('bh.seriesId')
  .getRawMany();

// 使用最新记录ID进行关联查询
const browseHistories = await this.browseHistoryRepo
  .createQueryBuilder('bh')
  .leftJoinAndSelect('bh.series', 'series')
  .leftJoinAndSelect('series.category', 'category')
  .where('bh.id IN (:...ids)', { ids: latestIds })
  .orderBy('bh.updatedAt', 'DESC')
  .getMany();
```

### 4. 定时清理任务

#### 新增 `BrowseHistoryCleanupService` 服务：

- **定时执行**：每天凌晨2点自动执行清理任务
- **批量处理**：按用户分组，批量清理超量记录
- **性能监控**：记录处理时间和清理数量

```typescript
@Cron(CronExpression.EVERY_DAY_AT_2AM)
async cleanupExcessBrowseHistory(): Promise<void> {
  // 获取所有有浏览记录的用户
  const usersWithHistory = await this.getUsersWithBrowseHistory();
  
  // 逐个用户清理超量记录
  for (const userId of usersWithHistory) {
    await this.cleanupUserBrowseHistory(userId);
  }
}
```

### 5. 管理接口

#### 新增管理接口：

- `POST /video/browse-history/cleanup-excess`：手动触发清理任务
- `GET /video/browse-history/cleanup-stats`：获取清理统计信息

## 优化效果

### 1. 数据量控制
- 每个用户最多100条记录，有效控制数据增长
- 自动清理机制确保数据量不会无限增长

### 2. 查询性能提升
- 添加复合索引，提高查询速度
- 去重查询减少返回数据量
- 子查询优化减少数据库负载

### 3. 用户体验改善
- 同系列只显示最新记录，避免重复
- 浏览记录更加精准和有用

### 4. 系统稳定性
- 定时清理任务确保系统长期稳定运行
- 实时限制检查防止单次操作造成数据爆炸

## 部署说明

### 1. 执行数据库迁移
```bash
# 执行索引创建脚本
psql -d your_database -f migrations/browse_history_optimization.sql
```

### 2. 安装依赖
```bash
npm install @nestjs/schedule
```

### 3. 重启应用
```bash
npm run start:prod
```

### 4. 验证优化效果
```bash
# 检查清理统计信息
curl -X GET "http://localhost:3000/video/browse-history/cleanup-stats"

# 手动触发清理任务
curl -X POST "http://localhost:3000/video/browse-history/cleanup-excess"
```

## 监控建议

1. **定期检查清理统计**：通过管理接口监控清理效果
2. **数据库性能监控**：观察索引使用情况和查询性能
3. **用户反馈收集**：关注用户对浏览记录功能的反馈

## 注意事项

1. **数据备份**：在执行清理任务前建议备份重要数据
2. **测试环境验证**：在生产环境部署前先在测试环境验证
3. **监控告警**：建议设置清理任务的执行状态监控
4. **用户通知**：如果清理规则有变化，建议提前通知用户

## 后续优化建议

1. **智能清理策略**：根据用户活跃度调整清理策略
2. **缓存优化**：对频繁查询的浏览记录进行缓存
3. **数据分析**：收集浏览记录数据用于用户行为分析
4. **个性化推荐**：基于浏览记录提供个性化内容推荐
