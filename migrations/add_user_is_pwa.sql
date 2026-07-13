-- 添加 PWA 安装状态字段
-- 用于记录用户是否已将 PWA 安装到桌面，供用户管理筛选和展示

-- 说明：is_pwa 为布尔低基数列，单列索引选择性差，不单独建索引
ALTER TABLE users
ADD COLUMN is_pwa TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否已安装PWA到桌面: 0=未安装, 1=已安装';

UPDATE users SET is_pwa = 0 WHERE is_pwa IS NULL;
