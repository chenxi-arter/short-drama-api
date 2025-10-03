-- migrations/add_favorites_table.sql
-- 创建用户收藏表

CREATE TABLE IF NOT EXISTS `favorites` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `series_id` INT NOT NULL COMMENT '系列ID',
  `episode_id` INT NULL COMMENT '剧集ID（可选，如果收藏的是具体某集）',
  `favorite_type` VARCHAR(20) NOT NULL DEFAULT 'series' COMMENT '收藏类型：series=系列, episode=单集',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '收藏时间',
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_series_id` (`series_id`),
  INDEX `idx_episode_id` (`episode_id`),
  INDEX `idx_created_at` (`created_at`),
  UNIQUE INDEX `idx_user_series` (`user_id`, `series_id`, `episode_id`),
  
  CONSTRAINT `fk_favorites_user` 
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) 
    ON DELETE CASCADE,
  CONSTRAINT `fk_favorites_series` 
    FOREIGN KEY (`series_id`) REFERENCES `series` (`id`) 
    ON DELETE CASCADE,
  CONSTRAINT `fk_favorites_episode` 
    FOREIGN KEY (`episode_id`) REFERENCES `episodes` (`id`) 
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户收藏表';

