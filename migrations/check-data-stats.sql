-- 数据统计查询脚本
-- 用于检查插入的测试数据统计信息

SELECT '=== 数据库表统计信息 ===' as info;

-- 分类统计
SELECT 
    '分类表' as 表名,
    COUNT(*) as 记录数,
    GROUP_CONCAT(name ORDER BY id SEPARATOR ', ') as 分类列表
FROM categories;

-- 标签统计
SELECT 
    '标签表' as 表名,
    COUNT(*) as 记录数,
    SUBSTRING(GROUP_CONCAT(name ORDER BY id SEPARATOR ', '), 1, 100) as 标签列表前100字符
FROM tags;

-- 系列统计
SELECT 
    '系列表' as 表名,
    COUNT(*) as 总系列数,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as 已完结,
    COUNT(CASE WHEN status = 'on-going' THEN 1 END) as 连载中,
    ROUND(AVG(score), 2) as 平均评分,
    SUM(playCount) as 总播放量
FROM series;

-- 剧集统计
SELECT 
    '剧集表' as 表名,
    COUNT(*) as 总剧集数,
    COUNT(DISTINCT series_id) as 涉及系列数,
    ROUND(AVG(duration), 0) as 平均时长秒,
    SUM(playCount) as 总播放量
FROM episodes;

-- 播放地址统计
SELECT 
    '播放地址表' as 表名,
    COUNT(*) as 总地址数,
    COUNT(DISTINCT episode_id) as 涉及剧集数,
    GROUP_CONCAT(DISTINCT quality ORDER BY quality SEPARATOR ', ') as 清晰度类型
FROM episode_urls;

-- 短视频统计
SELECT 
    '短视频表' as 表名,
    COUNT(*) as 总短视频数,
    COUNT(DISTINCT category_id) as 涉及分类数,
    ROUND(AVG(duration), 0) as 平均时长秒,
    SUM(play_count) as 总播放量,
    SUM(like_count) as 总点赞数
FROM short_videos;

-- 用户统计
SELECT 
    '用户表' as 表名,
    COUNT(*) as 总用户数,
    COUNT(CASE WHEN is_active = 1 THEN 1 END) as 活跃用户,
    COUNT(CASE WHEN is_active = 0 THEN 1 END) as 非活跃用户
FROM users;

-- 评论统计
SELECT 
    '评论表' as 表名,
    COUNT(*) as 总评论数,
    COUNT(DISTINCT user_id) as 评论用户数,
    COUNT(DISTINCT episode_id) as 涉及剧集数,
    COUNT(CASE WHEN appear_second > 0 THEN 1 END) as 弹幕数量,
    COUNT(CASE WHEN appear_second = 0 THEN 1 END) as 普通评论数
FROM comments;

-- 观看进度统计
SELECT 
    '观看进度表' as 表名,
    COUNT(*) as 总进度记录数,
    COUNT(DISTINCT user_id) as 观看用户数,
    COUNT(DISTINCT episode_id) as 涉及剧集数,
    ROUND(AVG(stop_at_second), 0) as 平均观看时长秒
FROM watch_progress;

-- 系列标签关联统计
SELECT 
    '系列标签关联表' as 表名,
    COUNT(*) as 总关联数,
    COUNT(DISTINCT series_id) as 涉及系列数,
    COUNT(DISTINCT tag_id) as 涉及标签数,
    ROUND(COUNT(*) / COUNT(DISTINCT series_id), 1) as 平均每系列标签数
FROM series_tags;

-- 剧集标签关联统计
SELECT 
    '剧集标签关联表' as 表名,
    COUNT(*) as 总关联数,
    COUNT(DISTINCT episode_id) as 涉及剧集数,
    COUNT(DISTINCT tag_id) as 涉及标签数,
    ROUND(COUNT(*) / COUNT(DISTINCT episode_id), 1) as 平均每剧集标签数
FROM episode_tags;

-- 热门内容统计
SELECT '=== 热门内容TOP5 ===' as info;

-- 播放量最高的系列
SELECT 
    '播放量最高系列' as 类型,
    title as 标题,
    playCount as 播放量,
    score as 评分
FROM series 
ORDER BY playCount DESC 
LIMIT 5;

-- 播放量最高的短视频
SELECT 
    '播放量最高短视频' as 类型,
    title as 标题,
    play_count as 播放量,
    like_count as 点赞数
FROM short_videos 
ORDER BY play_count DESC 
LIMIT 5;

-- 评论最多的剧集
SELECT 
    '评论最多剧集' as 类型,
    e.title as 剧集标题,
    s.title as 系列标题,
    COUNT(c.id) as 评论数
FROM episodes e
JOIN series s ON e.series_id = s.id
LEFT JOIN comments c ON e.id = c.episode_id
GROUP BY e.id, e.title, s.title
ORDER BY COUNT(c.id) DESC
LIMIT 5;