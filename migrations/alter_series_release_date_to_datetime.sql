-- 将 series.release_date 从 DATE 改为 DATETIME，以支持精确到时分秒
-- 适用数据库：MySQL/MariaDB

ALTER TABLE `series`
  MODIFY COLUMN `release_date` DATETIME NULL COMMENT '系列的首播或发布日期，精确到时分秒';

-- 说明：
-- - 原有 DATE 值将自动转换为对应日期的 00:00:00 时间
-- - 该变更不影响为 NULL 的记录


