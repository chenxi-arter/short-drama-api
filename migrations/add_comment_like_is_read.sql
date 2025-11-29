-- 添加点赞通知已读状态字段
-- 用于标记用户收到的点赞通知是否已查看

-- 添加 is_read 字段
ALTER TABLE comment_likes 
ADD COLUMN is_read BOOLEAN DEFAULT FALSE COMMENT '是否已读（针对被点赞者的通知）';

-- 为 is_read 字段添加索引，优化未读点赞查询
-- 需要通过 comment 表关联查询评论作者，所以索引包含 comment_id
CREATE INDEX idx_comment_likes_is_read ON comment_likes(comment_id, is_read, created_at);

-- 说明：
-- 1. is_read 字段默认为 false（未读）
-- 2. 当评论作者查看点赞通知时，将对应的点赞记录标记为 true（已读）
-- 3. 索引可以加速查询某个评论的未读点赞
-- 4. 需要通过 comment_id 关联到 comments 表，找到评论作者的 user_id
