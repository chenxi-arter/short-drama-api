-- 更新分类表结构以支持新的分类列表接口
-- 添加新字段以匹配前端需要的数据结构

-- 添加新字段
ALTER TABLE categories 
ADD COLUMN category_id VARCHAR(50) NOT NULL DEFAULT '0' COMMENT '分类ID（前端识别用）',
ADD COLUMN type INT NOT NULL DEFAULT 1 COMMENT '分类类型：0-首页，1-视频分类，2-短视频分类，6-片单',
ADD COLUMN `index` INT NOT NULL DEFAULT 1 COMMENT '排序索引',
ADD COLUMN route_name VARCHAR(50) NULL COMMENT '路由名称',
ADD COLUMN style_type INT NULL COMMENT '样式类型',
ADD COLUMN is_enabled BOOLEAN NOT NULL DEFAULT TRUE COMMENT '是否启用',
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间';

-- 插入示例数据（基于用户提供的JSON结构）
INSERT INTO categories (category_id, name, type, `index`, route_name, style_type, is_enabled) VALUES
('0', '首页', 0, 1, '', NULL, TRUE),
('3', '电影', 1, 2, 'movie', NULL, TRUE),
('4', '电视剧', 1, 3, 'drama', NULL, TRUE),
('5', '综艺', 1, 4, 'variety', NULL, TRUE),
('6', '动漫', 1, 5, 'anime', NULL, TRUE),
('95', '体育', 1, 6, 'sport', NULL, TRUE),
('7', '纪录片', 1, 7, 'documentary', NULL, TRUE),
('片单', '片单', 6, 106, 'collections', NULL, TRUE),
('chinese', '华人', 2, 9, 'chinese', 0, TRUE),
('games', '游戏', 2, 4, 'games', 0, TRUE),
('news', '新闻', 2, 1, 'news', 0, TRUE),
('yule', '娱乐', 2, 2, 'yule', 0, TRUE),
('life', '生活', 2, 3, 'life', 0, TRUE),
('music', '音乐', 2, 5, 'music', 0, TRUE),
('fashion', '时尚', 2, 6, 'fashion', 0, TRUE),
('tech', '科技', 2, 8, 'tech', 0, TRUE)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  type = VALUES(type),
  `index` = VALUES(`index`),
  route_name = VALUES(route_name),
  style_type = VALUES(style_type),
  is_enabled = VALUES(is_enabled);

-- 创建索引以提高查询性能
CREATE INDEX idx_categories_type ON categories(type);
CREATE INDEX idx_categories_index ON categories(`index`);
CREATE INDEX idx_categories_enabled ON categories(is_enabled);
CREATE INDEX idx_categories_category_id ON categories(category_id);