-- ===================================================
-- 为series表添加软删除功能
-- ===================================================

USE short_drama;

-- 添加软删除相关字段
ALTER TABLE series 
ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否活跃：1=正常，0=已删除',
ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT '删除时间',
ADD COLUMN deleted_by INT NULL DEFAULT NULL COMMENT '删除者用户ID（可选）';

-- 为软删除字段添加索引，提升查询性能
CREATE INDEX idx_series_is_active ON series (is_active);
CREATE INDEX idx_series_deleted_at ON series (deleted_at);

-- 添加外键约束，保证数据一致性
ALTER TABLE series
  ADD CONSTRAINT fk_series_category
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  ADD CONSTRAINT fk_series_region
    FOREIGN KEY (region_option_id) REFERENCES filter_options(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  ADD CONSTRAINT fk_series_language
    FOREIGN KEY (language_option_id) REFERENCES filter_options(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  ADD CONSTRAINT fk_series_status
    FOREIGN KEY (status_option_id) REFERENCES filter_options(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  ADD CONSTRAINT fk_series_year
    FOREIGN KEY (year_option_id) REFERENCES filter_options(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- 验证字段添加成功
DESCRIBE series;

-- 查看当前数据（应该都是 is_active=1, deleted_at=NULL）
SELECT id, title, is_active, deleted_at FROM series LIMIT 5;
