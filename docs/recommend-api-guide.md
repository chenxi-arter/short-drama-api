# 推荐功能 API 文档

**最后更新**: 2025-10-05  
**功能**: 类似抖音的随机推荐剧集功能

---

## 📋 功能概述

推荐功能提供智能的剧集推荐，类似抖音的推荐流：
- **智能推荐算法**：基于点赞、收藏、评论数
- **随机因子**：每次刷新都有新内容
- **完整信息**：剧集信息、系列信息、互动数据、评论预览
- **一键跳转**：返回系列 shortId，可直接跳转到系列详情

---

## 🔌 API 接口

### 获取推荐剧集列表

**接口地址**: `GET /api/video/recommend`

**请求参数**:
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `page` | number | 否 | 1 | 页码 |
| `size` | number | 否 | 20 | 每页数量 |

**请求示例**:
```bash
# 获取第一页（20条）
curl "http://localhost:8080/api/video/recommend"

# 获取第二页
curl "http://localhost:8080/api/video/recommend?page=2&size=20"

# 自定义每页数量
curl "http://localhost:8080/api/video/recommend?page=1&size=10"
```

**响应格式**:
```typescript
interface RecommendResponse {
  code: number;
  data: {
    list: RecommendEpisodeItem[];
    page: number;
    size: number;
    hasMore: boolean;
  };
  msg: string | null;
}

interface RecommendEpisodeItem {
  // 剧集基本信息
  shortId: string;                 // 剧集 shortId
  episodeNumber: number;           // 集数
  episodeTitle: string;            // 集数标题（如 "01"）
  title: string;                   // 剧集标题
  duration: number;                // 时长（秒）
  status: string;                  // 状态
  isVertical: boolean;             // 是否竖屏播放
  createdAt: string;               // 创建时间
  
  // 系列信息
  seriesShortId: string;           // 系列 shortId（用于跳转）
  seriesTitle: string;             // 系列标题
  seriesCoverUrl: string;          // 系列封面
  seriesDescription: string;       // 系列简介
  
  // 互动数据
  playCount: number;               // 播放次数
  likeCount: number;               // 点赞数
  dislikeCount: number;            // 不喜欢数
  favoriteCount: number;           // 收藏数
  commentCount: number;            // 评论数
  
  // 播放地址
  episodeAccessKey: string;        // 剧集访问密钥
  urls: {
    quality: string;               // 清晰度
    accessKey: string;             // 地址访问密钥
  }[];
  
  // 评论预览（最新3条）
  topComments: {
    id: number;
    shortId: string;
    content: string;
    username: string;
    avatar: string;
    createdAt: string;
    likeCount: number;
  }[];
  
  // 推荐分数（调试用）
  recommendScore?: number;
}
```

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "shortId": "6JswefD4QXK",
        "episodeNumber": 1,
        "episodeTitle": "01",
        "title": "第1集",
        "duration": 716,
        "status": "published",
        "isVertical": true,
        "createdAt": "2025-01-15 10:30:00",
        "seriesShortId": "N8Tg2KtBQPN",
        "seriesTitle": "示例剧集",
        "seriesCoverUrl": "https://example.com/cover.jpg",
        "seriesDescription": "这是一个精彩的剧集",
        "playCount": 1250,
        "likeCount": 89,
        "dislikeCount": 5,
        "favoriteCount": 42,
        "commentCount": 0,
        "episodeAccessKey": "abc123...",
        "urls": [
          {
            "quality": "720p",
            "accessKey": "url_key_123"
          }
        ],
        "topComments": [],
        "recommendScore": 523.45
      }
    ],
    "page": 1,
    "size": 20,
    "hasMore": true
  },
  "msg": null
}
```

---

## 🎯 推荐算法

### 推荐分数计算公式

```
推荐分数 = (点赞数 × 3 + 收藏数 × 5 + 评论数 × 2) + 随机因子(0-100)
```

### 权重说明

- **点赞数 × 3**: 点赞是最基础的互动
- **收藏数 × 5**: 收藏表示更强的喜爱
- **评论数 × 2**: 评论表示用户参与度
- **随机因子**: 保证内容多样性，避免推荐固化

### 筛选条件

- 只推荐 `status = 'published'` 的剧集
- 只推荐 `series.is_active = 1` 的系列
- 按推荐分数降序排列
- 加入随机排序，保证每次刷新都有不同内容

---

## 💡 使用场景

### 1. 首页推荐流

```typescript
// 加载推荐内容
async function loadRecommendFeed() {
  const response = await fetch('/api/video/recommend?page=1&size=20');
  const data = await response.json();
  
  data.data.list.forEach(episode => {
    renderEpisodeCard(episode);
  });
}

