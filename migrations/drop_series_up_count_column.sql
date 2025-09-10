-- Drop `up_count` column from `series` if it exists
USE short_drama;

SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'series'
    AND COLUMN_NAME = 'up_count'
);

SET @sql := IF(@col_exists > 0, 'ALTER TABLE `series` DROP COLUMN `up_count`;', 'SELECT "up_count column not found, skipped" AS info;');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verify
DESCRIBE series;
