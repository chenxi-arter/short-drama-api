# 剧集点赞点踩功能 API 文档

## 📋 概述

本文档说明如何对具体某一集进行点赞、点踩操作，以及如何查询用户的点赞/点踩/收藏状态。

## ✨ 功能特点

- ✅ 支持对单个剧集进行点赞/点踩
- ✅ 自动记录用户的点赞/点踩状态
- ✅ 切换点赞/点踩时自动调整计数（如从点赞切换到点踩）
- ✅ 支持取消点赞/点踩
- ✅ 在剧集列表中显示用户是否点赞、是否点踩、是否收藏
- ✅ 防止重复操作

---

## 🗄️ 数据库表结构

### `episode_reactions` 表

用户对剧集的点赞/点踩记录表。

```sql
CREATE TABLE IF NOT EXISTS `episode_reactions` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `episode_id` INT NOT NULL COMMENT '剧集ID',
  `reaction_type` VARCHAR(20) NOT NULL COMMENT '反应类型：like=点赞, dislike=点踩',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_episode_id` (`episode_id`),
  INDEX `idx_reaction_type` (`reaction_type`),
  UNIQUE INDEX `idx_user_episode` (`user_id`, `episode_id`),
  
  CONSTRAINT `fk_reaction_user` 
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) 
    ON DELETE CASCADE,
  CONSTRAINT `fk_reaction_episode` 
    FOREIGN KEY (`episode_id`) REFERENCES `episodes` (`id`) 
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户对剧集的点赞点踩记录表';
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INT | 主键ID |
| `user_id` | BIGINT | 用户ID |
| `episode_id` | INT | 剧集ID |
| `reaction_type` | VARCHAR(20) | 反应类型：`like`（点赞）或 `dislike`（点踩） |
| `created_at` | DATETIME(6) | 创建时间 |
| `updated_at` | DATETIME(6) | 更新时间 |

### 约束说明

- **唯一约束**: 一个用户对一个剧集只能有一条反应记录（`user_id`, `episode_id`）
- **外键约束**: 用户或剧集删除时，相关反应记录自动删除

---

## 🔌 API 接口

### 1. 点赞/点踩剧集

**接口地址**: `POST /api/video/episode/activity`

**认证方式**: JWT Token (Bearer)

**说明**: 
- 统一使用 activity 接口进行点赞/点踩操作
- 如果用户已有反应，切换反应类型时会自动调整计数
- 如果用户已有相同反应，则不做任何操作

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `shortId` | string | 是 | 剧集短ID |
| `type` | string | 是 | 操作类型：`like`（点赞）或 `dislike`（点踩） |

#### 请求示例

```bash
# 点赞
curl -X POST http://localhost:3000/api/video/episode/activity \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "shortId": "6JswefD4QXK",
    "type": "like"
  }'

# 点踩
curl -X POST http://localhost:3000/api/video/episode/activity \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "shortId": "6JswefD4QXK",
    "type": "dislike"
  }'
```

#### 返回示例

```json
{
  "code": 200,
  "data": {
    "episodeId": 12328,
    "shortId": "6JswefD4QXK",
    "type": "like",
    "changed": true,
    "previousType": "dislike"
  },
  "message": "已更新",
  "timestamp": "2025-10-15T16:13:12.796Z"
}
```

#### 返回字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `episodeId` | number | 剧集ID |
| `shortId` | string | 剧集短ID |
| `type` | string | 当前操作类型 |
| `changed` | boolean | 是否改变了状态（`false`表示已是该状态） |
| `previousType` | string | 之前的状态（仅当changed=true时存在） |

---

### 2. 取消点赞/点踩

**接口地址**: `POST /api/video/episode/reaction/remove`

**认证方式**: JWT Token (Bearer)

**说明**: 取消用户对某剧集的点赞或点踩，自动减少对应计数

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `shortId` | string | 是 | 剧集短ID |

#### 请求示例

```bash
curl -X POST http://localhost:3000/api/video/episode/reaction/remove \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "shortId": "6JswefD4QXK"
  }'
```

#### 返回示例

```json
{
  "code": 200,
  "data": {
    "episodeId": 12328,
    "shortId": "6JswefD4QXK",
    "removed": true
  },
  "message": "已取消",
  "timestamp": "2025-10-15T16:13:12.796Z"
}
```

