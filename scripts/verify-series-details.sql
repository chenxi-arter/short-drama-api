-- =====================================================
-- 验证系列明细数据统计准确性 SQL 脚本
-- 用途：统计指定日期范围内每个系列每日的数据，用于验证接口返回的系列明细数据是否准确
-- 接口：GET /api/admin/export/series-details?startDate=2025-01-08&endDate=2025-01-12&categoryId=1
-- 日期范围：2025-01-08 至 2025-01-12
-- =====================================================

-- 使用方法：
-- 1. 连接到数据库后执行此脚本
-- 2. 或者通过命令行：mysql -u用户名 -p数据库名 < verify-series-details.sql
-- 3. 修改日期范围：在 WHERE 子句中修改日期（第一个查询约第106-107行，其他查询类似）
-- 4. 修改分类筛选：在 WHERE 子句中添加 s.category_id = ?（可选，约第109行，需要在所有查询中添加）

-- =====================================================
-- 按日期和系列统计观看数据
-- =====================================================
SELECT 
    -- 日期
    -- 说明：统计的日期，格式为 'YYYY-MM-DD'
    --       数据来源：watch_progress 表的 updated_at 字段，使用 DATE_FORMAT 提取日期部分
    --       例如：2025-01-08 表示统计的是2025年1月8日的数据
    --       注意：如果一条记录的 updated_at 是 2025-01-08 15:30:00，会被归类到 2025-01-08
    DATE_FORMAT(wp.updated_at, '%Y-%m-%d') AS `日期`,
    
    -- 系列ID
    -- 说明：系列的唯一标识符（主键）
    --       数据来源：series 表的 id 字段
    --       用于关联和区分不同的系列
    s.id AS `系列ID`,
    
    -- 系列标题
    -- 说明：系列的标题名称
    --       数据来源：series 表的 title 字段
    --       用于显示和识别系列
    s.title AS `系列标题`,
    
    -- 分类名称
    -- 说明：系列所属的分类名称，如果系列没有分类则显示 '未分类'
    --       数据来源：categories 表的 name 字段，通过 LEFT JOIN 关联
    --       使用 COALESCE 处理 NULL 值，如果 series.category_id 为 NULL，则显示 '未分类'
    COALESCE(c.name, '未分类') AS `分类名称`,
    
    -- 集数
    -- 说明：该系列包含的剧集总数
    --       计算方式：子查询统计 episodes 表中 series_id = s.id 的记录数
    --       例如：系列1有10集 → 集数 = 10
    --       注意：这个值是系列的总集数，不是指定日期范围内的集数
    (SELECT COUNT(*) FROM episodes WHERE series_id = s.id) AS `集数`,
    
    -- 播放量（观看记录数）
    -- 说明：watch_progress 表使用联合主键 (user_id, episode_id)
    --       一个用户对一个剧集只有一条记录，每次观看会更新 updated_at
    --       播放量 = COUNT(*) = 在指定日期范围内，有多少个"用户-剧集"对的观看记录被更新了
    --       例如：用户A在1月8日观看了系列1的剧集1、剧集2、剧集3，那么系列1在1月8日的播放量就是3
    COUNT(*) AS `播放量(观看记录数)`,
    
    -- 总观看时长
    -- 说明：stop_at_second 是观看进度（用户观看到视频的第几秒）
    --       SUM(wp.stop_at_second) 是把所有观看记录的观看进度值加起来
    --       例如：用户A看到180秒，用户B看到200秒，用户C看到150秒 → SUM = 530秒
    --       注意：一个用户对一个剧集只有一条记录，记录的是最后一次观看的进度
    --       这个值主要用于计算平均观看时长：AVG = SUM / COUNT
    SUM(wp.stop_at_second) AS `总观看时长(秒)`,
    
    -- 接口使用的平均观看时长
    -- 说明：使用 AVG(wp.stop_at_second) 计算所有观看记录的平均观看进度
    --       计算方式：所有观看记录的 stop_at_second 值的平均值
    --       例如：3条记录分别是180秒、200秒、150秒 → AVG = (180+200+150)/3 = 176.67秒
    --       接口会使用 ROUND() 四舍五入到整数，所以返回 177秒
    --       数学上等价于：SUM(wp.stop_at_second) / COUNT(*)
    ROUND(AVG(wp.stop_at_second), 0) AS `接口平均观看时长(秒)`,
    
    -- 验证用：总观看时长 / 播放量
    -- 说明：用于验证接口的平均观看时长计算是否正确
    --       计算方式：SUM(wp.stop_at_second) / COUNT(*)
    --       例如：总观看时长530秒，播放量3 → 530/3 = 176.67秒，四舍五入 = 177秒
    --       这个值应该等于"接口平均观看时长(秒)"（数学上完全相等）
    ROUND(SUM(wp.stop_at_second) / COUNT(*), 0) AS `验证值_总时长除以播放量(秒)`,
    
    -- 接口使用的完播率
    -- 说明：完播率 = 观看进度 >= 90% 的记录数 / 总记录数
    --       计算方式：使用 AVG(CASE WHEN ... THEN 1 ELSE 0 END) 计算占比
    --       例如：10条观看记录中，有6条的观看进度 >= 剧集时长的90%
    --            完播率 = 6/10 = 0.6000（保留4位小数）
    --       接口会使用 parseFloat(parseFloat(...).toFixed(4)) 保留4位小数
    --       数学上等价于：SUM(完播记录数) / COUNT(*)
    ROUND(AVG(CASE WHEN wp.stop_at_second >= e.duration * 0.9 THEN 1 ELSE 0 END), 4) AS `接口完播率`,
    
    -- 验证用：完播记录数 / 总记录数
    -- 说明：用于验证接口的完播率计算是否正确
    --       计算方式：SUM(CASE WHEN ... THEN 1 ELSE 0 END) / COUNT(*)
    --       例如：10条记录中，6条完播 → 6/10 = 0.6000
    --       这个值应该等于"接口完播率"（数学上完全相等）
    ROUND(SUM(CASE WHEN wp.stop_at_second >= e.duration * 0.9 THEN 1 ELSE 0 END) / COUNT(*), 4) AS `验证值_完播率`,
    
    -- 点赞数和点踩数（需要通过单独的查询，这里先不包含）

