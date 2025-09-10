-- Drop `status` column from `series` if it exists
USE short_drama;

SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'series'
    AND COLUMN_NAME = 'status'
);

SET @sql := IF(@col_exists > 0, 'ALTER TABLE `series` DROP COLUMN `status`;', 'SELECT "status column not found, skipped" AS info;');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verify
DESCRIBE series;