#### 返回字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `episodeId` | number | 剧集ID |
| `shortId` | string | 剧集短ID |
| `removed` | boolean | 是否成功删除（`false`表示未找到反应记录） |

---

### 3. 获取剧集列表（含用户状态）

**接口地址**: `GET /api/video/episodes`

**认证方式**: JWT Token (Bearer) - 可选

**说明**: 
- 如果用户已登录，返回每集的用户点赞/点踩/收藏状态
- 如果用户未登录，用户状态字段为 `false`

#### 请求参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `seriesShortId` | string | 否 | - | 系列短ID |
| `seriesId` | number | 否 | - | 系列ID |
| `page` | number | 否 | 1 | 页码 |
| `size` | number | 否 | 20 | 每页数量 |

#### 请求示例

```bash
# 获取某系列的剧集列表（已登录）
curl -X GET "http://localhost:3000/api/video/episodes?seriesShortId=N8Tg2KtBQPN&page=1&size=20" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 获取剧集列表（未登录）
curl -X GET "http://localhost:3000/api/video/episodes?seriesShortId=N8Tg2KtBQPN&page=1&size=20"
```

#### 返回示例

```json
{
  "code": 200,
  "data": {
    "seriesInfo": {
      "id": 2448,
      "shortId": "N8Tg2KtBQPN",
      "title": "恋爱潜伏",
      "description": "外科医生顾念救了毒贩K后，却深陷毒枭窝中...",
      "coverUrl": "https://static.656932.com/video/cover/xxx.gif",
      "score": "8.3",
      "totalEpisodes": 21,
      "isCompleted": true
    },
    "list": [
      {
        "id": 12328,
        "shortId": "6JswefD4QXK",
        "episodeNumber": 1,
        "episodeTitle": "01",
        "title": "第1集",
        "duration": 300,
        "likeCount": 156,
        "dislikeCount": 12,
        "favoriteCount": 89,
        "userLiked": true,
        "userDisliked": false,
        "userFavorited": true,
        "watchProgress": 150,
        "watchPercentage": 50,
        "isWatched": false,
        "episodeAccessKey": "F5F06D9B7748D702C312D6775198E083",
        "urls": [
          {
            "quality": "720p",
            "accessKey": "abc123"
          }
        ]
      }
    ],
    "total": 21,
    "page": 1,
    "size": 20,
    "hasMore": true
  },
  "msg": null
}
```

#### 新增字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `userLiked` | boolean | 当前用户是否点赞了该集 |
| `userDisliked` | boolean | 当前用户是否点踩了该集 |
| `userFavorited` | boolean | 当前用户是否收藏了该集 |

---

### 4. 收藏剧集

**接口地址**: `POST /api/video/episode/activity`

**认证方式**: JWT Token (Bearer)

**说明**: 
- ⭐ **收藏是针对系列的**，传入任意一集的 `shortId` 会收藏整个系列
- 收藏后，该系列的所有剧集都显示为已收藏状态（`userFavorited: true`）
- 会同时增加该集的收藏计数
- 重复收藏同一系列不会报错

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `shortId` | string | 是 | 剧集短ID（该系列的任意一集） |
| `type` | string | 是 | 操作类型：`favorite` |

#### 请求示例

```bash
curl -X POST http://localhost:3000/api/video/episode/activity \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "shortId": "6JswefD4QXK",
    "type": "favorite"
  }'
```

#### 返回示例

```json
{
  "code": 200,
  "data": {
    "episodeId": 12328,
    "shortId": "6JswefD4QXK",
    "type": "favorite",
    "seriesId": 2448
  },
  "message": "已收藏系列",
  "timestamp": "2025-10-15T16:13:12.796Z"
}
```

---

### 5. 取消收藏

**接口地址**: `POST /api/user/favorites/remove`

**认证方式**: JWT Token (Bearer)

**说明**: 
- ⭐ **取消收藏是针对系列的**，传入该系列任意一集的 `shortId` 即可取消整个系列的收藏
- 取消后，该系列的所有剧集都显示为未收藏状态（`userFavorited: false`）

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `shortId` | string | 是 | 剧集短ID（该系列的任意一集） |

