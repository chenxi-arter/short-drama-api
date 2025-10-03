# 收藏功能 API 文档

## 概述

收藏功能允许用户收藏喜欢的剧集，并提供收藏列表查询、添加和删除功能。

## 功能特点

- ✅ 使用统一的 Activity 接口添加收藏（推荐）
- ✅ 支持收藏单个剧集
- ✅ 使用 `shortId` 进行操作，更符合前端习惯
- ✅ 防止重复收藏
- ✅ 提供分页查询收藏列表
- ✅ 返回完整的剧集信息（封面、标题、简介、评分等）
- ✅ 自动更新收藏计数

## 接口总览

| 接口 | 方法 | 用途 | 推荐度 |
|------|------|------|--------|
| `/api/video/episode/activity` | POST | 添加收藏 | ⭐⭐⭐ 推荐 |
| `/api/user/favorites/remove` | POST | 取消收藏 | ⭐⭐⭐ |
| `/api/user/favorites` | GET | 获取收藏列表 | ⭐⭐⭐ |
| `/api/user/favorites/stats` | GET | 获取收藏统计 | ⭐⭐ |

## 数据库表结构

### `favorites` 表

```sql
CREATE TABLE `favorites` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `series_id` INT NOT NULL COMMENT '剧集系列ID',
  `episode_id` INT NULL COMMENT '剧集单集ID (如果收藏的是单集)',
  `favorite_type` ENUM('series', 'episode') NOT NULL DEFAULT 'series' COMMENT '收藏类型：系列或单集',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `UQ_USER_SERIES_EPISODE` (`user_id`, `series_id`, `episode_id`),
  INDEX `IDX_USER_ID` (`user_id`),
  INDEX `IDX_SERIES_ID` (`series_id`),
  INDEX `IDX_EPISODE_ID` (`episode_id`),
  CONSTRAINT `FK_FAVORITE_USER` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_FAVORITE_SERIES` FOREIGN KEY (`series_id`) REFERENCES `series` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_FAVORITE_EPISODE` FOREIGN KEY (`episode_id`) REFERENCES `episodes` (`id`) ON DELETE CASCADE
) COMMENT='用户收藏表';
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INT | 收藏记录ID |
| `user_id` | BIGINT | 用户ID |
| `series_id` | INT | 剧集系列ID |
| `episode_id` | INT | 单集ID（可为null） |
| `favorite_type` | ENUM | 收藏类型：`'series'`（系列）或 `'episode'`（单集） |
| `created_at` | DATETIME | 创建时间 |
| `updated_at` | DATETIME | 更新时间 |

---

## API 接口

### 1. 添加收藏（推荐）

**接口地址**: `POST /api/video/episode/activity`

**认证方式**: JWT Token (Bearer)

**说明**: 
- 这是**推荐的收藏方式**，与播放、点赞等操作统一
- 使用剧集的 `shortId` 进行操作，更符合前端使用习惯
- 会自动增加剧集的收藏计数，并在 `favorites` 表中创建收藏记录

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `shortId` | string | 是 | 剧集短ID |
| `type` | string | 是 | 操作类型，收藏时传 `"favorite"` |

**请求示例**:

```bash
curl -X POST http://localhost:3000/api/video/episode/activity \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "shortId": "6JswefD4QXK",
    "type": "favorite"
  }'
```

**返回示例**:

```json
{
  "code": 200,
  "data": {
    "episodeId": 12328,
    "shortId": "6JswefD4QXK",
    "type": "favorite"
  },
  "message": "已更新",
  "timestamp": "2025-10-03T16:13:12.796Z"
}
```

**返回字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `episodeId` | number | 剧集ID |
| `shortId` | string | 剧集短ID |
| `type` | string | 操作类型 |

---

### 2. 取消收藏

**接口地址**: `POST /api/user/favorites/remove`

**认证方式**: JWT Token (Bearer)

**说明**: 使用 `shortId` 取消收藏，与添加收藏保持一致的参数格式

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `shortId` | string | 是 | 剧集短ID |

**请求示例**:

```bash
curl -X POST http://localhost:3000/api/user/favorites/remove \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "shortId": "6JswefD4QXK"
  }'
