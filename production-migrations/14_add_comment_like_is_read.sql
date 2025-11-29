-- =====================================================
-- 生产环境迁移: 添加点赞通知已读状态功能
-- 创建时间: 2024-11-29
-- 说明: 为点赞表添加 is_read 字段，用于标记用户收到的点赞通知是否已查看
-- =====================================================

-- 1. 添加 is_read 字段
ALTER TABLE comment_likes 
ADD COLUMN is_read BOOLEAN DEFAULT FALSE COMMENT '是否已读（针对被点赞者的通知）';

-- 2. 为查询性能优化添加索引
-- 此索引用于快速查询某个评论的未读点赞
CREATE INDEX idx_comment_likes_is_read 
ON comment_likes(comment_id, is_read, created_at);

-- 3. 验证变更
SELECT 
  COLUMN_NAME, 
  COLUMN_TYPE, 
  COLUMN_DEFAULT, 
  IS_NULLABLE, 
  COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'comment_likes'
  AND COLUMN_NAME = 'is_read';

-- 4. 验证索引
SHOW INDEX FROM comment_likes WHERE Key_name = 'idx_comment_likes_is_read';