// 渲染剧集卡片
function renderEpisodeCard(episode) {
  return `
    <div class="episode-card ${episode.isVertical ? 'vertical' : 'horizontal'}">
      <img src="${episode.seriesCoverUrl}" />
      <h3>${episode.seriesTitle} - ${episode.episodeTitle}</h3>
      <div class="stats">
        <span>👍 ${episode.likeCount}</span>
        <span>⭐ ${episode.favoriteCount}</span>
        <span>💬 ${episode.commentCount}</span>
      </div>
      <button onclick="jumpToSeries('${episode.seriesShortId}')">
        查看系列
      </button>
    </div>
  `;
}
```

### 2. 无限滚动加载

```typescript
let currentPage = 1;

async function loadMore() {
  const response = await fetch(`/api/video/recommend?page=${currentPage}&size=20`);
  const data = await response.json();
  
  if (data.data.hasMore) {
    currentPage++;
    appendEpisodes(data.data.list);
  } else {
    showNoMoreContent();
  }
}

// 监听滚动事件
window.addEventListener('scroll', () => {
  if (isNearBottom()) {
    loadMore();
  }
});
```

### 3. 跳转到系列详情

```typescript
// 使用返回的 seriesShortId 跳转
function jumpToSeries(seriesShortId) {
  // 方式1：跳转到系列详情页
  window.location.href = `/series/${seriesShortId}`;
  
  // 方式2：获取系列的所有剧集
  fetch(`/api/video/episodes?seriesShortId=${seriesShortId}`)
    .then(res => res.json())
    .then(data => {
      showSeriesDetail(data);
    });
}
```

---

## 🔗 相关接口

### 1. 获取评论列表

**接口**: `GET /api/video/comments`

**参数**:
- `episodeShortId`: 剧集 shortId（必填）
- `page`: 页码（默认 1）
- `size`: 每页数量（默认 20）

**示例**:
```bash
# 获取某剧集的评论
curl "http://localhost:8080/api/video/comments?episodeShortId=6JswefD4QXK&page=1&size=20"
```

**响应**:
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 501,
        "shortId": "cmt_abc",
        "content": "太好看了！",
        "username": "用户A",
        "avatar": "https://example.com/avatar1.jpg",
        "createdAt": "2025-01-16 14:20:00",
        "likeCount": 12,
        "replyCount": 3,
        "parentId": null,
        "rootId": null
      }
    ],
    "total": 23,
    "page": 1,
    "size": 20,
    "hasMore": true
  },
  "msg": null
}
```

### 2. 剧集互动（点赞/收藏/不喜欢）

**接口**: `POST /api/video/episode/activity`

**参数**:
```json
{
  "shortId": "6JswefD4QXK",
  "type": "like" | "dislike" | "favorite" | "play"
}
```

**示例**:
```bash
# 点赞
curl -X POST "http://localhost:8080/api/video/episode/activity" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"shortId": "6JswefD4QXK", "type": "like"}'

# 收藏
curl -X POST "http://localhost:8080/api/video/episode/activity" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"shortId": "6JswefD4QXK", "type": "favorite"}'
```

### 3. 发表评论

**接口**: `POST /api/video/episode/comment`