```

**返回示例**:

```json
{
  "code": 200,
  "message": "取消收藏成功",
  "data": {
    "removed": true,
    "shortId": "6JswefD4QXK",
    "seriesId": 2448,
    "episodeId": 12328,
    "favoriteType": "episode"
  }
}
```

**返回字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `removed` | boolean | 是否成功删除 |
| `shortId` | string | 剧集短ID |
| `seriesId` | number | 剧集系列ID |
| `episodeId` | number | 剧集ID |
| `favoriteType` | string | 收藏类型（固定为 `"episode"`） |

---

### 3. 获取收藏列表（按系列聚合）

**接口地址**: `GET /api/user/favorites`

**认证方式**: JWT Token (Bearer)

**说明**: 收藏列表**按系列聚合**显示，即使用户收藏了同一系列的多集，也只显示一个系列条目

**请求参数**:

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `page` | number | 否 | 1 | 页码 |
| `size` | number | 否 | 20 | 每页数量 |

**请求示例**:

```bash
curl -X GET "http://localhost:3000/api/user/favorites?page=1&size=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**返回示例**:

```json
{
  "code": 200,
  "message": "获取收藏列表成功",
  "data": {
    "list": [
      {
        "seriesId": 2448,
        "seriesShortId": "N8Tg2KtBQPN",
        "seriesTitle": "恋爱潜伏",
        "seriesCoverUrl": "https://static.656932.com/video/cover/6a689930e440c458b19bc49cd2b240d8.gif",
        "categoryName": "短剧",
        "description": "外科医生顾念救了毒贩K后，却深陷毒枭窝中...",
        "score": "8.3",
        "playCount": 304648,
        "totalEpisodeCount": 21,
        "favoritedEpisodeCount": 3,
        "upCount": 2,
        "isCompleted": true,
        "favoriteTime": "2025-10-03 08:13"
      }
    ],
    "total": 1,
    "page": 1,
    "size": 20,
    "hasMore": false
  }
}
```

**返回字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `list` | array | 收藏列表（按系列聚合） |
| `list[].seriesId` | number | 剧集系列ID |
| `list[].seriesShortId` | string | 剧集系列短ID |
| `list[].seriesTitle` | string | 剧集标题 |
| `list[].seriesCoverUrl` | string | 剧集封面URL |
| `list[].categoryName` | string | 分类名称 |
| `list[].description` | string | 剧集简介 |
| `list[].score` | string | 评分 |
| `list[].playCount` | number | 播放次数 |
| `list[].totalEpisodeCount` | number | 该系列总集数 |
| `list[].favoritedEpisodeCount` | number | **用户收藏了该系列的集数** |
| `list[].upCount` | number | **当天新增集数**（用于角标显示"更新X集"） |
| `list[].isCompleted` | boolean | 是否完结 |
| `list[].favoriteTime` | string | 最新收藏时间（格式：YYYY-MM-DD HH:mm） |
| `total` | number | 收藏的系列总数 |
| `page` | number | 当前页码 |
| `size` | number | 每页数量 |
| `hasMore` | boolean | 是否有更多数据 |

**说明**:
- 同一系列只显示一次，无论收藏了多少集
- `favoritedEpisodeCount` 显示用户收藏了该系列的多少集
- `upCount` 显示该系列当天新增的集数，前端可用于显示"更新2集"等角标
- `favoriteTime` 为该系列最新的收藏时间
- `total` 表示收藏的系列数量（而非集数）

---

### 4. 获取收藏统计

**接口地址**: `GET /api/user/favorites/stats`

**认证方式**: JWT Token (Bearer)

**请求示例**:

