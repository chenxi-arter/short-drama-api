# 评论点赞功能

## 功能说明

为评论系统添加点赞数量字段，用于记录每条评论获得的点赞总数。

## 数据库变更

### 新增字段

在 `comments` 表中添加：

| 字段名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `like_count` | INT | 0 | 点赞数量 |

### 迁移脚本

位置：`migrations/add-like-count-to-comments.sql`

执行迁移：

```bash
# 连接到数据库
mysql -u your_username -p your_database

# 执行迁移脚本
source migrations/add-like-count-to-comments.sql
```

或者直接执行：

```bash
mysql -u your_username -p your_database < migrations/add-like-count-to-comments.sql
```

## API 返回数据

### 评论列表接口

所有评论相关接口现在都会返回 `likeCount` 字段：

```json
{
  "id": 1,
  "content": "这部剧真好看！",
  "likeCount": 42,
  "replyCount": 5,
  "username": "tg123456",
  "nickname": "张三",
  "photoUrl": "https://...",
  "createdAt": "2025-11-19T00:00:00.000Z",
  "recentReplies": [
    {
      "id": 2,
      "content": "我也觉得",
      "likeCount": 10,
      "floorNumber": 1,
      "username": "tg789012",
      "nickname": "李四",
      "createdAt": "2025-11-19T00:01:00.000Z"
    }
  ]
}
```

### 影响的接口

1. **获取评论列表** - 返回主评论和回复预览的 `likeCount`
2. **获取评论回复** - 返回根评论和所有回复的 `likeCount`
3. **发表回复** - 返回新创建评论的 `likeCount`（默认为 0）

## 后续开发建议

### 1. 点赞/取消点赞接口

```typescript
// POST /api/comments/:id/like
async likeComment(commentId: number, userId: number) {
  // 1. 检查用户是否已点赞
  // 2. 如果未点赞，创建点赞记录并增加 like_count
  // 3. 如果已点赞，删除点赞记录并减少 like_count
}
```

### 2. 点赞记录表

建议创建 `comment_likes` 表记录用户点赞关系：

```sql
CREATE TABLE `comment_likes` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `comment_id` BIGINT NOT NULL,
  `user_id` BIGINT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_comment_user` (`comment_id`, `user_id`),
  INDEX `idx_user_id` (`user_id`)
) COMMENT='评论点赞记录表';
```

### 3. 获取用户点赞状态

在评论列表中返回当前用户是否已点赞：

```json
{
  "id": 1,
  "content": "这部剧真好看！",
  "likeCount": 42,
  "isLiked": true,  // 当前用户是否已点赞
  ...
}
```

### 4. 防刷机制

- 使用 Redis 缓存用户点赞状态
- 添加点赞频率限制
- 使用事务保证 `like_count` 的准确性

## 示例代码

### 点赞服务

```typescript
@Injectable()
export class CommentLikeService {
  async toggleLike(commentId: number, userId: number) {
    // 查找是否已点赞
    const existingLike = await this.commentLikeRepo.findOne({
      where: { commentId, userId }
    });

    if (existingLike) {
      // 取消点赞
      await this.commentLikeRepo.remove(existingLike);
      await this.commentRepo.decrement({ id: commentId }, 'likeCount', 1);
      return { liked: false };
    } else {
      // 点赞
      await this.commentLikeRepo.save({ commentId, userId });
      await this.commentRepo.increment({ id: commentId }, 'likeCount', 1);
      return { liked: true };
    }
  }

  async getUserLikedComments(userId: number, commentIds: number[]) {
    const likes = await this.commentLikeRepo.find({
      where: { 
        userId,
        commentId: In(commentIds)
      }
    });
    return new Set(likes.map(like => like.commentId));
  }
}
```

## 注意事项

1. ✅ 字段已添加到实体类 (`Comment.likeCount`)
2. ✅ 所有评论接口已返回 `likeCount` 字段
3. ⚠️ 需要执行数据库迁移脚本
4. ⚠️ 点赞/取消点赞功能需要单独开发
5. ⚠️ 建议创建点赞记录表记录用户点赞关系