#### 请求示例

```bash
curl -X POST http://localhost:3000/api/user/favorites/remove \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "shortId": "6JswefD4QXK"
  }'
```

#### 返回示例

```json
{
  "code": 200,
  "message": "取消收藏成功",
  "data": {
    "removed": true,
    "shortId": "6JswefD4QXK",
    "seriesId": 2448,
    "favoriteType": "series"
  }
}
```

---

## 💡 业务逻辑说明

### 点赞/点踩切换逻辑

1. **首次点赞**: 创建点赞记录，`likeCount + 1`
2. **首次点踩**: 创建点踩记录，`dislikeCount + 1`
3. **从点赞切换到点踩**: 更新记录类型，`likeCount - 1`, `dislikeCount + 1`
4. **从点踩切换到点赞**: 更新记录类型，`dislikeCount - 1`, `likeCount + 1`
5. **重复点赞/点踩**: 不做任何操作，返回 `changed: false`

### 唯一性保证

- 通过数据库唯一索引 `(user_id, episode_id)` 保证一个用户对一个剧集只能有一条反应记录
- 用户可以在点赞和点踩之间切换，但不能同时点赞和点踩

### 级联删除

- 当用户被删除时，该用户的所有点赞/点踩记录自动删除
- 当剧集被删除时，该剧集的所有点赞/点踩记录自动删除

---

## 🔄 使用场景

### 场景 1: 用户点赞某集

```bash
POST /api/video/episode/activity
{
  "shortId": "6JswefD4QXK",
  "type": "like"
}

# 返回
{
  "code": 200,
  "data": {
    "episodeId": 12328,
    "shortId": "6JswefD4QXK",
    "type": "like",
    "changed": true
  },
  "message": "已更新"
}
```

### 场景 2: 用户从点赞切换到点踩

```bash
# 第一次点赞
POST /api/video/episode/activity
{ "shortId": "6JswefD4QXK", "type": "like" }

# 切换为点踩
POST /api/video/episode/activity
{ "shortId": "6JswefD4QXK", "type": "dislike" }

# 返回
{
  "data": {
    "type": "dislike",
    "changed": true,
    "previousType": "like"
  }
}
```

### 场景 3: 用户重复点赞

```bash
# 第一次点赞
POST /api/video/episode/activity
{ "shortId": "6JswefD4QXK", "type": "like" }

# 再次点赞
POST /api/video/episode/activity
{ "shortId": "6JswefD4QXK", "type": "like" }

# 返回
{
  "data": {
    "type": "like",
    "changed": false,
    "previousType": "like"
  },
  "message": "已是该状态"
}
```

### 场景 4: 用户取消点赞

```bash
POST /api/video/episode/reaction/remove
{ "shortId": "6JswefD4QXK" }

# 返回
{
  "data": {
    "removed": true
  },
  "message": "已取消"
}
```

### 场景 5: 查看剧集列表时显示用户状态

```bash
GET /api/video/episodes?seriesShortId=N8Tg2KtBQPN
Authorization: Bearer YOUR_TOKEN

# 返回的每一集都包含：
{
  "userLiked": true,      // 用户已点赞
  "userDisliked": false,  // 用户未点踩
  "userFavorited": true   // 用户已收藏
}
```

---

## 🎨 前端集成示例

### 1. 点赞/点踩按钮组件

