# 生产环境数据库迁移指南

本文件夹包含了生产环境部署时需要执行的所有SQL迁移脚本。

## 环境要求

- MySQL 5.7+ 或 MySQL 8.0+
- 字符集：utf8mb4
- 执行权限：CREATE, ALTER, INSERT, INDEX

## 📋 迁移文件执行顺序

**请严格按照以下顺序执行SQL文件：**

### 1. 广告系统相关迁移
```bash
# 1.1 创建广告系统表结构和初始数据
mysql -u root -p your_database < 01_advertising_system.sql
```

### 2. Episode删除优化相关迁移
```bash
# 2.1 修复episode相关表的外键约束（自动查找外键名称）
mysql -u root -p your_database < 02_fix_episode_cascade_delete.sql

# 2.2 修复watch_progress表的外键约束（自动查找外键名称）
mysql -u root -p your_database < 03_fix_watch_progress_cascade.sql
```

**注意**：这两个脚本使用动态SQL自动查找并修改外键，无需手动指定外键名称。

### 3. 评论系统优化
```bash
# 3.1 添加评论点赞数字段
mysql -u root -p your_database < 04_add_comment_like_count.sql

# 3.2 创建评论点赞记录表
mysql -u root -p your_database < 05_add_comment_likes.sql
```

## 🔍 迁移内容说明

### 广告系统 (Advertising System)
- 创建 `advertising_platforms` 表 - 广告平台管理
- 创建 `advertising_campaigns` 表 - 广告投放计划
- 创建 `advertising_events` 表 - 事件追踪
- 创建 `advertising_conversions` 表 - 转化追踪  
- 创建 `advertising_campaign_stats` 表 - 统计数据
- 插入默认平台数据（抖音、微信、百度等）
- 创建相关索引优化查询性能

### Episode删除优化
- 修复 `episode_urls` 表外键约束为级联删除
- 修复 `watch_progress` 表外键约束为级联删除
- 解决删除episode时的外键约束错误

### 评论系统优化
- 为 `comments` 表添加 `like_count` 字段
- 用于存储评论的点赞数量
- 默认值为 0，支持后续点赞功能开发
- 创建 `comment_likes` 表 - 评论点赞记录
- 记录用户对评论的点赞关系
- 支持级联删除和防重复点赞

## ⚠️ 注意事项

1. **备份数据库**：执行迁移前请务必备份生产数据库
2. **字符编码**：确保MySQL客户端使用 `utf8mb4` 字符集
3. **权限检查**：确保数据库用户有足够的权限执行DDL操作
4. **测试验证**：建议先在测试环境执行一遍验证无误

## 🚀 执行示例

```bash
# 完整执行流程
mysql -u root -p production_db < 01_advertising_system.sql
mysql -u root -p production_db < 02_fix_episode_cascade_delete.sql
mysql -u root -p production_db < 03_fix_watch_progress_cascade.sql
mysql -u root -p production_db < 04_add_comment_like_count.sql
mysql -u root -p production_db < 05_add_comment_likes.sql
```

## 📞 联系方式

如果在迁移过程中遇到问题，请联系开发团队。