FROM watch_progress wp
INNER JOIN episodes e ON wp.episode_id = e.id
INNER JOIN series s ON e.series_id = s.id
LEFT JOIN categories c ON s.category_id = c.id

WHERE 
    -- 日期范围：2025-01-08 00:00:00 至 2025-01-12 23:59:59
    -- 修改这里的日期来查询其他时间段
    wp.updated_at >= '2025-01-08 00:00:00'
    AND wp.updated_at <= '2025-01-12 23:59:59'
    -- 分类筛选（可选，取消注释并设置分类ID）
    -- AND s.category_id = 1
    -- 只统计有效的观看记录（duration > 0）
    AND e.duration > 0

GROUP BY DATE_FORMAT(wp.updated_at, '%Y-%m-%d'), s.id, s.title, c.name

ORDER BY `日期` DESC, `播放量(观看记录数)` DESC;

-- =====================================================
-- 按日期和系列统计点赞/点踩数（单独查询）
-- =====================================================
SELECT 
    DATE_FORMAT(r.created_at, '%Y-%m-%d') AS `日期`,
    e.series_id AS `系列ID`,
    
    -- 点赞数
    -- 说明：统计指定日期范围内，该系列下所有剧集收到的点赞总数
    --       计算方式：SUM(CASE WHEN r.reaction_type = 'like' THEN 1 ELSE 0 END)
    --       数据来源：episode_reactions 表，通过 episode_id 关联到 episodes，再关联到 series
    --       例如：系列1的剧集1收到5个赞，剧集2收到3个赞 → 系列1的点赞数 = 8
    --       注意：一个用户对一个剧集只能点一次赞（如果表结构有唯一约束）
    --       如果用户取消点赞后重新点赞，可能会产生多条记录（取决于业务逻辑）
    SUM(CASE WHEN r.reaction_type = 'like' THEN 1 ELSE 0 END) AS `点赞数`,
    
    -- 点踩数
    -- 说明：统计指定日期范围内，该系列下所有剧集收到的点踩总数
    --       计算方式：SUM(CASE WHEN r.reaction_type = 'dislike' THEN 1 ELSE 0 END)
    --       数据来源：episode_reactions 表，通过 episode_id 关联到 episodes，再关联到 series
    --       例如：系列1的剧集1收到2个踩，剧集2收到1个踩 → 系列1的点踩数 = 3
    --       注意：一个用户对一个剧集只能点一次踩（如果表结构有唯一约束）
    --       如果用户取消点踩后重新点踩，可能会产生多条记录（取决于业务逻辑）
    SUM(CASE WHEN r.reaction_type = 'dislike' THEN 1 ELSE 0 END) AS `点踩数`

