# 🎬 短剧测试数据生成工具（API版本）

## 🆕 版本说明

这是**API版本**的测试数据生成工具，通过调用你的API接口来生成数据，而不是直接操作数据库。

### ✅ 优势

1. **真实场景**: 完全模拟真实用户使用API的场景
2. **API测试**: 顺便测试API的性能和稳定性
3. **数据一致性**: 通过API保证数据一致性，触发所有业务逻辑
4. **安全性**: 不直接操作数据库，更安全
5. **权限控制**: 遵循API的权限和验证逻辑

### 📊 对比

| 特性 | API版本 | 数据库直接版本 |
|------|---------|--------------|
| 速度 | 较慢（受API限制） | 快 |
| 真实性 | 高（完全模拟真实场景） | 低（绕过业务逻辑） |
| API测试 | ✅ 同时测试API | ❌ 不测试API |
| 数据一致性 | ✅ 完全一致 | ⚠️ 可能不一致 |
| 依赖 | 需要API运行 | 只需数据库 |

---

## 🚀 快速使用

### 1. 启动API服务

```bash
# 确保API服务正在运行
npm run start:dev
# 或
npm run start
```

API应该在 `http://localhost:8080` 运行

### 2. 运行脚本

```bash
cd scripts
node generate-drama-test-data-api.js --users 50
```

---

## 📋 功能特点

### ✅ 用户创建
- 生成指定数量的用户（默认100个）
- **包含邮箱账号**（用于登录获取token）
- **包含密码**（默认密码：`123456`）
- 短剧主题的昵称

### ✅ 通过API生成数据
- 📝 **评论接口**: `POST /api/video/episode/comment`
- ❤️ **点赞接口**: `POST /api/video/episode/activity` (type: 'like')
- ⭐ **收藏接口**: `POST /api/video/episode/activity` (type: 'favorite')

### ✅ 并发控制
- 支持自定义并发请求数（默认5）
- 自动延迟避免API压力过大
- 实时显示进度和成功/失败统计

### ✅ 两阶段生成策略
- **阶段1**: 确保每个剧集/系列都有数据
- **阶段2**: 随机分配额外数据，模拟真实分布

---

## 🎯 配置参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--api-url` | http://localhost:8080/api | API地址 |
| `--host` | localhost | 数据库地址 |
| `--port` | 3307 | 数据库端口 |
| `--user` | root | 数据库用户名 |
| `--password` | 123456 | 数据库密码 |
| `--database` | short_drama | 数据库名 |
| `--users` | 100 | 生成用户数量 |
| `--comments` | 5 | 每用户平均评论数 |
| `--likes` | 8 | 每用户平均点赞数 |
| `--favorites` | 3 | 每用户平均收藏数 |
| `--concurrent` | 5 | 并发请求数 |

---

## 💡 使用示例

### 示例1：基础使用
```bash
# 生成50个用户，使用默认配置
node generate-drama-test-data-api.js --users 50
```

### 示例2：小规模测试
```bash
# 生成10个用户，每用户3条评论
node generate-drama-test-data-api.js --users 10 --comments 3 --likes 5
```

### 示例3：大规模生成
```bash
# 生成500个用户，增加并发数加速
node generate-drama-test-data-api.js --users 500 --concurrent 10
```

### 示例4：自定义API地址
```bash
# 连接远程API
node generate-drama-test-data-api.js \
  --api-url https://api.example.com/api \
  --users 100
```

---

## 📈 运行效果

```
============================================================
📊 短剧数据生成配置（API版本）
============================================================
🌐 API地址: http://localhost:8080/api
🏢 数据库地址: localhost:3307
📚 数据库名称: short_drama
👥 用户数量: 50
💬 每用户平均评论数: 5
❤️  每用户平均点赞数: 8
⭐ 每用户平均收藏数: 3
🔄 并发请求数: 5
⏱️  请求延迟: 100ms
============================================================

📺 获取短剧剧集...
✅ 找到 100 个短剧剧集

👥 开始创建 50 个用户...
✅ 用户创建完成！共 50 个用户

💬 开始通过API生成评论...
📋 策略：确保每个剧集都有评论，然后随机分配额外评论
  阶段1: 为每个剧集至少生成 3 条评论
  阶段2: 随机分配额外的 50 条评论
  评论进度: 50/350 (成功: 48, 失败: 2)
  评论进度: 100/350 (成功: 97, 失败: 3)
  评论进度: 150/350 (成功: 145, 失败: 5)
  ...
✅ 评论生成完成！总计: 350, 成功: 340, 失败: 10
   平均每剧集 3 条评论

❤️  开始通过API生成点赞...
📋 策略：确保每个剧集都有点赞，然后随机分配额外点赞
  阶段1: 为每个剧集至少生成 5 个点赞
  阶段2: 随机分配额外的 100 个点赞
  点赞进度: 50/600 (成功: 49, 失败: 1)
  ...
✅ 点赞生成完成！总计: 600, 成功: 590, 失败: 10
   平均每剧集 5 个点赞

⭐ 开始通过API生成收藏...
📋 策略：确保每个系列都有收藏，然后随机分配额外收藏
  阶段1: 为每个系列至少生成 2 个收藏
  阶段2: 随机分配额外的 100 个收藏
  收藏进度: 50/150 (成功: 48, 失败: 2)
  ...
✅ 收藏生成完成！总计: 150, 成功: 145, 失败: 5
   平均每系列 7 个收藏

============================================================
📊 数据统计
============================================================
👥 总用户数: 50
💬 总评论数: 340
❤️  总点赞数: 590
⭐ 总收藏数: 145
📺 短剧剧集数: 100
============================================================

🎉 所有数据生成完成！
```

