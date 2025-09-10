-- 添加 display_order 字段到 filter_options 表
-- 这个字段将用于 ids 参数中的位置映射

-- 1. 添加 display_order 字段
ALTER TABLE filter_options 
ADD COLUMN display_order INT DEFAULT 0 COMMENT '显示顺序（对应ids中的数字）' AFTER sort_order;

-- 2. 为现有数据设置合理的 display_order 值
-- 这些值对应API文档中的示例数据

-- 排序选项 (filter_type_id = 1)
UPDATE filter_options SET display_order = 1 WHERE filter_type_id = 1 AND (name = '最新上传' OR value = 'latest');
UPDATE filter_options SET display_order = 2 WHERE filter_type_id = 1 AND (name = '最近更新' OR value = 'updated');
UPDATE filter_options SET display_order = 3 WHERE filter_type_id = 1 AND (name = '人气最高' OR value = 'popular');
UPDATE filter_options SET display_order = 4 WHERE filter_type_id = 1 AND (name = '评分最高' OR value = 'rating');

-- 类型选项 (filter_type_id = 2)  
UPDATE filter_options SET display_order = 1 WHERE filter_type_id = 2 AND (name = '全部类型' OR value = 'all');
UPDATE filter_options SET display_order = 2 WHERE filter_type_id = 2 AND (name = '偶像' OR value = 'idol');
UPDATE filter_options SET display_order = 3 WHERE filter_type_id = 2 AND (name = '言情' OR value = 'romance');
UPDATE filter_options SET display_order = 4 WHERE filter_type_id = 2 AND (name = '爱情' OR value = 'love');
UPDATE filter_options SET display_order = 5 WHERE filter_type_id = 2 AND (name = '古装' OR value = 'costume');

-- 地区选项 (filter_type_id = 3)
UPDATE filter_options SET display_order = 1 WHERE filter_type_id = 3 AND (name = '全部地区' OR value = 'all');
UPDATE filter_options SET display_order = 2 WHERE filter_type_id = 3 AND (name = '大陆' OR value = 'mainland');
UPDATE filter_options SET display_order = 3 WHERE filter_type_id = 3 AND (name = '香港' OR value = 'hongkong');
UPDATE filter_options SET display_order = 4 WHERE filter_type_id = 3 AND (name = '台湾' OR value = 'taiwan');
UPDATE filter_options SET display_order = 5 WHERE filter_type_id = 3 AND (name = '日本' OR value = 'japan');

-- 语言选项 (filter_type_id = 4)
UPDATE filter_options SET display_order = 1 WHERE filter_type_id = 4 AND (name = '全部语言' OR value = 'all');
UPDATE filter_options SET display_order = 2 WHERE filter_type_id = 4 AND (name = '国语' OR value = 'mandarin');
UPDATE filter_options SET display_order = 3 WHERE filter_type_id = 4 AND (name = '粤语' OR value = 'cantonese');
UPDATE filter_options SET display_order = 4 WHERE filter_type_id = 4 AND (name = '英语' OR value = 'english');
UPDATE filter_options SET display_order = 5 WHERE filter_type_id = 4 AND (name = '韩语' OR value = 'korean');

-- 年份选项 (filter_type_id = 5)
UPDATE filter_options SET display_order = 1 WHERE filter_type_id = 5 AND (name = '全部年份' OR value = 'all');
UPDATE filter_options SET display_order = 2 WHERE filter_type_id = 5 AND (name = '2025年' OR value = '2025');
UPDATE filter_options SET display_order = 3 WHERE filter_type_id = 5 AND (name = '去年' OR name = '2024年' OR value = '2024');
UPDATE filter_options SET display_order = 4 WHERE filter_type_id = 5 AND (name = '前年' OR name = '2023年' OR value = '2023');
UPDATE filter_options SET display_order = 5 WHERE filter_type_id = 5 AND (name = '更早' OR value = 'earlier');
UPDATE filter_options SET display_order = 6 WHERE filter_type_id = 5 AND (name = '90年代' OR value = '1990s');

-- 状态选项 (filter_type_id = 6)
UPDATE filter_options SET display_order = 1 WHERE filter_type_id = 6 AND (name = '全部状态' OR value = 'all');
UPDATE filter_options SET display_order = 2 WHERE filter_type_id = 6 AND (name = '全集' OR name = '完结' OR value = 'complete');
UPDATE filter_options SET display_order = 3 WHERE filter_type_id = 6 AND (name = '连载中' OR name = '更新中' OR value = 'ongoing');

-- 3. 为未匹配的选项设置递增的 display_order
-- 这个脚本会为每个 filter_type 下未设置 display_order 的选项分配递增的编号

SET @row_number = 0;
SET @prev_filter_type_id = 0;

UPDATE filter_options 
SET display_order = (
  SELECT @row_number := CASE 
    WHEN @prev_filter_type_id = filter_type_id THEN @row_number + 1
    ELSE 1
  END,
  @prev_filter_type_id := filter_type_id,
  @row_number
)[0]
WHERE display_order = 0
ORDER BY filter_type_id, sort_order, id;

-- 4. 添加索引以提高查询性能
CREATE INDEX idx_filter_options_display_order ON filter_options(filter_type_id, display_order);

-- 5. 验证数据
SELECT 
  ft.name as filter_type_name,
  fo.name as option_name,
  fo.display_order,
  fo.sort_order
FROM filter_options fo
JOIN filter_types ft ON fo.filter_type_id = ft.id
WHERE fo.is_active = 1
ORDER BY ft.index_position, fo.display_order;
