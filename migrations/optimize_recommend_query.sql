-- 优化推荐查询性能
-- 为 episodes 表添加复合索引

-- 1. 添加状态和创建时间的复合索引
-- 这个索引可以帮助快速过滤 published 状态的剧集，并利用时间排序
CREATE INDEX `idx_status_created_at` ON `episodes` (`status`, `created_at` DESC);

-- 2. 添加点赞和收藏的复合索引（可选，用于热门内容排序）
-- CREATE INDEX `idx_like_favorite_count` ON `episodes` (`like_count` DESC, `favorite_count` DESC);

-- 3. 为 series 表的 is_active 添加索引（如果还没有）
-- CREATE INDEX `idx_is_active` ON `series` (`is_active`);

-- 验证索引是否创建成功
SHOW INDEX FROM `episodes` WHERE Key_name LIKE 'idx_%';

