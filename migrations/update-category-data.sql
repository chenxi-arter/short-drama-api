-- 更新分类数据以匹配用户期望的格式
USE short_drama;

-- 删除现有数据
DELETE FROM categories;

-- 插入标准分类数据
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
(UUID(), '华人', 'chinese', 2, 9, 'chinese', 0, 1);

-- 验证插入的数据
SELECT id, name, category_id, type, `index`, route_name, style_type, is_enabled FROM categories ORDER BY type, `index`;