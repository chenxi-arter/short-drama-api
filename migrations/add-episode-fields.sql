-- 为episode和episode_url表添加缺失字段的修正迁移脚本
-- 基于当前数据库结构的实际情况进行调整

-- 1. 为 episodes 表添加 has_sequel 字段（created_at和updated_at已存在）
ALTER TABLE `episodes` 
ADD COLUMN `has_sequel` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否有续集' AFTER `updated_at`;

-- 2. 为 episode_urls 表添加创建时间和更新时间字段（access_key已存在）
ALTER TABLE `episode_urls` 
ADD COLUMN `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间' AFTER `access_key`,
ADD COLUMN `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间' AFTER `created_at`;

-- 3. 为现有的空access_key数据生成随机值（如果有的话）
UPDATE `episode_urls` SET `access_key` = REPLACE(UUID(), '-', '') WHERE `access_key` = '' OR `access_key` IS NULL;

-- 4. 添加索引优化查询性能
ALTER TABLE `episodes` ADD INDEX `idx_has_sequel` (`has_sequel`);
ALTER TABLE `episode_urls` ADD INDEX `idx_created_at` (`created_at`);
ALTER TABLE `episode_urls` ADD INDEX `idx_updated_at` (`updated_at`);

COMMIT;

-- 验证修改结果
SELECT 'episodes表结构验证' as info;
SHOW COLUMNS FROM `episodes` LIKE '%sequel%';
SHOW COLUMNS FROM `episodes` LIKE '%created_at%';
SHOW COLUMNS FROM `episodes` LIKE '%updated_at%';

SELECT 'episode_urls表结构验证' as info;
SHOW COLUMNS FROM `episode_urls` LIKE '%access_key%';
SHOW COLUMNS FROM `episode_urls` LIKE '%created_at%';
SHOW COLUMNS FROM `episode_urls` LIKE '%updated_at%';

-- 检查数据统计
SELECT 'episodes续集统计' as info, `has_sequel`, COUNT(*) as count FROM `episodes` GROUP BY `has_sequel`;
SELECT 'episode_urls加密键示例' as info, `id`, `access_key`, `created_at` FROM `episode_urls` LIMIT 3;