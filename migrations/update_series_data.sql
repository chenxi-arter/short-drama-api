-- ===================================================
-- 更新series表数据 - 修复现有数据的外键关联
-- ===================================================

USE short_drama;

-- 更新现有的series数据，添加缺失的外键关联
UPDATE series SET 
  region_option_id = 11,     -- 大陆
  language_option_id = 16,   -- 国语  
  status_option_id = 27,     -- 全集
  year_option_id = 23        -- 2024年
WHERE id = 1001;

UPDATE series SET 
  region_option_id = 11,     -- 大陆
  language_option_id = 16,   -- 国语
  status_option_id = 28,     -- 连载中
  year_option_id = 21        -- 2025年
WHERE id = 1002;

UPDATE series SET 
  region_option_id = 11,     -- 大陆
  language_option_id = 16,   -- 国语
  status_option_id = 27,     -- 全集
  year_option_id = 23        -- 2024年
WHERE id = 1003;

UPDATE series SET 
  region_option_id = 11,     -- 大陆
  language_option_id = 16,   -- 国语
  status_option_id = 27,     -- 全集
  year_option_id = 23        -- 2024年
WHERE id = 1004;

UPDATE series SET 
  region_option_id = 11,     -- 大陆
  language_option_id = 16,   -- 国语
  status_option_id = 27,     -- 全集
  year_option_id = 22        -- 2023年
WHERE id = 1005;

UPDATE series SET 
  region_option_id = 11,     -- 大陆
  language_option_id = 16,   -- 国语
  status_option_id = 27,     -- 全集
  year_option_id = NULL      -- 年份待定
WHERE id = 2001;

UPDATE series SET 
  region_option_id = 11,     -- 大陆
  language_option_id = 16,   -- 国语
  status_option_id = 28,     -- 连载中
  year_option_id = NULL      -- 年份待定
WHERE id = 2002;

UPDATE series SET 
  region_option_id = 11,     -- 大陆
  language_option_id = 16,   -- 国语
  status_option_id = 27,     -- 全集
  year_option_id = NULL      -- 年份待定
WHERE id = 2003;

-- 检查更新结果
SELECT '更新完成！' as status;

-- 显示更新后的数据
SELECT 
  id, 
  title,
  short_id,
  region_option_id,
  language_option_id, 
  status_option_id,
  year_option_id
FROM series 
WHERE id IN (1001,1002,1003,1004,1005,2001,2002,2003)
ORDER BY id;