```bash
curl -X GET "http://localhost:3000/api/user/favorites/stats" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**返回示例**:

```json
{
  "code": 200,
  "message": "获取统计成功",
  "data": {
    "totalSeriesFavorites": 5
  }
}
```

---

## 收藏类型说明

### `favoriteType` 字段

收藏功能通过 `favoriteType` 字段区分收藏类型：

| 值 | 说明 | `episodeId` 值 |
|----|------|----------------|
| `"series"` | 收藏整个剧集系列 | `null` |
| `"episode"` | 收藏单个剧集 | 具体的剧集ID |

### 判断逻辑

**添加收藏时**:
- 如果传入 `episodeId` → `favoriteType = "episode"`
- 如果不传 `episodeId` → `favoriteType = "series"`

**取消收藏时**:
- 需要传入与添加时相同的参数
- 取消单集收藏：传入 `seriesId` + `episodeId`
- 取消系列收藏：只传入 `seriesId`

---

## 业务逻辑

### 防止重复收藏

数据库通过 `UNIQUE KEY UQ_USER_SERIES_EPISODE (user_id, series_id, episode_id)` 约束防止重复收藏。

如果尝试收藏已收藏的内容，接口会返回已存在的收藏记录，不会创建新记录。

### 级联删除

当用户、剧集系列或单集被删除时，相关的收藏记录会自动删除（通过外键约束的 `ON DELETE CASCADE`）。

### 同一系列的多个收藏

用户可以同时：
- 收藏整个系列（`episodeId = null`）
- 收藏该系列的特定单集（`episodeId = 具体值`）

这两种收藏是独立的，互不影响。

---

## 错误处理

### 常见错误

**400 Bad Request**:
```json
{
  "code": 400,
  "message": "seriesId 必填"
}
```

**401 Unauthorized**:
```json
{
  "message": "登录信息无效或已过期",
  "error": "Unauthorized",
  "statusCode": 401
}
```

**404 Not Found** (剧集不存在):
```json
{
  "code": 404,
  "message": "剧集不存在"
}
```

---

## 使用场景

### 场景 1: 用户在观看时收藏剧集（推荐）

```bash
# 添加收藏 - 使用 Activity 接口
POST /api/video/episode/activity
{
  "shortId": "6JswefD4QXK",
  "type": "favorite"
}
```

### 场景 2: 取消收藏

```bash
# 使用 shortId 取消收藏（与添加收藏参数一致）
POST /api/user/favorites/remove
{
  "shortId": "6JswefD4QXK"
}
```

### 场景 3: 查看收藏列表

```bash
GET /api/user/favorites?page=1&size=20
```

### 场景 4: 查看收藏统计

```bash
GET /api/user/favorites/stats
```

---

## 前端集成建议

### 1. 添加收藏（推荐方式）

```typescript
/**
 * 收藏剧集 - 使用 Activity 接口
 * @param shortId 剧集短ID
 */
async function addToFavorites(shortId: string) {
  const response = await fetch('/api/video/episode/activity', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      shortId: shortId,
      type: 'favorite'
    })
  });
  
  const result = await response.json();
  
  if (result.code === 200) {
    console.log('收藏成功');
    // 更新UI状态
    updateFavoriteButton(true);
  }
}
```

### 2. 取消收藏

```typescript
/**
 * 取消收藏
 * @param shortId 剧集短ID
 */
async function removeFromFavorites(shortId: string) {
  const response = await fetch('/api/user/favorites/remove', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ shortId })
  });
  
  const result = await response.json();
  
  if (result.code === 200 && result.data.removed) {
    console.log('取消收藏成功');
    // 更新UI状态
    updateFavoriteButton(false);
  }
}
```

### 3. 检查收藏状态

```typescript
/**
 * 检查剧集是否已收藏
 * @param episodeId 剧集ID
 */
