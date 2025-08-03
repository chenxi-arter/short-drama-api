-- 添加系列筛选相关字段
-- 为 series 表添加地区、语言、发布日期、完结状态和更新时间字段

USE short_drama;

-- 添加地区字段
ALTER TABLE series ADD COLUMN region VARCHAR(50) NULL COMMENT '制作地区';

-- 添加语言字段
ALTER TABLE series ADD COLUMN language VARCHAR(50) NULL COMMENT '主要语言';

-- 添加发布日期字段
ALTER TABLE series ADD COLUMN release_date DATE NULL COMMENT '首播或发布日期';

-- 添加是否完结字段
ALTER TABLE series ADD COLUMN is_completed BOOLEAN DEFAULT FALSE COMMENT '是否完结';

-- 添加更新时间字段
ALTER TABLE series ADD COLUMN updated_at TIMESTAMP NULL COMMENT '最后更新时间';

-- 为新字段添加索引以提高查询性能
CREATE INDEX idx_series_region ON series(region);
CREATE INDEX idx_series_language ON series(language);
CREATE INDEX idx_series_release_date ON series(release_date);
CREATE INDEX idx_series_is_completed ON series(is_completed);
CREATE INDEX idx_series_updated_at ON series(updated_at);

-- 更新现有数据的默认值
UPDATE series SET 
  region = '中国大陆',
  language = '中文',
  is_completed = (status = 'completed'),
  updated_at = NOW()
WHERE region IS NULL;

SELECT 'Series filter fields migration completed successfully' as result;