```typescript
class ReactionButtons {
  private shortId: string;
  private userLiked: boolean = false;
  private userDisliked: boolean = false;
  
  constructor(shortId: string, userLiked: boolean, userDisliked: boolean) {
    this.shortId = shortId;
    this.userLiked = userLiked;
    this.userDisliked = userDisliked;
    this.render();
  }
  
  async like() {
    if (this.userLiked) {
      // 取消点赞
      await this.removeReaction();
      this.userLiked = false;
    } else {
      // 点赞（如果已点踩，会自动切换）
      await this.react('like');
      this.userLiked = true;
      this.userDisliked = false;
    }
    this.render();
  }
  
  async dislike() {
    if (this.userDisliked) {
      // 取消点踩
      await this.removeReaction();
      this.userDisliked = false;
    } else {
      // 点踩（如果已点赞，会自动切换）
      await this.react('dislike');
      this.userDisliked = true;
      this.userLiked = false;
    }
    this.render();
  }
  
  private async react(type: 'like' | 'dislike') {
    const response = await fetch('/api/video/episode/activity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      },
      body: JSON.stringify({ shortId: this.shortId, type })
    });
    return response.json();
  }
  
  private async removeReaction() {
    const response = await fetch('/api/video/episode/reaction/remove', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      },
      body: JSON.stringify({ shortId: this.shortId })
    });
    return response.json();
  }
  
  private render() {
    // 更新UI显示
    const likeBtn = document.getElementById('like-btn');
    const dislikeBtn = document.getElementById('dislike-btn');
    
    if (likeBtn) {
      likeBtn.className = this.userLiked ? 'active' : '';
    }
    if (dislikeBtn) {
      dislikeBtn.className = this.userDisliked ? 'active' : '';
    }
  }
  
  private getToken(): string {
    // 从localStorage或cookie获取token
    return localStorage.getItem('access_token') || '';
  }
}

// 使用示例
const episode = {
  shortId: '6JswefD4QXK',
  userLiked: true,
  userDisliked: false
};

const reactionButtons = new ReactionButtons(
  episode.shortId,
  episode.userLiked,
  episode.userDisliked
);
```

### 2. 收藏按钮组件

```typescript
class FavoriteButton {
  private shortId: string;
  private isFavorited: boolean = false;
  
  constructor(shortId: string, isFavorited: boolean) {
    this.shortId = shortId;
    this.isFavorited = isFavorited;
    this.render();
  }
  
  async toggle() {
    if (this.isFavorited) {
      // 取消收藏
      await this.removeFavorite();
      this.isFavorited = false;
    } else {
      // 添加收藏
      await this.addFavorite();
      this.isFavorited = true;
    }
    this.render();
  }
  
  private async addFavorite() {
    const response = await fetch('/api/video/episode/activity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      },
      body: JSON.stringify({ shortId: this.shortId, type: 'favorite' })
    });
    return response.json();
  }
  
  private async removeFavorite() {
    const response = await fetch('/api/user/favorites/remove', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      },
      body: JSON.stringify({ shortId: this.shortId })
    });
    return response.json();
  }
  
  private render() {
    const btn = document.getElementById('favorite-btn');
    if (btn) {
      btn.textContent = this.isFavorited ? '已收藏' : '收藏';
      btn.className = this.isFavorited ? 'favorited' : '';
    }
  }
  
  private getToken(): string {
    return localStorage.getItem('access_token') || '';
  }
}
```

---

## ⚠️ 注意事项

1. **认证要求**: 所有点赞/点踩/收藏接口都需要 JWT 认证
2. **幂等性**: 重复的点赞/点踩/收藏操作不会报错，API会正确处理
3. **状态互斥**: 用户不能同时点赞和点踩同一集，切换会自动调整计数
4. **性能优化**: 剧集列表接口使用批量查询，一次性获取所有用户状态，避免N+1查询
5. **数据一致性**: 通过数据库唯一索引和外键约束保证数据一致性

---

## 📊 数据库迁移

执行以下SQL脚本创建 `episode_reactions` 表：

```bash
# 如果是Docker中的MySQL
docker exec -i <mysql容器名> mysql -u<用户名> -p<密码> <数据库名> < migrations/add_episode_reactions.sql

# 或者进入MySQL容器执行
docker exec -it <mysql容器名> bash
mysql -u<用户名> -p<密码> <数据库名>
SOURCE /path/to/migrations/add_episode_reactions.sql;
```

---

## 🔗 相关文档

- [收藏功能 API 文档](./favorites-api-guide.md)
- [评论功能 API 文档](./comment-reply-usage-guide.md)
- [前端 API 使用指南](./frontend-api-guide.md)

---

## 📝 更新日志

### v1.0.0 (2025-10-15)
- ✅ 实现剧集点赞/点踩功能
- ✅ 支持点赞/点踩状态切换
- ✅ 支持取消点赞/点踩
- ✅ 剧集列表返回用户点赞/点踩/收藏状态
- ✅ 批量查询优化，提升性能

