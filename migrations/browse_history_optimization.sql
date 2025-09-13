-- 浏览记录优化 - 添加索引
-- 创建时间: 2024-01-XX
-- 目的: 优化浏览记录的查询性能和重复记录检查

-- 1. 添加复合索引用于快速查找重复记录 (userId, seriesId, browseType)
-- 这个索引将大大提高检查是否存在相同系列浏览记录的速度
CREATE INDEX idx_browse_history_user_series_type 
ON browse_history (user_id, series_id, browse_type);

-- 2. 添加复合索引用于按用户和时间排序 (userId, updatedAt)
-- 这个索引将优化获取用户浏览记录和清理超量记录的性能
CREATE INDEX idx_browse_history_user_updated 
ON browse_history (user_id, updated_at DESC);

-- 3. 添加索引用于按更新时间排序，用于全局清理任务
CREATE INDEX idx_browse_history_updated_at 
ON browse_history (updated_at DESC);

-- 4. 添加索引用于统计查询
CREATE INDEX idx_browse_history_user_id 
ON browse_history (user_id);

-- 验证索引创建结果
SHOW INDEX FROM browse_history;