**参数**:
```json
{
  "episodeIdentifier": "6JswefD4QXK",
  "content": "评论内容"
}
```

**示例**:
```bash
curl -X POST "http://localhost:8080/api/video/episode/comment" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "episodeIdentifier": "6JswefD4QXK",
    "content": "太好看了！"
  }'
```

### 4. 获取播放地址

**接口**: `POST /api/video/url/query`

**参数**:
```json
{
  "type": "episode",
  "accessKey": "<episodeAccessKey>"
}
```

**示例**:
```bash
curl -X POST "http://localhost:8080/api/video/url/query" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "episode",
    "accessKey": "abc123..."
  }'
```

---

## 📱 前端集成示例

### React 示例

```typescript
import React, { useState, useEffect } from 'react';

interface Episode {
  shortId: string;
  seriesShortId: string;
  seriesTitle: string;
  episodeTitle: string;
  seriesCoverUrl: string;
  likeCount: number;
  favoriteCount: number;
  commentCount: number;
  isVertical: boolean;
}

export function RecommendFeed() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadRecommend();
  }, [page]);

  async function loadRecommend() {
    const res = await fetch(`/api/video/recommend?page=${page}&size=20`);
    const data = await res.json();
    
    setEpisodes(prev => [...prev, ...data.data.list]);
    setHasMore(data.data.hasMore);
  }

  async function handleLike(shortId: string) {
    await fetch('/api/video/episode/activity', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ shortId, type: 'like' }),
    });
  }

  return (
    <div className="recommend-feed">
      {episodes.map(ep => (
        <div key={ep.shortId} className={`episode-card ${ep.isVertical ? 'vertical' : ''}`}>
          <img src={ep.seriesCoverUrl} alt={ep.seriesTitle} />
          <h3>{ep.seriesTitle} - {ep.episodeTitle}</h3>
          <div className="actions">
            <button onClick={() => handleLike(ep.shortId)}>
              👍 {ep.likeCount}
            </button>
            <button>⭐ {ep.favoriteCount}</button>
            <button>💬 {ep.commentCount}</button>
          </div>
          <button onClick={() => navigate(`/series/${ep.seriesShortId}`)}>
            查看系列
          </button>
        </div>
      ))}
      {hasMore && <button onClick={() => setPage(p => p + 1)}>加载更多</button>}
    </div>
  );
}
```

---

## ⚠️ 注意事项

1. **认证要求**:
   - 推荐接口无需认证，可公开访问
   - 互动接口（点赞、收藏、评论）需要 JWT token

2. **性能优化**:
   - 推荐结果包含随机因子，不建议缓存
   - 建议使用无限滚动而不是传统分页
   - 前端可以预加载下一页数据

3. **数据更新**:
   - 互动数据（点赞、收藏、评论）实时更新
   - 推荐分数每次请求重新计算
   - 评论预览只显示最新3条

4. **播放器适配**:
   - 使用 `isVertical` 字段判断播放器方向
   - `true`: 竖屏播放器（9:16）
   - `false`: 横屏播放器（16:9）

---

## 🔧 调试技巧

### 查看推荐分数

推荐分数会在响应中返回（`recommendScore` 字段），可用于调试推荐算法：

```bash
curl "http://localhost:8080/api/video/recommend?page=1&size=5" | jq '.data.list[] | {title, recommendScore, likeCount, favoriteCount, commentCount}'
```

### 测试随机性

多次请求同一页，观察结果是否有变化：

```bash
for i in {1..3}; do
  echo "=== 第 $i 次请求 ==="
  curl -s "http://localhost:8080/api/video/recommend?page=1&size=3" | jq '.data.list[] | .shortId'
  sleep 1
done
```

---

## 📚 相关文档

- [前端 API 使用指南](./frontend-api-guide.md)
- [评论功能文档](./frontend-api-guide.md#评论管理流程)
- [收藏功能文档](./favorites-api-guide.md)
- [剧集播放文档](./frontend-api-guide.md#剧集观看流程)
