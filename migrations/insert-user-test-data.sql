-- 插入完整的测试数据
-- 包含用户、分类、剧集系列、剧集、评论、观看进度等相关数据

USE short_drama;

-- 1. 插入分类数据
INSERT INTO categories (id, category_id, name, type, `index`, route_name, style_type, is_enabled, created_at, updated_at) 
VALUES 
  (1, 'drama', '电视剧', 1, 1, 'drama', 1, 1, NOW(), NOW()),
  (2, 'movie', '电影', 1, 2, 'movie', 1, 1, NOW(), NOW()),
  (3, 'variety', '综艺', 1, 3, 'variety', 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 2. 插入测试用户数据
INSERT INTO users (id, uuid, first_name, last_name, username, is_active, created_at) 
VALUES (
  7845078844,
  '04bd8e7f-7077-11f0-be2b-d6d61acc1ebf',
  '西',
  '陈', 
  'dinghe987',
  1,
  '2025-07-30 14:32:42'
)
ON DUPLICATE KEY UPDATE 
  uuid=VALUES(uuid),
  first_name=VALUES(first_name),
  last_name=VALUES(last_name),
  username=VALUES(username);

-- 3. 插入剧集系列数据
INSERT INTO series (id, uuid, title, description, cover_url, total_episodes, category_id, score, play_count, status, up_status, up_count, starring, actor, director, region, language, release_date, is_completed, created_at, updated_at) 
VALUES (
  1001,
  '550e8400-e29b-41d4-a716-446655440001',
  '测试剧集系列',
  '这是一个用于测试的剧集系列，包含多个精彩剧集',
  'https://example.com/cover1.jpg',
  10,
  1,
  8.5,
  12580,
  'completed',
  'hot',
  1250,
  '张三,李四,王五',
  '张三,李四,王五,赵六',
  '知名导演',
  '中国大陆',
  '中文',
  '2024-01-15',
  1,
  '2024-01-15 10:00:00',
  NOW()
)
ON DUPLICATE KEY UPDATE 
  uuid=VALUES(uuid),
  title=VALUES(title),
  description=VALUES(description);

-- 4. 插入剧集数据
INSERT INTO episodes (id, uuid, series_id, episode_number, title, duration, status, play_count, has_sequel, created_at, updated_at) 
VALUES 
  (2001, '550e8400-e29b-41d4-a716-446655440101', 1001, 1, '第一集：开端', 2400, 'published', 5680, 1, '2024-01-15 10:30:00', NOW()),
  (2002, '550e8400-e29b-41d4-a716-446655440102', 1001, 2, '第二集：发展', 2350, 'published', 4920, 1, '2024-01-16 10:30:00', NOW()),
  (2003, '550e8400-e29b-41d4-a716-446655440103', 1001, 3, '第三集：高潮', 2480, 'published', 4150, 0, '2024-01-17 10:30:00', NOW())
ON DUPLICATE KEY UPDATE 
  uuid=VALUES(uuid),
  title=VALUES(title),
  duration=VALUES(duration);

-- 5. 插入评论数据
INSERT INTO comments (id, user_id, episode_id, content, appear_second, created_at) 
VALUES 
  (3001, 7845078844, 2001, '这一集太精彩了！', 0, '2024-01-20 15:30:00'),
  (3002, 7845078844, 2001, '男主角演技真好', 1200, '2024-01-20 15:45:00'),
  (3003, 7845078844, 2002, '剧情发展很有意思', 0, '2024-01-21 16:20:00')
ON DUPLICATE KEY UPDATE 
  content=VALUES(content),
  appear_second=VALUES(appear_second);

-- 6. 插入观看进度数据
INSERT INTO watch_progress (user_id, episode_id, stop_at_second, updated_at) 
VALUES 
  (7845078844, 2001, 2400, '2024-01-20 16:00:00'),
  (7845078844, 2002, 1800, '2024-01-21 17:30:00'),
  (7845078844, 2003, 600, '2024-01-22 14:15:00')
ON DUPLICATE KEY UPDATE 
  stop_at_second=VALUES(stop_at_second),
  updated_at=VALUES(updated_at);

-- 验证插入结果
SELECT '=== 用户信息 ===' as info;
SELECT * FROM users WHERE id = 7845078844;

SELECT '=== 分类信息 ===' as info;
SELECT * FROM categories WHERE category_id IN ('drama', 'movie', 'variety');

SELECT '=== 剧集系列信息 ===' as info;
SELECT * FROM series WHERE id = 1001;

SELECT '=== 剧集信息 ===' as info;
SELECT * FROM episodes WHERE series_id = 1001;

SELECT '=== 评论信息 ===' as info;
SELECT c.*, u.username, e.title as episode_title 
FROM comments c 
JOIN users u ON c.user_id = u.id 
JOIN episodes e ON c.episode_id = e.id 
WHERE c.user_id = 7845078844;

SELECT '=== 观看进度信息 ===' as info;
SELECT wp.*, u.username, e.title as episode_title 
FROM watch_progress wp 
JOIN users u ON wp.user_id = u.id 
JOIN episodes e ON wp.episode_id = e.id 
WHERE wp.user_id = 7845078844;