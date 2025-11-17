-- 回滚脚本 - 仅在出现严重问题时使用
-- ⚠️ 警告：此脚本会删除所有广告系统数据，请谨慎使用

-- 删除广告系统相关表（按依赖顺序）
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS advertising_conversions;
DROP TABLE IF EXISTS advertising_events;
DROP TABLE IF EXISTS advertising_campaign_stats;
DROP TABLE IF EXISTS advertising_campaigns;
DROP TABLE IF EXISTS advertising_platforms;

SET FOREIGN_KEY_CHECKS = 1;

-- 注意：外键约束修改通常不需要回滚，因为CASCADE删除是更安全的选择
