-- 精简分类表数据，只保留首页、短剧、电影、综艺四个分类
-- 执行时间：2024年

-- 备份当前分类数据（可选）
-- CREATE TABLE categories_backup AS SELECT * FROM categories;

-- 首先禁用外键约束检查
SET FOREIGN_KEY_CHECKS = 0;

-- 删除不需要的分类数据，只保留指定的分类
DELETE FROM categories WHERE category_id NOT IN ('0', '3', '4', '5');

-- 更新保留的分类数据，确保名称和路由正确
-- 更新首页分类
UPDATE categories SET 
    name = '首页',
    type = 0,
    `index` = 1,
    route_name = 'home'
WHERE category_id = '0';

-- 更新电影分类
UPDATE categories SET 
    name = '电影',
    type = 1,
    `index` = 2,
    route_name = 'movie'
WHERE category_id = '3';

-- 更新电视剧分类为短剧
UPDATE categories SET 
    name = '短剧',
    type = 1,
    `index` = 3,
    route_name = 'drama'
WHERE category_id = '4';

-- 更新综艺分类
UPDATE categories SET 
    name = '综艺',
    type = 1,
    `index` = 4,
    route_name = 'variety'
WHERE category_id = '5';

-- 重新启用外键约束检查
SET FOREIGN_KEY_CHECKS = 1;

-- 查看精简后的分类数据
SELECT category_id as catid, name, type, `index`, route_name 
FROM categories 
ORDER BY `index`;

-- 显示分类统计
SELECT COUNT(*) as total_categories FROM categories;