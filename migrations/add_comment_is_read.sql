-- 添加评论已读状态字段
-- 用于标记用户收到的回复是否已查看

-- 添加 is_read 字段
ALTER TABLE comments 
ADD COLUMN is_read BOOLEAN DEFAULT FALSE COMMENT '是否已读（针对回复消息）';

-- 为 is_read 字段添加索引，优化未读回复查询
CREATE INDEX idx_comments_reply_to_user_is_read ON comments(reply_to_user_id, is_read, created_at);

-- 说明：
-- 1. is_read 字段默认为 false（未读）
-- 2. 当用户查看回复时，将对应的回复记录标记为 true（已读）
-- 3. 索引可以加速查询某个用户的未读回复
