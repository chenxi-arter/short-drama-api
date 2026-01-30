-- 创建观看日志表
-- 用于准确记录用户观看行为，支持观看时长统计
-- 与 watch_progress 表的区别：
--   - watch_progress: 记录观看进度（断点续播），每个用户-剧集只有1条记录，会被覆盖更新
--   - watch_logs: 记录观看历史（统计分析），每次观看都新增一条记录，不会被覆盖

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for watch_logs
-- ----------------------------
CREATE TABLE IF NOT EXISTS `watch_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '观看日志主键ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `episode_id` int NOT NULL COMMENT '剧集ID',
  `watch_duration` int NOT NULL DEFAULT 0 COMMENT '观看时长（秒）- 本次观看的实际时长',
  `start_position` int NOT NULL DEFAULT 0 COMMENT '开始观看位置（秒）',
  `end_position` int NOT NULL DEFAULT 0 COMMENT '结束观看位置（秒）',
  `watch_date` date NOT NULL COMMENT '观看日期（用于按日统计）',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_user_watch_date` (`user_id`, `watch_date`) USING BTREE COMMENT '用于按用户和日期查询',
  KEY `idx_episode_watch_date` (`episode_id`, `watch_date`) USING BTREE COMMENT '用于按剧集和日期查询',
  KEY `idx_watch_date` (`watch_date`) USING BTREE COMMENT '用于按日期统计',
  KEY `FK_watch_logs_user_id` (`user_id`) USING BTREE,
  KEY `FK_watch_logs_episode_id` (`episode_id`) USING BTREE,
  CONSTRAINT `FK_watch_logs_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_watch_logs_episode_id` FOREIGN KEY (`episode_id`) REFERENCES `episodes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='观看日志表 - 记录用户观看行为用于统计分析';

SET FOREIGN_KEY_CHECKS = 1;
