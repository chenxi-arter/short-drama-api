-- ============================================
-- 迁移脚本：删除所有冗余索引（合并版）
-- 创建时间: 2025-11-21
-- 描述: 删除被复合索引覆盖的冗余单列索引
-- 预期效果: 减少索引维护开销，节省磁盘空间
-- ============================================

-- 设置字符集
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================
-- 第一部分：删除 TypeORM 自动创建的冗余索引
-- ============================================

-- 1. advertising_campaigns 表
-- 删除重复的 campaign_code 索引（保留 idx_campaign_code）
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'advertising_campaigns' 
    AND INDEX_NAME = 'campaign_code');
SET @sqlstmt := IF(@exist > 0, 
    'ALTER TABLE advertising_campaigns DROP INDEX campaign_code',
    'SELECT "索引 campaign_code 不存在" as message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. advertising_conversions 表
-- 删除 idx_campaign（被 idx_conversions_campaign_time 覆盖）
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'advertising_conversions' 
    AND INDEX_NAME = 'idx_campaign');
SET @sqlstmt := IF(@exist > 0, 
    'ALTER TABLE advertising_conversions DROP INDEX idx_campaign',
    'SELECT "索引 idx_campaign 不存在" as message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. advertising_events 表
-- 删除 idx_campaign（被 idx_events_campaign_time 覆盖）
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'advertising_events' 
    AND INDEX_NAME = 'idx_campaign');
SET @sqlstmt := IF(@exist > 0, 
    'ALTER TABLE advertising_events DROP INDEX idx_campaign',
    'SELECT "索引 idx_campaign 不存在" as message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 删除 idx_session_id（被 idx_events_session_time 覆盖）
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'advertising_events' 
    AND INDEX_NAME = 'idx_session_id');
SET @sqlstmt := IF(@exist > 0, 
    'ALTER TABLE advertising_events DROP INDEX idx_session_id',
    'SELECT "索引 idx_session_id 不存在" as message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. advertising_platforms 表
-- 删除重复的 code 索引（保留 idx_code）
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'advertising_platforms' 
    AND INDEX_NAME = 'code');
SET @sqlstmt := IF(@exist > 0, 
    'ALTER TABLE advertising_platforms DROP INDEX code',
    'SELECT "索引 code 不存在" as message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. comment_likes 表
-- 删除 idx_user_id（被 idx_user_comment 覆盖）
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'comment_likes' 
    AND INDEX_NAME = 'idx_user_id');
SET @sqlstmt := IF(@exist > 0, 
    'ALTER TABLE comment_likes DROP INDEX idx_user_id',
    'SELECT "索引 idx_user_id 不存在" as message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 6. episode_reactions 表
-- 删除 idx_user_id（被 idx_user_episode 覆盖）
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'episode_reactions' 
    AND INDEX_NAME = 'idx_user_id');
SET @sqlstmt := IF(@exist > 0, 
    'ALTER TABLE episode_reactions DROP INDEX idx_user_id',
    'SELECT "索引 idx_user_id 不存在" as message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 7. series_genre_options 表
-- 删除 idx_series（被 uq_series_option 覆盖）
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'series_genre_options' 
    AND INDEX_NAME = 'idx_series');
SET @sqlstmt := IF(@exist > 0, 
    'ALTER TABLE series_genre_options DROP INDEX idx_series',
    'SELECT "索引 idx_series 不存在" as message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 8. users 表
-- 删除 idx_users_telegram_id（与 telegram_id 重复）
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'users' 
    AND INDEX_NAME = 'idx_users_telegram_id');
SET @sqlstmt := IF(@exist > 0, 
    'ALTER TABLE users DROP INDEX idx_users_telegram_id',
    'SELECT "索引 idx_users_telegram_id 不存在" as message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 第二部分：删除 SQL 脚本创建的冗余索引
-- ============================================

-- 9. advertising_events 表（SQL脚本创建的）
-- 删除 idx_event_type（被 idx_events_stats 覆盖）
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'advertising_events' 
    AND INDEX_NAME = 'idx_event_type');
SET @sqlstmt := IF(@exist > 0, 
    'ALTER TABLE advertising_events DROP INDEX idx_event_type',
    'SELECT "索引 idx_event_type 不存在" as message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 删除 idx_event_time（被复合索引覆盖）
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'advertising_events' 
    AND INDEX_NAME = 'idx_event_time');
SET @sqlstmt := IF(@exist > 0, 
    'ALTER TABLE advertising_events DROP INDEX idx_event_time',
    'SELECT "索引 idx_event_time 不存在" as message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 删除 idx_created_at（很少使用）
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'advertising_events' 
    AND INDEX_NAME = 'idx_created_at');
SET @sqlstmt := IF(@exist > 0, 
    'ALTER TABLE advertising_events DROP INDEX idx_created_at',
    'SELECT "索引 idx_created_at 不存在" as message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 10. advertising_conversions 表（SQL脚本创建的）
-- 删除 idx_conversion_type（被 idx_conversions_stats 覆盖）
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'advertising_conversions' 
    AND INDEX_NAME = 'idx_conversion_type');
SET @sqlstmt := IF(@exist > 0, 
    'ALTER TABLE advertising_conversions DROP INDEX idx_conversion_type',
    'SELECT "索引 idx_conversion_type 不存在" as message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 删除 idx_conversion_time（被复合索引覆盖）
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'advertising_conversions' 
    AND INDEX_NAME = 'idx_conversion_time');
SET @sqlstmt := IF(@exist > 0, 
    'ALTER TABLE advertising_conversions DROP INDEX idx_conversion_time',
    'SELECT "索引 idx_conversion_time 不存在" as message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 删除 idx_created_at（很少使用）
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'advertising_conversions' 
    AND INDEX_NAME = 'idx_created_at');
SET @sqlstmt := IF(@exist > 0, 
    'ALTER TABLE advertising_conversions DROP INDEX idx_created_at',
    'SELECT "索引 idx_created_at 不存在" as message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 验证结果
-- ============================================

SELECT '删除所有冗余索引后的统计' as info;

SELECT 
    TABLE_NAME,
    COUNT(DISTINCT INDEX_NAME) as remaining_indexes,
    GROUP_CONCAT(DISTINCT INDEX_NAME ORDER BY INDEX_NAME SEPARATOR ', ') as indexes
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME IN (
        'advertising_campaigns',
        'advertising_conversions',
        'advertising_events',
        'advertising_platforms',
        'comment_likes',
        'episode_reactions',
        'series_genre_options',
        'users'
    )
GROUP BY TABLE_NAME
ORDER BY TABLE_NAME;
