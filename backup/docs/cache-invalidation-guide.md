# 缓存主动失效机制指南

## 概述

本项目已实现缓存主动失效机制，在关键数据更新操作时自动清除相关缓存，确保数据一致性。

## 已实现的主动失效场景

### 1. 评论/弹幕更新

**触发条件**: 用户发表评论或弹幕时

**清除范围**:
- 视频详情缓存 (`video_details_{episodeId}`)
- 首页视频缓存 (`home_videos_*`)
- 筛选器数据缓存 (`filter_data_*`)

**实现位置**: `VideoService.addComment()`

```typescript
// 自动清除相关缓存
await this.clearVideoRelatedCache(episodeId.toString());
```

### 2. 观看进度更新

**触发条件**: 用户更新观看进度时

**清除范围**:
- 视频详情缓存 (`video_details_{episodeId}`)

**实现位置**: `VideoService.saveProgress()`

```typescript
// 清除视频详情缓存 - 更新进度信息
await this.cacheManager.del(`video_details_${episodeId}`);
```

## 缓存清除方法

### clearVideoRelatedCache()

清除特定视频相关的所有缓存

```typescript
private async clearVideoRelatedCache(videoId: string, categoryId?: number)
```

**清除内容**:
- 视频详情缓存
- 首页视频缓存（多页面）
- 筛选器数据缓存

### clearAllListCache()

清除所有列表相关缓存

```typescript
private async clearAllListCache()
```

**清除内容**:
- 首页视频缓存
- 筛选器标签缓存
- 筛选器数据缓存

## 手动清除缓存

### 使用 Redis CLI

```bash
# 连接到 Redis
redis-cli

# 清除特定缓存
DEL video_details_123
DEL home_videos_1_1

# 查看所有缓存键
KEYS *

# 清除所有缓存（谨慎使用）
FLUSHALL
```

### 批量清除脚本

```bash
#!/bin/bash
# 清除所有视频相关缓存

redis-cli <<EOF
KEYS home_videos_* | xargs DEL
KEYS filter_data_* | xargs DEL
KEYS filter_tags_* | xargs DEL
KEYS video_details_* | xargs DEL
EOF

echo "缓存清除完成"
```

## 缓存策略建议

### 数据更新场景

| 操作类型 | 清除策略 | 影响范围 |
|---------|---------|----------|
| 发表评论 | 清除视频详情 + 列表缓存 | 中等 |
| 更新进度 | 仅清除视频详情 | 最小 |
| 新增视频 | 清除所有列表缓存 | 最大 |
| 更新视频信息 | 清除相关视频缓存 | 中等 |
| 分类变更 | 清除所有缓存 | 最大 |

### 性能考虑

1. **避免过度清除**: 只清除真正受影响的缓存
2. **异步处理**: 缓存清除不影响主业务逻辑
3. **错误处理**: 缓存清除失败不影响数据更新
4. **监控日志**: 记录缓存清除操作便于调试

## 扩展建议

### 1. 添加更多数据更新场景

```typescript
// 示例：新增视频时清除缓存
async createVideo(videoData: any) {
  const video = await this.videoRepo.save(videoData);
  
  // 清除所有列表缓存
  await this.clearAllListCache();
  
  return video;
}
```

### 2. 实现缓存标签系统

```typescript
// 使用标签管理相关缓存
const tags = [`category_${categoryId}`, `video_${videoId}`];
await this.cacheManager.del(tags);
```

### 3. 缓存预热机制

```typescript
// 清除缓存后预热热门数据
async preWarmCache() {
  await this.getHomeVideos(1, 1); // 预热首页
  await this.getFiltersTags('1');  // 预热筛选器
}
```

### 4. 缓存监控

```typescript
// 添加缓存操作日志
private async logCacheOperation(operation: string, key: string) {
  console.log(`[Cache] ${operation}: ${key} at ${new Date().toISOString()}`);
}
```

## 故障排除

### 常见问题

1. **缓存清除失败**
   - 检查 Redis 连接状态
   - 查看错误日志
   - 验证缓存键格式

2. **数据仍然不一致**
   - 确认缓存清除范围是否完整
   - 检查是否有其他缓存层
   - 验证缓存键命名规则

3. **性能下降**
   - 减少不必要的缓存清除
   - 优化缓存清除范围
   - 考虑异步清除

### 调试技巧

```typescript
// 添加调试日志
private async clearVideoRelatedCache(videoId: string) {
  console.log(`开始清除视频 ${videoId} 相关缓存`);
  
  try {
    await this.cacheManager.del(`video_details_${videoId}`);
    console.log(`已清除视频详情缓存: video_details_${videoId}`);
    
    // ... 其他清除操作
    
    console.log(`视频 ${videoId} 缓存清除完成`);
  } catch (error) {
    console.error(`清除缓存失败:`, error);
  }
}
```

## 总结

通过实现主动失效机制，系统现在能够：

✅ **自动维护数据一致性** - 数据更新时自动清除相关缓存

✅ **提升用户体验** - 用户能立即看到最新数据

✅ **减少手动干预** - 大部分场景下无需手动清除缓存

✅ **保持高性能** - 智能清除策略避免过度影响性能

建议在生产环境中监控缓存命中率和清除频率，根据实际使用情况进一步优化缓存策略。