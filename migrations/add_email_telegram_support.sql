-- 添加邮箱和Telegram支持
-- 执行时间: 2025-01-22

-- 1. 添加邮箱字段
ALTER TABLE users ADD COLUMN email VARCHAR(255) UNIQUE NULL COMMENT '邮箱地址，用于账号密码登录';

-- 2. 添加密码哈希字段
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL COMMENT '密码哈希，用于账号密码登录';

-- 3. 添加Telegram ID字段
ALTER TABLE users ADD COLUMN telegram_id BIGINT UNIQUE NULL COMMENT 'Telegram用户ID，绑定Telegram后存储';

-- 4. 添加索引以提高查询性能
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_telegram_id ON users(telegram_id);

-- 5. 为现有用户设置默认值（如果有的话）
-- 如果现有用户是通过Telegram创建的，可以这样设置：
-- UPDATE users SET telegram_id = id WHERE id > 1000000000;








