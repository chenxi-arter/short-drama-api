-- 更新series表，建立与category的关联关系
-- 移除tags相关的多对多关系，改为直接通过category_id关联

-- 1. 为series表添加category_id字段（如果不存在）
ALTER TABLE series ADD COLUMN IF NOT EXISTS category_id VARCHAR(50);

-- 2. 根据现有数据更新category_id字段
-- 将电影类series关联到电影分类
UPDATE series SET category_id = '2' WHERE title LIKE '%电影%' OR description LIKE '%电影%';

-- 将电视剧类series关联到电视剧分类
UPDATE series SET category_id = '4' WHERE title LIKE '%电视剧%' OR description LIKE '%电视剧%' OR title LIKE '%剧集%';

-- 将综艺类series关联到综艺分类
UPDATE series SET category_id = '5' WHERE title LIKE '%综艺%' OR description LIKE '%综艺%';

-- 将动漫类series关联到动漫分类
UPDATE series SET category_id = '6' WHERE title LIKE '%动漫%' OR description LIKE '%动漫%' OR title LIKE '%动画%';

-- 将纪录片类series关联到纪录片分类
UPDATE series SET category_id = '7' WHERE title LIKE '%纪录片%' OR description LIKE '%纪录片%';

-- 将体育类series关联到体育分类
UPDATE series SET category_id = '95' WHERE title LIKE '%体育%' OR description LIKE '%体育%';

-- 默认未分类的series关联到首页分类
UPDATE series SET category_id = '1' WHERE category_id IS NULL;

-- 3. 删除series_tags中间表（如果存在）
DROP TABLE IF EXISTS series_tags;

-- 4. 删除episode_tags中间表（如果存在）
DROP TABLE IF EXISTS episode_tags;

-- 5. 删除tags表（如果存在）
DROP TABLE IF EXISTS tags;

-- 6. 为category_id字段添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_series_category_id ON series(category_id);

-- 7. 添加外键约束（可选，根据需要启用）
-- ALTER TABLE series ADD CONSTRAINT fk_series_category 
--   FOREIGN KEY (category_id) REFERENCES categories(category_id);

COMMIT;