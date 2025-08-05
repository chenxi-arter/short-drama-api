-- 为 categories 表的 category_id 字段添加唯一约束
-- 执行时间：2024年

-- 首先检查是否存在重复的 category_id
SELECT category_id, COUNT(*) as count 
FROM categories 
GROUP BY category_id 
HAVING COUNT(*) > 1;

-- 如果存在重复数据，需要先清理重复数据
-- 保留 id 最小的记录，删除其他重复记录
-- DELETE c1 FROM categories c1
-- INNER JOIN categories c2 
-- WHERE c1.id > c2.id AND c1.category_id = c2.category_id;

-- 为 category_id 字段添加唯一约束
ALTER TABLE categories 
ADD CONSTRAINT uk_categories_category_id UNIQUE (category_id);

-- 验证约束是否添加成功
SHOW INDEX FROM categories WHERE Key_name = 'uk_categories_category_id';