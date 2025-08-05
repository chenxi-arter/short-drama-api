# Redis 缓存配置和使用指南

## 环境配置

在 `.env` 文件中已添加以下 Redis 配置：

```env
# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TTL=300
```

### 配置说明

- `REDIS_HOST`: Redis 服务器地址，默认 localhost
- `REDIS_PORT`: Redis 端口，默认 6379
- `REDIS_PASSWORD`: Redis 密码，如果没有密码则留空
- `REDIS_DB`: Redis 数据库编号，默认 0
- `REDIS_TTL`: 默认缓存过期时间（秒），默认 300 秒（5分钟）

## 安装 Redis

### macOS 安装
```bash
# 使用 Homebrew 安装
brew install redis

# 启动 Redis 服务
brew services start redis

# 或者手动启动
redis-server
```

### Docker 安装
```bash
# 拉取 Redis 镜像
docker pull redis:latest

# 运行 Redis 容器
docker run -d --name redis -p 6379:6379 redis:latest
```

## 缓存主动失效机制

本项目已实现缓存主动失效机制，在关键数据更新操作时自动清除相关缓存，确保数据一致性。

### 已实现的主动失效场景

#### 1. 评论/弹幕更新

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

#### 2. 观看进度更新

**触发条件**: 用户更新观看进度时

**清除范围**:
- 视频详情缓存 (`video_details_{episodeId}`)

**实现位置**: `VideoService.saveProgress()`

```typescript
// 清除视频详情缓存 - 更新进度信息
await this.cacheManager.del(`video_details_${episodeId}`);
```

### 缓存清除方法

#### clearVideoRelatedCache()

清除特定视频相关的所有缓存

```typescript
private async clearVideoRelatedCache(videoId: string, categoryId?: number)
```

**清除内容**:
- 视频详情缓存
- 首页视频缓存（多页面）
- 筛选器数据缓存

#### clearAllListCache()

清除所有列表相关缓存

```typescript
private async clearAllListCache()
```

**清除内容**:
- 首页视频缓存
- 筛选器标签缓存
- 筛选器数据缓存

### 手动清除缓存

#### 使用 Redis CLI

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

#### 批量清除脚本

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

## 已缓存的接口

以下接口已添加 Redis 缓存优化：

### 1. 首页视频接口
- **路径**: `/api/home/getvideos`
- **缓存键**: `home_videos_{channeid}_{page}`
- **缓存时间**: 5分钟
- **说明**: 缓存首页视频列表，包括轮播图、筛选器和视频列表

### 2. 筛选器标签接口
- **路径**: `/api/list/getfilterstags`
- **缓存键**: `filter_tags_{channeid}`
- **缓存时间**: 10分钟
- **说明**: 缓存筛选器标签配置，变化频率较低

### 3. 筛选器数据接口
- **路径**: `/api/list/getfiltersdata`
- **缓存键**: `filter_data_{channeid}_{ids}_{page}`
- **缓存时间**: 3分钟
- **说明**: 缓存筛选后的视频列表数据

### 4. 视频详情接口
- **路径**: `/api/video/details`
- **缓存键**: `video_details_{id}`
- **缓存时间**: 10分钟
- **说明**: 缓存视频详情信息，包括剧集列表

## 性能提升效果

### 预期性能提升
- **首次请求**: 正常数据库查询时间
- **缓存命中**: 响应时间减少 80-95%
- **数据库负载**: 显著降低，特别是热门内容

### 缓存策略
- **热点数据**: 较长缓存时间（10分钟）
- **动态数据**: 较短缓存时间（3-5分钟）
- **自动过期**: 避免数据过时问题

## 监控和调试

### 查看 Redis 状态
```bash
# 连接到 Redis
redis-cli

# 查看所有键
KEYS *

# 查看特定缓存
GET home_videos_1_1

# 查看缓存过期时间
TTL home_videos_1_1

# 清除所有缓存
FLUSHALL
```

### 缓存命中率监控
```bash
# 查看 Redis 统计信息
redis-cli INFO stats
```

## 生产环境建议

### Redis 配置优化
```env
# 生产环境配置示例
REDIS_HOST=your-redis-server.com
REDIS_PORT=6379
REDIS_PASSWORD=your-strong-password
REDIS_DB=0
REDIS_TTL=600  # 10分钟
```

### 安全建议
1. 设置强密码
2. 限制网络访问
3. 定期备份
4. 监控内存使用

### 扩展建议
1. 使用 Redis Cluster 进行水平扩展
2. 配置主从复制提高可用性
3. 使用 Redis Sentinel 进行故障转移

## 故障排除

### 常见问题

1. **连接失败**
   - 检查 Redis 服务是否启动
   - 验证连接配置
   - 检查防火墙设置

2. **缓存不生效**
   - 检查缓存键是否正确
   - 验证 TTL 设置
   - 查看应用日志

3. **内存不足**
   - 调整 Redis 内存限制
   - 优化缓存策略
   - 清理过期数据

### 日志监控
应用启动时会显示 Redis 连接状态，注意观察相关日志信息。