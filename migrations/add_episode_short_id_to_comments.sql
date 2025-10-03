-- 为 comments 表添加 episode_short_id 字段
-- 用于避免剧集删除后评论对应关系错误

-- 1. 添加 episode_short_id 字段
ALTER TABLE `comments` 
ADD COLUMN `episode_short_id` VARCHAR(20) DEFAULT NULL AFTER `episode_id`,
ADD INDEX `idx_episode_short_id` (`episode_short_id`);

-- 2. 将现有评论的 episode_id 对应的 short_id 填充到 episode_short_id
UPDATE `comments` c
INNER JOIN `episodes` e ON c.`episode_id` = e.`id`
SET c.`episode_short_id` = e.`short_id`
WHERE c.`episode_short_id` IS NULL;

-- 3. 将 episode_short_id 设为 NOT NULL（在数据迁移完成后）
-- ALTER TABLE `comments` MODIFY COLUMN `episode_short_id` VARCHAR(20) NOT NULL;

-- 4. （可选）未来可以删除 episode_id 字段
-- ALTER TABLE `comments` DROP COLUMN `episode_id`;
-- ALTER TABLE `comments` DROP FOREIGN KEY `FK_comments_episode` IF EXISTS;

