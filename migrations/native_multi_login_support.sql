-- Native multi-login support migration
-- Purpose: align `users` table with current entity model for email + Telegram login
-- Run this once against your MySQL instance

START TRANSACTION;

-- 1) Ensure primary key `id` is AUTO_INCREMENT bigint
ALTER TABLE `users`
  MODIFY COLUMN `id` BIGINT NOT NULL AUTO_INCREMENT;

-- 2) Add email/password/telegram columns if they don't exist
-- NOTE: Comment out any statement that errors due to existing columns
ALTER TABLE `users` ADD COLUMN `email` VARCHAR(255) NULL UNIQUE COMMENT '邮箱地址，用于账号密码登录';
ALTER TABLE `users` ADD COLUMN `password_hash` VARCHAR(255) NULL COMMENT '密码哈希，用于账号密码登录';
ALTER TABLE `users` ADD COLUMN `telegram_id` BIGINT NULL UNIQUE COMMENT 'Telegram用户ID，绑定Telegram后存储';

-- 3) Helpful secondary indexes (ignore errors if they already exist)
CREATE INDEX idx_users_email ON `users`(`email`);
CREATE INDEX idx_users_telegram_id ON `users`(`telegram_id`);

-- 4) Backfill telegram_id for legacy TG-only accounts (adjust condition to your data rules)
UPDATE `users`
SET `telegram_id` = `id`
WHERE `telegram_id` IS NULL
  AND `email` IS NULL;

COMMIT;

-- If you need to rollback manually:
-- ALTER TABLE `users` MODIFY COLUMN `id` BIGINT NOT NULL; -- remove AUTO_INCREMENT
-- 原生多登录支持迁移
-- 执行时间: 2025-01-22

-- 1. 修改用户表结构，支持原生多登录
ALTER TABLE users 
  MODIFY COLUMN id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ADD COLUMN email VARCHAR(255) UNIQUE NULL COMMENT '邮箱地址，用于账号密码登录',
  ADD COLUMN password_hash VARCHAR(255) NULL COMMENT '密码哈希，用于账号密码登录',
  ADD COLUMN telegram_id BIGINT UNIQUE NULL COMMENT 'Telegram用户ID，用于Telegram登录';

-- 2. 为现有Telegram用户设置telegram_id
-- 假设现有用户的id就是telegram_id
UPDATE users SET telegram_id = id WHERE id > 1000000000;

-- 3. 添加索引以提高查询性能
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_telegram_id ON users(telegram_id);

-- 4. 确保所有相关表都使用统一的user_id关联
-- 评论表
-- ALTER TABLE comments ADD CONSTRAINT fk_comments_user_id FOREIGN KEY (user_id) REFERENCES users(id);

-- 观看进度表  
-- ALTER TABLE watch_progress ADD CONSTRAINT fk_watch_progress_user_id FOREIGN KEY (user_id) REFERENCES users(id);

-- 浏览历史表
-- ALTER TABLE browse_history ADD CONSTRAINT fk_browse_history_user_id FOREIGN KEY (user_id) REFERENCES users(id);

