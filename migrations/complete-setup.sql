-- =====================================================
-- 短剧API项目 - 完整数据库初始化脚本
-- 包含所有表结构、索引、测试数据和refresh_tokens表
-- 适用于新服务器一键部署
-- =====================================================

-- 设置字符集和时区
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET time_zone = '+08:00';

-- =====================================================
-- 1. 创建基础表结构
-- =====================================================

-- 用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `telegram_id` bigint NOT NULL COMMENT 'Telegram用户ID',
  `first_name` varchar(255) NOT NULL COMMENT '名字',
  `last_name` varchar(255) DEFAULT NULL COMMENT '姓氏',
  `username` varchar(255) DEFAULT NULL COMMENT '用户名',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否激活',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_telegram_id` (`telegram_id`),
  KEY `idx_username` (`username`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 分类表
CREATE TABLE IF NOT EXISTS `categories` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '分类ID',
  `name` varchar(100) NOT NULL COMMENT '分类名称',
  `description` text COMMENT '分类描述',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否激活',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`),
  KEY `idx_sort_order` (`sort_order`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分类表';

-- 标签表
CREATE TABLE IF NOT EXISTS `tags` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '标签ID',
  `name` varchar(50) NOT NULL COMMENT '标签名称',
  `color` varchar(7) DEFAULT '#007bff' COMMENT '标签颜色',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否激活',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='标签表';

-- 系列表
CREATE TABLE IF NOT EXISTS `series` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '系列ID',
  `title` varchar(255) NOT NULL COMMENT '系列标题',
  `description` text COMMENT '系列描述',
  `cover_image` varchar(500) DEFAULT NULL COMMENT '封面图片URL',
  `category_id` int NOT NULL COMMENT '分类ID',
  `total_episodes` int NOT NULL DEFAULT '0' COMMENT '总集数',
  `status` enum('ongoing','completed','paused') NOT NULL DEFAULT 'ongoing' COMMENT '状态',
  `rating` decimal(3,2) DEFAULT '0.00' COMMENT '评分',
  `view_count` bigint NOT NULL DEFAULT '0' COMMENT '观看次数',
  `like_count` bigint NOT NULL DEFAULT '0' COMMENT '点赞数',
  `up_status` tinyint(1) NOT NULL DEFAULT '0' COMMENT '更新状态',
  `up_count` int NOT NULL DEFAULT '0' COMMENT '更新集数',
  `is_featured` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否推荐',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否激活',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `fk_series_category` (`category_id`),
  KEY `idx_status` (`status`),
  KEY `idx_is_featured` (`is_featured`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_view_count` (`view_count`),
  KEY `idx_rating` (`rating`),
  CONSTRAINT `fk_series_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系列表';

-- 剧集表
CREATE TABLE IF NOT EXISTS `episodes` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '剧集ID',
  `series_id` int NOT NULL COMMENT '系列ID',
  `episode_number` int NOT NULL COMMENT '集数',
  `title` varchar(255) NOT NULL COMMENT '剧集标题',
  `description` text COMMENT '剧集描述',
  `video_url` varchar(500) NOT NULL COMMENT '视频URL',
  `thumbnail` varchar(500) DEFAULT NULL COMMENT '缩略图URL',
  `duration` int NOT NULL DEFAULT '0' COMMENT '时长(秒)',
  `view_count` bigint NOT NULL DEFAULT '0' COMMENT '观看次数',
  `like_count` bigint NOT NULL DEFAULT '0' COMMENT '点赞数',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否激活',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_series_episode` (`series_id`,`episode_number`),
  KEY `idx_episode_number` (`episode_number`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_view_count` (`view_count`),
  CONSTRAINT `fk_episodes_series` FOREIGN KEY (`series_id`) REFERENCES `series` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='剧集表';

-- 短视频表
CREATE TABLE IF NOT EXISTS `videos` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '视频ID',
  `title` varchar(255) NOT NULL COMMENT '视频标题',
  `description` text COMMENT '视频描述',
  `video_url` varchar(500) NOT NULL COMMENT '视频URL',
  `thumbnail` varchar(500) DEFAULT NULL COMMENT '缩略图URL',
  `duration` int NOT NULL DEFAULT '0' COMMENT '时长(秒)',
  `category_id` int NOT NULL COMMENT '分类ID',
  `view_count` bigint NOT NULL DEFAULT '0' COMMENT '观看次数',
  `like_count` bigint NOT NULL DEFAULT '0' COMMENT '点赞数',
  `is_featured` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否推荐',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否激活',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `fk_videos_category` (`category_id`),
  KEY `idx_is_featured` (`is_featured`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_view_count` (`view_count`),
  CONSTRAINT `fk_videos_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='短视频表';

-- 系列标签关联表
CREATE TABLE IF NOT EXISTS `series_tags` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `series_id` int NOT NULL COMMENT '系列ID',
  `tag_id` int NOT NULL COMMENT '标签ID',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_series_tag` (`series_id`,`tag_id`),
  KEY `fk_series_tags_tag` (`tag_id`),
  CONSTRAINT `fk_series_tags_series` FOREIGN KEY (`series_id`) REFERENCES `series` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_series_tags_tag` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系列标签关联表';

-- 剧集标签关联表
CREATE TABLE IF NOT EXISTS `episode_tags` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `episode_id` int NOT NULL COMMENT '剧集ID',
  `tag_id` int NOT NULL COMMENT '标签ID',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_episode_tag` (`episode_id`,`tag_id`),
  KEY `fk_episode_tags_tag` (`tag_id`),
  CONSTRAINT `fk_episode_tags_episode` FOREIGN KEY (`episode_id`) REFERENCES `episodes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_episode_tags_tag` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='剧集标签关联表';

-- 视频标签关联表
CREATE TABLE IF NOT EXISTS `video_tags` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `video_id` int NOT NULL COMMENT '视频ID',
  `tag_id` int NOT NULL COMMENT '标签ID',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_video_tag` (`video_id`,`tag_id`),
  KEY `fk_video_tags_tag` (`tag_id`),
  CONSTRAINT `fk_video_tags_video` FOREIGN KEY (`video_id`) REFERENCES `videos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_video_tags_tag` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='视频标签关联表';

-- 评论表
CREATE TABLE IF NOT EXISTS `comments` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '评论ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `content_type` enum('series','episode','video') NOT NULL COMMENT '内容类型',
  `content_id` int NOT NULL COMMENT '内容ID',
  `content` text NOT NULL COMMENT '评论内容',
  `comment_type` enum('comment','danmu') NOT NULL DEFAULT 'comment' COMMENT '评论类型',
  `time_position` int DEFAULT NULL COMMENT '弹幕时间位置(秒)',
  `parent_id` bigint DEFAULT NULL COMMENT '父评论ID',
  `like_count` int NOT NULL DEFAULT '0' COMMENT '点赞数',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否激活',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `fk_comments_user` (`user_id`),
  KEY `idx_content` (`content_type`,`content_id`),
  KEY `idx_parent` (`parent_id`),
  KEY `idx_comment_type` (`comment_type`),
  KEY `idx_time_position` (`time_position`),
  KEY `idx_is_active` (`is_active`),
  CONSTRAINT `fk_comments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_comments_parent` FOREIGN KEY (`parent_id`) REFERENCES `comments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评论表';

-- 观看进度表
CREATE TABLE IF NOT EXISTS `watch_progress` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `content_type` enum('episode','video') NOT NULL COMMENT '内容类型',
  `content_id` int NOT NULL COMMENT '内容ID',
  `progress_seconds` int NOT NULL DEFAULT '0' COMMENT '观看进度(秒)',
  `total_seconds` int NOT NULL DEFAULT '0' COMMENT '总时长(秒)',
  `is_completed` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否看完',
  `last_watched_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '最后观看时间',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_content` (`user_id`,`content_type`,`content_id`),
  KEY `idx_content` (`content_type`,`content_id`),
  KEY `idx_is_completed` (`is_completed`),
  KEY `idx_last_watched` (`last_watched_at`),
  CONSTRAINT `fk_watch_progress_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='观看进度表';

-- =====================================================
-- 2. 创建refresh_tokens表（新增功能）
-- =====================================================

CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `token` varchar(255) NOT NULL COMMENT 'Refresh Token',
  `expires_at` timestamp NOT NULL COMMENT '过期时间',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `is_revoked` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否已撤销',
  `device_info` varchar(500) DEFAULT NULL COMMENT '设备信息',
  `ip_address` varchar(45) DEFAULT NULL COMMENT 'IP地址',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_token` (`token`),
  KEY `fk_refresh_tokens_user` (`user_id`),
  KEY `idx_expires_at` (`expires_at`),
  KEY `idx_is_revoked` (`is_revoked`),
  KEY `idx_ip_address` (`ip_address`),
  CONSTRAINT `fk_refresh_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='刷新令牌表';

-- =====================================================
-- 3. 插入基础数据
-- =====================================================

-- 插入分类数据
INSERT IGNORE INTO `categories` (`id`, `name`, `description`, `sort_order`) VALUES
(1, '都市情感', '现代都市背景的情感剧', 1),
(2, '古装言情', '古代背景的爱情故事', 2),
(3, '悬疑推理', '悬疑推理类短剧', 3),
(4, '喜剧搞笑', '轻松幽默的喜剧内容', 4),
(5, '青春校园', '校园青春题材', 5),
(6, '职场励志', '职场奋斗励志故事', 6),
(7, '家庭伦理', '家庭关系伦理剧', 7),
(8, '科幻奇幻', '科幻奇幻题材', 8),
(9, '历史传奇', '历史人物传奇故事', 9),
(10, '武侠江湖', '武侠江湖题材', 10),
(11, '医疗救援', '医疗题材剧集', 11),
(12, '军旅题材', '军事题材内容', 12),
(13, '商战谍战', '商业竞争谍战题材', 13),
(14, '农村生活', '农村生活题材', 14),
(15, '网络文学', '网络小说改编', 15),
(16, '短视频', '独立短视频内容', 16);

-- 插入标签数据
INSERT IGNORE INTO `tags` (`id`, `name`, `color`) VALUES
(1, '热门', '#ff4757'),
(2, '推荐', '#2ed573'),
(3, '新剧', '#1e90ff'),
(4, '完结', '#ffa502'),
(5, '独播', '#ff6b81'),
(6, '高分', '#f39c12'),
(7, '经典', '#9b59b6'),
(8, '热血', '#e74c3c'),
(9, '治愈', '#2ecc71'),
(10, '烧脑', '#34495e'),
(11, '甜宠', '#ff69b4'),
(12, '虐心', '#8e44ad'),
(13, '搞笑', '#f1c40f'),
(14, '励志', '#e67e22'),
(15, '悬疑', '#2c3e50'),
(16, '爱情', '#e91e63'),
(17, '友情', '#00bcd4'),
(18, '亲情', '#4caf50'),
(19, '成长', '#ff9800'),
(20, '逆袭', '#795548'),
(21, '重生', '#607d8b'),
(22, '穿越', '#9c27b0'),
(23, '系统', '#3f51b5'),
(24, '修仙', '#673ab7'),
(25, '都市', '#009688');

-- 插入测试用户数据
INSERT IGNORE INTO `users` (`id`, `telegram_id`, `first_name`, `last_name`, `username`) VALUES
(1, 123456789, '张', '三', 'zhangsan'),
(2, 234567890, '李', '四', 'lisi'),
(3, 345678901, '王', '五', 'wangwu'),
(4, 456789012, '赵', '六', 'zhaoliu'),
(5, 567890123, '钱', '七', 'qianqi'),
(6, 678901234, '孙', '八', 'sunba'),
(7, 789012345, '周', '九', 'zhoujiu'),
(8, 890123456, '吴', '十', 'wushi'),
(9, 901234567, '郑', '十一', 'zhengshiyi'),
(10, 1012345678, '王', '十二', 'wangshier'),
(11, 1123456789, '冯', '十三', 'fengshisan'),
(12, 1234567890, '陈', '十四', 'chenshisi'),
(13, 1345678901, '褚', '十五', 'chushiwu'),
(14, 1456789012, '卫', '十六', 'weishiliu'),
(15, 1567890123, '蒋', '十七', 'jiangshiqi');

-- 插入系列数据
INSERT IGNORE INTO `series` (`id`, `title`, `description`, `cover_image`, `category_id`, `total_episodes`, `status`, `rating`, `view_count`, `like_count`, `up_status`, `up_count`, `is_featured`) VALUES
(1, '霸道总裁的小娇妻', '一个普通女孩与霸道总裁的爱情故事', 'https://example.com/cover1.jpg', 1, 20, 'completed', 8.5, 150000, 12000, 1, 20, 1),
(2, '穿越之凤凰涅槃', '现代女子穿越古代成为皇后的传奇', 'https://example.com/cover2.jpg', 2, 25, 'ongoing', 9.2, 200000, 18000, 1, 15, 1),
(3, '校园恋爱物语', '青春校园里的甜蜜爱情', 'https://example.com/cover3.jpg', 5, 15, 'completed', 7.8, 80000, 6500, 1, 15, 0),
(4, '悬疑档案', '一系列离奇案件的破解过程', 'https://example.com/cover4.jpg', 3, 30, 'ongoing', 8.9, 120000, 9800, 1, 12, 1),
(5, '职场风云', '职场新人的奋斗历程', 'https://example.com/cover5.jpg', 6, 18, 'completed', 8.1, 95000, 7200, 1, 18, 0),
(6, '家有儿女新传', '现代家庭的温馨故事', 'https://example.com/cover6.jpg', 7, 22, 'ongoing', 8.3, 110000, 8900, 1, 10, 0),
(7, '星际穿越之恋', '科幻背景下的浪漫爱情', 'https://example.com/cover7.jpg', 8, 16, 'paused', 7.9, 75000, 5800, 0, 8, 0),
(8, '大明风华', '明朝历史人物传奇', 'https://example.com/cover8.jpg', 9, 28, 'ongoing', 9.0, 180000, 15000, 1, 20, 1),
(9, '武林外传续集', '经典武侠的现代演绎', 'https://example.com/cover9.jpg', 10, 24, 'completed', 8.7, 160000, 13500, 1, 24, 1),
(10, '急诊科医生', '医院急诊科的日常', 'https://example.com/cover10.jpg', 11, 20, 'ongoing', 8.4, 105000, 8200, 1, 12, 0),
(11, '特种兵王', '退役特种兵的都市生活', 'https://example.com/cover11.jpg', 12, 26, 'completed', 8.6, 140000, 11000, 1, 26, 1),
(12, '商战风云', '商界精英的较量', 'https://example.com/cover12.jpg', 13, 19, 'ongoing', 8.2, 88000, 6800, 1, 8, 0),
(13, '乡村爱情故事', '农村生活的温情故事', 'https://example.com/cover13.jpg', 14, 21, 'completed', 7.6, 70000, 5200, 1, 21, 0),
(14, '网游之天下无双', '虚拟游戏世界的冒险', 'https://example.com/cover14.jpg', 15, 23, 'ongoing', 8.8, 125000, 10500, 1, 15, 1),
(15, '都市修仙传', '现代都市中的修仙者', 'https://example.com/cover15.jpg', 1, 27, 'ongoing', 9.1, 190000, 16800, 1, 18, 1);

-- 插入剧集数据（每个系列插入部分剧集）
INSERT IGNORE INTO `episodes` (`id`, `series_id`, `episode_number`, `title`, `description`, `video_url`, `thumbnail`, `duration`, `view_count`, `like_count`) VALUES
(1, 1, 1, '初次相遇', '女主角与霸道总裁的第一次相遇', 'https://example.com/video1.mp4', 'https://example.com/thumb1.jpg', 1200, 15000, 1200),
(2, 1, 2, '误会重重', '因为误会产生的矛盾', 'https://example.com/video2.mp4', 'https://example.com/thumb2.jpg', 1180, 14500, 1150),
(3, 2, 1, '穿越之始', '现代女子意外穿越到古代', 'https://example.com/video3.mp4', 'https://example.com/thumb3.jpg', 1300, 20000, 1800),
(4, 2, 2, '宫廷初体验', '初入宫廷的种种不适', 'https://example.com/video4.mp4', 'https://example.com/thumb4.jpg', 1250, 19500, 1750),
(5, 3, 1, '新学期开始', '新学期的校园生活开始', 'https://example.com/video5.mp4', 'https://example.com/thumb5.jpg', 1100, 8000, 650),
(6, 4, 1, '神秘失踪案', '一起离奇的失踪案件', 'https://example.com/video6.mp4', 'https://example.com/thumb6.jpg', 1400, 12000, 980),
(7, 5, 1, '职场新人报到', '初入职场的紧张与兴奋', 'https://example.com/video7.mp4', 'https://example.com/thumb7.jpg', 1150, 9500, 720),
(8, 6, 1, '家庭聚餐', '温馨的家庭聚餐时光', 'https://example.com/video8.mp4', 'https://example.com/thumb8.jpg', 1080, 11000, 890),
(9, 7, 1, '星际旅行', '开启神秘的星际之旅', 'https://example.com/video9.mp4', 'https://example.com/thumb9.jpg', 1350, 7500, 580),
(10, 8, 1, '大明开国', '明朝建立的历史背景', 'https://example.com/video10.mp4', 'https://example.com/thumb10.jpg', 1450, 18000, 1500),
(11, 9, 1, '江湖再现', '武林高手重出江湖', 'https://example.com/video11.mp4', 'https://example.com/thumb11.jpg', 1320, 16000, 1350),
(12, 10, 1, '急诊夜班', '急诊科的忙碌夜晚', 'https://example.com/video12.mp4', 'https://example.com/thumb12.jpg', 1200, 10500, 820),
(13, 11, 1, '退役归来', '特种兵退役后的生活', 'https://example.com/video13.mp4', 'https://example.com/thumb13.jpg', 1280, 14000, 1100),
(14, 12, 1, '商战序幕', '商业竞争的开始', 'https://example.com/video14.mp4', 'https://example.com/thumb14.jpg', 1220, 8800, 680),
(15, 13, 1, '乡村新貌', '新时代的乡村变化', 'https://example.com/video15.mp4', 'https://example.com/thumb15.jpg', 1050, 7000, 520),
(16, 14, 1, '游戏开始', '进入虚拟游戏世界', 'https://example.com/video16.mp4', 'https://example.com/thumb16.jpg', 1380, 12500, 1050),
(17, 15, 1, '修仙启蒙', '都市修仙的开始', 'https://example.com/video17.mp4', 'https://example.com/thumb17.jpg', 1420, 19000, 1680),
(18, 1, 3, '感情升温', '两人关系逐渐升温', 'https://example.com/video18.mp4', 'https://example.com/thumb18.jpg', 1190, 14200, 1120),
(19, 2, 3, '宫斗开始', '后宫争斗的序幕', 'https://example.com/video19.mp4', 'https://example.com/thumb19.jpg', 1310, 19200, 1720),
(20, 4, 2, '线索浮现', '案件的关键线索出现', 'https://example.com/video20.mp4', 'https://example.com/thumb20.jpg', 1390, 11800, 960);

-- 插入短视频数据
INSERT IGNORE INTO `videos` (`id`, `title`, `description`, `video_url`, `thumbnail`, `duration`, `category_id`, `view_count`, `like_count`, `is_featured`) VALUES
(1, '搞笑日常合集', '日常生活中的搞笑瞬间', 'https://example.com/short1.mp4', 'https://example.com/short_thumb1.jpg', 180, 4, 50000, 4200, 1),
(2, '美食制作教程', '简单易学的美食制作', 'https://example.com/short2.mp4', 'https://example.com/short_thumb2.jpg', 240, 16, 35000, 2800, 0),
(3, '健身小贴士', '日常健身的小技巧', 'https://example.com/short3.mp4', 'https://example.com/short_thumb3.jpg', 200, 16, 28000, 2100, 0),
(4, '旅行风景', '美丽的旅行风景分享', 'https://example.com/short4.mp4', 'https://example.com/short_thumb4.jpg', 160, 16, 42000, 3500, 1),
(5, '宠物趣事', '可爱宠物的有趣瞬间', 'https://example.com/short5.mp4', 'https://example.com/short_thumb5.jpg', 150, 4, 38000, 3200, 0),
(6, '科技前沿', '最新科技产品介绍', 'https://example.com/short6.mp4', 'https://example.com/short_thumb6.jpg', 220, 8, 25000, 1800, 0),
(7, '音乐分享', '好听的音乐推荐', 'https://example.com/short7.mp4', 'https://example.com/short_thumb7.jpg', 190, 16, 32000, 2600, 0),
(8, '化妆教程', '简单的化妆技巧', 'https://example.com/short8.mp4', 'https://example.com/short_thumb8.jpg', 280, 16, 45000, 3800, 1),
(9, '游戏攻略', '热门游戏的攻略分享', 'https://example.com/short9.mp4', 'https://example.com/short_thumb9.jpg', 210, 16, 30000, 2400, 0),
(10, '学习方法', '高效学习方法分享', 'https://example.com/short10.mp4', 'https://example.com/short_thumb10.jpg', 250, 6, 22000, 1900, 0),
(11, '情感故事', '感人的情感小故事', 'https://example.com/short11.mp4', 'https://example.com/short_thumb11.jpg', 170, 1, 40000, 3400, 1),
(12, '生活小窍门', '实用的生活小技巧', 'https://example.com/short12.mp4', 'https://example.com/short_thumb12.jpg', 160, 16, 33000, 2700, 0);

-- 插入系列标签关联数据
INSERT IGNORE INTO `series_tags` (`series_id`, `tag_id`) VALUES
(1, 1), (1, 11), (1, 16), (1, 25),
(2, 1), (2, 2), (2, 22), (2, 16),
(3, 3), (3, 11), (3, 19), (3, 17),
(4, 1), (4, 15), (4, 10), (4, 2),
(5, 14), (5, 19), (5, 25), (5, 20),
(6, 9), (6, 18), (6, 13), (6, 25),
(7, 8), (7, 16), (7, 19), (7, 3),
(8, 1), (8, 7), (8, 6), (8, 2),
(9, 7), (9, 8), (9, 13), (9, 4),
(10, 9), (10, 14), (10, 18), (10, 25),
(11, 8), (11, 14), (11, 20), (11, 25),
(12, 14), (12, 20), (12, 25), (12, 10),
(13, 9), (13, 18), (13, 16), (13, 4),
(14, 1), (14, 23), (14, 20), (14, 8),
(15, 1), (15, 24), (15, 20), (15, 25);

-- 插入剧集标签关联数据
INSERT IGNORE INTO `episode_tags` (`episode_id`, `tag_id`) VALUES
(1, 1), (1, 11), (1, 16),
(2, 11), (2, 16), (2, 12),
(3, 1), (3, 22), (3, 16),
(4, 22), (4, 16), (4, 15),
(5, 3), (5, 11), (5, 19),
(6, 1), (6, 15), (6, 10),
(7, 14), (7, 19), (7, 25),
(8, 9), (8, 18), (8, 13),
(9, 8), (9, 16), (9, 19),
(10, 1), (10, 7), (10, 6),
(11, 7), (11, 8), (11, 13),
(12, 9), (12, 14), (12, 18),
(13, 8), (13, 14), (13, 20),
(14, 14), (14, 20), (14, 25),
(15, 9), (15, 18), (15, 16),
(16, 1), (16, 23), (16, 20),
(17, 1), (17, 24), (17, 20),
(18, 11), (18, 16), (18, 9),
(19, 22), (19, 16), (19, 15),
(20, 15), (20, 10), (20, 1);

-- 插入评论数据
INSERT IGNORE INTO `comments` (`id`, `user_id`, `content_type`, `content_id`, `content`, `comment_type`, `time_position`, `like_count`) VALUES
(1, 1, 'series', 1, '这部剧真的太好看了！', 'comment', NULL, 25),
(2, 2, 'series', 1, '霸道总裁的设定很经典', 'comment', NULL, 18),
(3, 3, 'episode', 1, '第一集就很吸引人', 'comment', NULL, 12),
(4, 4, 'episode', 1, '哈哈哈，这里太搞笑了', 'danmu', 300, 8),
(5, 5, 'series', 2, '穿越剧的巅峰之作！', 'comment', NULL, 32),
(6, 6, 'episode', 3, '女主角演技真好', 'comment', NULL, 15),
(7, 7, 'episode', 3, '这个转折太意外了', 'danmu', 450, 10),
(8, 8, 'series', 4, '悬疑剧情很烧脑', 'comment', NULL, 22),
(9, 9, 'video', 1, '搞笑视频笑死我了', 'comment', NULL, 28),
(10, 10, 'video', 1, '太有趣了！', 'danmu', 60, 5),
(11, 11, 'series', 8, '历史剧拍得很用心', 'comment', NULL, 35),
(12, 12, 'episode', 10, '服装道具都很精美', 'comment', NULL, 20),
(13, 13, 'series', 9, '武侠经典重现', 'comment', NULL, 30),
(14, 14, 'video', 4, '风景太美了', 'comment', NULL, 25),
(15, 15, 'series', 15, '修仙题材很新颖', 'comment', NULL, 28),
(16, 1, 'episode', 17, '特效做得不错', 'comment', NULL, 16),
(17, 2, 'video', 8, '化妆教程很实用', 'comment', NULL, 22),
(18, 3, 'series', 6, '家庭剧很温馨', 'comment', NULL, 19),
(19, 4, 'episode', 8, '这一家人太可爱了', 'danmu', 200, 7),
(20, 5, 'video', 11, '故事很感人', 'comment', NULL, 24),
(21, 6, 'series', 11, '特种兵题材很燃', 'comment', NULL, 26),
(22, 7, 'episode', 13, '动作戏很精彩', 'comment', NULL, 18),
(23, 8, 'video', 6, '科技产品介绍很详细', 'comment', NULL, 14),
(24, 9, 'series', 14, '游戏世界设定很棒', 'comment', NULL, 21);

-- 插入观看进度数据
INSERT IGNORE INTO `watch_progress` (`id`, `user_id`, `content_type`, `content_id`, `progress_seconds`, `total_seconds`, `is_completed`, `last_watched_at`) VALUES
(1, 1, 'episode', 1, 1200, 1200, 1, '2024-01-15 20:30:00'),
(2, 1, 'episode', 2, 600, 1180, 0, '2024-01-16 21:00:00'),
(3, 2, 'episode', 1, 800, 1200, 0, '2024-01-15 19:45:00'),
(4, 2, 'episode', 3, 1300, 1300, 1, '2024-01-17 20:15:00'),
(5, 3, 'video', 1, 180, 180, 1, '2024-01-16 15:30:00'),
(6, 3, 'video', 4, 120, 160, 0, '2024-01-17 16:20:00'),
(7, 4, 'episode', 6, 900, 1400, 0, '2024-01-18 21:30:00'),
(8, 5, 'episode', 10, 1450, 1450, 1, '2024-01-19 20:00:00'),
(9, 6, 'video', 8, 200, 280, 0, '2024-01-20 14:45:00'),
(10, 7, 'episode', 11, 1000, 1320, 0, '2024-01-21 19:30:00'),
(11, 8, 'video', 9, 210, 210, 1, '2024-01-22 16:15:00'),
(12, 9, 'episode', 13, 800, 1280, 0, '2024-01-23 20:45:00'),
(13, 10, 'video', 11, 170, 170, 1, '2024-01-24 15:20:00'),
(14, 11, 'episode', 17, 1200, 1420, 0, '2024-01-25 21:10:00'),
(15, 12, 'video', 2, 150, 240, 0, '2024-01-26 13:30:00'),
(16, 13, 'episode', 15, 1050, 1050, 1, '2024-01-27 19:00:00'),
(17, 14, 'video', 12, 100, 160, 0, '2024-01-28 14:15:00'),
(18, 15, 'episode', 16, 900, 1380, 0, '2024-01-29 20:30:00'),
(19, 1, 'video', 5, 150, 150, 1, '2024-01-30 16:45:00');

-- =====================================================
-- 4. 创建定期清理过期token的事件（可选）
-- =====================================================

-- 启用事件调度器
SET GLOBAL event_scheduler = ON;

-- 创建清理过期refresh_tokens的事件
DROP EVENT IF EXISTS `cleanup_expired_refresh_tokens`;

DELIMITER ;;
CREATE EVENT `cleanup_expired_refresh_tokens`
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
BEGIN
  DELETE FROM refresh_tokens 
  WHERE expires_at < NOW() OR is_revoked = 1;
END;;
DELIMITER ;

-- =====================================================
-- 5. 恢复外键检查
-- =====================================================

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- 完成提示
-- =====================================================

SELECT 'Database initialization completed successfully!' as message;
SELECT 
  'Categories' as table_name, COUNT(*) as record_count FROM categories
UNION ALL
SELECT 'Tags', COUNT(*) FROM tags
UNION ALL
SELECT 'Users', COUNT(*) FROM users
UNION ALL
SELECT 'Series', COUNT(*) FROM series
UNION ALL
SELECT 'Episodes', COUNT(*) FROM episodes
UNION ALL
SELECT 'Videos', COUNT(*) FROM videos
UNION ALL
SELECT 'Comments', COUNT(*) FROM comments
UNION ALL
SELECT 'Watch Progress', COUNT(*) FROM watch_progress
UNION ALL
SELECT 'Refresh Tokens', COUNT(*) FROM refresh_tokens;