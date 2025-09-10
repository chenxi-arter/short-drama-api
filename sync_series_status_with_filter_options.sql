USE short_drama;
SET NAMES utf8mb4;

-- 同步 series 表中的 status 字段与 status_option_id 字段
-- 确保两者保持一致，优先使用 filter_options 中的数据

-- 更新 status 字段，使其与 status_option_id 对应的 filter_options 保持一致
UPDATE series s
JOIN filter_options fo ON s.status_option_id = fo.id
SET s.status = fo.value
WHERE s.is_active = 1 AND fo.is_active = 1;

-- 对于没有 status_option_id 的记录，根据 status 字段设置对应的 status_option_id
UPDATE series s
SET s.status_option_id = (
  SELECT fo.id
  FROM filter_options fo
  JOIN filter_types ft ON fo.filter_type_id = ft.id
  WHERE ft.code = 'status' 
    AND fo.value = s.status
    AND fo.is_active = 1
  LIMIT 1
)
WHERE s.status_option_id IS NULL OR s.status_option_id = 0;

-- 对于仍然没有匹配的记录，设置默认值
UPDATE series s
SET 
  s.status_option_id = (
    SELECT fo.id
    FROM filter_options fo
    JOIN filter_types ft ON fo.filter_type_id = ft.id
    WHERE ft.code = 'status' 
      AND fo.value = 'ongoing'
      AND fo.is_active = 1
    LIMIT 1
  ),
  s.status = 'ongoing'
WHERE (s.status_option_id IS NULL OR s.status_option_id = 0) AND s.is_active = 1;

-- 验证同步结果
SELECT 
  s.id,
  s.title,
  s.status as series_status,
  fo.name as status_option_name,
  fo.value as status_option_value,
  s.status_option_id
FROM series s
LEFT JOIN filter_options fo ON s.status_option_id = fo.id
WHERE s.is_active = 1
ORDER BY s.id
LIMIT 15;
