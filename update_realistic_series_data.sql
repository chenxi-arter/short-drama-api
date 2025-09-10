USE short_drama;
SET NAMES utf8mb4;

-- 更新现有数据使其更合理，不删除（避免外键约束问题）
-- 先更新现有的不合理数据

-- 更新现有剧集的基本信息
UPDATE series SET 
  title = '霸道总裁爱上我',
  description = '现代都市言情剧，讲述霸道总裁与平凡女孩的爱情故事',
  category_id = 1,
  region_option_id = 12, -- 大陆
  language_option_id = 20, -- 国语
  status_option_id = 34, -- 连载中
  year_option_id = 27, -- 去年
  total_episodes = 24,
  score = 8.6,
  play_count = 156800,
  is_completed = 0,
  status = 'on-going',
  up_status = '更新至第18集',
  release_date = '2024-03-15',
  starring = '张三,李四',
  director = '王导演'
WHERE id = 1001;

UPDATE series SET 
  title = '古装仙侠传',
  description = '古装仙侠剧，修仙之路充满挑战与奇遇',
  category_id = 1,
  region_option_id = 12, -- 大陆
  language_option_id = 20, -- 国语
  status_option_id = 33, -- 全集
  year_option_id = 28, -- 前年
  total_episodes = 36,
  score = 9.1,
  play_count = 234500,
  is_completed = 1,
  status = 'completed',
  up_status = '全36集',
  release_date = '2023-06-20',
  starring = '赵五,钱六',
  director = '李导演'
WHERE id = 1002;

UPDATE series SET 
  title = '都市悬疑案',
  description = '现代悬疑推理剧，警察破案故事',
  category_id = 2,
  region_option_id = 12, -- 大陆
  language_option_id = 20, -- 国语
  status_option_id = 34, -- 连载中
  year_option_id = 27, -- 去年
  total_episodes = 20,
  score = 8.8,
  play_count = 89600,
  is_completed = 0,
  status = 'on-going',
  up_status = '更新至第15集',
  release_date = '2024-05-10',
  starring = '孙七,周八',
  director = '陈导演'
WHERE id = 1003;

UPDATE series SET 
  title = '青春校园恋',
  description = '青春校园爱情剧，高中生的纯真爱情',
  category_id = 1,
  region_option_id = 12, -- 大陆
  language_option_id = 20, -- 国语
  status_option_id = 33, -- 全集
  year_option_id = 27, -- 去年
  total_episodes = 30,
  score = 8.2,
  play_count = 98700,
  is_completed = 1,
  status = 'completed',
  up_status = '全30集',
  release_date = '2024-09-08',
  starring = '吴九,郑十',
  director = '刘导演'
WHERE id = 1004;

UPDATE series SET 
  title = '宫廷风云',
  description = '古装宫廷剧，后宫争斗与权谋',
  category_id = 1,
  region_option_id = 12, -- 大陆
  language_option_id = 20, -- 国语
  status_option_id = 34, -- 连载中
  year_option_id = 28, -- 前年
  total_episodes = 42,
  score = 9.0,
  play_count = 345600,
  is_completed = 0,
  status = 'on-going',
  up_status = '更新至第28集',
  release_date = '2023-12-01',
  starring = '冯十一,褚十二',
  director = '黄导演'
WHERE id = 1005;

-- 更新其他现有记录
UPDATE series SET 
  title = '茶餐厅风云',
  description = '香港本土生活剧，茶餐厅里的人情世故',
  category_id = 1,
  region_option_id = 13, -- 香港
  language_option_id = 21, -- 粤语
  status_option_id = 33, -- 全集
  year_option_id = 28, -- 前年
  total_episodes = 25,
  score = 8.4,
  play_count = 76500,
  is_completed = 1,
  status = 'completed',
  up_status = '全25集',
  release_date = '2023-08-15',
  starring = '陈小春,梁朝伟',
  director = '杜琪峰'
WHERE id = 2001;

UPDATE series SET 
  title = '首尔爱情故事',
  description = '韩式浪漫爱情剧，都市男女的情感纠葛',
  category_id = 1,
  region_option_id = 16, -- 韩国
  language_option_id = 23, -- 韩语
  status_option_id = 34, -- 连载中
  year_option_id = 27, -- 去年
  total_episodes = 16,
  score = 8.7,
  play_count = 189600,
  is_completed = 0,
  status = 'on-going',
  up_status = '更新至第12集',
  release_date = '2024-05-10',
  starring = '李敏镐,宋慧乔',
  director = '朴导演'
WHERE id = 2002;

UPDATE series SET 
  title = '纽约律师事务所',
  description = '美式法庭职场剧，律师的职业与生活',
  category_id = 2,
  region_option_id = 17, -- 美国
  language_option_id = 22, -- 英语
  status_option_id = 34, -- 连载中
  year_option_id = 27, -- 去年
  total_episodes = 22,
  score = 9.0,
  play_count = 145600,
  is_completed = 0,
  status = 'on-going',
  up_status = '更新至第15集',
  release_date = '2024-01-20',
  starring = 'Mike Ross,Harvey Specter',
  director = 'Aaron Korsh'
WHERE id = 2003;

