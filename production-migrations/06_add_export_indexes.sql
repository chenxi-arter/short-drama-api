-- ============================================
-- 迁移脚本：添加导出接口优化索引
-- 创建时间: 2025-11-20
-- 描述: 为导出接口添加必要的索引，提升查询性能
-- 预期效果: 查询速度提升 60-80%
-- ============================================

-- 设置字符集
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 1. watch_progress 表索引（最关键）
-- 检查索引是否存在，不存在则创建
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'watch_progress' 
    AND INDEX_NAME = 'idx_wp_updated_at');
SET @sqlstmt := IF(@exist = 0, 
    'CREATE INDEX idx_wp_updated_at ON watch_progress(updated_at)',
    'SELECT "索引 idx_wp_updated_at 已存在" as message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'watch_progress' 
    AND INDEX_NAME = 'idx_wp_updated_user');
SET @sqlstmt := IF(@exist = 0, 
    'CREATE INDEX idx_wp_updated_user ON watch_progress(updated_at, user_id)',
    'SELECT "索引 idx_wp_updated_user 已存在" as message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'watch_progress' 
    AND INDEX_NAME = 'idx_wp_episode_updated');
SET @sqlstmt := IF(@exist = 0, 
    'CREATE INDEX idx_wp_episode_updated ON watch_progress(episode_id, updated_at)',
    'SELECT "索引 idx_wp_episode_updated 已存在" as message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. users 表索引
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'users' 
    AND INDEX_NAME = 'idx_user_created_at');
SET @sqlstmt := IF(@exist = 0, 
    'CREATE INDEX idx_user_created_at ON users(created_at)',
    'SELECT "索引 idx_user_created_at 已存在" as message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. episode_reactions 表索引
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'episode_reactions' 
    AND INDEX_NAME = 'idx_reaction_created_at');
SET @sqlstmt := IF(@exist = 0, 
    'CREATE INDEX idx_reaction_created_at ON episode_reactions(created_at)',
    'SELECT "索引 idx_reaction_created_at 已存在" as message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'episode_reactions' 
    AND INDEX_NAME = 'idx_reaction_created_type');
SET @sqlstmt := IF(@exist = 0, 
    'CREATE INDEX idx_reaction_created_type ON episode_reactions(created_at, reaction_type)',
    'SELECT "索引 idx_reaction_created_type 已存在" as message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. favorites 表索引
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'favorites' 
    AND INDEX_NAME = 'idx_favorite_created_at');
SET @sqlstmt := IF(@exist = 0, 
    'CREATE INDEX idx_favorite_created_at ON favorites(created_at)',
    'SELECT "索引 idx_favorite_created_at 已存在" as message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'favorites' 
    AND INDEX_NAME = 'idx_favorite_created_series');
SET @sqlstmt := IF(@exist = 0, 
    'CREATE INDEX idx_favorite_created_series ON favorites(created_at, series_id)',
    'SELECT "索引 idx_favorite_created_series 已存在" as message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. comments 表索引
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'comments' 
    AND INDEX_NAME = 'idx_comment_created_at');
SET @sqlstmt := IF(@exist = 0, 
    'CREATE INDEX idx_comment_created_at ON comments(created_at)',
    'SELECT "索引 idx_comment_created_at 已存在" as message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'comments' 
    AND INDEX_NAME = 'idx_comment_created_episode');
SET @sqlstmt := IF(@exist = 0, 
    'CREATE INDEX idx_comment_created_episode ON comments(created_at, episode_short_id)',
    'SELECT "索引 idx_comment_created_episode 已存在" as message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 验证索引创建结果
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    SEQ_IN_INDEX,
    INDEX_TYPE
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME IN ('watch_progress', 'users', 'episode_reactions', 'favorites', 'comments')
    AND INDEX_NAME LIKE 'idx_%'
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;
