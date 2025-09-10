USE short_drama;
SET NAMES utf8mb4;

-- 更新 series 表中的筛选字段，使其引用正确的 filter_options ID
-- 根据当前的 filter_options 表结构进行合理的映射

-- 更新地区字段 (region_option_id)
UPDATE series SET region_option_id = 12 WHERE region_option_id IN (11, 14, 30); -- 大陆
UPDATE series SET region_option_id = 13 WHERE region_option_id IN (12, 13); -- 香港
UPDATE series SET region_option_id = 14 WHERE region_option_id IN (13, 14); -- 台湾
UPDATE series SET region_option_id = 15 WHERE region_option_id IN (14, 15); -- 日本
UPDATE series SET region_option_id = 16 WHERE region_option_id IN (38, 39); -- 韩国
UPDATE series SET region_option_id = 17 WHERE region_option_id IN (39, 17); -- 美国
UPDATE series SET region_option_id = 18 WHERE region_option_id IN (41, 18); -- 新加坡

-- 更新语言字段 (language_option_id)
UPDATE series SET language_option_id = 20 WHERE language_option_id IN (16, 17, 31); -- 国语
UPDATE series SET language_option_id = 21 WHERE language_option_id IN (17, 18); -- 粤语
UPDATE series SET language_option_id = 22 WHERE language_option_id IN (18, 22); -- 英语
UPDATE series SET language_option_id = 23 WHERE language_option_id IN (19, 23); -- 韩语
UPDATE series SET language_option_id = 24 WHERE language_option_id IN (42, 24); -- 马来语

-- 更新状态字段 (status_option_id)
UPDATE series SET status_option_id = 33 WHERE status_option_id IN (27, 33) OR is_completed = 1; -- 全集
UPDATE series SET status_option_id = 34 WHERE status_option_id IN (28, 34) OR is_completed = 0; -- 连载中
UPDATE series SET status_option_id = 35 WHERE status_option_id IN (43, 35); -- 预告中

-- 更新年份字段 (year_option_id)
UPDATE series SET year_option_id = 26 WHERE year_option_id IN (21, 29, 26) OR release_date >= '2025-01-01'; -- 2025年
UPDATE series SET year_option_id = 27 WHERE year_option_id IN (22, 27) OR release_date BETWEEN '2024-01-01' AND '2024-12-31'; -- 去年
UPDATE series SET year_option_id = 28 WHERE year_option_id IN (23, 28) OR release_date BETWEEN '2023-01-01' AND '2023-12-31'; -- 前年
UPDATE series SET year_option_id = 29 WHERE year_option_id IN (24, 29) OR release_date < '2023-01-01'; -- 更早
UPDATE series SET year_option_id = 30 WHERE year_option_id IN (25, 30) OR release_date BETWEEN '1990-01-01' AND '1999-12-31'; -- 90年代
UPDATE series SET year_option_id = 31 WHERE year_option_id IN (33, 31) OR release_date >= '2026-01-01'; -- 2026年

-- 为没有设置筛选字段的记录设置合理的默认值
UPDATE series SET region_option_id = 12 WHERE region_option_id IS NULL OR region_option_id = 0; -- 默认大陆
UPDATE series SET language_option_id = 20 WHERE language_option_id IS NULL OR language_option_id = 0; -- 默认国语
UPDATE series SET status_option_id = 34 WHERE status_option_id IS NULL OR status_option_id = 0; -- 默认连载中
UPDATE series SET year_option_id = 27 WHERE year_option_id IS NULL OR year_option_id = 0; -- 默认去年

-- 根据剧集类型和标题内容，设置更合理的筛选字段
-- 古装相关
UPDATE series SET 
  region_option_id = 12, -- 大陆
  language_option_id = 20, -- 国语
  year_option_id = 27 -- 去年
WHERE title LIKE '%古装%' OR title LIKE '%仙侠%' OR title LIKE '%宫廷%';

-- 都市爱情相关
UPDATE series SET 
  region_option_id = 12, -- 大陆
  language_option_id = 20, -- 国语
  year_option_id = 27 -- 去年
WHERE title LIKE '%都市%' OR title LIKE '%爱情%' OR title LIKE '%总裁%';

-- 悬疑相关
UPDATE series SET 
  region_option_id = 12, -- 大陆
  language_option_id = 20, -- 国语
  year_option_id = 27 -- 去年
WHERE title LIKE '%悬疑%' OR title LIKE '%推理%' OR title LIKE '%犯罪%';

-- 根据评分和播放量设置更合理的数据
UPDATE series SET 
  score = ROUND(7.0 + (RAND() * 3.0), 1), -- 7.0-10.0 的随机评分
  play_count = FLOOR(10000 + (RAND() * 500000)) -- 1万-50万的随机播放量
WHERE score < 5.0 OR play_count < 1000;

-- 设置合理的剧集状态
UPDATE series SET 
  status = 'completed',
  is_completed = 1,
  status_option_id = 33 -- 全集
WHERE total_episodes > 0 AND total_episodes <= 50 AND RAND() > 0.3;

UPDATE series SET 
  status = 'on-going',
  is_completed = 0,
  status_option_id = 34, -- 连载中
  up_status = CONCAT('更新至第', FLOOR(total_episodes * 0.7), '集')
WHERE status_option_id = 34 AND total_episodes > 0;

-- 验证更新结果
SELECT 
  s.id,
  s.title,
  s.category_id,
  r.name as region,
  l.name as language,
  st.name as status,
  y.name as year,
  s.score,
  s.play_count,
  s.is_completed,
  s.up_status
FROM series s
LEFT JOIN filter_options r ON s.region_option_id = r.id
LEFT JOIN filter_options l ON s.language_option_id = l.id
LEFT JOIN filter_options st ON s.status_option_id = st.id
LEFT JOIN filter_options y ON s.year_option_id = y.id
WHERE s.is_active = 1
LIMIT 15;
