-- migrations/add_comment_reply_support.sql
-- 为评论表添加盖楼（回复）功能支持

-- 1. 添加父评论ID字段（用于楼中楼）
ALTER TABLE `comments` ADD COLUMN `parent_id` INT NULL DEFAULT NULL AFTER `episode_short_id`;

-- 2. 添加根评论ID字段（用于快速定位主楼）
ALTER TABLE `comments` ADD COLUMN `root_id` INT NULL DEFAULT NULL AFTER `parent_id`;

-- 3. 添加回复目标用户ID（@某人）
ALTER TABLE `comments` ADD COLUMN `reply_to_user_id` BIGINT NULL DEFAULT NULL AFTER `root_id`;

-- 4. 添加楼层号（同一主楼下的序号）
ALTER TABLE `comments` ADD COLUMN `floor_number` INT NOT NULL DEFAULT 0 AFTER `reply_to_user_id`;

-- 5. 添加索引优化查询性能
CREATE INDEX `idx_parent_id` ON `comments` (`parent_id`);
CREATE INDEX `idx_root_id` ON `comments` (`root_id`);
CREATE INDEX `idx_episode_root` ON `comments` (`episode_short_id`, `root_id`);

-- 6. 添加外键约束（可选，保证数据一致性）
ALTER TABLE `comments` 
  ADD CONSTRAINT `fk_comment_parent` 
  FOREIGN KEY (`parent_id`) REFERENCES `comments` (`id`) 
  ON DELETE CASCADE;

ALTER TABLE `comments` 
  ADD CONSTRAINT `fk_comment_root` 
  FOREIGN KEY (`root_id`) REFERENCES `comments` (`id`) 
  ON DELETE CASCADE;

-- 7. 添加回复计数字段（可选，用于显示"共X条回复"）
ALTER TABLE `comments` ADD COLUMN `reply_count` INT NOT NULL DEFAULT 0 AFTER `floor_number`;

-- 字段说明：
-- parent_id: 直接父评论ID（null表示主楼，非null表示回复某条评论）
-- root_id: 根评论ID（null表示自己是主楼，非null表示属于某个主楼的回复链）
-- reply_to_user_id: 被回复的用户ID（用于@提醒）
-- floor_number: 楼层号（同一root_id下的序号，主楼为0）
-- reply_count: 回复数量（仅主楼统计，子回复为0）

