-- Create join table for series <-> genre options (题材)
CREATE TABLE IF NOT EXISTS `series_genre_options` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `series_id` INT NOT NULL,
  `option_id` INT NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_series_option` (`series_id`, `option_id`),
  KEY `idx_option` (`option_id`),
  KEY `idx_series` (`series_id`),
  CONSTRAINT `fk_sgo_series` FOREIGN KEY (`series_id`) REFERENCES `series`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sgo_option` FOREIGN KEY (`option_id`) REFERENCES `filter_options`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


