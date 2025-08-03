-- 为series表添加演员相关字段
-- 执行时间: 2024-12-19
-- 描述: 为剧集系列表添加主演、演员和导演字段

USE short_drama;

-- 添加主演字段
ALTER TABLE series ADD COLUMN starring TEXT NULL COMMENT '主演名单，多个演员用逗号分隔';

-- 添加演员字段  
ALTER TABLE series ADD COLUMN actor TEXT NULL COMMENT '演员名单，多个演员用逗号分隔';

-- 添加导演字段
ALTER TABLE series ADD COLUMN director VARCHAR(255) NULL COMMENT '导演信息，多个导演用逗号分隔';

-- 验证字段添加成功
DESC series;

-- 可选：为现有数据添加示例演员信息（根据实际需要调整）
-- UPDATE series SET 
--   starring = '张三,李四',
--   actor = '张三,李四,王五,赵六', 
--   director = '导演A'
-- WHERE id = 1;

SELECT 'Actor fields added to series table successfully!' as result;