-- 推荐查询优化索引 - 精简版
-- 用于提升 /api/video/recommend 接口的查询性能

-- 检查并删除已存在的索引（如需要）
-- DROP INDEX IF EXISTS idx_episodes_recommend ON episodes;
-- DROP INDEX IF EXISTS idx_series_recommend ON series;
-- DROP INDEX IF EXISTS idx_episodes_stats ON episodes;

-- 1. episodes 表主索引（覆盖推荐查询的主要过滤和排序条件）
CREATE INDEX idx_episodes_recommend 
ON episodes(status, episode_number, created_at DESC, series_id);

-- 2. series 表辅助索引（加速 JOIN 和 WHERE 过滤）
CREATE INDEX idx_series_recommend 
ON series(is_active, category_id);

-- 3. episodes 表统计字段索引（可选，用于推荐分数计算）
CREATE INDEX idx_episodes_stats 
ON episodes(like_count, favorite_count);
