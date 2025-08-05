-- 为防枚举攻击添加UUID字段迁移脚本
-- 执行时间：建议在低峰期执行
-- 预计执行时间：根据数据量而定，建议分批执行

-- 1. 为series表添加uuid字段
ALTER TABLE `series` ADD COLUMN `uuid` VARCHAR(36) UNIQUE NULL COMMENT 'UUID标识符，用于防枚举攻击';

-- 2. 为short_videos表添加uuid字段
ALTER TABLE `short_videos` ADD COLUMN `uuid` VARCHAR(36) UNIQUE NULL COMMENT 'UUID标识符，用于防枚举攻击';

-- 3. 为现有的series记录生成UUID
UPDATE `series` SET `uuid` = UUID() WHERE `uuid` IS NULL;

-- 4. 为现有的short_videos记录生成UUID
UPDATE `short_videos` SET `uuid` = UUID() WHERE `uuid` IS NULL;

-- 5. 为series表的uuid字段添加索引（提高查询性能）
CREATE INDEX `idx_series_uuid` ON `series`(`uuid`);

-- 6. 为short_videos表的uuid字段添加索引（提高查询性能）
CREATE INDEX `idx_short_videos_uuid` ON `short_videos`(`uuid`);

-- 验证数据完整性
-- 检查是否所有记录都有UUID
SELECT 
    'series' as table_name,
    COUNT(*) as total_records,
    COUNT(uuid) as records_with_uuid,
    COUNT(*) - COUNT(uuid) as records_without_uuid
FROM `series`
UNION ALL
SELECT 
    'short_videos' as table_name,
    COUNT(*) as total_records,
    COUNT(uuid) as records_with_uuid,
    COUNT(*) - COUNT(uuid) as records_without_uuid
FROM `short_videos`;

-- 检查UUID唯一性
SELECT 'series' as table_name, uuid, COUNT(*) as count
FROM `series` 
WHERE uuid IS NOT NULL
GROUP BY uuid 
HAVING COUNT(*) > 1
UNION ALL
SELECT 'short_videos' as table_name, uuid, COUNT(*) as count
FROM `short_videos` 
WHERE uuid IS NOT NULL
GROUP BY uuid 
HAVING COUNT(*) > 1;

-- 如果上述查询返回空结果，说明UUID生成成功且唯一