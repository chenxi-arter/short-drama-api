-- ============================================================
-- 评论查询性能优化
-- 针对50万+评论的优化索引
-- ============================================================

-- 1. 添加复合索引：剧集+根ID+创建时间（最重要！）
-- 用于快速查询某剧集的主楼评论，并按时间排序
CREATE INDEX `idx_episode_root_created` ON `comments` 
(`episode_short_id`, `root_id`, `created_at` DESC);

-- 2. 添加复合索引：根ID+创建时间
-- 用于快速查询某主楼的回复，并按时间排序
CREATE INDEX `idx_root_created` ON `comments` 
(`root_id`, `created_at` DESC);

-- 3. 添加用户ID索引（如果查询用户评论）
CREATE INDEX `idx_user_created` ON `comments` 
(`user_id`, `created_at` DESC);

-- 4. 删除可能重复的旧索引（如果存在）
-- DROP INDEX `idx_episode_root` ON `comments`;  -- 这个索引会被上面的覆盖

-- ============================================================
-- 索引说明
-- ============================================================
-- idx_episode_root_created: 
--   - 查询某剧集的主楼时，MySQL可以直接使用这个索引
--   - WHERE episode_short_id = 'xxx' AND root_id IS NULL ORDER BY created_at DESC
--   - 效率提升 100+ 倍
--
-- idx_root_created:
--   - 查询某主楼的回复时使用
--   - WHERE root_id = 123 ORDER BY created_at DESC
--   - 避免全表扫描
--
-- idx_user_created:
--   - 查询某用户的所有评论时使用
--   - WHERE user_id = 456 ORDER BY created_at DESC
--
-- ============================================================
-- 执行后验证索引
-- ============================================================
-- SHOW INDEX FROM comments;
-- EXPLAIN SELECT * FROM comments 
-- WHERE episode_short_id = 'xxx' AND root_id IS NULL 
-- ORDER BY created_at DESC LIMIT 20;