async function checkIfFavorited(episodeId: number): Promise<boolean> {
  // 获取收藏列表
  const response = await fetch('/api/user/favorites?page=1&size=100', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  
  // 检查列表中是否包含该剧集
  const isFavorited = data.data.list.some(
    (item: any) => item.episodeId === episodeId
  );
  
  return isFavorited;
}
```

### 4. 收藏列表展示

```typescript
/**
 * 加载并展示收藏列表
 */
async function loadFavorites(page: number = 1) {
  const response = await fetch(`/api/user/favorites?page=${page}&size=20`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  
  if (data.code === 200) {
    // 渲染收藏列表
    data.data.list.forEach(item => {
      renderFavoriteItem({
        favoriteId: item.favoriteId,
        seriesId: item.seriesId,
        episodeId: item.episodeId,
        title: item.seriesTitle,
        cover: item.seriesCoverUrl,
        favoriteType: item.favoriteType,
        score: item.score,
        playCount: item.playCount,
        favoriteTime: item.createdAt
      });
    });
    
    // 更新分页信息
    updatePagination({
      currentPage: data.data.page,
      total: data.data.total,
      hasMore: data.data.hasMore
    });
  }
}
```

### 5. 完整的收藏按钮组件示例

```typescript
/**
 * 收藏按钮组件
 */
class FavoriteButton {
  private shortId: string;
  private episodeId: number;
  private isFavorited: boolean = false;
  
  constructor(shortId: string, episodeId: number) {
    this.shortId = shortId;
    this.episodeId = episodeId;
    this.init();
  }
  
  async init() {
    // 检查初始收藏状态
    this.isFavorited = await checkIfFavorited(this.episodeId);
    this.render();
  }
  
  async toggle() {
    if (this.isFavorited) {
      // 取消收藏 - 使用 shortId
      await removeFromFavorites(this.shortId);
      this.isFavorited = false;
    } else {
      // 添加收藏 - 使用 shortId
      await addToFavorites(this.shortId);
      this.isFavorited = true;
    }
    this.render();
  }
  
  render() {
    // 更新按钮UI
    const button = document.getElementById('favorite-btn');
    if (button) {
      button.textContent = this.isFavorited ? '已收藏' : '收藏';
      button.className = this.isFavorited ? 'favorited' : 'not-favorited';
    }
  }
}
```

---

## 注意事项

1. **认证要求**: 所有收藏相关接口都需要 JWT 认证
2. **推荐使用 Activity 接口添加收藏**: 使用 `POST /api/video/episode/activity` 接口添加收藏，与其他用户互动操作（播放、点赞等）保持一致
3. **统一使用 shortId**: 添加和取消收藏都使用剧集的 `shortId`，参数格式完全一致，更符合前端使用习惯
4. **自动记录**: 通过 Activity 接口收藏时，会自动：
   - 增加剧集的 `favorite_count` 计数
   - 在 `favorites` 表中创建收藏记录
5. **防重复**: 重复收藏同一剧集不会报错，系统会自动处理
6. **级联删除**: 删除剧集会自动删除相关收藏记录

---

## 更新日志

### v1.3.0 (2025-10-04)
- ✅ **新增 `upCount` 字段**：显示该剧集当天新增的集数
- ✅ 前端可使用 `upCount` 显示"更新X集"角标
- ✅ 提升用户体验，及时通知剧集更新情况

### v1.2.0 (2025-10-04)
- ✅ **收藏列表按系列聚合显示**
- ✅ 显示用户收藏了该系列的集数（`favoritedEpisodeCount`）
- ✅ 同一系列只显示一次，无论收藏了多少集
- ✅ `total` 表示收藏的系列数量

### v1.1.0 (2025-10-04)
- ✅ 统一使用 `shortId` 参数
- ✅ 添加和取消收藏参数格式完全一致
- ✅ 简化前端集成，无需维护额外的ID

### v1.0.0 (2025-10-03)
- ✅ 实现基础收藏功能
- ✅ 支持单集收藏
- ✅ 提供分页查询收藏列表
- ✅ 集成到 activity 接口
- ✅ 添加收藏统计功能

