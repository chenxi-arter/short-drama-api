-- =====================================================
-- 创建轮播图表
-- =====================================================

CREATE TABLE IF NOT EXISTS `banners` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '轮播图ID',
  `title` varchar(255) NOT NULL COMMENT '轮播图标题',
  `image_url` varchar(500) NOT NULL COMMENT '轮播图图片URL',
  `series_id` int DEFAULT NULL COMMENT '关联的系列ID',
  `category_id` int DEFAULT NULL COMMENT '关联的分类ID',
  `link_url` varchar(500) DEFAULT NULL COMMENT '点击跳转链接',
  `weight` int NOT NULL DEFAULT '0' COMMENT '权重，用于排序',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否启用',
  `start_time` timestamp NULL DEFAULT NULL COMMENT '开始展示时间',
  `end_time` timestamp NULL DEFAULT NULL COMMENT '结束展示时间',
  `description` text COMMENT '描述信息',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_series_id` (`series_id`),
  KEY `idx_weight` (`weight`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_start_time` (`start_time`),
  KEY `idx_end_time` (`end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='轮播图表';

-- 插入一些测试数据
INSERT INTO `banners` (`title`, `image_url`, `series_id`, `category_id`, `link_url`, `weight`, `is_active`, `description`) VALUES
('热门短剧推荐', 'https://example.com/banner1.jpg', 1, 1, 'https://example.com/series/1', 100, 1, '最新热门短剧，精彩不容错过'),
('经典电影回顾', 'https://example.com/banner2.jpg', 2, 2, 'https://example.com/series/2', 90, 1, '经典电影重温，回味无穷'),
('综艺娱乐', 'https://example.com/banner3.jpg', 3, 3, 'https://example.com/series/3', 80, 1, '轻松娱乐，欢声笑语'),
('动作大片', 'https://example.com/banner4.jpg', 4, 1, 'https://example.com/series/4', 70, 1, '刺激动作，热血沸腾'),
('浪漫爱情', 'https://example.com/banner5.jpg', 5, 2, 'https://example.com/series/5', 60, 1, '甜蜜爱情，温暖人心');