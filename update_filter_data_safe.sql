-- 安全更新筛选器数据以匹配期望的 JSON 结构
-- 使用 UPDATE 而不是 DELETE + INSERT 以避免外键约束问题

USE short_drama;

-- 1. 更新 filter_types 表的中文名称
UPDATE filter_types SET name = '排序' WHERE code = 'sort';
UPDATE filter_types SET name = '类型' WHERE code = 'type';
UPDATE filter_types SET name = '地区' WHERE code = 'region';
UPDATE filter_types SET name = '语言' WHERE code = 'language';
UPDATE filter_types SET name = '年份' WHERE code = 'year';
UPDATE filter_types SET name = '状态' WHERE code = 'status';

-- 2. 先将所有现有选项设为非活跃状态
UPDATE filter_options SET is_active = 0;

-- 3. 更新排序选项 (filter_type_id = 1)
-- 更新现有记录
UPDATE filter_options SET name = '全部排序', value = 'all', display_order = 0, is_active = 1, is_default = 1 WHERE filter_type_id = 1 AND value = 'latest';
UPDATE filter_options SET name = '最新上传', value = 'latest', display_order = 1, is_active = 1, is_default = 0 WHERE filter_type_id = 1 AND value = 'updated';
UPDATE filter_options SET name = '最近更新', value = 'updated', display_order = 2, is_active = 1, is_default = 0 WHERE filter_type_id = 1 AND value = 'popular';
UPDATE filter_options SET name = '人气最高', value = 'popular', display_order = 3, is_active = 1, is_default = 0 WHERE filter_type_id = 1 AND value = 'rating';
UPDATE filter_options SET name = '评分最高', value = 'rating', display_order = 4, is_active = 1, is_default = 0 WHERE filter_type_id = 1 AND id = 4;

-- 插入缺失的排序选项
INSERT IGNORE INTO filter_options (filter_type_id, name, value, display_order, is_active, is_default, sort_order) VALUES
(1, '全部排序', 'all', 0, 1, 1, 0);

-- 4. 更新类型选项 (filter_type_id = 2)
UPDATE filter_options SET name = '全部类型', value = 'all', display_order = 0, is_active = 1, is_default = 1 WHERE filter_type_id = 2 AND (value = 'all' OR id = 5);
UPDATE filter_options SET name = '偶像', value = 'idol', display_order = 1, is_active = 1, is_default = 0 WHERE filter_type_id = 2 AND (value = 'idol' OR id = 6);
UPDATE filter_options SET name = '言情', value = 'romance', display_order = 2, is_active = 1, is_default = 0 WHERE filter_type_id = 2 AND (value = 'romance' OR id = 7);
UPDATE filter_options SET name = '爱情', value = 'love', display_order = 3, is_active = 1, is_default = 0 WHERE filter_type_id = 2 AND (value = 'love' OR id = 8);
UPDATE filter_options SET name = '古装', value = 'costume', display_order = 4, is_active = 1, is_default = 0 WHERE filter_type_id = 2 AND (value = 'costume' OR id = 9);

-- 5. 更新地区选项 (filter_type_id = 3)
UPDATE filter_options SET name = '全部地区', value = 'all', display_order = 0, is_active = 1, is_default = 1 WHERE filter_type_id = 3 AND (value = 'all' OR id = 10);
UPDATE filter_options SET name = '大陆', value = 'mainland', display_order = 1, is_active = 1, is_default = 0 WHERE filter_type_id = 3 AND (value = 'mainland' OR id = 11);
UPDATE filter_options SET name = '香港', value = 'hongkong', display_order = 2, is_active = 1, is_default = 0 WHERE filter_type_id = 3 AND (value = 'hongkong' OR id = 12);
UPDATE filter_options SET name = '台湾', value = 'taiwan', display_order = 3, is_active = 1, is_default = 0 WHERE filter_type_id = 3 AND (value = 'taiwan' OR id = 13);
UPDATE filter_options SET name = '日本', value = 'japan', display_order = 4, is_active = 1, is_default = 0 WHERE filter_type_id = 3 AND (value = 'japan' OR id = 14);
UPDATE filter_options SET name = '韩国', value = 'korea', display_order = 5, is_active = 1, is_default = 0 WHERE filter_type_id = 3 AND (value = 'korea' OR id = 38);
UPDATE filter_options SET name = '美国', value = 'usa', display_order = 6, is_active = 1, is_default = 0 WHERE filter_type_id = 3 AND (value = 'usa' OR id = 39);

