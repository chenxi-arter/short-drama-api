USE short_drama;
SET NAMES utf8mb4;

-- 进一步优化 series 表的测试数据，让筛选字段更加合理

-- 1. 根据剧集标题和内容，设置更合理的地区和语言
UPDATE series SET 
  region_option_id = 12, -- 大陆
  language_option_id = 20 -- 国语
WHERE title LIKE '%古装%' OR title LIKE '%仙侠%' OR title LIKE '%宫廷%' OR title LIKE '%武侠%';

-- 韩剧相关
UPDATE series SET 
  region_option_id = 16, -- 韩国
  language_option_id = 23 -- 韩语
WHERE title LIKE '%韩%' OR title LIKE '%欧巴%' OR title LIKE '%首尔%';

-- 港剧相关
UPDATE series SET 
  region_option_id = 13, -- 香港
  language_option_id = 21 -- 粤语
WHERE title LIKE '%香港%' OR title LIKE '%港%' OR title LIKE '%茶餐厅%';

-- 美剧相关
UPDATE series SET 
  region_option_id = 17, -- 美国
  language_option_id = 22 -- 英语
WHERE title LIKE '%美%' OR title LIKE '%纽约%' OR title LIKE '%洛杉矶%';

-- 2. 设置更合理的剧集总数
UPDATE series SET total_episodes = 
  CASE 
    WHEN title LIKE '%短剧%' OR title LIKE '%微剧%' THEN FLOOR(5 + RAND() * 15) -- 5-20集
    WHEN title LIKE '%电影%' THEN 1 -- 电影只有1集
    WHEN title LIKE '%综艺%' THEN FLOOR(10 + RAND() * 20) -- 10-30集
    ELSE FLOOR(20 + RAND() * 30) -- 20-50集
  END
WHERE total_episodes = 0 OR total_episodes > 100;

-- 3. 根据剧集类型设置合理的评分范围
UPDATE series SET score = 
  CASE 
    WHEN title LIKE '%爱情%' OR title LIKE '%言情%' THEN ROUND(7.5 + (RAND() * 2.0), 1) -- 7.5-9.5
    WHEN title LIKE '%古装%' OR title LIKE '%仙侠%' THEN ROUND(8.0 + (RAND() * 1.8), 1) -- 8.0-9.8
    WHEN title LIKE '%悬疑%' OR title LIKE '%推理%' THEN ROUND(8.2 + (RAND() * 1.5), 1) -- 8.2-9.7
    WHEN title LIKE '%综艺%' OR title LIKE '%搞笑%' THEN ROUND(7.0 + (RAND() * 2.5), 1) -- 7.0-9.5
    ELSE ROUND(7.5 + (RAND() * 2.0), 1) -- 默认 7.5-9.5
  END;

-- 4. 设置合理的播放量（根据评分和剧集热度）
UPDATE series SET play_count = 
  CASE 
    WHEN score >= 9.0 THEN FLOOR(100000 + (RAND() * 500000)) -- 高评分：10-60万
    WHEN score >= 8.0 THEN FLOOR(50000 + (RAND() * 300000)) -- 中高评分：5-35万
    WHEN score >= 7.0 THEN FLOOR(20000 + (RAND() * 150000)) -- 中等评分：2-17万
    ELSE FLOOR(5000 + (RAND() * 50000)) -- 低评分：0.5-5.5万
  END;

-- 5. 根据完成状态设置合理的up_status
UPDATE series SET up_status = 
  CASE 
    WHEN is_completed = 1 THEN CONCAT('全', total_episodes, '集')
    WHEN is_completed = 0 THEN CONCAT('更新至第', FLOOR(total_episodes * (0.3 + RAND() * 0.4)), '集')
    ELSE '即将上线'
  END
WHERE up_status IS NULL OR up_status = '' OR up_status = 'NULL';

-- 6. 设置合理的发布日期
UPDATE series SET release_date = 
  CASE 
    WHEN year_option_id = 26 THEN DATE_ADD('2025-01-01', INTERVAL FLOOR(RAND() * 365) DAY) -- 2025年
    WHEN year_option_id = 27 THEN DATE_ADD('2024-01-01', INTERVAL FLOOR(RAND() * 365) DAY) -- 去年(2024)
    WHEN year_option_id = 28 THEN DATE_ADD('2023-01-01', INTERVAL FLOOR(RAND() * 365) DAY) -- 前年(2023)
    WHEN year_option_id = 29 THEN DATE_ADD('2020-01-01', INTERVAL FLOOR(RAND() * 1095) DAY) -- 更早(2020-2022)
    WHEN year_option_id = 30 THEN DATE_ADD('1990-01-01', INTERVAL FLOOR(RAND() * 3650) DAY) -- 90年代
    WHEN year_option_id = 31 THEN DATE_ADD('2026-01-01', INTERVAL FLOOR(RAND() * 365) DAY) -- 2026年
    ELSE CURDATE()
  END
WHERE release_date IS NULL;

-- 7. 添加一些更多样化的测试数据
INSERT INTO series (title, description, category_id, region_option_id, language_option_id, status_option_id, year_option_id, total_episodes, score, play_count, is_completed, status, up_status, release_date, is_active) VALUES
('甜蜜的恋爱', '现代都市爱情轻喜剧', 1, 12, 20, 34, 27, 24, 8.6, 156800, 0, 'on-going', '更新至第18集', '2024-03-15', 1),
('武林外传新篇', '古装武侠喜剧续集', 1, 12, 20, 33, 28, 40, 9.1, 234500, 1, 'completed', '全40集', '2023-06-20', 1),
('首尔爱情故事', '韩式浪漫爱情剧', 1, 16, 23, 34, 27, 16, 8.8, 189600, 0, 'on-going', '更新至第12集', '2024-05-10', 1),
('香港茶餐厅', '港式生活情景剧', 1, 13, 21, 33, 28, 30, 8.2, 98700, 1, 'completed', '全30集', '2023-09-08', 1),
('纽约律师事务所', '美式法庭职场剧', 2, 17, 22, 34, 27, 22, 9.0, 145600, 0, 'on-going', '更新至第15集', '2024-01-20', 1);

-- 最终验证结果
SELECT 
  s.id,
  s.title,
  r.name as region,
  l.name as language,
  st.name as status,
  y.name as year,
  s.total_episodes,
  s.score,
  s.play_count,
  s.up_status,
  s.release_date
FROM series s
LEFT JOIN filter_options r ON s.region_option_id = r.id
LEFT JOIN filter_options l ON s.language_option_id = l.id
LEFT JOIN filter_options st ON s.status_option_id = st.id
LEFT JOIN filter_options y ON s.year_option_id = y.id
WHERE s.is_active = 1
ORDER BY s.id
LIMIT 20;
