# 评论盖楼功能使用指南

## ✅ 功能已上线

评论盖楼（楼中楼）功能已成功部署，支持多级嵌套回复。

---

## 📋 接口清单

### 1. 发表主楼评论（原有接口）

**POST** `/api/video/episode/comment`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "shortId": "6JswefD4QXK",
  "content": "这是一条主楼评论"
}
```

**Response:**
```json
{
  "code": 200,
  "message": "评论发表成功",
  "data": {
    "id": 4,
    "content": "这是一条主楼评论",
    "createdAt": "2025-10-03T07:22:12.655Z"
  }
}
```

---

### 2. 回复评论（新增接口）🆕

**POST** `/api/video/episode/comment/reply`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "episodeShortId": "6JswefD4QXK",
  "parentId": 4,
  "content": "这是一条回复"
}
```

**Response:**
```json
{
  "code": 200,
  "message": "回复成功",
  "data": {
    "id": 5,
    "parentId": 4,
    "rootId": 4,
    "floorNumber": 1,
    "content": "这是一条回复",
    "createdAt": "2025-10-03T07:22:12.696Z",
    "username": "test_user",
    "nickname": null,
    "photoUrl": null,
    "replyToUsername": "main_user",
    "replyToNickname": null
  }
}
```

---

### 3. 获取评论列表（已升级）⬆️

**GET** `/api/video/comments?episodeShortId=xxx&page=1&size=20`

**说明:** 现在只返回主楼评论，并附带最新2条回复预览

**Response:**
```json
{
  "code": 200,
  "message": "获取评论成功",
  "data": {
    "comments": [
      {
        "id": 4,
        "content": "【主楼】欢迎大家来盖楼！",
        "appearSecond": 0,
        "replyCount": 4,
        "createdAt": "2025-10-03T07:22:12.655Z",
        "username": "test_commenter",
        "nickname": null,
        "photoUrl": null,
        "recentReplies": [
          {
            "id": 8,
            "content": "【4楼】回复1楼：沙发被你抢了",
            "floorNumber": 4,
            "createdAt": "2025-10-03T07:22:51.470Z",
            "username": "test_commenter",
            "nickname": null
          },
          {
            "id": 7,
            "content": "【3楼】盖楼功能真不错！",
            "floorNumber": 3,
            "createdAt": "2025-10-03T07:22:33.842Z",
            "username": "test_commenter",
            "nickname": null
          }
        ]
      }
    ],
    "total": 1,
    "page": 1,
    "size": 20,
    "totalPages": 1
  }
}
```

---

### 4. 获取某条评论的所有回复（新增）🆕

**GET** `/api/video/episode/comments/:commentId/replies?page=1&size=20`

**说明:** 获取主楼的所有回复，按楼层号升序排列

**Response:**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "rootComment": {
      "id": 4,
      "content": "【主楼】欢迎大家来盖楼！",
      "username": "test_commenter",
      "nickname": null,
      "photoUrl": null,
      "replyCount": 4,
      "createdAt": "2025-10-03T07:22:12.655Z"
    },
    "replies": [
      {
        "id": 5,
        "parentId": 4,
        "floorNumber": 1,
        "content": "【1楼】我来抢沙发！",
        "createdAt": "2025-10-03T07:22:12.696Z",
        "username": "test_commenter",
        "nickname": null,
        "photoUrl": null
      },
      {
        "id": 6,
        "parentId": 4,
        "floorNumber": 2,
        "content": "【2楼】我也来了！",
        "createdAt": "2025-10-03T07:22:33.806Z",
        "username": "test_commenter",
        "nickname": null,
        "photoUrl": null
      },
      {
        "id": 7,
        "parentId": 4,
        "floorNumber": 3,
        "content": "【3楼】盖楼功能真不错！",
        "createdAt": "2025-10-03T07:22:33.842Z",
        "username": "test_commenter",
        "nickname": null,
        "photoUrl": null
      },
      {
        "id": 8,
        "parentId": 5,
        "floorNumber": 4,
        "content": "【4楼】回复1楼：沙发被你抢了",
        "createdAt": "2025-10-03T07:22:51.470Z",
        "username": "test_commenter",
        "nickname": null,
        "photoUrl": null
      }
    ],
    "total": 4,
    "page": 1,
    "size": 20,
    "totalPages": 1
  }
}
```

---

## 🎨 前端实现建议

### 展示主楼评论列表

```tsx
// 主楼评论展示
<div className="comment-item">
  <div className="comment-header">
    <Avatar src={comment.photoUrl} name={comment.nickname || comment.username} />
    <span>{comment.nickname || comment.username}</span>
    <time>{formatTime(comment.createdAt)}</time>
  </div>
  
  <div className="comment-content">{comment.content}</div>
  
  {comment.replyCount > 0 && (
    <div className="reply-summary">
      <span>💬 {comment.replyCount}条回复</span>
      
      {/* 回复预览 */}
      {comment.recentReplies.map(reply => (
        <div key={reply.id} className="reply-preview">
          <strong>{reply.username}:</strong> {reply.content}
        </div>
      ))}
      
      {comment.replyCount > 2 && (
        <button onClick={() => loadAllReplies(comment.id)}>
          查看全部{comment.replyCount}条回复
        </button>
      )}
    </div>
  )}
  
  <button onClick={() => showReplyInput(comment.id)}>回复</button>
