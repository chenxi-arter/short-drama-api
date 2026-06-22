# 评论盖楼功能 - 快速实施指南

## 🚀 30分钟快速上线

### Step 1: 数据库迁移（5分钟）

```bash
# 执行迁移脚本
docker exec short-drama-mysql mysql -uroot -p123456 short_drama < migrations/add_comment_reply_support.sql

# 验证字段是否添加成功
docker exec short-drama-mysql mysql -uroot -p123456 short_drama -e "DESCRIBE comments;"
```

### Step 2: 重启应用（2分钟）

已更新的 Entity 会自动生效：
```bash
npm run build
pm2 restart all
```

### Step 3: 测试接口（3分钟）

```bash
# 1. 发表主楼评论（原有接口）
curl -X POST http://localhost:8080/api/video/episode/comment \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shortId": "6JswefD4QXK",
    "content": "主楼评论"
  }'

# 返回结果会包含 id（假设为123）

# 2. 回复评论（需要实现新接口）
curl -X POST http://localhost:8080/api/video/episode/comment/reply \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "episodeShortId": "6JswefD4QXK",
    "parentId": 123,
    "content": "这是一条回复"
  }'

# 3. 查看评论（会显示回复数量）
curl http://localhost:8080/api/video/comments?episodeShortId=6JswefD4QXK&page=1&size=20
```

---

## 📊 两种实现方案对比

### 方案A: 简化版（推荐快速上线）

**优点**:
- 实现简单，1小时内完成
- 只支持一级回复（评论→回复，不支持回复→回复）
- 适合MVP和快速验证

**字段使用**:
- `parentId`: 父评论ID（非null表示是回复）
- `replyCount`: 回复数量（主楼统计）
- 其他字段暂不使用

**接口**:
1. `POST /api/video/episode/comment/reply` - 回复评论
2. `GET /api/video/comments/:id/replies` - 获取回复列表

---

### 方案B: 完整版（功能强大）

**优点**:
- 支持多级嵌套回复
- 楼层号清晰
- @提醒功能
- 适合长期运营

**字段使用**:
- `parentId`: 直接父评论
- `rootId`: 主楼ID
- `floorNumber`: 楼层号
- `replyToUserId`: 被@的用户
- `replyCount`: 回复统计

**接口**:
1. `POST /api/video/episode/comment/reply` - 支持回复任意层级
2. `GET /api/video/comments/:id/replies` - 按楼层号排序
3. `GET /api/video/comments?showReplies=true` - 主楼带回复预览

---

## 🎯 推荐实施路径

### 阶段1: 基础功能（1-2小时）

1. **执行数据库迁移**
2. **更新 Entity**（已完成）
3. **实现回复接口**（方案A，简化版）
4. **前端展示**：朋友圈式布局

```typescript
// 简化版：只需要这两个方法
class CommentService {
  // 发表回复
  async addReply(userId, episodeShortId, parentId, content) {
    const reply = this.commentRepo.create({
      userId,
      episodeShortId,
      parentId,
      rootId: parentId, // 简化版：rootId = parentId
      content,
    });
    await this.commentRepo.save(reply);
    
    // 更新主楼回复数
    await this.commentRepo.increment({ id: parentId }, 'replyCount', 1);
  }
  
  // 获取回复列表
  async getReplies(parentId, page, size) {
    return this.commentRepo.find({
      where: { parentId },
      order: { createdAt: 'ASC' },
      skip: (page - 1) * size,
      take: size,
      relations: ['user'],
    });
  }
}
```

### 阶段2: 优化体验（1-2天）

1. **添加回复预览**：主楼列表显示最新2条回复
2. **@提醒功能**：保存 replyToUserId
3. **楼层号**：计算并显示 #1楼、#2楼

### 阶段3: 高级功能（按需）

1. **多级嵌套**：回复→回复→回复
2. **热门回复**：按点赞数排序
3. **回复折叠**：超过N条自动折叠

---

## 💡 前端展示建议

### 简化版展示（推荐）

```
┌──────────────────────────────────┐
│ 👤 张三  2小时前                │
│ 这部剧太好看了！                 │
│ ❤️ 12  💬 3条回复              │
│                                  │
│ [展开回复]                       │
└──────────────────────────────────┘

点击"展开回复"后：

┌──────────────────────────────────┐
│ 👤 张三  2小时前                │
│ 这部剧太好看了！                 │
│ ❤️ 12  💬 3条回复              │
│                                  │
│ ┌────────────────────────────┐ │
│ │ 👤 李四  1小时前           │ │
│ │ 同意！                     │ │
│ │ [回复]                     │ │
│ └────────────────────────────┘ │
│                                  │
│ ┌────────────────────────────┐ │
│ │ 👤 王五  30分钟前          │ │
│ │ +1                         │ │
│ │ [回复]                     │ │
│ └────────────────────────────┘ │
└──────────────────────────────────┘
```

---

## ⚠️ 注意事项

### 1. 数据一致性
- 删除主楼时，要同时删除所有回复（ON DELETE CASCADE）
- 或者保留回复，但标记主楼已删除

### 2. 性能考虑
- 回复数量超过100时考虑分页加载
- 使用索引优化查询：`idx_parent_id`, `idx_root_id`

### 3. 用户体验
- 回复成功后自动滚动到新回复位置
- 显示"正在加载回复..."的状态
- 支持@用户自动补全

### 4. 安全控制
- 限制回复频率（1分钟内最多5条）
- 内容审核（敏感词过滤）
- 防止回复轰炸

---

## 🔧 故障排查

### 问题1: 回复数量不对
```sql
-- 修复方法：重新统计所有主楼的回复数
UPDATE comments c 
SET reply_count = (
  SELECT COUNT(*) FROM comments r 
  WHERE r.parent_id = c.id
) 
WHERE c.parent_id IS NULL;
```

### 问题2: 孤立回复（父评论被删除）
```sql
-- 查找孤立回复
SELECT * FROM comments 
WHERE parent_id IS NOT NULL 
  AND parent_id NOT IN (SELECT id FROM comments);

-- 清理孤立回复
DELETE FROM comments 
WHERE parent_id IS NOT NULL 
  AND parent_id NOT IN (SELECT id FROM comments);
```

---

## 📈 数据统计SQL

```sql
-- 1. 统计每个剧集的评论和回复数
SELECT 
  episode_short_id,
  COUNT(CASE WHEN parent_id IS NULL THEN 1 END) as main_comments,
  COUNT(CASE WHEN parent_id IS NOT NULL THEN 1 END) as replies,
  COUNT(*) as total
FROM comments
GROUP BY episode_short_id;

-- 2. 最热门的评论（回复数最多）
SELECT 
  c.id,
  c.content,
  c.reply_count,
  u.username
FROM comments c
LEFT JOIN users u ON c.user_id = u.id
WHERE c.parent_id IS NULL
ORDER BY c.reply_count DESC
LIMIT 10;

-- 3. 最活跃的评论区（按剧集）
SELECT 
  episode_short_id,
  COUNT(*) as total_interactions,
  COUNT(DISTINCT user_id) as unique_users
FROM comments
GROUP BY episode_short_id
ORDER BY total_interactions DESC
LIMIT 10;
```

---

**是否立即执行数据库迁移？**

如果确认要实施评论盖楼功能，我可以帮你：
1. ✅ 执行数据库迁移脚本
2. ✅ 实现简化版回复接口（1小时内完成）
3. ✅ 提供前端调用示例
4. ✅ 测试验证

请确认是否继续！

