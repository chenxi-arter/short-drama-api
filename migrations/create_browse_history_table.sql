-- 创建浏览记录表
CREATE TABLE IF NOT EXISTS `browse_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '浏览记录主键ID',
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `series_id` int(11) NOT NULL COMMENT '剧集系列ID',
  `browse_type` varchar(50) NOT NULL DEFAULT 'episode_list' COMMENT '浏览类型',
  `duration_seconds` int(11) NOT NULL DEFAULT 0 COMMENT '浏览时长（秒）',
  `last_episode_number` int(11) DEFAULT NULL COMMENT '最后访问的集数',
  `visit_count` int(11) NOT NULL DEFAULT 1 COMMENT '访问次数',
  `user_agent` varchar(500) DEFAULT NULL COMMENT '用户代理',
  `ip_address` varchar(45) DEFAULT NULL COMMENT 'IP地址',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_series_type` (`user_id`, `series_id`, `browse_type`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_series_id` (`series_id`),
  KEY `idx_updated_at` (`updated_at`),
  CONSTRAINT `fk_browse_history_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_browse_history_series` FOREIGN KEY (`series_id`) REFERENCES `series` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户浏览记录表';
