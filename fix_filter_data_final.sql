-- 最终修复筛选器数据
USE short_drama;

-- 1. 删除所有现有的 filter_options（保留外键引用的记录）
UPDATE filter_options SET is_active = 0;

-- 2. 重新插入正确的数据
-- 排序选项 (filter_type_id = 1)
INSERT INTO filter_options (filter_type_id, name, value, display_order, is_active, is_default, sort_order) VALUES
(1, '全部', 'all', 0, 1, 1, 0),
(1, '最新上传', 'latest', 1, 1, 0, 1),
(1, '最近更新', 'updated', 2, 1, 0, 2),
(1, '人气最高', 'popular', 3, 1, 0, 3),
(1, '评分最高', 'rating', 4, 1, 0, 4)
ON DUPLICATE KEY UPDATE 
  name = VALUES(name), 
  display_order = VALUES(display_order), 
  is_active = VALUES(is_active), 
  is_default = VALUES(is_default);

-- 类型选项 (filter_type_id = 2)
INSERT INTO filter_options (filter_type_id, name, value, display_order, is_active, is_default, sort_order) VALUES
(2, '全部类型', 'all', 0, 1, 1, 0),
(2, '偶像', 'idol', 1, 1, 0, 1),
(2, '言情', 'romance', 2, 1, 0, 2),
(2, '爱情', 'love', 3, 1, 0, 3),
(2, '古装', 'costume', 4, 1, 0, 4)
ON DUPLICATE KEY UPDATE 
  name = VALUES(name), 
  display_order = VALUES(display_order), 
  is_active = VALUES(is_active), 
  is_default = VALUES(is_default);

-- 地区选项 (filter_type_id = 3)
INSERT INTO filter_options (filter_type_id, name, value, display_order, is_active, is_default, sort_order) VALUES
(3, '全部地区', 'all', 0, 1, 1, 0),
(3, '大陆', 'mainland', 1, 1, 0, 1),
(3, '香港', 'hongkong', 2, 1, 0, 2),
(3, '台湾', 'taiwan', 3, 1, 0, 3),
(3, '日本', 'japan', 4, 1, 0, 4),
(3, '韩国', 'korea', 5, 1, 0, 5),
(3, '美国', 'usa', 6, 1, 0, 6),
(3, '新加坡', 'singapore', 7, 1, 0, 7)
ON DUPLICATE KEY UPDATE 
  name = VALUES(name), 
  display_order = VALUES(display_order), 
  is_active = VALUES(is_active), 
  is_default = VALUES(is_default);

-- 语言选项 (filter_type_id = 4)
INSERT INTO filter_options (filter_type_id, name, value, display_order, is_active, is_default, sort_order) VALUES
(4, '全部语言', 'all', 0, 1, 1, 0),
(4, '国语', 'mandarin', 1, 1, 0, 1),
(4, '粤语', 'cantonese', 2, 1, 0, 2),
(4, '英语', 'english', 3, 1, 0, 3),
(4, '韩语', 'korean', 4, 1, 0, 4),
(4, '马来语', 'malay', 5, 1, 0, 5)
ON DUPLICATE KEY UPDATE 
  name = VALUES(name), 
  display_order = VALUES(display_order), 
  is_active = VALUES(is_active), 
  is_default = VALUES(is_default);

-- 年份选项 (filter_type_id = 5)
INSERT INTO filter_options (filter_type_id, name, value, display_order, is_active, is_default, sort_order) VALUES
(5, '全部年份', 'all', 0, 1, 1, 0),
(5, '2025年', '2025', 1, 1, 0, 1),
(5, '去年', '2024', 2, 1, 0, 2),
(5, '前年', '2023', 3, 1, 0, 3),
(5, '更早', 'earlier', 4, 1, 0, 4),
(5, '90年代', '1990s', 5, 1, 0, 5),
(5, '2026年', '2026', 6, 1, 0, 6)
ON DUPLICATE KEY UPDATE 
  name = VALUES(name), 
  display_order = VALUES(display_order), 
  is_active = VALUES(is_active), 
  is_default = VALUES(is_default);

-- 状态选项 (filter_type_id = 6)
INSERT INTO filter_options (filter_type_id, name, value, display_order, is_active, is_default, sort_order) VALUES
(6, '全部状态', 'all', 0, 1, 1, 0),
(6, '全集', 'complete', 1, 1, 0, 1),
(6, '连载中', 'ongoing', 2, 1, 0, 2),
(6, '预告中', 'preview', 3, 1, 0, 3)
ON DUPLICATE KEY UPDATE 
  name = VALUES(name), 
  display_order = VALUES(display_order), 
  is_active = VALUES(is_active), 
  is_default = VALUES(is_default);

-- 验证数据
SELECT 
  ft.name as filter_type_name,
  fo.name as option_name,
  fo.display_order,
  fo.is_default,
  fo.is_active
FROM filter_options fo
JOIN filter_types ft ON fo.filter_type_id = ft.id
WHERE fo.is_active = 1
ORDER BY ft.index_position, fo.display_order;
