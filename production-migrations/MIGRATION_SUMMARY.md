# 数据库结构变更说明（给DBA）

## 📌 变更原因概述

本次数据库迁移主要解决三个核心问题：

### 1. **广告系统支持** (01_advertising_system.sql)
**业务需求**：需要追踪广告投放效果和转化数据  
**变更内容**：新增5张表
- `advertising_platforms` - 广告平台管理
- `advertising_campaigns` - 投放计划
- `advertising_events` - 事件追踪
- `advertising_conversions` - 转化记录
- `advertising_campaign_stats` - 统计汇总

**影响**：无，纯新增表，不影响现有功能

---

### 2. **数据删除问题修复** (02, 03)
**问题**：删除剧集时报外键约束错误，无法清理关联数据  
**原因**：外键设置为 `RESTRICT`，阻止级联删除  
**解决方案**：修改外键为 `CASCADE DELETE`
- `episode_urls.episode_id` → CASCADE
- `watch_progress.episode_id` → CASCADE

**影响**：删除剧集时自动清理播放地址和观看进度，避免孤立数据

---

### 3. **评论点赞功能** (04, 05)
**业务需求**：用户需要对评论点赞，提升互动性  
**变更内容**：
- `comments` 表添加 `like_count` 字段（INT，默认0）
- 新增 `comment_likes` 表记录点赞关系

**技术要点**：
- 唯一索引 `(user_id, comment_id)` 防止重复点赞
- 级联删除：删除评论时自动清理点赞记录
- 级联删除：删除用户时自动清理其点赞记录

**影响**：无，向后兼容，现有评论 `like_count` 默认为0

---

## ⚡ 执行建议

### 优先级
1. **高优先级**：02, 03（修复删除问题，影响数据维护）
2. **中优先级**：04, 05（新功能，不影响现有业务）
3. **低优先级**：01（广告系统，可延后）

### 执行时间
- **预计耗时**：< 5分钟（数据量小）
- **建议时段**：业务低峰期
- **锁表影响**：ALTER TABLE 会短暂锁表

### 回滚方案
提供了 `rollback.sql` 脚本，可快速回滚所有变更

---

## 📊 数据影响评估

| 迁移脚本 | 操作类型 | 锁表时间 | 数据影响 | 风险等级 |
|---------|---------|---------|---------|---------|
| 01 | CREATE TABLE | 无 | 无 | 低 |
| 02 | ALTER TABLE | 短暂 | 无 | 低 |
| 03 | ALTER TABLE | 短暂 | 无 | 低 |
| 04 | ALTER TABLE | 短暂 | 无（添加字段） | 低 |
| 05 | CREATE TABLE | 无 | 无 | 低 |

---

## ✅ 执行前检查清单

- [ ] 已备份生产数据库
- [ ] 已在测试环境验证
- [ ] 确认字符集为 utf8mb4
- [ ] 确认有 ALTER, CREATE 权限
- [ ] 已通知业务方维护窗口
- [ ] 准备好回滚脚本

---

## 🔧 快速执行（复制粘贴）

```bash
# 1. 备份数据库
mysqldump -u root -p your_database > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. 执行迁移（按顺序）
mysql -u root -p your_database < 01_advertising_system.sql
mysql -u root -p your_database < 02_fix_episode_cascade_delete.sql
mysql -u root -p your_database < 03_fix_watch_progress_cascade.sql
mysql -u root -p your_database < 04_add_comment_like_count.sql
mysql -u root -p your_database < 05_add_comment_likes.sql

# 3. 验证结果
mysql -u root -p your_database < verify.sql
```

---

## 📞 联系方式

- **开发负责人**：[你的名字]
- **紧急联系**：[电话/邮箱]
- **回滚支持**：提供 rollback.sql

---

**变更日期**：2025-11-19  
**版本**：v2.1  
**审批状态**：待DBA审批
