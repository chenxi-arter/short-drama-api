# 通知系统完整 API 文档

## 概述
完整的通知系统，包括**回复通知**和**点赞通知**，支持未读标记和已读管理。

---

## 数据库变更

### 1. 回复通知表 (comments)
```sql
ALTER TABLE comments 
ADD COLUMN is_read BOOLEAN DEFAULT FALSE COMMENT '是否已读（针对回复消息）';

CREATE INDEX idx_comments_reply_to_user_is_read 
ON comments(reply_to_user_id, is_read, created_at);
```

### 2. 点赞通知表 (comment_likes)
```sql
ALTER TABLE comment_likes 
ADD COLUMN is_read BOOLEAN DEFAULT FALSE COMMENT '是否已读（针对被点赞者的通知）';

CREATE INDEX idx_comment_likes_is_read 
ON comment_likes(comment_id, is_read, created_at);
```

---

## API 接口

### 一、统一通知接口（推荐使用）

#### 1. 获取未读通知总数
**接口**: `GET /api/notifications/unread-count`  
**认证**: 需要 JWT Token  
**说明**: 一次性获取所有类型的未读通知数量

**响应示例**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "replies": 5,      // 未读回复数
    "likes": 10,       // 未读点赞数
    "total": 15        // 总未读数
  }
}
```

#### 2. 获取所有未读通知（合并列表）
**接口**: `GET /api/notifications/unread?page=1&size=20`  
**认证**: 需要 JWT Token  
**说明**: 获取回复和点赞的合并列表，按时间倒序排列

**响应示例**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "list": [
      {
        "type": "reply",
        "id": 123,
        "content": "我也觉得这集很精彩！",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "isRead": false,
        "fromUsername": "张三",
        "myComment": "这集太精彩了！",
        "seriesTitle": "热门剧集",
        "episodeNumber": 5
      },
      {
        "type": "like",
        "id": 456,
        "likedAt": "2024-01-15T10:25:00.000Z",
        "isRead": false,
        "likerUsername": "李四",
        "commentContent": "这个角色演得真好",
        "seriesTitle": "热门剧集",
        "episodeNumber": 3
      }
    ],
    "total": 15,
    "page": 1,
    "size": 20,
    "hasMore": false,
    "totalPages": 1
  }
}
```

---

### 二、回复通知接口

#### 1. 获取未读回复列表
**接口**: `GET /api/video/episode/my-unread-replies?page=1&size=20`  
**认证**: 需要 JWT Token

**响应示例**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "list": [
      {
        "id": 123,
        "content": "我也觉得这集很精彩！",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "isRead": false,
        "episodeNumber": 5,
        "episodeTitle": "第五集",
        "seriesShortId": "abc123",
        "seriesTitle": "热门剧集",
        "seriesCoverUrl": "https://...",
        "fromUserId": 789,
        "fromUsername": "张三",  // 显示优先级：nickname -> first_name+last_name -> username -> null
        "fromNickname": "张三",
        "fromPhotoUrl": "https://...",  // 用户头像URL，可能为null
        "myComment": "这集太精彩了！",
        "floorNumber": 2
      }
    ],
    "total": 5,
    "page": 1,
    "size": 20,
    "hasMore": false,
    "totalPages": 1
  }
}
```

#### 2. 标记回复为已读
**接口**: `POST /api/video/episode/replies/mark-read`  
**认证**: 需要 JWT Token

**请求体**:
```json
{
  "replyIds": [123, 124, 125]  // 可选，不传则标记所有未读回复
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "已标记为已读",
  "data": {
    "ok": true,
    "affected": 3
  }
}
```

#### 3. 获取未读回复数量
**接口**: `GET /api/video/episode/unread-reply-count`  
**认证**: 需要 JWT Token

**响应示例**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "count": 5
  }
}
```

---

### 三、点赞通知接口

#### 1. 获取未读点赞列表
**接口**: `GET /api/video/comment/my-unread-likes?page=1&size=20`  
**认证**: 需要 JWT Token

**响应示例**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "list": [
      {
        "id": 456,
        "likedAt": "2024-01-15T10:25:00.000Z",
        "isRead": false,
        "likerUserId": 789,
        "likerUsername": "李四",
        "likerNickname": "李四",
        "likerPhotoUrl": "https://...",
        "commentId": 100,
        "commentContent": "这个角色演得真好",
        "episodeShortId": "xyz789",
        "episodeNumber": 3,
        "episodeTitle": "第三集",
        "seriesShortId": "abc123",
        "seriesTitle": "热门剧集",
        "seriesCoverUrl": "https://..."
      }
    ],
    "total": 10,
    "page": 1,
    "size": 20,
    "hasMore": false,
    "totalPages": 1
  }
}
```

#### 2. 标记点赞为已读
**接口**: `POST /api/video/comment/likes/mark-read`  
**认证**: 需要 JWT Token

**请求体**:
```json
{
  "likeIds": [456, 457, 458]  // 可选，不传则标记所有未读点赞
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "已标记为已读",
  "data": {
    "ok": true,
    "affected": 3
  }
}
```

#### 3. 获取未读点赞数量
**接口**: `GET /api/video/comment/unread-like-count`  
**认证**: 需要 JWT Token

**响应示例**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "count": 10
  }
}
```

---

