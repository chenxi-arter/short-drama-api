-- Force genre filter_type to have id = 2 and update related data

SET @target_id := 2;
SET @old_id := (SELECT id FROM filter_types WHERE code='genre' LIMIT 1);

-- No-op if already id=2
SET @need_change := IF(@old_id IS NULL OR @old_id = @target_id, 0, 1);

SET FOREIGN_KEY_CHECKS=0;

-- Ensure slot 2 available
DELETE FROM filter_types WHERE id = @target_id AND code <> 'genre';

-- Update parent row id and enforce ordering/active
UPDATE filter_types SET id = @target_id, index_position = 2, is_active = 1 WHERE id = @old_id AND @need_change = 1;

-- Update children to point to new id
UPDATE filter_options SET filter_type_id = @target_id WHERE filter_type_id = @old_id AND @need_change = 1;

SET FOREIGN_KEY_CHECKS=1;

-- Final normalize order
UPDATE filter_types SET index_position = 1, is_active = 1 WHERE code = 'sort';
UPDATE filter_types SET index_position = 2, is_active = 1 WHERE code = 'genre';
UPDATE filter_types SET index_position = 3, is_active = 1 WHERE code = 'region';
UPDATE filter_types SET index_position = 4, is_active = 1 WHERE code = 'language';
UPDATE filter_types SET index_position = 5, is_active = 1 WHERE code = 'year';
UPDATE filter_types SET index_position = 6, is_active = 1 WHERE code = 'status';


