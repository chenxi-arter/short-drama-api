# 安全视频访问指南

## 概述

本文档详细说明如何从筛选结果安全获取视频详细信息和播放地址，并介绍系统中实施的防数据窃取措施。

## 数据流程

### 1. 筛选数据获取

通过筛选接口获取视频列表：

```javascript
// 获取筛选数据
POST /api/video/getconditionfilterdata
{
  "titleid": "drama",
  "ids": "0,0,0,0,0",
  "page": 1,
  "size": 21
}

// 返回数据结构
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 123,
        "uuid": "a1b2c3d4e5f6...",  // 安全的UUID标识符
        "title": "示例短剧",
        "coverUrl": "https://cdn.example.com/cover.jpg",
        "description": "剧情描述",
        "totalEpisodes": 24,
        "playCount": 15000,
        "score": "8.5"
      }
    ],
    "total": 100,
    "hasMore": true
  }
}
```

### 2. 获取视频详细信息

使用筛选结果中的 `uuid` 或 `id` 获取详细信息：

```javascript
// 推荐：使用UUID（更安全）
GET /api/video/details?uuid=a1b2c3d4e5f6...

// 或使用ID（向后兼容）
GET /api/video/details?id=123

// 返回详细信息
{
  "code": 200,
  "data": {
    "detailInfo": {
      "id": 123,
      "uuid": "a1b2c3d4e5f6...",
      "title": "示例短剧",
      "episodes": [
        {
          "episodeId": 456,
          "title": "第01集",
          "duration": 1800,
          "accessKey": "def456..."  // 播放地址访问密钥
        }
      ]
    }
  }
}
```

### 3. 安全获取播放地址

使用剧集的 `accessKey` 获取实际播放地址：

```javascript
// 通过访问密钥获取播放地址
GET /api/video/episode-url/def456...

// 返回播放地址信息
{
  "id": 789,
  "episodeId": 456,
  "quality": "720p",
  "cdnUrl": "https://cdn.example.com/video/encrypted_path.m3u8",
  "ossUrl": "https://oss.example.com/backup/video.mp4",
  "subtitleUrl": "https://cdn.example.com/subtitle.vtt",
  "episode": {
    "id": 456,
    "title": "第01集",
    "series": {
      "id": 123,
      "title": "示例短剧"
    }
  }
}
```

## 安全措施

### 1. 访问密钥机制

**实现原理：**
- 每个播放地址都有唯一的32位十六进制访问密钥
- 密钥使用加密随机数生成，无法被枚举
- 替代直接使用数据库ID访问资源

**代码实现：**
```typescript
// 生成访问密钥
static generateAccessKey(length: number = 32): string {
  return randomBytes(length / 2).toString('hex');
}

// 验证密钥格式
static isValidAccessKey(key: string): boolean {
  return /^[a-f0-9]{32}$/i.test(key);
}
```

### 2. UUID标识符

**优势：**
- 全局唯一，无法被猜测
- 不暴露数据库内部结构
- 支持分布式系统

**使用建议：**
- 优先使用UUID而非数字ID
- 在API响应中同时提供UUID和ID（兼容性）

### 3. JWT身份验证

**保护机制：**
- 所有视频相关API都需要JWT令牌
- 用户身份验证和授权
- 防止未授权访问

```typescript
@UseGuards(JwtAuthGuard)
@Controller('/api/video')
export class VideoController {
  // 所有接口都受JWT保护
}
```

### 4. 缓存策略

**安全缓存：**
- 视频详情缓存10分钟
- 使用安全的缓存键
- 自动清理过期数据

```typescript
const cacheKey = `video_details_${isUuid ? 'uuid' : 'id'}_${identifier}`;
await this.cacheManager.set(cacheKey, result, 600000); // 10分钟
```

### 5. 数据脱敏

**敏感信息保护：**
- 播放地址不直接暴露在列表接口
- 需要通过访问密钥二次获取
- 分离元数据和实际资源地址

## 防数据窃取措施

### 1. 防枚举攻击

**问题：** 攻击者可能通过遍历ID获取所有视频信息

**解决方案：**
- 使用UUID替代自增ID
- 访问密钥随机生成
- 限制API调用频率

### 2. 访问控制

**多层验证：**
```
用户请求 → JWT验证 → 参数验证 → 访问密钥验证 → 返回资源
```

### 3. 日志监控

**建议实施：**
- 记录异常访问模式
- 监控高频API调用
- 设置访问频率限制

### 4. 资源保护

**CDN配置：**
- 设置防盗链
- 时效性URL
- IP白名单

## 最佳实践

### 1. 客户端实现

```javascript
class VideoService {
  // 获取筛选数据
  async getFilteredVideos(filters) {
    const response = await this.api.post('/api/video/getconditionfilterdata', filters);
    return response.data.list;
  }
  
  // 获取视频详情（优先使用UUID）
  async getVideoDetails(video) {
    const identifier = video.uuid || video.id;
    const param = video.uuid ? 'uuid' : 'id';
    const response = await this.api.get(`/api/video/details?${param}=${identifier}`);
    return response.data.detailInfo;
  }
  
  // 获取播放地址
  async getPlayUrl(accessKey) {
    const response = await this.api.get(`/api/video/episode-url/${accessKey}`);
    return response.data;
  }
}
```

### 2. 错误处理

```javascript
try {
  const playUrl = await videoService.getPlayUrl(accessKey);
  // 播放视频
} catch (error) {
  if (error.message === '无效的访问密钥格式') {
    // 处理密钥格式错误
  } else if (error.message === '播放地址不存在') {
    // 处理资源不存在
  }
}
```

### 3. 缓存策略

```javascript
// 客户端缓存策略
class VideoCache {
  constructor() {
    this.cache = new Map();
    this.ttl = 10 * 60 * 1000; // 10分钟
  }
  
  get(key) {
    const item = this.cache.get(key);
    if (item && Date.now() - item.timestamp < this.ttl) {
      return item.data;
    }
    this.cache.delete(key);
    return null;
  }
  
  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}
```

## 总结

通过以上安全机制，系统实现了：

1. **多层安全验证**：JWT + UUID + AccessKey
2. **防枚举攻击**：随机密钥替代自增ID
3. **数据分离**：元数据与播放地址分离
4. **访问控制**：细粒度权限管理
5. **监控审计**：完整的访问日志

这种设计既保证了用户体验，又有效防止了数据被恶意窃取。