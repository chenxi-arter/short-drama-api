-- 修复Episode相关表的级联删除问题（安全版本）
-- 解决删除episode时的外键约束错误

-- 设置安全模式
SET FOREIGN_KEY_CHECKS = 0;

-- 1. 修改 episode_urls 表的外键约束为级联删除
-- 先查找并删除现有的外键约束
SET @constraint_name = (
    SELECT CONSTRAINT_NAME 
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'episode_urls' 
        AND COLUMN_NAME = 'episode_id'
        AND REFERENCED_TABLE_NAME = 'episodes'
    LIMIT 1
);

-- 如果外键存在，则删除
SET @sql = IF(@constraint_name IS NOT NULL,
    CONCAT('ALTER TABLE episode_urls DROP FOREIGN KEY ', @constraint_name),
    'SELECT "No foreign key found for episode_urls.episode_id" as message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 添加新的级联删除外键约束
ALTER TABLE episode_urls 
ADD CONSTRAINT fk_episode_urls_episode_id 
FOREIGN KEY (episode_id) REFERENCES episodes(id) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- 恢复外键检查
SET FOREIGN_KEY_CHECKS = 1;

-- 验证修改
SELECT 
    CONSTRAINT_NAME,
    DELETE_RULE,
    UPDATE_RULE
FROM 
    INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
WHERE 
    CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'episode_urls'
    AND REFERENCED_TABLE_NAME = 'episodes';
