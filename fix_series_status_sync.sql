USE short_drama;
SET NAMES utf8mb4;

-- 同步 series 表中的 status 字段与 status_option_id 字段
-- 使用 CAST 或者直接使用 ID 匹配来避免字符集冲突

-- 首先，根据当前的 status 值设置对应的 status_option_id
UPDATE series 
SET status_option_id = CASE 
  WHEN status = 'completed' THEN 33  -- 全集
  WHEN status = 'on-going' THEN 34   -- 连载中
  WHEN status = 'preview' THEN 35    -- 预告中
  ELSE 34  -- 默认连载中
END
WHERE is_active = 1;

-- 然后，根据 status_option_id 更新 status 字段
UPDATE series 
SET status = CASE status_option_id
  WHEN 33 THEN 'completed'
  WHEN 34 THEN 'on-going'
  WHEN 35 THEN 'preview'
  ELSE 'on-going'
END
WHERE is_active = 1;

-- 验证同步结果
SELECT 
  s.id,
  s.title,
  s.status as series_status,
  fo.name as status_option_name,
  fo.value as status_option_value,
  s.status_option_id,
  s.is_completed
FROM series s
LEFT JOIN filter_options fo ON s.status_option_id = fo.id
WHERE s.is_active = 1
ORDER BY s.id
LIMIT 15;
