SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET character_set_connection=utf8mb4;

-- 取最近 5 个活跃系列
DROP TEMPORARY TABLE IF EXISTS tmp_series5;
CREATE TEMPORARY TABLE tmp_series5 AS
SELECT id AS series_id FROM series WHERE is_active=1 ORDER BY id DESC LIMIT 5;

-- 题材：display_order=1(言情) 与 2(玄幻)
DROP TEMPORARY TABLE IF EXISTS tmp_genre12;
CREATE TEMPORARY TABLE tmp_genre12 AS
SELECT display_order, id AS option_id
FROM filter_options WHERE filter_type_id=2 AND display_order IN (1,2);

-- 为每个系列插入两条（避免重复）
INSERT IGNORE INTO series_genre_options(series_id, option_id)
SELECT s.series_id, g.option_id
FROM tmp_series5 s CROSS JOIN tmp_genre12 g;


