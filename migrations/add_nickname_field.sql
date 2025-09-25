-- 添加用户昵称字段
-- 创建时间: 2025-09-25
-- 说明: 为users表添加nickname字段，用于存储用户昵称

ALTER TABLE users ADD COLUMN nickname VARCHAR(50) NULL COMMENT '用户昵称，可重复';

-- 为现有用户设置默认昵称（可选，基于用户名）
UPDATE users SET nickname = COALESCE(first_name, username, CONCAT('用户', id)) WHERE nickname IS NULL;
