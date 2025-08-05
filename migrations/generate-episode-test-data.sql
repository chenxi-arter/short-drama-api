-- 生成episodes和episode_urls表的测试数据
-- 包含access_key字段的完整测试数据

USE short_drama;

-- 注意：如果字段已存在，这些ALTER语句会报错，但不影响后续数据插入
-- 可以忽略这些错误

-- 尝试添加access_key字段（如果已存在会报错，可忽略）
-- ALTER TABLE `episode_urls` ADD COLUMN `access_key` VARCHAR(64) UNIQUE AFTER `episode_id`;

-- 尝试添加uuid字段（如果已存在会报错，可忽略）
-- ALTER TABLE `episodes` ADD COLUMN `uuid` VARCHAR(36) UNIQUE AFTER `id`;

-- 清理现有的测试数据（可选）
-- DELETE FROM episode_urls WHERE episode_id IN (SELECT id FROM episodes WHERE series_id <= 5);
-- DELETE FROM episodes WHERE series_id <= 5;

-- 插入episodes测试数据
INSERT IGNORE INTO episodes (uuid, series_id, episode_number, title, duration, status) VALUES
-- 系列1：霸道总裁爱上我 (series_id=66)
(UUID(), 66, 1, '第1集：初遇霸道总裁', 2400, 'published'),
(UUID(), 66, 2, '第2集：意外的邂逅', 2380, 'published'),
(UUID(), 66, 3, '第3集：爱情的萌芽', 2420, 'published'),
(UUID(), 66, 4, '第4集：误会与解释', 2500, 'published'),
(UUID(), 66, 5, '第5集：甜蜜的约会', 2450, 'published'),

-- 系列2：穿越古代当皇妃 (series_id=67)
(UUID(), 67, 1, '第1集：穿越之始', 2600, 'published'),
(UUID(), 67, 2, '第2集：宫廷初体验', 2550, 'published'),
(UUID(), 67, 3, '第3集：爱恨情仇', 2480, 'published'),
(UUID(), 67, 4, '第4集：权力游戏', 2520, 'published'),
(UUID(), 67, 5, '第5集：生死抉择', 2580, 'published'),

-- 系列3：校园青春恋曲 (series_id=68)
(UUID(), 68, 1, '第1集：青春校园', 2300, 'published'),
(UUID(), 68, 2, '第2集：初恋萌芽', 2350, 'published'),
(UUID(), 68, 3, '第3集：友情考验', 2400, 'published'),
(UUID(), 68, 4, '第4集：梦想起航', 2450, 'published'),

-- 系列4：悬疑推理大师 (series_id=69)
(UUID(), 69, 1, '第1集：神秘案件', 2500, 'published'),
(UUID(), 69, 2, '第2集：线索追踪', 2480, 'published'),
(UUID(), 69, 3, '第3集：真相大白', 2520, 'published'),

-- 系列5：科幻星际战争 (series_id=70)
(UUID(), 70, 1, '第1集：星际启航', 2700, 'published'),
(UUID(), 70, 2, '第2集：外星接触', 2650, 'published'),
(UUID(), 70, 3, '第3集：宇宙大战', 2600, 'published');

-- 为新插入的episodes生成UUID
UPDATE `episodes` SET `uuid` = UUID() WHERE `uuid` IS NULL;

-- 插入episode_urls测试数据（包含access_key）
-- 为已插入的episodes生成播放地址
INSERT IGNORE INTO `episode_urls` (`episode_id`, `quality`, `oss_url`, `cdn_url`, `subtitle_url`, `access_key`) 
SELECT 
    e.id,
    '720p' as quality,
    CONCAT('https://oss.example.com/s', e.series_id, 'e', e.episode_number, '_720p.mp4') as oss_url,
    CONCAT('https://cdn.example.com/s', e.series_id, 'e', e.episode_number, '_720p.mp4') as cdn_url,
    CASE WHEN e.episode_number <= 2 THEN CONCAT('https://cdn.example.com/s', e.series_id, 'e', e.episode_number, '_sub.srt') ELSE NULL END as subtitle_url,
    SHA2(CONCAT('ep', e.id, '_720p_', UNIX_TIMESTAMP(), RAND()), 256) as access_key
FROM episodes e WHERE e.series_id IN (66, 67, 68, 69, 70);

INSERT IGNORE INTO `episode_urls` (`episode_id`, `quality`, `oss_url`, `cdn_url`, `subtitle_url`, `access_key`) 
SELECT 
    e.id,
    '1080p' as quality,
    CONCAT('https://oss.example.com/s', e.series_id, 'e', e.episode_number, '_1080p.mp4') as oss_url,
    CONCAT('https://cdn.example.com/s', e.series_id, 'e', e.episode_number, '_1080p.mp4') as cdn_url,
    CASE WHEN e.episode_number <= 2 THEN CONCAT('https://cdn.example.com/s', e.series_id, 'e', e.episode_number, '_sub.srt') ELSE NULL END as subtitle_url,
    SHA2(CONCAT('ep', e.id, '_1080p_', UNIX_TIMESTAMP(), RAND()), 256) as access_key
FROM episodes e WHERE e.series_id IN (66, 67, 68, 69, 70);

-- 为前5集添加4K清晰度
INSERT IGNORE INTO `episode_urls` (`episode_id`, `quality`, `oss_url`, `cdn_url`, `subtitle_url`, `access_key`) 
SELECT 
    e.id,
    '4K' as quality,
    CONCAT('https://oss.example.com/s', e.series_id, 'e', e.episode_number, '_4k.mp4') as oss_url,
    CONCAT('https://cdn.example.com/s', e.series_id, 'e', e.episode_number, '_4k.mp4') as cdn_url,
    CASE WHEN e.episode_number <= 2 THEN CONCAT('https://cdn.example.com/s', e.series_id, 'e', e.episode_number, '_sub.srt') ELSE NULL END as subtitle_url,
    SHA2(CONCAT('ep', e.id, '_4k_', UNIX_TIMESTAMP(), RAND()), 256) as access_key
FROM episodes e WHERE e.series_id = 66 AND e.episode_number <= 3;





-- 为现有的episode_urls记录生成access_key（如果没有的话）
UPDATE `episode_urls` SET `access_key` = SHA2(CONCAT(id, '_', UNIX_TIMESTAMP(), '_', RAND()), 256) WHERE `access_key` IS NULL OR `access_key` = '';

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS `idx_episode_urls_access_key` ON `episode_urls`(`access_key`);
CREATE INDEX IF NOT EXISTS `idx_episodes_uuid` ON `episodes`(`uuid`);
CREATE INDEX IF NOT EXISTS `idx_episodes_series_episode` ON `episodes`(`series_id`, `episode_number`);

-- 查询生成的测试数据统计
SELECT 
    'Episodes' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT series_id) as series_count
FROM episodes
UNION ALL
SELECT 
    'Episode URLs' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT quality) as quality_types
FROM episode_urls;

-- 显示一些示例数据
SELECT 
    e.id as episode_id,
    e.series_id,
    e.episode_number,
    e.title,
    e.uuid,
    eu.quality,
    eu.access_key
FROM episodes e
LEFT JOIN episode_urls eu ON e.id = eu.episode_id
WHERE e.series_id <= 2
ORDER BY e.series_id, e.episode_number, eu.quality
LIMIT 10;

COMMIT;

-- 脚本执行完成提示
SELECT '✅ Episodes和Episode URLs测试数据生成完成！' as status;
SELECT '📊 可以使用上面显示的access_key进行播放地址测试' as tip;
SELECT '🔐 每个剧集都有对应的UUID和access_key用于安全访问' as security_note;