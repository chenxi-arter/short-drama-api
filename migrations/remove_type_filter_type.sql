-- Migrate legacy 'type' group data into 'genre' and remove 'type'

-- Ensure genre exists and is active at index 2
INSERT INTO filter_types (code, name, index_position, is_active)
SELECT 'genre', '题材', 2, 1
WHERE NOT EXISTS (SELECT 1 FROM filter_types WHERE code = 'genre');

SET @type_id  = (SELECT id FROM filter_types WHERE code = 'type'  LIMIT 1);
SET @genre_id = (SELECT id FROM filter_types WHERE code = 'genre' LIMIT 1);

-- If no legacy type, nothing to do
SET @has_type := IFNULL(@type_id, 0);

-- Copy missing options from type -> genre by name (preserve display_order)
INSERT INTO filter_options (filter_type_id, name, value, is_default, is_active, sort_order, display_order)
SELECT @genre_id, t.name, LOWER(t.name), t.is_default, t.is_active, t.display_order, t.display_order
FROM filter_options t
LEFT JOIN filter_options g
  ON g.filter_type_id = @genre_id AND g.name = t.name
WHERE t.filter_type_id = @type_id AND g.id IS NULL;

-- Map series_genre_options option_id from type options to genre options by name
CREATE TEMPORARY TABLE IF NOT EXISTS tmp_type2genre (
  type_opt_id INT PRIMARY KEY,
  genre_opt_id INT NOT NULL
) ENGINE=Memory;

DELETE FROM tmp_type2genre;
INSERT INTO tmp_type2genre (type_opt_id, genre_opt_id)
SELECT t.id, g.id
FROM filter_options t
JOIN filter_options g ON g.name = t.name AND g.filter_type_id = @genre_id
WHERE t.filter_type_id = @type_id;

-- Update join table
UPDATE series_genre_options sgo
JOIN tmp_type2genre m ON m.type_opt_id = sgo.option_id
SET sgo.option_id = m.genre_opt_id;

-- Remove legacy type options and type group
DELETE FROM filter_options WHERE filter_type_id = @type_id;
DELETE FROM filter_types WHERE id = @type_id;

-- Ensure final order
UPDATE filter_types SET index_position = 1, is_active = 1 WHERE code = 'sort';
UPDATE filter_types SET index_position = 2, is_active = 1 WHERE code = 'genre';
UPDATE filter_types SET index_position = 3, is_active = 1 WHERE code = 'region';
UPDATE filter_types SET index_position = 4, is_active = 1 WHERE code = 'language';
UPDATE filter_types SET index_position = 5, is_active = 1 WHERE code = 'year';
UPDATE filter_types SET index_position = 6, is_active = 1 WHERE code = 'status';


