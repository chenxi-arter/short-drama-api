-- 仅对 display_order > 0 的项强制唯一（保留“全部=0”不受限制）
-- 方案：添加生成列，只在 display_order>0 时复制 display_order，否则为 NULL；
-- 然后在 (filter_type_id, display_order_nonzero) 上建唯一索引。

ALTER TABLE `filter_options`
  ADD COLUMN `display_order_nonzero` INT GENERATED ALWAYS AS (CASE WHEN `display_order` > 0 THEN `display_order` ELSE NULL END) STORED;

ALTER TABLE `filter_options`
  ADD UNIQUE KEY `uniq_filter_type_display_order_nonzero` (`filter_type_id`, `display_order_nonzero`);


