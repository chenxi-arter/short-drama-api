-- =====================================================
-- 生产环境迁移: 添加评论已读状态功能
-- 创建时间: 2024-11-29
-- 说明: 为评论表添加 is_read 字段，用于标记用户收到的回复是否已查看
-- =====================================================

-- 1. 添加 is_read 字段
ALTER TABLE comments 
ADD COLUMN is_read BOOLEAN DEFAULT FALSE COMMENT '是否已读（针对回复消息）';

-- 2. 为查询性能优化添加索引
-- 此索引用于快速查询某个用户的未读回复
CREATE INDEX idx_comments_reply_to_user_is_read 
ON comments(reply_to_user_id, is_read, created_at);

-- 3. 验证变更
SELECT 
  COLUMN_NAME, 
  COLUMN_TYPE, 
  COLUMN_DEFAULT, 
  IS_NULLABLE, 
  COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'comments'
  AND COLUMN_NAME = 'is_read';

-- 4. 验证索引
SHOW INDEX FROM comments WHERE Key_name = 'idx_comments_reply_to_user_is_read';
