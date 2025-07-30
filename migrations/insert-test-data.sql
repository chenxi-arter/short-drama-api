-- 插入测试数据脚本
-- 为所有表插入丰富的测试数据

-- 插入更多分类数据
INSERT IGNORE INTO `categories` (`name`) VALUES 
('科幻剧'),
('历史剧'),
('战争剧'),
('青春剧'),
('家庭剧'),
('犯罪剧'),
('医疗剧'),
('校园剧'),
('职场剧'),
('武侠剧');

-- 插入更多标签数据
INSERT IGNORE INTO `tags` (`name`) VALUES 
('高分推荐'),
('经典重温'),
('新人演员'),
('大制作'),
('小成本'),
('网络热播'),
('口碑佳作'),
('话题之作'),
('年度必看'),
('青春校园'),
('职场励志'),
('家庭温情'),
('武侠江湖'),
('科幻未来'),
('历史传奇');

-- 插入更多系列数据
INSERT IGNORE INTO `series` (`title`, `description`, `cover_url`, `total_episodes`, `score`, `playCount`, `status`, `up_status`, `up_count`, `category_id`) VALUES 
('科幻未来世界', '2050年的科幻故事', 'https://example.com/sci-fi1.jpg', 30, 8.7, 12000, 'on-going', '更新到第15集', 15, 7),
('历史风云录', '明朝历史传奇', 'https://example.com/history1.jpg', 40, 9.2, 20000, 'completed', '全集', 40, 8),
('战地英雄', '抗战题材剧集', 'https://example.com/war1.jpg', 32, 8.9, 18000, 'completed', '全集', 32, 9),
('青春校园日记', '高中生活故事', 'https://example.com/youth1.jpg', 24, 8.3, 9000, 'on-going', '更新到第10集', 10, 10),
('温馨家庭', '三代同堂的故事', 'https://example.com/family1.jpg', 28, 8.6, 11000, 'on-going', '更新到第20集', 20, 11),
('犯罪现场', '刑侦破案剧', 'https://example.com/crime1.jpg', 36, 9.1, 16000, 'completed', '全集', 36, 12),
('白衣天使', '医院生活剧', 'https://example.com/medical1.jpg', 26, 8.8, 13000, 'on-going', '更新到第18集', 18, 13),
('大学时光', '大学校园故事', 'https://example.com/campus1.jpg', 22, 8.4, 8500, 'completed', '全集', 22, 14),
('职场风云', '商战职场剧', 'https://example.com/office1.jpg', 34, 8.7, 14000, 'on-going', '更新到第25集', 25, 15),
('江湖侠客', '武侠江湖传说', 'https://example.com/wuxia1.jpg', 38, 9.0, 17000, 'completed', '全集', 38, 16),
('都市夜生活', '现代都市群像', 'https://example.com/urban1.jpg', 20, 8.2, 7000, 'on-going', '更新到第12集', 12, 1),
('宫廷秘史', '清朝宫廷剧', 'https://example.com/palace1.jpg', 42, 8.9, 19000, 'completed', '全集', 42, 2),
('推理大师', '侦探推理剧', 'https://example.com/detective1.jpg', 16, 9.3, 21000, 'completed', '全集', 16, 3),
('浪漫爱情', '现代爱情故事', 'https://example.com/romance1.jpg', 18, 8.5, 10500, 'on-going', '更新到第14集', 14, 4),
('爆笑生活', '都市喜剧', 'https://example.com/comedy1.jpg', 25, 8.1, 6500, 'on-going', '更新到第16集', 16, 5);

-- 插入剧集数据（为前几个系列插入剧集）
INSERT IGNORE INTO `episodes` (`series_id`, `episode_number`, `title`, `duration`, `status`, `playCount`) VALUES 
-- 都市爱情故事的剧集
(1, 1, '初次相遇', 2400, 'published', 1500),
(1, 2, '误会重重', 2450, 'published', 1400),
(1, 3, '真相大白', 2380, 'published', 1300),
(1, 4, '感情升温', 2420, 'published', 1200),
(1, 5, '分手危机', 2500, 'published', 1100),
-- 古装传奇的剧集
(2, 1, '入宫序曲', 2600, 'published', 2000),
(2, 2, '宫廷斗争', 2550, 'published', 1900),
(2, 3, '爱恨情仇', 2480, 'published', 1800),
(2, 4, '权力游戏', 2520, 'published', 1700),
(2, 5, '生死抉择', 2580, 'published', 1600),
-- 悬疑推理的剧集
(3, 1, '神秘案件', 2300, 'published', 1200),
(3, 2, '线索追踪', 2350, 'published', 1150),
(3, 3, '真凶浮现', 2400, 'published', 1100),
(3, 4, '最后审判', 2450, 'published', 1050),
-- 科幻未来世界的剧集
(4, 1, '未来启示', 2500, 'published', 800),
(4, 2, '机器觉醒', 2480, 'published', 750),
(4, 3, '人类反击', 2520, 'published', 700),
-- 历史风云录的剧集
(5, 1, '王朝兴起', 2700, 'published', 1800),
(5, 2, '权臣当道', 2650, 'published', 1750),
(5, 3, '民间疾苦', 2600, 'published', 1700);

