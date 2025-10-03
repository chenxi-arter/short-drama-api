# 评论盖楼（楼中楼）功能实现指南

## 📋 目录
1. [数据模型设计](#数据模型设计)
2. [接口设计](#接口设计)
3. [前端展示方案](#前端展示方案)
4. [实现步骤](#实现步骤)

---

## 数据模型设计

### 字段说明

```typescript
interface Comment {
  id: number;                    // 评论ID
  userId: number;                // 评论者用户ID
  episodeShortId: string;        // 剧集ShortID
  
  // === 盖楼相关字段 ===
  parentId?: number;             // 父评论ID（直接回复谁）
  rootId?: number;               // 根评论ID（主楼ID）
  replyToUserId?: number;        // 被回复的用户ID（用于@提醒）
  floorNumber: number;           // 楼层号（同一主楼下的序号）
  replyCount: number;            // 回复数量（仅主楼统计）
  
  content: string;               // 评论内容
  appearSecond: number;          // 弹幕时间（普通评论为0）
  createdAt: Date;               // 创建时间
  
  // 用户信息
  username?: string;
  nickname?: string;
  photoUrl?: string;
  
  // 被回复用户信息（如果是回复）
  replyToUsername?: string;
  replyToNickname?: string;
}
```

### 数据关系示例

```
主楼1 (id=1, parentId=null, rootId=null, floorNumber=0, replyCount=3)
  ├─ 回复1 (id=2, parentId=1, rootId=1, floorNumber=1)
  ├─ 回复2 (id=3, parentId=1, rootId=1, floorNumber=2)
  └─ 回复3 (id=4, parentId=1, rootId=1, floorNumber=3)
      └─ 回复3的回复 (id=5, parentId=4, rootId=1, floorNumber=4)

主楼2 (id=6, parentId=null, rootId=null, floorNumber=0, replyCount=1)
  └─ 回复1 (id=7, parentId=6, rootId=6, floorNumber=1)
```

---

## 接口设计

### 1. 发表主楼评论（原有接口）

**POST** `/api/video/episode/comment`

```typescript
// Request
{
  "shortId": "6JswefD4QXK",
  "content": "这部剧太好看了！"
}

// Response
{
  "code": 200,
  "message": "评论发表成功",
  "data": {
    "id": 1,
    "content": "这部剧太好看了！",
    "floorNumber": 0,
    "replyCount": 0,
    "createdAt": "2025-10-03T08:00:00.000Z"
  }
}
```

### 2. 回复评论（新增接口）

**POST** `/api/video/episode/comment/reply`

```typescript
// Request
{
  "episodeShortId": "6JswefD4QXK",
  "parentId": 1,              // 回复的评论ID
  "content": "我也觉得！"
}

// Response
{
  "code": 200,
  "message": "回复成功",
  "data": {
    "id": 2,
    "parentId": 1,
    "rootId": 1,
    "floorNumber": 1,
    "content": "我也觉得！",
    "replyToUsername": "张三",
    "createdAt": "2025-10-03T08:05:00.000Z"
  }
}
```

### 3. 获取主楼评论列表

**GET** `/api/video/comments?episodeShortId=xxx&page=1&size=20`

```typescript
// Response
{
  "code": 200,
  "data": {
    "comments": [
      {
        "id": 1,
        "content": "这部剧太好看了！",
        "floorNumber": 0,
        "replyCount": 3,           // 显示"3条回复"
        "username": "张三",
        "createdAt": "2025-10-03T08:00:00.000Z",
        // 最新的2-3条回复预览
        "recentReplies": [
          {
            "id": 4,
            "content": "同意！",
            "floorNumber": 3,
            "username": "李四",
            "replyToUsername": "张三",
            "createdAt": "2025-10-03T08:10:00.000Z"
          }
        ]
      }
    ],
    "total": 50,
    "page": 1,
    "size": 20
  }
}
```

### 4. 获取某条评论的所有回复

**GET** `/api/video/comments/:commentId/replies?page=1&size=20`

```typescript
// Response
{
  "code": 200,
  "data": {
    "rootComment": {
      "id": 1,
      "content": "这部剧太好看了！",
      "username": "张三",
      "replyCount": 10,
      "createdAt": "2025-10-03T08:00:00.000Z"
    },
    "replies": [
      {
        "id": 2,
        "parentId": 1,
        "floorNumber": 1,
        "content": "我也觉得！",
        "username": "李四",
        "replyToUsername": "张三",
        "createdAt": "2025-10-03T08:05:00.000Z"
      },
      {
        "id": 5,
        "parentId": 4,
        "floorNumber": 4,
        "content": "确实不错",
        "username": "王五",
        "replyToUsername": "李四",
        "createdAt": "2025-10-03T08:15:00.000Z"
      }
    ],
    "total": 10,
    "page": 1,
    "size": 20
  }
}
```

---

## 前端展示方案

### 方案A: 微信朋友圈式（推荐）

```
┌─────────────────────────────────────┐
│ 👤 张三  5分钟前                    │
│ 这部剧太好看了！                     │
│                                      │
│ 💬 3条回复                          │
│   李四 回复 张三：我也觉得！         │
│   王五 回复 李四：同意+1             │
│   ... 查看更多回复                   │
└─────────────────────────────────────┘
```

### 方案B: 知乎/B站式（楼中楼展开）

```
┌─────────────────────────────────────┐
│ 👤 张三  #1楼  5分钟前               │
│ 这部剧太好看了！                     │
│ [回复]                               │
│                                      │
│   ┌─────────────────────────────┐   │
│   │ 👤 李四  #2楼  3分钟前       │   │
│   │ @张三 我也觉得！             │   │
│   │ [回复]                       │   │
│   │                              │   │
│   │   ┌─────────────────────┐   │   │
│   │   │ 👤 王五  #3楼       │   │   │
│   │   │ @李四 同意+1        │   │   │
│   │   │ [回复]              │   │   │
│   │   └─────────────────────┘   │   │
│   └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

---

## 实现步骤

### Step 1: 执行数据库迁移

```bash
# 连接到数据库并执行迁移脚本
mysql -u root -p short_drama < migrations/add_comment_reply_support.sql
```

### Step 2: 更新 CommentService

在 `src/video/services/comment.service.ts` 中添加以下方法：

```typescript
/**
 * 发表回复评论
 */
async addReply(
  userId: number,
  episodeShortId: string,
  parentId: number,
  content: string,
): Promise<Comment> {
  // 1. 查找父评论
  const parentComment = await this.commentRepo.findOne({
    where: { id: parentId },
  });
  
  if (!parentComment) {
    throw new Error('父评论不存在');
  }
  
  // 2. 确定根评论ID（如果父评论是主楼，则根ID是父ID；否则继承父评论的根ID）
  const rootId = parentComment.rootId || parentComment.id;
  
  // 3. 计算楼层号（同一根评论下的最大楼层号+1）
  const maxFloor = await this.commentRepo
    .createQueryBuilder('comment')
    .select('MAX(comment.floorNumber)', 'max')
    .where('comment.rootId = :rootId OR comment.id = :rootId', { rootId })
    .getRawOne();
  
  const floorNumber = (maxFloor?.max || 0) + 1;
  
  // 4. 创建回复
  const reply = this.commentRepo.create({
    userId,
    episodeShortId,
    parentId,
    rootId,
    replyToUserId: parentComment.userId,
    floorNumber,
    content,
    appearSecond: 0,
  });
  
  const saved = await this.commentRepo.save(reply);
  
  // 5. 更新主楼的回复数量
  await this.commentRepo.increment(
    { id: rootId },
    'replyCount',
    1
  );
  
  // 6. 清除缓存
  await this.clearCommentCache(episodeShortId);
  
  return saved;
}

/**
 * 获取主楼评论列表（带回复预览）
 */
async getCommentsWithReplies(
  episodeShortId: string,
  page: number = 1,
  size: number = 20,
  replyPreviewCount: number = 2,
) {
  const skip = (page - 1) * size;
  
  // 1. 获取主楼评论（rootId为null）
  const [rootComments, total] = await this.commentRepo.findAndCount({
    where: { episodeShortId, rootId: IsNull() },
    order: { createdAt: 'DESC' },
    skip,
    take: size,
    relations: ['user'],
  });
  
  // 2. 批量获取每条主楼的最新N条回复
  const formattedComments = await Promise.all(
    rootComments.map(async (comment) => {
      const recentReplies = await this.commentRepo.find({
        where: { rootId: comment.id },
        order: { createdAt: 'DESC' },
        take: replyPreviewCount,
        relations: ['user'],
      });
      
      return {
        id: comment.id,
        content: comment.content,
        floorNumber: comment.floorNumber,
        replyCount: comment.replyCount,
        createdAt: comment.createdAt,
        username: comment.user?.username || null,
        nickname: comment.user?.nickname || null,
        photoUrl: comment.user?.photo_url || null,
        recentReplies: recentReplies.map(reply => ({
          id: reply.id,
          content: reply.content,
          floorNumber: reply.floorNumber,
          createdAt: reply.createdAt,
          username: reply.user?.username || null,
          nickname: reply.user?.nickname || null,
        })),
      };
    })
  );
  
  return {
    comments: formattedComments,
    total,
    page,
    size,
    totalPages: Math.ceil(total / size),
  };
}

/**
 * 获取某条评论的所有回复
 */
async getCommentReplies(
  commentId: number,
  page: number = 1,
  size: number = 20,
) {
  // 1. 获取主楼信息
  const rootComment = await this.commentRepo.findOne({
    where: { id: commentId },
    relations: ['user'],
  });
  
  if (!rootComment) {
    throw new Error('评论不存在');
  }
  
  const skip = (page - 1) * size;
  
  // 2. 获取所有回复
  const [replies, total] = await this.commentRepo.findAndCount({
    where: { rootId: commentId },
    order: { floorNumber: 'ASC' },
    skip,
    take: size,
    relations: ['user'],
  });
  
  return {
    rootComment: {
      id: rootComment.id,
      content: rootComment.content,
      username: rootComment.user?.username || null,
      nickname: rootComment.user?.nickname || null,
      replyCount: rootComment.replyCount,
      createdAt: rootComment.createdAt,
    },
    replies: replies.map(reply => ({
      id: reply.id,
      parentId: reply.parentId,
      floorNumber: reply.floorNumber,
      content: reply.content,
      createdAt: reply.createdAt,
      username: reply.user?.username || null,
      nickname: reply.user?.nickname || null,
    })),
    total,
    page,
    size,
    totalPages: Math.ceil(total / size),
  };
}
```

### Step 3: 添加控制器方法

在 `InteractionController` 中添加：

```typescript
/**
 * 回复评论
 */
@UseGuards(JwtAuthGuard)
@Post('comment/reply')
async replyComment(
  @Req() req: any,
  @Body() body: { episodeShortId: string, parentId: number, content: string }
) {
  const userId: number = req.user?.userId;
  if (!userId) return this.error('未认证', 401);
  
  const { episodeShortId, parentId, content } = body;
  
  if (!episodeShortId || !parentId || !content?.trim()) {
    throw new BadRequestException('参数缺失');
  }
  
  const result = await this.commentService.addReply(
    userId,
    episodeShortId,
    parentId,
    content.trim(),
  );
  
  return this.success(result, '回复成功', 200);
}

/**
 * 获取评论的所有回复
 */
@Get('comments/:commentId/replies')
async getCommentReplies(
  @Param('commentId') commentId: string,
  @Query('page') page?: string,
  @Query('size') size?: string,
) {
  const pageNum = Math.max(parseInt(page ?? '1', 10) || 1, 1);
  const sizeNum = Math.max(parseInt(size ?? '20', 10) || 20, 1);
  
  const result = await this.commentService.getCommentReplies(
    parseInt(commentId, 10),
    pageNum,
    sizeNum,
  );
  
  return this.success(result, '获取成功', 200);
}
```

### Step 4: 前端调用示例

```typescript
// 1. 发表主楼评论
await axios.post('/api/video/episode/comment', {
  shortId: '6JswefD4QXK',
  content: '这部剧太好看了！'
});

// 2. 回复评论
await axios.post('/api/video/episode/comment/reply', {
  episodeShortId: '6JswefD4QXK',
  parentId: 1,
  content: '我也觉得！'
});

// 3. 获取主楼列表（带回复预览）
const { data } = await axios.get('/api/video/comments', {
  params: { episodeShortId: '6JswefD4QXK', page: 1, size: 20 }
});

// 4. 点击"查看更多回复"，获取全部回复
const replies = await axios.get('/api/video/comments/1/replies', {
  params: { page: 1, size: 50 }
});
```

---

## 性能优化建议

### 1. 缓存策略
- 主楼列表缓存（5分钟）
- 热门评论回复缓存（10分钟）

### 2. 数据库优化
- 使用复合索引：`(episode_short_id, root_id, floor_number)`
- 定期清理孤立回复（父评论被删除）

### 3. 分页策略
- 主楼列表：每页20条
- 回复列表：每页50条
- 回复预览：最新2-3条

### 4. 显示策略
- 超过100条回复时，只加载最新和最早各50条
- 中间部分点击"加载更多"

---

## 扩展功能（可选）

### 1. @提醒功能
- 发送站内消息通知被@的用户
- 在回复中高亮显示@的用户名

### 2. 点赞功能
- 为每条评论/回复添加点赞数
- 热门回复排序

### 3. 举报/折叠
- 违规回复自动折叠
- 用户可举报不当内容

### 4. 热评置顶
- 点赞数高的回复自动置顶
- 作者可手动置顶

---

**文档版本**: v1.0  
**创建时间**: 2025-10-03  
**维护团队**: 短剧系统开发团队

