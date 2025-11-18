-- ============================================
-- 迁移脚本：添加评论点赞数字段
-- 创建时间: 2025-11-19
-- 描述: 为 comments 表添加 like_count 字段用于存储点赞数量
-- ============================================

-- 为 comments 表添加 like_count 字段
ALTER TABLE `comments` 
ADD COLUMN `like_count` INT NOT NULL DEFAULT 0 COMMENT '点赞数量' AFTER `reply_count`;

-- 为已存在的评论设置默认点赞数为 0（可选，因为已经有 DEFAULT 0）
UPDATE `comments` SET `like_count` = 0 WHERE `like_count` IS NULL;

-- 添加索引以优化按点赞数排序的查询（可选，如果需要按点赞数排序可以取消注释）
-- CREATE INDEX `idx_like_count` ON `comments` (`like_count`);

-- 验证字段是否添加成功
SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    COLUMN_DEFAULT,
    IS_NULLABLE,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'comments'
  AND COLUMN_NAME = 'like_count';
