-- ============================================
-- 迁移脚本：创建评论点赞表
-- 创建时间: 2025-11-19
-- 描述: 创建 comment_likes 表用于记录用户对评论的点赞
-- ============================================

-- 创建评论点赞记录表
CREATE TABLE IF NOT EXISTS `comment_likes` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT NOT NULL COMMENT '点赞用户ID',
  `comment_id` INT NOT NULL COMMENT '评论ID',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '点赞时间',
  
  -- 索引
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_comment_id` (`comment_id`),
  INDEX `idx_created_at` (`created_at`),
  
  -- 唯一约束：同一用户对同一评论只能点赞一次
  UNIQUE INDEX `idx_user_comment` (`user_id`, `comment_id`),
  
  -- 外键约束
  CONSTRAINT `fk_comment_like_user` 
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) 
    ON DELETE CASCADE,
  CONSTRAINT `fk_comment_like_comment` 
    FOREIGN KEY (`comment_id`) REFERENCES `comments` (`id`) 
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评论点赞记录表';

-- 验证表是否创建成功
SELECT 
    TABLE_NAME,
    TABLE_COMMENT,
    TABLE_ROWS
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'comment_likes';

-- 验证索引是否创建成功
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    NON_UNIQUE
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'comment_likes'
ORDER BY INDEX_NAME, SEQ_IN_INDEX;