-- 更新剩余的记录为合理数据
UPDATE series SET 
  title = CASE id
    WHEN 2005 THEN '东京恋爱物语'
    WHEN 2006 THEN '港岛警察'
    WHEN 2007 THEN '财阀家族'
    WHEN 2008 THEN '台北夜市'
    WHEN 2009 THEN '狮城传说'
    WHEN 2010 THEN '未来科幻'
    WHEN 2011 THEN '经典武侠'
    ELSE CONCAT('精品剧集', id)
  END,
  description = CASE id
    WHEN 2005 THEN '日式纯爱剧，东京都市恋爱故事'
    WHEN 2006 THEN '香港警匪剧，正义与邪恶的较量'
    WHEN 2007 THEN '韩国财阀家族权斗剧'
    WHEN 2008 THEN '台湾本土生活剧，夜市里的温情故事'
    WHEN 2009 THEN '新加坡多元文化剧，不同种族的和谐故事'
    WHEN 2010 THEN '科幻题材剧集，未来世界的故事'
    WHEN 2011 THEN '90年代经典武侠剧重播'
    ELSE '精品剧集内容'
  END,
  region_option_id = CASE id
    WHEN 2005 THEN 15 -- 日本
    WHEN 2006 THEN 13 -- 香港
    WHEN 2007 THEN 16 -- 韩国
    WHEN 2008 THEN 14 -- 台湾
    WHEN 2009 THEN 18 -- 新加坡
    WHEN 2010 THEN 12 -- 大陆
    WHEN 2011 THEN 12 -- 大陆
    ELSE 12 -- 默认大陆
  END,
  language_option_id = CASE id
    WHEN 2005 THEN 23 -- 韩语（日语用韩语代替）
    WHEN 2006 THEN 21 -- 粤语
    WHEN 2007 THEN 23 -- 韩语
    WHEN 2008 THEN 20 -- 国语
    WHEN 2009 THEN 24 -- 马来语
    WHEN 2010 THEN 20 -- 国语
    WHEN 2011 THEN 20 -- 国语
    ELSE 20 -- 默认国语
  END,
  status_option_id = CASE id
    WHEN 2010 THEN 35 -- 预告中
    ELSE 33 -- 全集
  END,
  year_option_id = CASE id
    WHEN 2005 THEN 28 -- 前年
    WHEN 2006 THEN 27 -- 去年
    WHEN 2007 THEN 27 -- 去年
    WHEN 2008 THEN 28 -- 前年
    WHEN 2009 THEN 27 -- 去年
    WHEN 2010 THEN 26 -- 2025年
    WHEN 2011 THEN 30 -- 90年代
    ELSE 27 -- 默认去年
  END,
  total_episodes = CASE id
    WHEN 2005 THEN 11
    WHEN 2006 THEN 28
    WHEN 2007 THEN 20
    WHEN 2008 THEN 22
    WHEN 2009 THEN 15
    WHEN 2010 THEN 30
    WHEN 2011 THEN 50
    ELSE FLOOR(10 + RAND() * 30)
  END,
  score = CASE id
    WHEN 2005 THEN 8.3
    WHEN 2006 THEN 8.9
    WHEN 2007 THEN 9.2
    WHEN 2008 THEN 8.1
    WHEN 2009 THEN 7.9
    WHEN 2010 THEN 0 -- 预告中暂无评分
    WHEN 2011 THEN 9.5
    ELSE ROUND(7.5 + (RAND() * 2.0), 1)
  END,
  play_count = CASE id
    WHEN 2005 THEN 87400
    WHEN 2006 THEN 187300
    WHEN 2007 THEN 267800
    WHEN 2008 THEN 65800
    WHEN 2009 THEN 45600
    WHEN 2010 THEN 0 -- 预告中暂无播放量
    WHEN 2011 THEN 567800
    ELSE FLOOR(20000 + RAND() * 200000)
  END,
  is_completed = CASE id
    WHEN 2010 THEN 0 -- 预告中
    ELSE 1 -- 已完结
  END,
  status = CASE id
    WHEN 2010 THEN 'preview'
    ELSE 'completed'
  END,
  up_status = CASE id
    WHEN 2005 THEN '全11集'
    WHEN 2006 THEN '全28集'
    WHEN 2007 THEN '全20集'
    WHEN 2008 THEN '全22集'
    WHEN 2009 THEN '全15集'
    WHEN 2010 THEN '即将播出'
    WHEN 2011 THEN '全50集'
    ELSE '已完结'
  END,
  release_date = CASE id
    WHEN 2005 THEN '2023-04-10'
    WHEN 2006 THEN '2024-04-20'
    WHEN 2007 THEN '2024-07-30'
    WHEN 2008 THEN '2023-09-20'
    WHEN 2009 THEN '2024-08-12'
    WHEN 2010 THEN '2025-03-01'
    WHEN 2011 THEN '1995-08-20'
    ELSE '2024-01-01'
  END
WHERE id IN (2005, 2006, 2007, 2008, 2009, 2010, 2011) OR id > 2011;

-- 验证最终结果
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
  DATE_FORMAT(s.release_date, '%Y-%m-%d') as release_date
FROM series s
LEFT JOIN filter_options r ON s.region_option_id = r.id
LEFT JOIN filter_options l ON s.language_option_id = l.id
LEFT JOIN filter_options st ON s.status_option_id = st.id
LEFT JOIN filter_options y ON s.year_option_id = y.id
WHERE s.is_active = 1
ORDER BY s.id
LIMIT 20;
