-- 完整的分类表结构和数据更新脚本
-- 合并了 update-category-table.sql 和 update-category-data.sql 的功能
-- 提供一站式分类表初始化和数据填充

USE short_drama;

-- 1. 更新分类表结构
-- 添加新字段以支持新的分类列表接口
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS category_id VARCHAR(50) NOT NULL DEFAULT '0' COMMENT '分类ID（前端识别用）',
ADD COLUMN IF NOT EXISTS type INT NOT NULL DEFAULT 1 COMMENT '分类类型：0-首页，1-视频分类，2-短视频分类，6-片单',
ADD COLUMN IF NOT EXISTS `index` INT NOT NULL DEFAULT 1 COMMENT '排序索引',
ADD COLUMN IF NOT EXISTS route_name VARCHAR(50) NULL COMMENT '路由名称',
ADD COLUMN IF NOT EXISTS style_type INT NULL COMMENT '样式类型',
ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN NOT NULL DEFAULT TRUE COMMENT '是否启用',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间';

-- 2. 清理现有数据（可选，根据需要启用）
-- DELETE FROM categories;

-- 3. 插入标准分类数据
INSERT INTO categories (uuid, name, category_id, type, `index`, route_name, style_type, is_enabled) VALUES
-- 首页分类
(UUID(), '首页', '0', 0, 1, '', NULL, 1),

-- 视频分类 (type=1)
(UUID(), '电影', '3', 1, 2, 'movie', NULL, 1),
(UUID(), '电视剧', '4', 1, 3, 'drama', NULL, 1),
(UUID(), '综艺', '5', 1, 4, 'variety', NULL, 1),
(UUID(), '动漫', '6', 1, 5, 'anime', NULL, 1),
(UUID(), '体育', '95', 1, 6, 'sport', NULL, 1),
(UUID(), '纪录片', '7', 1, 7, 'documentary', NULL, 1),

-- 片单分类 (type=6)
(UUID(), '片单', '片单', 6, 106, 'collections', NULL, 1),

-- 短视频分类 (type=2)
(UUID(), '新闻', 'news', 2, 1, 'news', 0, 1),
(UUID(), '娱乐', 'yule', 2, 2, 'yule', 0, 1),
(UUID(), '生活', 'life', 2, 3, 'life', 0, 1),
(UUID(), '游戏', 'games', 2, 4, 'games', 0, 1),
(UUID(), '音乐', 'music', 2, 5, 'music', 0, 1),
(UUID(), '时尚', 'fashion', 2, 6, 'fashion', 0, 1),
(UUID(), '科技', 'tech', 2, 8, 'tech', 0, 1),
(UUID(), '华人', 'chinese', 2, 9, 'chinese', 0, 1)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  type = VALUES(type),
  `index` = VALUES(`index`),
  route_name = VALUES(route_name),
  style_type = VALUES(style_type),
  is_enabled = VALUES(is_enabled),
  updated_at = CURRENT_TIMESTAMP;

-- 4. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_index ON categories(`index`);
CREATE INDEX IF NOT EXISTS idx_categories_enabled ON categories(is_enabled);
CREATE INDEX IF NOT EXISTS idx_categories_category_id ON categories(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_route_name ON categories(route_name);

-- 5. 验证插入的数据
SELECT 
    id, 
    uuid,
    name, 
    category_id, 
    type, 
    `index`, 
    route_name, 
    style_type, 
    is_enabled,
    created_at
FROM categories 
ORDER BY type, `index`;

-- 6. 显示统计信息
SELECT 
    type,
    CASE 
        WHEN type = 0 THEN '首页'
        WHEN type = 1 THEN '视频分类'
        WHEN type = 2 THEN '短视频分类'
        WHEN type = 6 THEN '片单'
        ELSE '其他'
    END as type_name,
    COUNT(*) as count
FROM categories 
WHERE is_enabled = 1
GROUP BY type
ORDER BY type;

SELECT '分类表更新完成！' as status;