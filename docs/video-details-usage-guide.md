# 视频详细信息获取指南

本文档详细说明如何使用 `episode` 和 `episode_url` 实体来获取视频的详细信息和播放地址。

## 数据流程概述

当你从首页视频列表获取到一个视频项时，可以通过以下步骤获取详细信息：

```json
{
  "id": 1,
  "coverUrl": "https://example.com/cover1.jpg",
  "title": "都市爱情故事",
  "score": "8.5",
  "playCount": 10000,
  "url": "1",
  "type": "首页",
  "isSerial": true,
  "upStatus": "更新到第12集",
  "upCount": 12
}
```

## 步骤1：获取系列详情

使用视频的 `id` 字段（在这个例子中是 `1`）来获取系列的详细信息：

### 接口调用
```bash
GET /api/public/video/series/1
```

### 响应数据结构
```json
{
  "id": 1,
  "title": "都市爱情故事",
  "description": "一部关于都市青年爱情生活的温馨短剧",
  "coverUrl": "https://example.com/cover1.jpg",
  "totalEpisodes": 12,
  "episodes": [
    {
      "id": 1,
      "seriesId": 1,
      "episodeNumber": 1,
      "title": "初次相遇",
      "duration": 2400,
      "status": "published",
      "playCount": 1500,
      "urls": [
        {
          "id": 13,
          "episodeId": 1,
          "quality": "720p",
          "ossUrl": "https://oss.example.com/ep1_720p.mp4",
          "cdnUrl": "https://cdn.example.com/ep1_720p.mp4",
          "subtitleUrl": "https://cdn.example.com/ep1_sub.srt",
          "accessKey": "873f47e16e1d11f0a79246ab21e67dc1"
        },
        {
          "id": 14,
          "episodeId": 1,
          "quality": "1080p",
          "ossUrl": "https://oss.example.com/ep1_1080p.mp4",
          "cdnUrl": "https://cdn.example.com/ep1_1080p.mp4",
          "subtitleUrl": "https://cdn.example.com/ep1_sub.srt",
          "accessKey": "873f48816e1d11f0a79246ab21e67dc1"
        }
      ]
    }
  ],
  "category": {
    "id": 62,
    "name": "首页",
    "type": 0
  },
  "score": 8.5,
  "playCount": 10000,
  "status": "on-going",
  "upStatus": "更新到第12集",
  "upCount": 12
}
```

## 步骤2：理解数据结构

### Episode 实体字段说明
- `id`: 剧集的唯一标识符
- `seriesId`: 所属系列的ID
- `episodeNumber`: 集数编号（第几集）
- `title`: 剧集标题
- `duration`: 播放时长（秒）
- `status`: 发布状态（published/hidden/draft）
- `playCount`: 播放次数
- `urls`: 该集的所有播放地址

### EpisodeUrl 实体字段说明
- `id`: 播放地址的唯一标识符
- `episodeId`: 所属剧集的ID
- `quality`: 视频清晰度（720p/1080p/4K）
- `ossUrl`: OSS原始地址
- `cdnUrl`: CDN加速播放地址
- `subtitleUrl`: 字幕文件地址
- `accessKey`: 防枚举攻击的访问密钥

## 步骤3：获取播放地址（需要认证）

使用 `accessKey` 来安全地获取播放地址：

### 接口调用
```bash
GET /api/video/episode-url/{accessKey}
Authorization: Bearer <JWT_TOKEN>
```

### 示例
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     "http://localhost:3000/api/video/episode-url/873f47e16e1d11f0a79246ab21e67dc1"
```

### 响应数据
```json
{
  "id": 13,
  "episodeId": 1,
  "quality": "720p",
  "ossUrl": "https://oss.example.com/ep1_720p.mp4",
  "cdnUrl": "https://cdn.example.com/ep1_720p.mp4",
  "subtitleUrl": "https://cdn.example.com/ep1_sub.srt",
  "accessKey": "873f47e16e1d11f0a79246ab21e67dc1",
  "episode": {
    "id": 1,
    "title": "初次相遇",
    "series": {
      "id": 1,
      "title": "都市爱情故事"
    }
  }
}
```

## 步骤4：播放视频

使用获取到的播放地址进行视频播放：

1. **CDN地址优先**: 优先使用 `cdnUrl` 以获得更好的播放体验
2. **OSS地址备用**: 如果CDN不可用，使用 `ossUrl`
3. **字幕支持**: 如果有 `subtitleUrl`，可以加载字幕文件
4. **清晰度选择**: 根据用户网络状况选择合适的清晰度

## 安全特性

### AccessKey 机制
- **防枚举攻击**: 使用随机生成的32位十六进制字符串
- **唯一性保证**: 每个播放地址都有唯一的访问密钥
- **安全访问**: 避免直接暴露数据库ID

### 认证要求
- 获取播放地址需要有效的JWT Token
- 保护版权内容不被未授权访问

## 完整的使用流程

```javascript
// 1. 从首页获取视频列表
const videoList = await fetch('/api/home/getvideos?catid=62');
const video = videoList.data.list[0]; // 获取第一个视频

// 2. 获取系列详情（无需认证）
const seriesDetail = await fetch(`/api/public/video/series/${video.id}`);
const episodes = seriesDetail.episodes;

// 3. 选择要播放的剧集
const firstEpisode = episodes[0];
const playUrls = firstEpisode.urls;

// 4. 选择合适的清晰度
const selectedUrl = playUrls.find(url => url.quality === '1080p') || playUrls[0];

// 5. 获取播放地址（需要认证）
const playbackInfo = await fetch(`/api/video/episode-url/${selectedUrl.accessKey}`, {
  headers: {
    'Authorization': `Bearer ${userToken}`
  }
});

// 6. 播放视频
const videoPlayer = document.getElementById('video-player');
videoPlayer.src = playbackInfo.cdnUrl;

// 7. 加载字幕（如果有）
if (playbackInfo.subtitleUrl) {
  const track = document.createElement('track');
  track.src = playbackInfo.subtitleUrl;
  track.kind = 'subtitles';
  track.srclang = 'zh';
  track.label = '中文';
  videoPlayer.appendChild(track);
}
```

## 错误处理

### 常见错误
1. **401 Unauthorized**: JWT Token无效或过期
2. **404 Not Found**: AccessKey无效或播放地址不存在
3. **403 Forbidden**: 没有访问权限

### 错误处理示例
```javascript
try {
  const response = await fetch(`/api/video/episode-url/${accessKey}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (response.status === 401) {
    // 重新登录获取新token
    await refreshToken();
  } else if (response.status === 404) {
    // 播放地址不存在，尝试其他清晰度
    console.error('播放地址不存在');
  }
} catch (error) {
  console.error('获取播放地址失败:', error);
}
```

## 最佳实践

1. **缓存策略**: 合理缓存系列详情，减少重复请求
2. **清晰度自适应**: 根据网络状况自动选择合适的清晰度
3. **错误重试**: 实现播放失败时的重试机制
4. **进度保存**: 使用 `/api/video/progress` 接口保存观看进度
5. **安全存储**: 妥善保管JWT Token，避免泄露

## 相关接口

- `GET /api/home/getvideos` - 获取首页视频列表
- `GET /api/public/video/series/:id` - 获取系列详情（无需认证）
- `GET /api/video/episode-url/:accessKey` - 获取播放地址（需要认证）
- `POST /api/video/progress` - 保存观看进度（需要认证）
- `GET /api/video/details` - 获取视频详情（需要认证，返回格式不同）