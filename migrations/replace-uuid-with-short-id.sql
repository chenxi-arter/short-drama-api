-- 替换UUID为11位短ID的数据库迁移脚本
-- 执行前请备份数据库

-- 1. 修改users表
ALTER TABLE `users` 
ADD COLUMN `short_id` VARCHAR(11) UNIQUE AFTER `id`,
ADD INDEX `idx_users_short_id` (`short_id`);

-- 为现有用户生成短ID（需要在应用层执行）
-- UPDATE `users` SET `short_id` = SUBSTRING(MD5(CONCAT(id, UNIX_TIMESTAMP())), 1, 11) WHERE `short_id` IS NULL;

-- 删除原有uuid字段
ALTER TABLE `users` DROP COLUMN `uuid`;

-- 2. 修改series表
ALTER TABLE `series` 
ADD COLUMN `short_id` VARCHAR(11) UNIQUE AFTER `id`,
ADD INDEX `idx_series_short_id` (`short_id`);

-- 为现有剧集生成短ID（需要在应用层执行）
-- UPDATE `series` SET `short_id` = SUBSTRING(MD5(CONCAT(id, UNIX_TIMESTAMP())), 1, 11) WHERE `short_id` IS NULL;

-- 删除原有uuid字段
ALTER TABLE `series` DROP COLUMN `uuid`;

-- 3. 修改episodes表
ALTER TABLE `episodes` 
ADD COLUMN `short_id` VARCHAR(11) UNIQUE AFTER `id`,
ADD INDEX `idx_episodes_short_id` (`short_id`);

-- 为现有剧集生成短ID（需要在应用层执行）
-- UPDATE `episodes` SET `short_id` = SUBSTRING(MD5(CONCAT(id, UNIX_TIMESTAMP())), 1, 11) WHERE `short_id` IS NULL;

-- 删除原有uuid字段
ALTER TABLE `episodes` DROP COLUMN `uuid`;

-- 4. 修改short_videos表
ALTER TABLE `short_videos` 
ADD COLUMN `short_id` VARCHAR(11) UNIQUE AFTER `id`,
ADD INDEX `idx_short_videos_short_id` (`short_id`);

-- 为现有短视频生成短ID（需要在应用层执行）
-- UPDATE `short_videos` SET `short_id` = SUBSTRING(MD5(CONCAT(id, UNIX_TIMESTAMP())), 1, 11) WHERE `short_id` IS NULL;

-- 删除原有uuid字段
ALTER TABLE `short_videos` DROP COLUMN `uuid`;

-- 注意：
-- 1. 上述UPDATE语句被注释掉，因为需要使用应用层的ShortIdUtil.generate()方法生成真正的短ID
-- 2. 执行此迁移前，请确保应用程序已停止
-- 3. 执行后需要运行数据迁移脚本来为现有记录生成短ID
-- 4. 建议分步骤执行，每个表单独执行并验证