USE short_drama;
SET NAMES utf8mb4;

-- 创建更合理的测试数据
-- 先清理现有的不合理数据
DELETE FROM series WHERE is_active = 1;

-- 重置自增ID
ALTER TABLE series AUTO_INCREMENT = 1001;

-- 插入合理的测试数据
INSERT INTO series (
  title, description, category_id, region_option_id, language_option_id, 
  status_option_id, year_option_id, total_episodes, score, play_count, 
  is_completed, status, up_status, release_date, is_active, starring, director
) VALUES

-- 大陆国语剧集
('霸道总裁爱上我', '现代都市言情剧，讲述霸道总裁与平凡女孩的爱情故事', 1, 12, 20, 34, 27, 24, 8.6, 156800, 0, 'on-going', '更新至第18集', '2024-03-15', 1, '张三,李四', '王导演'),
('古装仙侠传', '古装仙侠剧，修仙之路充满挑战与奇遇', 1, 12, 20, 33, 28, 36, 9.1, 234500, 1, 'completed', '全36集', '2023-06-20', 1, '赵五,钱六', '李导演'),
('都市悬疑案', '现代悬疑推理剧，警察破案故事', 2, 12, 20, 34, 27, 20, 8.8, 89600, 0, 'on-going', '更新至第15集', '2024-05-10', 1, '孙七,周八', '陈导演'),
('青春校园恋', '青春校园爱情剧，高中生的纯真爱情', 1, 12, 20, 33, 27, 30, 8.2, 98700, 1, 'completed', '全30集', '2024-09-08', 1, '吴九,郑十', '刘导演'),
('宫廷风云', '古装宫廷剧，后宫争斗与权谋', 1, 12, 20, 34, 28, 42, 9.0, 345600, 0, 'on-going', '更新至第28集', '2023-12-01', 1, '冯十一,褚十二', '黄导演'),

-- 香港粤语剧集
('茶餐厅风云', '香港本土生活剧，茶餐厅里的人情世故', 1, 13, 21, 33, 28, 25, 8.4, 76500, 1, 'completed', '全25集', '2023-08-15', 1, '陈小春,梁朝伟', '杜琪峰'),
('港岛警察', '香港警匪剧，正义与邪恶的较量', 2, 13, 21, 34, 27, 28, 8.9, 187300, 0, 'on-going', '更新至第20集', '2024-04-20', 1, '古天乐,刘德华', '麦兆辉'),

-- 韩国韩语剧集
('首尔爱情故事', '韩式浪漫爱情剧，都市男女的情感纠葛', 1, 16, 23, 34, 27, 16, 8.7, 189600, 0, 'on-going', '更新至第12集', '2024-05-10', 1, '李敏镐,宋慧乔', '朴导演'),
('财阀家族', '韩国财阀家族权斗剧', 2, 16, 23, 33, 27, 20, 9.2, 267800, 1, 'completed', '全20集', '2024-07-30', 1, '李秉宪,金泰希', '金导演'),

-- 美国英语剧集
('纽约律师事务所', '美式法庭职场剧，律师的职业与生活', 2, 17, 22, 34, 27, 22, 9.0, 145600, 0, 'on-going', '更新至第15集', '2024-01-20', 1, 'Mike Ross,Harvey Specter', 'Aaron Korsh'),
('洛杉矶警察局', '美国警察程序剧，打击犯罪维护正义', 2, 17, 22, 33, 28, 24, 8.5, 198700, 1, 'completed', '全24集', '2023-11-15', 1, 'John Smith,Jane Doe', 'Michael Bay'),

-- 日本日语剧集
('东京恋爱物语', '日式纯爱剧，东京都市恋爱故事', 1, 15, 23, 33, 28, 11, 8.3, 87400, 1, 'completed', '全11集', '2023-04-10', 1, '木村拓哉,山口智子', '野岛伸司'),
('推理侦探社', '日本推理悬疑剧，侦探破案故事', 2, 15, 23, 34, 27, 18, 8.8, 156900, 0, 'on-going', '更新至第12集', '2024-06-05', 1, '福山雅治,柴咲幸', '三谷幸喜'),

-- 台湾国语剧集
('台北夜市', '台湾本土生活剧，夜市里的温情故事', 1, 14, 20, 33, 28, 22, 8.1, 65800, 1, 'completed', '全22集', '2023-09-20', 1, '陈柏霖,林依晨', '瞿友宁'),

-- 新加坡马来语剧集
('狮城传说', '新加坡多元文化剧，不同种族的和谐故事', 1, 18, 24, 34, 27, 15, 7.9, 45600, 0, 'on-going', '更新至第10集', '2024-08-12', 1, 'Fann Wong,Christopher Lee', 'Jack Neo'),

-- 2025年新剧（预告中）
('未来科幻', '科幻题材剧集，未来世界的故事', 3, 12, 20, 35, 26, 30, 0, 0, 0, 'preview', '即将播出', '2025-03-01', 1, 'TBD,TBD', 'TBD'),
('古装新传', '2025年古装大制作', 1, 12, 20, 35, 26, 40, 0, 0, 0, 'preview', '即将播出', '2025-06-15', 1, 'TBD,TBD', 'TBD'),

-- 90年代经典重播
('经典武侠', '90年代经典武侠剧重播', 1, 12, 20, 33, 30, 50, 9.5, 567800, 1, 'completed', '全50集', '1995-08-20', 1, '古龙,金庸改编', '张纪中'),

-- 2026年待播剧
('未来都市', '2026年科幻都市剧', 3, 12, 20, 35, 31, 25, 0, 0, 0, 'preview', '制作中', '2026-01-15', 1, 'TBD,TBD', 'TBD');

-- 更新一些合理的播放量和评分
UPDATE series SET 
  play_count = CASE 
    WHEN status_option_id = 35 THEN 0 -- 预告中的剧集播放量为0
    WHEN score >= 9.0 THEN FLOOR(200000 + (RAND() * 400000)) -- 高评分：20-60万
    WHEN score >= 8.5 THEN FLOOR(100000 + (RAND() * 250000)) -- 中高评分：10-35万
    WHEN score >= 8.0 THEN FLOOR(50000 + (RAND() * 150000)) -- 中等评分：5-20万
    WHEN score >= 7.5 THEN FLOOR(20000 + (RAND() * 80000)) -- 较低评分：2-10万
    ELSE FLOOR(5000 + (RAND() * 25000)) -- 低评分：0.5-3万
  END,
  score = CASE 
    WHEN status_option_id = 35 THEN 0 -- 预告中的剧集暂无评分
    ELSE score
  END
WHERE is_active = 1;

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
ORDER BY s.id;