FROM episode_reactions r
INNER JOIN episodes e ON r.episode_id = e.id
INNER JOIN series s ON e.series_id = s.id

WHERE 
    r.created_at >= '2025-01-08 00:00:00'
    AND r.created_at <= '2025-01-12 23:59:59'
    -- 分类筛选（可选，取消注释并设置分类ID）
    -- AND s.category_id = 1

GROUP BY DATE_FORMAT(r.created_at, '%Y-%m-%d'), e.series_id

ORDER BY `日期` DESC, `点赞数` DESC;

-- =====================================================
-- 按日期和系列统计收藏数（单独查询）
-- =====================================================
SELECT 
    DATE_FORMAT(f.created_at, '%Y-%m-%d') AS `日期`,
    f.series_id AS `系列ID`,
    
    -- 收藏数
    -- 说明：统计指定日期范围内，有多少个用户收藏了该系列
    --       计算方式：COUNT(*) = 统计 favorites 表中，created_at 在日期范围内的记录数
    --       数据来源：favorites 表，直接通过 series_id 关联到 series
    --       例如：1月8日有3个用户收藏了系列1 → 系列1在1月8日的收藏数 = 3
    --       注意：一个用户对一个系列只能收藏一次（如果表结构有唯一约束）
    --       如果用户取消收藏后重新收藏，可能会产生多条记录（取决于业务逻辑）
    --       统计的是收藏动作发生的日期，而不是系列被收藏的总数
    COUNT(*) AS `收藏数`

FROM favorites f
INNER JOIN series s ON f.series_id = s.id

WHERE 
    f.created_at >= '2025-01-08 00:00:00'
    AND f.created_at <= '2025-01-12 23:59:59'
    -- 分类筛选（可选，取消注释并设置分类ID）
    -- AND s.category_id = 1

GROUP BY DATE_FORMAT(f.created_at, '%Y-%m-%d'), f.series_id

ORDER BY `日期` DESC, `收藏数` DESC;

-- =====================================================
-- 按日期和系列统计评论数（通过episodeShortId关联，需要手动关联到series）
-- =====================================================
SELECT 
    DATE_FORMAT(c.created_at, '%Y-%m-%d') AS `日期`,
    e.series_id AS `系列ID`,
    
    -- 评论数
    -- 说明：统计指定日期范围内，该系列下所有剧集收到的评论总数
    --       计算方式：COUNT(*) = 统计 comments 表中，created_at 在日期范围内的记录数
    --       数据来源：comments 表，通过 episode_short_id 关联到 episodes 的 short_id，再关联到 series
    --       例如：系列1的剧集1收到10条评论，剧集2收到5条评论 → 系列1的评论数 = 15
    --       注意：评论包括主评论和回复评论（如果 comments 表包含回复）
    --       统计的是评论创建的日期，而不是评论的总数
    --       一个用户可以对同一个剧集发表多条评论
    COUNT(*) AS `评论数`