-- 插入剧集播放地址
INSERT IGNORE INTO `episode_urls` (`episode_id`, `quality`, `oss_url`, `cdn_url`, `subtitle_url`) VALUES 
-- 第1集的不同清晰度
(1, '720p', 'https://oss.example.com/ep1_720p.mp4', 'https://cdn.example.com/ep1_720p.mp4', 'https://cdn.example.com/ep1_sub.srt'),
(1, '1080p', 'https://oss.example.com/ep1_1080p.mp4', 'https://cdn.example.com/ep1_1080p.mp4', 'https://cdn.example.com/ep1_sub.srt'),
(1, '4K', 'https://oss.example.com/ep1_4k.mp4', 'https://cdn.example.com/ep1_4k.mp4', 'https://cdn.example.com/ep1_sub.srt'),
-- 第2集的不同清晰度
(2, '720p', 'https://oss.example.com/ep2_720p.mp4', 'https://cdn.example.com/ep2_720p.mp4', 'https://cdn.example.com/ep2_sub.srt'),
(2, '1080p', 'https://oss.example.com/ep2_1080p.mp4', 'https://cdn.example.com/ep2_1080p.mp4', 'https://cdn.example.com/ep2_sub.srt'),
-- 第3集的不同清晰度
(3, '720p', 'https://oss.example.com/ep3_720p.mp4', 'https://cdn.example.com/ep3_720p.mp4', NULL),
(3, '1080p', 'https://oss.example.com/ep3_1080p.mp4', 'https://cdn.example.com/ep3_1080p.mp4', NULL),
-- 更多剧集的播放地址
(4, '720p', 'https://oss.example.com/ep4_720p.mp4', 'https://cdn.example.com/ep4_720p.mp4', NULL),
(5, '720p', 'https://oss.example.com/ep5_720p.mp4', 'https://cdn.example.com/ep5_720p.mp4', NULL),
(6, '1080p', 'https://oss.example.com/ep6_1080p.mp4', 'https://cdn.example.com/ep6_1080p.mp4', 'https://cdn.example.com/ep6_sub.srt'),
(7, '720p', 'https://oss.example.com/ep7_720p.mp4', 'https://cdn.example.com/ep7_720p.mp4', NULL),
(8, '1080p', 'https://oss.example.com/ep8_1080p.mp4', 'https://cdn.example.com/ep8_1080p.mp4', NULL);

-- 插入更多短视频数据
INSERT IGNORE INTO `short_videos` (`title`, `description`, `cover_url`, `video_url`, `duration`, `play_count`, `like_count`, `platform_name`, `category_id`) VALUES 
('都市生活片段', '现代都市生活记录', 'https://example.com/short_urban1.jpg', 'https://example.com/video_urban1.mp4', 45, 2500, 120, '官方平台', 1),
('古风舞蹈', '传统古典舞蹈表演', 'https://example.com/short_dance1.jpg', 'https://example.com/video_dance1.mp4', 180, 8000, 400, '官方平台', 2),
('悬疑短片', '3分钟悬疑故事', 'https://example.com/short_mystery1.jpg', 'https://example.com/video_mystery1.mp4', 180, 6000, 300, '官方平台', 3),
('爱情微电影', '浪漫爱情短片', 'https://example.com/short_love1.jpg', 'https://example.com/video_love1.mp4', 300, 12000, 600, '官方平台', 4),
('搞笑段子', '爆笑生活片段', 'https://example.com/short_funny1.jpg', 'https://example.com/video_funny1.mp4', 30, 15000, 800, '官方平台', 5),
('动作特技', '精彩动作镜头', 'https://example.com/short_action1.jpg', 'https://example.com/video_action1.mp4', 120, 7000, 350, '官方平台', 6),
('科幻特效', '未来科技展示', 'https://example.com/short_scifi1.jpg', 'https://example.com/video_scifi1.mp4', 90, 4000, 200, '官方平台', 7),
('历史纪录', '历史事件回顾', 'https://example.com/short_history1.jpg', 'https://example.com/video_history1.mp4', 240, 3500, 180, '官方平台', 8),
('青春校园', '校园生活记录', 'https://example.com/short_youth1.jpg', 'https://example.com/video_youth1.mp4', 150, 9000, 450, '官方平台', 10),
('家庭温情', '家庭生活片段', 'https://example.com/short_family1.jpg', 'https://example.com/video_family1.mp4', 200, 5500, 280, '官方平台', 11),
('职场励志', '职场正能量', 'https://example.com/short_office1.jpg', 'https://example.com/video_office1.mp4', 180, 4500, 220, '官方平台', 15),
('武侠片段', '武侠动作场面', 'https://example.com/short_wuxia1.jpg', 'https://example.com/video_wuxia1.mp4', 120, 6500, 320, '官方平台', 16);