</div>
```

### 展示回复列表

```tsx
// 点击"查看全部回复"后展示
<div className="replies-modal">
  <div className="root-comment">
    <Avatar src={rootComment.photoUrl} />
    <div>
      <strong>{rootComment.nickname || rootComment.username}</strong>
      <p>{rootComment.content}</p>
    </div>
  </div>
  
  <div className="replies-list">
    {replies.map(reply => (
      <div key={reply.id} className="reply-item">
        <span className="floor-number">#{reply.floorNumber}楼</span>
        <Avatar src={reply.photoUrl} />
        <div>
          <strong>{reply.nickname || reply.username}</strong>
          <p>{reply.content}</p>
          <button onClick={() => replyTo(reply.id)}>回复</button>
        </div>
      </div>
    ))}
  </div>
</div>
```

---

## 💡 使用场景示例

### 场景1: 用户发表主楼评论

```bash
curl -X POST https://api.example.com/api/video/episode/comment \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shortId": "6JswefD4QXK",
    "content": "这部剧太好看了！"
  }'
```

### 场景2: 用户回复主楼

```bash
curl -X POST https://api.example.com/api/video/episode/comment/reply \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "episodeShortId": "6JswefD4QXK",
    "parentId": 4,
    "content": "我也觉得！"
  }'
```

### 场景3: 用户回复某条回复（多级嵌套）

```bash
# 回复第5条评论（这是1楼）
curl -X POST https://api.example.com/api/video/episode/comment/reply \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "episodeShortId": "6JswefD4QXK",
    "parentId": 5,
    "content": "@1楼 同意你的观点！"
  }'
```

### 场景4: 用户点击"查看全部回复"

```bash
curl https://api.example.com/api/video/episode/comments/4/replies?page=1&size=20
```

---

## 📊 数据结构说明

### 楼层关系示例

```
主楼 (id=4, parentId=null, rootId=null, floor=0, replyCount=4)
  ├─ 1楼 (id=5, parentId=4, rootId=4, floor=1)
  ├─ 2楼 (id=6, parentId=4, rootId=4, floor=2)
  ├─ 3楼 (id=7, parentId=4, rootId=4, floor=3)
  └─ 4楼 (id=8, parentId=5, rootId=4, floor=4) -- 这是回复1楼的
```

### 字段说明

- **id**: 评论唯一ID
- **parentId**: 直接父评论ID（回复谁）
  - `null`: 主楼评论
  - `非null`: 回复某条评论
- **rootId**: 根评论ID（主楼ID）
  - `null`: 自己是主楼
  - `非null`: 属于某个主楼的回复
- **floorNumber**: 楼层号（同一主楼下的序号）
  - `0`: 主楼
  - `1, 2, 3...`: 回复楼层
- **replyCount**: 回复数量
  - 仅主楼统计
  - 子回复为0

---

## 🔧 注意事项

### 1. 回复数量统计

- 只有主楼评论的 `replyCount` 会统计
- 所有回复（包括回复的回复）都会累加到主楼的 `replyCount`

### 2. 楼层号规则

- 主楼：`floorNumber = 0`
- 回复：按发表时间顺序递增（1, 2, 3...）
- 无论回复谁，楼层号都是连续的

### 3. 回复预览

- 默认显示最新2条回复
- 可通过修改 `replyPreviewCount` 参数调整

### 4. 删除逻辑

- 删除主楼会级联删除所有回复（`ON DELETE CASCADE`）
- 删除某条回复不影响其他回复

---

## 🚀 性能优化建议

### 1. 分页加载

- 主楼列表：每页20条
- 回复列表：每页50条

### 2. 缓存策略

- 热门主楼评论缓存10分钟
- 回复列表缓存5分钟

### 3. 数据库索引

已自动创建以下索引：
- `idx_parent_id`: 快速查找某条评论的回复
- `idx_root_id`: 快速查找主楼的所有回复
- `idx_episode_root`: 快速查找剧集的主楼评论

---

## 📈 API 测试示例

```bash
# 完整测试流程
BASE="https://api.example.com"
TOKEN="your_access_token"

# 1. 发表主楼
MAIN=$(curl -s -X POST "$BASE/api/video/episode/comment" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"shortId":"6JswefD4QXK","content":"主楼评论"}')
COMMENT_ID=$(echo "$MAIN" | jq -r '.data.id')

# 2. 回复主楼
curl -s -X POST "$BASE/api/video/episode/comment/reply" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"episodeShortId\":\"6JswefD4QXK\",\"parentId\":$COMMENT_ID,\"content\":\"1楼回复\"}"

# 3. 查看主楼列表
curl -s "$BASE/api/video/comments?episodeShortId=6JswefD4QXK"

# 4. 查看所有回复
curl -s "$BASE/api/video/episode/comments/$COMMENT_ID/replies"
```

---

**文档版本**: v1.0  
**更新时间**: 2025-10-03  
**功能状态**: ✅ 已上线

