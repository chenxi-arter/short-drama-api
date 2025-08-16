-- =============================================
-- 移除series表中的旧标识字段（region, language, status）
-- =============================================
USE short_drama;

ALTER TABLE series
  DROP COLUMN IF EXISTS region,
  DROP COLUMN IF EXISTS language,
  DROP COLUMN IF EXISTS status;

-- 可选：如果你还想移除up_status等其它冗余字段，可以在这里补充
-- ALTER TABLE series DROP COLUMN IF EXISTS up_status;