## 前端集成示例

### 智能轮询实现

```typescript
class NotificationPoller {
  private intervalId: number | null = null;
  private pollInterval = 30000; // 30秒
  
  async start() {
    // 立即执行一次
    await this.checkNotifications();
    
    // 定时轮询
    this.intervalId = setInterval(() => {
      this.checkNotifications();
    }, this.pollInterval);
    
    // 页面可见性变化时调整轮询频率
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pollInterval = 60000; // 后台时1分钟
      } else {
        this.pollInterval = 30000; // 前台时30秒
        this.checkNotifications(); // 立即检查
      }
      this.restart();
    });
  }
  
  async checkNotifications() {
    try {
      const response = await fetch('/api/notifications/unread-count', {
        headers: { 
          'Authorization': `Bearer ${this.getToken()}` 
        }
      });
      
      const result = await response.json();
      
      if (result.code === 200) {
        const { replies, likes, total } = result.data;
        
        // 更新UI显示
        this.updateBadge(total);
        this.updateNotificationList(replies, likes);
      }
    } catch (error) {
      console.error('轮询失败', error);
    }
  }
  
  updateBadge(count: number) {
    const badge = document.querySelector('.notification-badge');
    if (badge) {
      badge.textContent = count > 99 ? '99+' : count.toString();
      badge.style.display = count > 0 ? 'block' : 'none';
    }
  }
  
  updateNotificationList(replies: number, likes: number) {
    // 更新通知列表UI
    console.log(`未读回复: ${replies}, 未读点赞: ${likes}`);
  }
  
  restart() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.start();
  }
  
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  private getToken(): string {
    return localStorage.getItem('token') || '';
  }
}

// 使用示例
const poller = new NotificationPoller();
poller.start();

// 页面卸载时停止轮询
window.addEventListener('beforeunload', () => {
  poller.stop();
});
```

### 查看通知并标记已读

```typescript
// 1. 获取未读通知列表
async function fetchUnreadNotifications() {
  const response = await fetch('/api/notifications/unread?page=1&size=20', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const result = await response.json();
  return result.data.list;
}

// 2. 用户点击查看后，标记为已读
async function markAsRead(notification: any) {
  if (notification.type === 'reply') {
    // 标记回复为已读
    await fetch('/api/video/episode/replies/mark-read', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ replyIds: [notification.id] })
    });
  } else if (notification.type === 'like') {
    // 标记点赞为已读
    await fetch('/api/video/comment/likes/mark-read', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ likeIds: [notification.id] })
    });
  }
  
  // 重新获取未读数量
  await checkNotifications();
}

// 3. 一键全部已读
async function markAllAsRead() {
  await Promise.all([
    fetch('/api/video/episode/replies/mark-read', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({}) // 不传replyIds，标记所有
    }),
    fetch('/api/video/comment/likes/mark-read', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({}) // 不传likeIds，标记所有
    })
  ]);
}
```

---

## 数据库迁移步骤

### 开发环境
```bash
# 1. 回复通知
mysql -u your_user -p your_database < migrations/add_comment_is_read.sql

# 2. 点赞通知
mysql -u your_user -p your_database < migrations/add_comment_like_is_read.sql
```

### 生产环境
```bash
# 1. 回复通知
mysql -u your_user -p your_database < production-migrations/13_add_comment_is_read.sql

# 2. 点赞通知
mysql -u your_user -p your_database < production-migrations/14_add_comment_like_is_read.sql
```

---

## 性能优化建议

### 1. 数据库索引
已创建的索引：
- `idx_comments_reply_to_user_is_read` - 优化回复通知查询
- `idx_comment_likes_is_read` - 优化点赞通知查询

### 2. 轮询策略
- **前台活跃**: 30秒轮询一次
- **后台挂起**: 60秒轮询一次或停止
- **用户操作后**: 立即检查一次

### 3. 缓存优化（可选）
```typescript
// 使用Redis缓存未读数量
async getUnreadCounts(userId: number) {
  const cacheKey = `unread_count:${userId}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  const counts = await this.calculateUnreadCounts(userId);
  await redis.setex(cacheKey, 60, JSON.stringify(counts)); // 缓存60秒
  
  return counts;
}
```

---

## 注意事项

1. **权限控制**: 所有接口都需要JWT认证，用户只能查看自己的通知
2. **性能考虑**: 已添加数据库索引，支持高效查询
3. **默认值**: 新创建的回复和点赞默认 `is_read = false`
4. **批量操作**: 支持批量标记和一键全部已读
5. **轮询频率**: 建议30-60秒，避免过于频繁造成服务器压力

---

## API 总结

| 功能 | 接口 | 方法 |
|------|------|------|
| **统一通知数量** | `/api/notifications/unread-count` | GET |
| **统一通知列表** | `/api/notifications/unread` | GET |
| 未读回复列表 | `/api/video/episode/my-unread-replies` | GET |
| 标记回复已读 | `/api/video/episode/replies/mark-read` | POST |
| 未读回复数量 | `/api/video/episode/unread-reply-count` | GET |
| 未读点赞列表 | `/api/video/comment/my-unread-likes` | GET |
| 标记点赞已读 | `/api/video/comment/likes/mark-read` | POST |
| 未读点赞数量 | `/api/video/comment/unread-like-count` | GET |
