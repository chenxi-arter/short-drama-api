-- ============================================
-- 迁移脚本：删除SQL脚本创建的冗余索引
-- 创建时间: 2025-11-20
-- 描述: 删除01_advertising_system.sql中创建的冗余单列索引
-- 这些索引被复合索引覆盖，是冗余的
-- ============================================

-- 设置字符集
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 1. advertising_events 表
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

-- 2. advertising_conversions 表
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

-- 验证结果
SELECT 
    '删除SQL脚本创建的冗余索引后的统计' as info;

SELECT 
    TABLE_NAME,
    COUNT(DISTINCT INDEX_NAME) as remaining_indexes,
    GROUP_CONCAT(DISTINCT INDEX_NAME ORDER BY INDEX_NAME) as indexes
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME IN ('advertising_events', 'advertising_conversions')
GROUP BY TABLE_NAME
ORDER BY TABLE_NAME;
