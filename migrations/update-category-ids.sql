-- 更新categories表中的categoryId字段，使其与代码映射保持一致
-- 原值: 首页(0), 电影(3), 短剧(4), 综艺(5)
-- 新值: 首页(62), 短剧(63), 电影(64), 综艺(65)

USE short_drama;

-- 备份当前数据
CREATE TABLE IF NOT EXISTS categories_backup AS SELECT * FROM categories;

-- 更新categoryId字段
UPDATE categories SET categoryId = '62' WHERE categoryId = '0' AND name = '首页';
UPDATE categories SET categoryId = '63' WHERE categoryId = '4' AND name = '短剧';
UPDATE categories SET categoryId = '64' WHERE categoryId = '3' AND name = '电影';
UPDATE categories SET categoryId = '65' WHERE categoryId = '5' AND name = '综艺';

-- 验证更新结果
SELECT id, categoryId, name, type, routeName FROM categories ORDER BY categoryId;

-- 如果需要回滚，可以使用以下语句：
-- DELETE FROM categories;
-- INSERT INTO categories SELECT * FROM categories_backup;
-- DROP TABLE categories_backup;