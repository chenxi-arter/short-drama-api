USE short_drama;

-- 完全删除所有 filter_options 并重新创建
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM filter_options;
SET FOREIGN_KEY_CHECKS = 1;

-- 重置自增ID
ALTER TABLE filter_options AUTO_INCREMENT = 1;

-- 重新插入所有数据
INSERT INTO filter_options (filter_type_id, name, value, display_order, is_active, is_default, sort_order, created_at, updated_at) VALUES
-- 排序选项 (filter_type_id = 1)
(1, '全部', 'all', 0, 1, 1, 0, NOW(), NOW()),
(1, '最新上传', 'latest', 1, 1, 0, 1, NOW(), NOW()),
(1, '最近更新', 'updated', 2, 1, 0, 2, NOW(), NOW()),
(1, '人气最高', 'popular', 3, 1, 0, 3, NOW(), NOW()),
(1, '评分最高', 'rating', 4, 1, 0, 4, NOW(), NOW()),

-- 类型选项 (filter_type_id = 2)
(2, '全部类型', 'all', 0, 1, 1, 0, NOW(), NOW()),
(2, '偶像', 'idol', 1, 1, 0, 1, NOW(), NOW()),
(2, '言情', 'romance', 2, 1, 0, 2, NOW(), NOW()),
(2, '爱情', 'love', 3, 1, 0, 3, NOW(), NOW()),
(2, '古装', 'costume', 4, 1, 0, 4, NOW(), NOW()),

-- 地区选项 (filter_type_id = 3)
(3, '全部地区', 'all', 0, 1, 1, 0, NOW(), NOW()),
(3, '大陆', 'mainland', 1, 1, 0, 1, NOW(), NOW()),
(3, '香港', 'hongkong', 2, 1, 0, 2, NOW(), NOW()),
(3, '台湾', 'taiwan', 3, 1, 0, 3, NOW(), NOW()),
(3, '日本', 'japan', 4, 1, 0, 4, NOW(), NOW()),
(3, '韩国', 'korea', 5, 1, 0, 5, NOW(), NOW()),
(3, '美国', 'usa', 6, 1, 0, 6, NOW(), NOW()),
(3, '新加坡', 'singapore', 7, 1, 0, 7, NOW(), NOW()),

-- 语言选项 (filter_type_id = 4)
(4, '全部语言', 'all', 0, 1, 1, 0, NOW(), NOW()),
(4, '国语', 'mandarin', 1, 1, 0, 1, NOW(), NOW()),
(4, '粤语', 'cantonese', 2, 1, 0, 2, NOW(), NOW()),
(4, '英语', 'english', 3, 1, 0, 3, NOW(), NOW()),
(4, '韩语', 'korean', 4, 1, 0, 4, NOW(), NOW()),
(4, '马来语', 'malay', 5, 1, 0, 5, NOW(), NOW()),

-- 年份选项 (filter_type_id = 5)
(5, '全部年份', 'all', 0, 1, 1, 0, NOW(), NOW()),
(5, '2025年', '2025', 1, 1, 0, 1, NOW(), NOW()),
(5, '去年', '2024', 2, 1, 0, 2, NOW(), NOW()),
(5, '前年', '2023', 3, 1, 0, 3, NOW(), NOW()),
(5, '更早', 'earlier', 4, 1, 0, 4, NOW(), NOW()),
(5, '90年代', '1990s', 5, 1, 0, 5, NOW(), NOW()),
(5, '2026年', '2026', 6, 1, 0, 6, NOW(), NOW()),

-- 状态选项 (filter_type_id = 6)
(6, '全部状态', 'all', 0, 1, 1, 0, NOW(), NOW()),
(6, '全集', 'complete', 1, 1, 0, 1, NOW(), NOW()),
(6, '连载中', 'ongoing', 2, 1, 0, 2, NOW(), NOW()),
(6, '预告中', 'preview', 3, 1, 0, 3, NOW(), NOW());

-- 验证数据
SELECT 
  ft.name as filter_type_name,
  fo.name as option_name,
  fo.display_order,
  fo.is_default
FROM filter_options fo
JOIN filter_types ft ON fo.filter_type_id = ft.id
WHERE fo.is_active = 1
ORDER BY ft.index_position, fo.display_order;