FROM comments c
INNER JOIN episodes e ON c.episode_short_id = e.short_id
INNER JOIN series s ON e.series_id = s.id

WHERE 
    c.created_at >= '2025-01-08 00:00:00'
    AND c.created_at <= '2025-01-12 23:59:59'
    -- 分类筛选（可选，取消注释并设置分类ID）
    -- AND s.category_id = 1

GROUP BY DATE_FORMAT(c.created_at, '%Y-%m-%d'), e.series_id

ORDER BY `日期` DESC, `评论数` DESC;

-- =====================================================
-- 验证说明：
-- =====================================================
-- 接口信息：
-- - 接口：GET /api/admin/export/series-details?startDate=2025-01-08&endDate=2025-01-12&categoryId=1
-- - 接口返回的数据按日期和系列分组
-- 
-- 验证步骤：
-- 1. 执行第一个查询（观看数据），查看结果
-- 2. 执行第二个查询（收藏数据），查看结果
-- 3. 执行第三个查询（评论数据），查看结果
-- 4. 调用接口，查看返回的数据
-- 5. 对比 SQL 结果和接口返回的数据是否一致
-- 
-- 验证项说明：
-- ✓ "接口平均观看时长(秒)" 应该等于 "验证值_总时长除以播放量(秒)"（数学上相等）
-- ✓ "接口完播率" 应该等于 "验证值_完播率"（数学上相等）
-- ✓ 播放量、点赞数、点踩数、收藏数、评论数应该与接口返回的对应字段一致
-- ✓ 平均观看时长和完播率应该与接口返回的对应字段一致
--
-- 数据合并说明：
-- 接口会合并4个查询的结果（观看数据、点赞/踩数据、收藏数据、评论数据）
-- SQL脚本提供了4个独立的查询，需要手动按"日期+系列ID"匹配合并
-- 或者可以在数据库中使用临时表或子查询来合并（这里为了清晰分开展示）
--
-- 注意事项：
-- 1. 接口使用 innerJoin episode，所以只统计能 JOIN 到 episode 且 duration > 0 的记录
-- 2. 接口的平均观看时长会四舍五入到整数
-- 3. 接口的完播率保留4位小数（parseFloat(parseFloat(...).toFixed(4))）
-- 4. 收藏数和评论数需要手动与第一个查询的结果合并（按日期+系列ID匹配）
-- 5. 如果指定了 categoryId，需要在所有查询的 WHERE 子句中添加分类筛选条件
--
-- 播放量计算说明：
-- - watch_progress 表结构：联合主键 (user_id, episode_id)，一个用户对一个剧集只有一条记录
-- - 播放量 = COUNT(*) = 统计在指定日期范围内，有多少条 watch_progress 记录的 updated_at 在日期范围内
-- - 每条记录代表：某个用户观看了某个剧集（该剧集属于某个系列）
-- - 如果用户在同一天多次观看同一个剧集，updated_at 会更新，但记录数还是1条
-- - 所以播放量统计的是"用户-剧集"对的数量，而不是观看次数
-- - 例如：用户A在1月8日观看了系列1的剧集1、剧集2、剧集3，那么系列1在1月8日的播放量就是3
--
-- 总观看时长计算说明：
-- - stop_at_second 字段：记录用户观看到视频的第几秒（观看进度）
-- - SUM(wp.stop_at_second)：把所有观看记录的观看进度值加起来
-- - 例如：用户A观看了系列1的剧集1，看到第180秒 → stop_at_second = 180
--        用户B观看了系列1的剧集1，看到第200秒 → stop_at_second = 200
--        用户C观看了系列1的剧集2，看到第150秒 → stop_at_second = 150
--        那么系列1的总观看时长 = 180 + 200 + 150 = 530秒
-- - 注意：一个用户对一个剧集只有一条记录，记录的是最后一次观看的进度
-- - 这个值主要用于计算平均观看时长：AVG(wp.stop_at_second) = SUM(wp.stop_at_second) / COUNT(*)
--
-- 平均观看时长计算说明：
-- - 计算方式：AVG(wp.stop_at_second) = 所有观看记录的 stop_at_second 值的平均值
-- - 接口处理：使用 ROUND(AVG(wp.stop_at_second), 0) 四舍五入到整数
-- - 数学等价：AVG(wp.stop_at_second) = SUM(wp.stop_at_second) / COUNT(*)
-- - 例如：3条记录分别是180秒、200秒、150秒 → AVG = (180+200+150)/3 = 176.67秒 → 177秒（四舍五入）
-- - 含义：平均每个"用户-剧集"对的观看进度（秒数）
--
-- 完播率计算说明：
-- - 完播定义：观看进度 >= 剧集时长的90%（wp.stop_at_second >= e.duration * 0.9）
-- - 计算方式：完播记录数 / 总记录数
-- - 接口处理：使用 AVG(CASE WHEN ... THEN 1 ELSE 0 END) 计算占比，保留4位小数
-- - 数学等价：SUM(完播记录数) / COUNT(*) = SUM(CASE WHEN ... THEN 1 ELSE 0 END) / COUNT(*)
-- - 例如：10条观看记录中，有6条的观看进度 >= 剧集时长的90% → 完播率 = 6/10 = 0.6000
-- - 含义：在指定日期范围内，该系列有多少比例的观看记录达到了完播标准（90%）
--
-- 点赞数计算说明：
-- - 数据来源：episode_reactions 表，reaction_type = 'like'
-- - 计算方式：SUM(CASE WHEN r.reaction_type = 'like' THEN 1 ELSE 0 END)
-- - 统计范围：指定日期范围内，该系列下所有剧集收到的点赞总数
-- - 例如：系列1的剧集1收到5个赞，剧集2收到3个赞 → 系列1的点赞数 = 8
-- - 注意：一个用户对一个剧集只能点一次赞（如果表结构有唯一约束）
--
-- 点踩数计算说明：
-- - 数据来源：episode_reactions 表，reaction_type = 'dislike'
-- - 计算方式：SUM(CASE WHEN r.reaction_type = 'dislike' THEN 1 ELSE 0 END)
-- - 统计范围：指定日期范围内，该系列下所有剧集收到的点踩总数
-- - 例如：系列1的剧集1收到2个踩，剧集2收到1个踩 → 系列1的点踩数 = 3
-- - 注意：一个用户对一个剧集只能点一次踩（如果表结构有唯一约束）
--
-- 收藏数计算说明：
-- - 数据来源：favorites 表，直接通过 series_id 关联
-- - 计算方式：COUNT(*) = 统计 created_at 在日期范围内的记录数
-- - 统计范围：指定日期范围内，有多少个用户收藏了该系列
-- - 例如：1月8日有3个用户收藏了系列1 → 系列1在1月8日的收藏数 = 3
-- - 注意：一个用户对一个系列只能收藏一次（如果表结构有唯一约束）
-- - 统计的是收藏动作发生的日期，而不是系列被收藏的总数
--
-- 评论数计算说明：
-- - 数据来源：comments 表，通过 episode_short_id 关联到 episodes，再关联到 series
-- - 计算方式：COUNT(*) = 统计 created_at 在日期范围内的记录数
-- - 统计范围：指定日期范围内，该系列下所有剧集收到的评论总数
-- - 例如：系列1的剧集1收到10条评论，剧集2收到5条评论 → 系列1的评论数 = 15
-- - 注意：评论包括主评论和回复评论（如果 comments 表包含回复）
-- - 一个用户可以对同一个剧集发表多条评论
--
-- 示例对比：
-- 如果接口返回某个系列某天的 avgWatchDuration = 180，SQL 的"接口平均观看时长(秒)"也应该是 180
-- 如果接口返回 completionRate = 0.6500，SQL 的"接口完播率"也应该是 0.6500（或接近）
