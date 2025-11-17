-- 修复watch_progress表的级联删除问题（安全版本）

-- 设置安全模式
SET FOREIGN_KEY_CHECKS = 0;

-- 1. 修改 watch_progress 表的外键约束为级联删除
-- 先查找并删除现有的外键约束
SET @constraint_name = (
    SELECT CONSTRAINT_NAME 
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'watch_progress' 
        AND COLUMN_NAME = 'episode_id'
        AND REFERENCED_TABLE_NAME = 'episodes'
    LIMIT 1
);

-- 如果外键存在，则删除
SET @sql = IF(@constraint_name IS NOT NULL,
    CONCAT('ALTER TABLE watch_progress DROP FOREIGN KEY ', @constraint_name),
    'SELECT "No foreign key found for watch_progress.episode_id" as message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 添加新的级联删除外键约束
ALTER TABLE watch_progress 
ADD CONSTRAINT fk_watch_progress_episode_id 
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
    AND TABLE_NAME = 'watch_progress'
    AND REFERENCED_TABLE_NAME = 'episodes';