---

## 🔧 工作流程

### 1. 创建用户
```
在数据库中批量创建用户 → 保存邮箱和密码
```

### 2. 生成评论
```
for 每个用户:
  ↓
  登录获取token (POST /api/user/email-login)
  ↓
  发表评论 (POST /api/video/episode/comment)
```

### 3. 生成点赞
```
for 每个用户:
  ↓
  登录获取token
  ↓
  点赞剧集 (POST /api/video/episode/activity)
```

### 4. 生成收藏
```
for 每个用户:
  ↓
  登录获取token
  ↓
  收藏系列 (POST /api/video/episode/activity)
```

---

## ⚡ 性能优化

### 1. 并发控制
脚本默认使用5个并发请求，避免API压力过大。

可以根据服务器性能调整：
```bash
# 服务器性能好，可以增加并发
node generate-drama-test-data-api.js --concurrent 20

# 服务器压力大，减少并发
node generate-drama-test-data-api.js --concurrent 2
```

### 2. 请求延迟
每批请求之间有100ms延迟，可在代码中调整 `REQUEST_DELAY`

### 3. Token缓存
每次请求都会重新登录获取token，确保每个用户都经过完整的认证流程。

---

## 🔍 验证数据

### 查看生成的评论
```sql
SELECT 
  c.content,
  u.nickname,
  u.email,
  e.episode_number,
  s.title,
  c.created_at
FROM comments c
JOIN users u ON c.user_id = u.id
JOIN episodes e ON c.episode_short_id = e.short_id
JOIN series s ON e.series_id = s.id
WHERE s.category_id = 1
ORDER BY c.created_at DESC
LIMIT 20;
```

### 查看点赞统计
```sql
SELECT 
  e.id,
  e.episode_number,
  s.title,
  COUNT(r.id) as like_count
FROM episodes e
JOIN series s ON e.series_id = s.id
LEFT JOIN episode_reactions r ON r.episode_id = e.id AND r.reaction_type = 'like'
WHERE s.category_id = 1
GROUP BY e.id
ORDER BY like_count DESC
LIMIT 20;
```

### 查看收藏统计
```sql
SELECT 
  s.id,
  s.title,
  COUNT(f.id) as favorite_count
FROM series s
LEFT JOIN favorites f ON f.series_id = s.id
WHERE s.category_id = 1
GROUP BY s.id
ORDER BY favorite_count DESC
LIMIT 20;
```

---

## ⚠️ 注意事项

### 1. API服务必须运行
确保API服务在 `http://localhost:8080` 运行，否则脚本会失败。

### 2. 速度较慢
因为需要通过API，速度比直接操作数据库慢很多。建议：
- 小规模测试：10-50个用户
- 中等规模：50-200个用户
- 大规模：200-1000个用户（需要更长时间）

### 3. 失败重试
脚本不会自动重试失败的请求，但会统计成功和失败数量。

### 4. API限流
如果API有限流机制，需要调整并发数和延迟时间。

### 5. 内存占用
大量并发请求可能占用较多内存，建议根据服务器配置调整并发数。

---

## 🆚 何时使用哪个版本？

### 使用API版本 (`generate-drama-test-data-api.js`)
✅ 想测试API性能和稳定性  
✅ 需要完全模拟真实用户场景  
✅ 关注数据一致性  
✅ 测试API的并发处理能力  
✅ 有充足的时间等待生成完成

### 使用数据库直接版本 (`generate-drama-test-data.js`)
✅ 需要快速生成大量数据  
✅ 只是为了填充测试数据  
✅ 不关心API测试  
✅ 数据库操作更方便  
✅ 时间紧迫

---

## 📞 故障排查

### 问题1：API连接失败
```
Error: fetch failed
```

**解决方法**：
1. 检查API服务是否运行：`curl http://localhost:8080/api/health`
2. 检查API地址是否正确
3. 使用 `--api-url` 指定正确的地址

### 问题2：登录失败
```
登录失败: Invalid credentials
```

**解决方法**：
1. 检查用户是否创建成功
2. 检查默认密码是否正确（123456）
3. 查看数据库中的用户记录

### 问题3：大量请求失败
```
总计: 500, 成功: 100, 失败: 400
```

**解决方法**：
1. 减少并发数：`--concurrent 2`
2. 检查API日志查看错误原因
3. 检查数据库连接是否正常
4. 检查服务器资源（CPU/内存）

### 问题4：速度太慢
**优化方法**：
1. 增加并发数：`--concurrent 10`（需要服务器支持）
2. 减少用户数量：`--users 20`
3. 使用数据库直接版本

---

## ✅ 完成清单

运行成功后检查：

- [ ] 脚本运行成功，无致命错误
- [ ] 用户数据已创建（有邮箱和密码）
- [ ] 评论通过API成功创建
- [ ] 点赞通过API成功创建
- [ ] 收藏通过API成功创建
- [ ] 失败率在可接受范围内（<5%）
- [ ] 数据分布合理（每个剧集都有数据）
- [ ] API性能表现良好

---

**通过API生成真实数据，测试你的短剧应用！** 🎉

