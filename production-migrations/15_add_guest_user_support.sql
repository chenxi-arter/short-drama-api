-- 添加游客用户支持
-- 用于支持匿名用户访问和后续转正式用户

-- 1. 添加游客标识字段
ALTER TABLE users 
ADD COLUMN is_guest TINYINT(1) DEFAULT 0 COMMENT '是否为游客用户: 0=正式用户, 1=游客';

-- 2. 添加游客唯一标识符（用于前端存储和识别）
ALTER TABLE users 
ADD COLUMN guest_token VARCHAR(64) UNIQUE COMMENT '游客唯一标识token，用于前端识别游客身份';

-- 3. 添加索引优化查询
ALTER TABLE users 
ADD INDEX idx_is_guest (is_guest);

ALTER TABLE users 
ADD INDEX idx_guest_token (guest_token);

-- 4. 修改现有约束，允许游客用户的某些字段为空
-- 游客用户不需要 email, telegram_id, username 等字段
-- 这些字段在用户转正时才会填充

-- 注意：现有的 unique 约束已经支持 NULL 值，MySQL 允许多个 NULL 值存在
-- 所以不需要修改现有约束

-- 5. 更新现有用户为正式用户（防止数据混乱）
UPDATE users SET is_guest = 0 WHERE is_guest IS NULL;
