-- 为series表添加created_at字段
-- 这个字段在实体定义中存在，但数据库表中缺失

USE short_drama;

-- 添加created_at字段
ALTER TABLE series 
ADD COLUMN created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) 
COMMENT '创建时间' 
AFTER category_id;

-- 为created_at字段添加索引以提高查询性能
CREATE INDEX idx_series_created_at ON series(created_at);

-- 验证字段添加成功
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'short_drama' 
AND TABLE_NAME = 'series' 
AND COLUMN_NAME = 'created_at';