-- ===================================================
-- 安全插入series数据 - 不删除现有表和数据
-- ===================================================

-- 插入新的series记录（如果不存在的话）
-- 使用 INSERT IGNORE 避免重复插入

USE short_drama;

-- 插入测试数据（仅在不存在时插入）
INSERT IGNORE INTO `series` (
  `id`, `title`, `description`, `cover_url`, `total_episodes`, `created_at`, `score`, `play_count`, 
  `status`, `up_status`, `up_count`, `starring`, `actor`, `director`, `region`, `language`, 
  `release_date`, `is_completed`, `updated_at`, `category_id`, `short_id`,
  `region_option_id`, `language_option_id`, `status_option_id`, `year_option_id`
) VALUES
(1001, '测试剧集系列', '这是一个用于测试的剧集系列，包含多个精彩剧集', 'https://thinkingking.top/images/094e33ba88190db66de4b173150fd97e.png', 10, '2024-01-15 10:00:00.000000', 8.5, 12580, 'completed', 'hot', 1250, '张三,李四,王五', '张三,李四,王五,赵六', '知名导演', 'mainland', 'mandarin', '2024-01-15', 1, '2025-08-06 07:09:03', 1, 'jTX5ctteb9h', 11, 16, 27, 23),
(1002, '都市爱情剧', '现代都市背景的爱情故事', 'https://thinkingking.top/images/6a67290e1bcab67cae9b53493ca36473.png', 20, '2025-08-06 07:39:01.615378', 9.2, 25600, 'ongoing', 'new', 2560, '赵丽颖,杨洋', '赵丽颖,杨洋,王子文,李现', '著名导演A', 'mainland', 'mandarin', '2024-02-01', 0, NULL, 1, 'p8aUvzGtbvE', 11, 16, 28, 21),
(1003, '悬疑电影', '扣人心弦的悬疑推理电影', 'https://thinkingking.top/images/627aa5e927d9ab8c939a5120f1bf37b2.png', 1, '2025-08-06 07:39:01.618262', 8.8, 18900, 'completed', 'hot', 1890, '易烊千玺,周冬雨', '易烊千玺,周冬雨,王千源,张译', '知名导演B', 'mainland', 'mandarin', '2024-01-20', 1, NULL, 2, 'KTQ6EGtPzVF', 11, 16, 27, 23),
(1004, '搞笑综艺', '轻松幽默的娱乐综艺节目', 'https://thinkingking.top/images/7609a424f174e819dba493b88ca177d2.png', 12, '2025-08-06 07:39:01.620979', 8, 32100, 'completed', 'popular', 3210, '沈腾,贾玲,岳云鹏', '沈腾,贾玲,岳云鹏,张小斐', '综艺导演C', 'mainland', 'mandarin', '2024-01-10', 1, NULL, 3, 'wsuYyNpq59X', 11, 16, 27, 23),
(1005, '古装电视剧', '古代宫廷题材电视剧', 'https://thinkingking.top/images/dc64c6a47fbb78643b9b7353ab673ff1.png', 45, '2025-08-06 07:39:01.639425', 9.5, 45600, 'completed', 'hot', 4560, '刘诗诗,胡歌', '刘诗诗,胡歌,袁弘,林更新', '古装剧导演D', 'mainland', 'mandarin', '2023-12-15', 1, NULL, 1, '68jDaAEyHp4', 11, 16, 27, 22),
(2001, '霸道总裁爱上我', '一个普通女孩与霸道总裁的爱情故事，充满甜蜜与波折', 'https://thinkingking.top/images/92c9e51924f825603f0d1d76ea9374a4.png', 24, '2025-08-06 07:55:00.000000', 9.2, 156800, 'completed', '全24集', 24, '张三,李四', '张三,李四,王五,赵六', '导演A', 'mainland', 'mandarin', NULL, 0, NULL, 1, 'fpcxnnFA6m9', 11, 16, 27, NULL),
(2002, '古装仙侠传', '修仙世界的爱恨情仇，仙侠传奇故事', 'https://thinkingking.top/images/c0610c196b9a4c46170164fb692e220d.png', 36, '2025-08-06 07:55:00.000000', 8.8, 234500, 'on-going', '更新至第30集', 30, '仙女A,仙男B', '仙女A,仙男B,配角C,配角D', '导演B', 'mainland', 'mandarin', NULL, 0, NULL, 1, 'kaNqkt7QENy', 11, 16, 28, NULL),
(2003, '都市悬疑案', '现代都市背景的悬疑推理剧，扣人心弦', 'https://thinkingking.top/images/2608620cb27c75274cfa73bde5f80ffe.png', 12, '2025-08-06 07:55:00.000000', 9.5, 89600, 'completed', '全12集', 12, '侦探A,助手B', '侦探A,助手B,嫌疑人C,警察D', '导演C', 'mainland', 'mandarin', NULL, 0, NULL, 2, 'GyPHPsWxknr', 11, 16, 27, NULL);

-- 显示插入结果
SELECT '数据插入完成!' as status;
SELECT COUNT(*) as total_records FROM series;
SELECT id, title, short_id FROM series ORDER BY id;