-- 插入测试用户数据
INSERT IGNORE INTO `users` (`id`, `first_name`, `last_name`, `username`, `is_active`) VALUES 
(1001, '张', '三', 'zhangsan', 1),
(1002, '李', '四', 'lisi', 1),
(1003, '王', '五', 'wangwu', 1),
(1004, '赵', '六', 'zhaoliu', 1),
(1005, '钱', '七', 'qianqi', 1),
(1006, '孙', '八', 'sunba', 1),
(1007, '周', '九', 'zhoujiu', 1),
(1008, '吴', '十', 'wushi', 1),
(1009, '郑', '一', 'zhengyi', 1),
(1010, '冯', '二', 'fenger', 1),
(1011, 'John', 'Doe', 'johndoe', 1),
(1012, 'Jane', 'Smith', 'janesmith', 1),
(1013, 'Mike', 'Johnson', 'mikejohnson', 1),
(1014, 'Sarah', 'Wilson', 'sarahwilson', 1),
(1015, 'David', 'Brown', 'davidbrown', 1);

-- 插入评论数据
INSERT IGNORE INTO `comments` (`user_id`, `episode_id`, `content`, `appear_second`) VALUES 
(1001, 1, '这一集太精彩了！', 0),
(1002, 1, '男主角演技真好', 0),
(1003, 1, '剧情发展很有意思', 0),
(1004, 2, '第二集更加精彩', 0),
(1005, 2, '女主角好漂亮', 0),
(1006, 3, '这个转折太意外了', 0),
(1007, 3, '编剧太厉害了', 0),
(1008, 4, '感情戏很感人', 0),
(1009, 5, '这集有点虐心', 0),
(1010, 6, '古装剧就是好看', 0),
(1011, 7, '宫斗戏很精彩', 0),
(1012, 8, '这个角色很有魅力', 0),
(1013, 9, '悬疑剧情很烧脑', 0),
(1014, 10, '推理过程很精彩', 0),
(1015, 11, '科幻特效不错', 0),
-- 弹幕评论（带时间戳）
(1001, 1, '哈哈哈笑死我了', 120),
(1002, 1, '这里的音乐很棒', 300),
(1003, 2, '男主好帅！', 180),
(1004, 2, '这个镜头拍得真美', 450),
(1005, 3, '剧情神转折', 600),
(1006, 3, '没想到是这样', 720),
(1007, 4, '太感动了', 360),
(1008, 5, '心疼女主', 240);

-- 插入观看进度数据
INSERT IGNORE INTO `watch_progress` (`user_id`, `episode_id`, `stop_at_second`) VALUES 
(1001, 1, 1200),
(1001, 2, 800),
(1002, 1, 2400),
(1002, 2, 1500),
(1002, 3, 600),
(1003, 1, 2000),
(1003, 6, 1800),
(1004, 7, 1200),
(1005, 8, 900),
(1006, 9, 1500),
(1007, 10, 2100),
(1008, 11, 800),
(1009, 1, 300),
(1010, 2, 1800),
(1011, 3, 2200),
(1012, 4, 1000),
(1013, 5, 1600),
(1014, 6, 2000),
(1015, 7, 1400);

-- 插入系列标签关联数据
INSERT IGNORE INTO `series_tags` (`series_id`, `tag_id`) VALUES 
-- 都市爱情故事的标签
(1, 1), -- 2025热映
(1, 4), -- 爱情
(1, 3), -- 都市
(1, 8), -- 热门
-- 古装传奇的标签
(2, 5), -- 古装
(2, 9), -- 推荐
(2, 16), -- 高分推荐
(2, 19), -- 大制作
-- 悬疑推理的标签
(3, 2), -- 悬疑
(3, 16), -- 高分推荐
(3, 21), -- 口碑佳作
-- 科幻未来世界的标签
(4, 29), -- 科幻未来
(4, 19), -- 大制作
(4, 22), -- 话题之作
-- 历史风云录的标签
(5, 30), -- 历史传奇
(5, 17), -- 经典重温
(5, 23), -- 年度必看
-- 更多系列的标签
(6, 7), -- 动作
(6, 8), -- 热门
(7, 24), -- 青春校园
(7, 18), -- 新人演员
(8, 26), -- 家庭温情
(8, 21), -- 口碑佳作
(9, 25), -- 职场励志
(9, 22), -- 话题之作
(10, 27), -- 武侠江湖
(10, 17); -- 经典重温

-- 插入剧集标签关联数据
INSERT IGNORE INTO `episode_tags` (`episode_id`, `tag_id`) VALUES 
-- 第1集的标签
(1, 1), -- 2025热映
(1, 8), -- 热门
-- 第2集的标签
(2, 4), -- 爱情
(2, 9), -- 推荐
-- 第3集的标签
(3, 2), -- 悬疑
(3, 21), -- 口碑佳作
-- 更多剧集标签
(6, 5), -- 古装
(7, 16), -- 高分推荐
(8, 19), -- 大制作
(9, 2), -- 悬疑
(10, 21), -- 口碑佳作
(15, 29), -- 科幻未来
(18, 30); -- 历史传奇

COMMIT;