-- 插入新加坡选项（如果不存在）
INSERT IGNORE INTO filter_options (filter_type_id, name, value, display_order, is_active, is_default, sort_order) VALUES
(3, '新加坡', 'singapore', 7, 1, 0, 7);

-- 6. 更新语言选项 (filter_type_id = 4)
UPDATE filter_options SET name = '全部语言', value = 'all', display_order = 0, is_active = 1, is_default = 1 WHERE filter_type_id = 4 AND (value = 'all' OR id = 15);
UPDATE filter_options SET name = '国语', value = 'mandarin', display_order = 1, is_active = 1, is_default = 0 WHERE filter_type_id = 4 AND (value = 'mandarin' OR id = 16);
UPDATE filter_options SET name = '粤语', value = 'cantonese', display_order = 2, is_active = 1, is_default = 0 WHERE filter_type_id = 4 AND (value = 'cantonese' OR id = 17);
UPDATE filter_options SET name = '英语', value = 'english', display_order = 3, is_active = 1, is_default = 0 WHERE filter_type_id = 4 AND (value = 'english' OR id = 18);
UPDATE filter_options SET name = '韩语', value = 'korean', display_order = 4, is_active = 1, is_default = 0 WHERE filter_type_id = 4 AND (value = 'korean' OR id = 19);

-- 插入马来语选项（如果不存在）
INSERT IGNORE INTO filter_options (filter_type_id, name, value, display_order, is_active, is_default, sort_order) VALUES
(4, '马来语', 'malay', 5, 1, 0, 5);

-- 7. 更新年份选项 (filter_type_id = 5)
UPDATE filter_options SET name = '全部年份', value = 'all', display_order = 0, is_active = 1, is_default = 1 WHERE filter_type_id = 5 AND (value = 'all' OR id = 20);
UPDATE filter_options SET name = '2025年', value = '2025', display_order = 1, is_active = 1, is_default = 0 WHERE filter_type_id = 5 AND (value = '2025' OR id = 21 OR id = 29);
UPDATE filter_options SET name = '去年', value = '2024', display_order = 2, is_active = 1, is_default = 0 WHERE filter_type_id = 5 AND (value = '2024' OR id = 22);
UPDATE filter_options SET name = '前年', value = '2023', display_order = 3, is_active = 1, is_default = 0 WHERE filter_type_id = 5 AND (value = '2023' OR id = 23);
UPDATE filter_options SET name = '更早', value = 'earlier', display_order = 4, is_active = 1, is_default = 0 WHERE filter_type_id = 5 AND (value = 'earlier' OR id = 24);
UPDATE filter_options SET name = '90年代', value = '1990s', display_order = 5, is_active = 1, is_default = 0 WHERE filter_type_id = 5 AND (value = '1990s' OR id = 25);
UPDATE filter_options SET name = '2026年', value = '2026', display_order = 6, is_active = 1, is_default = 0 WHERE filter_type_id = 5 AND (value = '2026' OR id = 33);

-- 8. 更新状态选项 (filter_type_id = 6)
UPDATE filter_options SET name = '全部状态', value = 'all', display_order = 0, is_active = 1, is_default = 1 WHERE filter_type_id = 6 AND (value = 'all' OR id = 26);
UPDATE filter_options SET name = '全集', value = 'complete', display_order = 1, is_active = 1, is_default = 0 WHERE filter_type_id = 6 AND (value = 'complete' OR id = 27);
UPDATE filter_options SET name = '连载中', value = 'ongoing', display_order = 2, is_active = 1, is_default = 0 WHERE filter_type_id = 6 AND (value = 'ongoing' OR id = 28);

-- 插入预告中选项（如果不存在）
INSERT IGNORE INTO filter_options (filter_type_id, name, value, display_order, is_active, is_default, sort_order) VALUES
(6, '预告中', 'preview', 3, 1, 0, 3);

-- 9. 清理不需要的选项（将它们设为非活跃）
UPDATE filter_options SET is_active = 0 WHERE filter_type_id = 3 AND id = 30; -- 删除重复的地区选项
UPDATE filter_options SET is_active = 0 WHERE filter_type_id = 4 AND id = 31; -- 删除重复的语言选项
UPDATE filter_options SET is_active = 0 WHERE filter_type_id = 6 AND id = 32; -- 删除重复的状态选项

-- 10. 验证数据
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
