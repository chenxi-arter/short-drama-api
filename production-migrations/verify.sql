-- 验证迁移结果的SQL脚本

-- 1. 检查广告系统表是否创建成功
SELECT 'advertising_platforms' as table_name, COUNT(*) as record_count FROM advertising_platforms
UNION ALL
SELECT 'advertising_campaigns', COUNT(*) FROM advertising_campaigns
UNION ALL
SELECT 'advertising_events', COUNT(*) FROM advertising_events
UNION ALL
SELECT 'advertising_conversions', COUNT(*) FROM advertising_conversions
UNION ALL
SELECT 'advertising_campaign_stats', COUNT(*) FROM advertising_campaign_stats;

-- 2. 检查广告平台数据
SELECT id, name, code, is_enabled FROM advertising_platforms ORDER BY sort_order;

-- 3. 检查外键约束是否正确设置
SELECT 
    TABLE_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    DELETE_RULE,
    UPDATE_RULE
FROM information_schema.REFERENTIAL_CONSTRAINTS 
WHERE REFERENCED_TABLE_NAME IN ('episodes', 'advertising_platforms', 'advertising_campaigns')
ORDER BY TABLE_NAME, CONSTRAINT_NAME;

-- 4. 检查索引是否创建成功
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME LIKE 'advertising_%'
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;
