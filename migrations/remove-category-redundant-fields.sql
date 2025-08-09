-- 移除categories表中的冗余字段
-- 方案1：保留category_id作为业务标识符，移除type、index、style_type字段

-- 备份现有数据（可选）
-- CREATE TABLE categories_backup AS SELECT * FROM categories;

-- 移除冗余字段
ALTER TABLE categories DROP COLUMN IF EXISTS type;
ALTER TABLE categories DROP COLUMN IF EXISTS `index`;
ALTER TABLE categories DROP COLUMN IF EXISTS style_type;

-- 更新注释
ALTER TABLE categories MODIFY COLUMN category_id VARCHAR(50) NOT NULL COMMENT '分类业务ID，用于前端标识';
ALTER TABLE categories MODIFY COLUMN name VARCHAR(100) NOT NULL COMMENT '分类名称';
ALTER TABLE categories MODIFY COLUMN route_name VARCHAR(100) DEFAULT NULL COMMENT '路由名称';
ALTER TABLE categories MODIFY COLUMN is_enabled TINYINT(1) DEFAULT 1 COMMENT '是否启用';

-- 确保category_id的唯一性
ALTER TABLE categories ADD UNIQUE KEY uk_category_id (category_id);