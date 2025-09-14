/*
 Navicat Premium Dump SQL

 Source Server         : mysql
 Source Server Type    : MySQL
 Source Server Version : 80043 (8.0.43)
 Source Host           : localhost:3307
 Source Schema         : short_drama

 Target Server Type    : MySQL
 Target Server Version : 80043 (8.0.43)
 File Encoding         : 65001

 Date: 14/09/2025 13:05:12
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for browse_history
-- ----------------------------
DROP TABLE IF EXISTS `browse_history`;
CREATE TABLE `browse_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `series_id` int NOT NULL,
  `browse_type` varchar(50) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'episode_watch',
  `last_episode_number` int DEFAULT NULL,
  `visit_count` int NOT NULL DEFAULT '1',
  `user_agent` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`) USING BTREE,
  KEY `FK_2772b4e4dcd762bfffb7d7ea17d` (`user_id`) USING BTREE,
  KEY `FK_819bb524d195464598595e21315` (`series_id`) USING BTREE,
  CONSTRAINT `FK_2772b4e4dcd762bfffb7d7ea17d` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FK_819bb524d195464598595e21315` FOREIGN KEY (`series_id`) REFERENCES `series` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- Records of browse_history
-- ----------------------------
BEGIN;
INSERT INTO `browse_history` (`id`, `user_id`, `series_id`, `browse_type`, `last_episode_number`, `visit_count`, `user_agent`, `ip_address`, `created_at`, `updated_at`) VALUES (5, 7845078844, 1002, 'episode_list', 10, 1, 'curl/8.7.1', '::1', '2025-08-13 02:42:07.366279', '2025-08-13 02:42:07.366279');
INSERT INTO `browse_history` (`id`, `user_id`, `series_id`, `browse_type`, `last_episode_number`, `visit_count`, `user_agent`, `ip_address`, `created_at`, `updated_at`) VALUES (6, 7845078844, 1003, 'series_detail', 15, 1, 'curl/8.7.1', '::1', '2025-08-13 02:42:15.236080', '2025-08-13 02:42:15.236080');
INSERT INTO `browse_history` (`id`, `user_id`, `series_id`, `browse_type`, `last_episode_number`, `visit_count`, `user_agent`, `ip_address`, `created_at`, `updated_at`) VALUES (7, 7845078844, 1004, 'episode_list', 1, 2, 'curl/8.7.1', '::1', '2025-08-13 02:50:22.176088', '2025-08-13 10:50:22.217000');
INSERT INTO `browse_history` (`id`, `user_id`, `series_id`, `browse_type`, `last_episode_number`, `visit_count`, `user_agent`, `ip_address`, `created_at`, `updated_at`) VALUES (8, 7845078844, 1004, 'episode_list', 1, 1, 'curl/8.7.1', '::1', '2025-08-13 02:50:22.191876', '2025-08-13 02:50:22.191876');
INSERT INTO `browse_history` (`id`, `user_id`, `series_id`, `browse_type`, `last_episode_number`, `visit_count`, `user_agent`, `ip_address`, `created_at`, `updated_at`) VALUES (9, 7845078844, 1004, 'episode_list', 1, 1, 'curl/8.7.1', '::1', '2025-08-13 02:50:22.195594', '2025-08-13 02:50:22.195594');
INSERT INTO `browse_history` (`id`, `user_id`, `series_id`, `browse_type`, `last_episode_number`, `visit_count`, `user_agent`, `ip_address`, `created_at`, `updated_at`) VALUES (10, 7845078844, 2001, 'episode_watch', 7, 32, 'curl/8.7.1', '::1', '2025-08-13 15:23:57.214984', '2025-09-13 21:39:44.692000');
INSERT INTO `browse_history` (`id`, `user_id`, `series_id`, `browse_type`, `last_episode_number`, `visit_count`, `user_agent`, `ip_address`, `created_at`, `updated_at`) VALUES (17, 6702079700, 1001, 'episode_list', 3, 1, 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', '192.168.1.100', '2025-08-13 16:51:59.246055', '2025-08-13 16:51:59.246055');
INSERT INTO `browse_history` (`id`, `user_id`, `series_id`, `browse_type`, `last_episode_number`, `visit_count`, `user_agent`, `ip_address`, `created_at`, `updated_at`) VALUES (18, 6702079700, 2001, 'episode_list', 20, 108, 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36 Edg/139.0.0.0', '13.250.251.250', '2025-08-13 16:51:59.248059', '2025-08-26 13:22:44.399000');
INSERT INTO `browse_history` (`id`, `user_id`, `series_id`, `browse_type`, `last_episode_number`, `visit_count`, `user_agent`, `ip_address`, `created_at`, `updated_at`) VALUES (19, 6702079700, 2001, 'episode_play', 5, 3, 'curl/8.7.1', '::1', '2025-08-14 04:33:03.787088', '2025-08-14 12:38:11.487000');
INSERT INTO `browse_history` (`id`, `user_id`, `series_id`, `browse_type`, `last_episode_number`, `visit_count`, `user_agent`, `ip_address`, `created_at`, `updated_at`) VALUES (20, 6702079700, 2001, 'series_detail', NULL, 1, 'curl/8.7.1', '::1', '2025-08-14 04:33:11.002142', '2025-08-14 04:33:11.002142');
INSERT INTO `browse_history` (`id`, `user_id`, `series_id`, `browse_type`, `last_episode_number`, `visit_count`, `user_agent`, `ip_address`, `created_at`, `updated_at`) VALUES (21, 6702079700, 2002, 'episode_list', 20, 5, 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36 Edg/138.0.0.0', '::ffff:13.250.251.250', '2025-08-15 06:41:16.210619', '2025-08-16 18:57:43.196000');
INSERT INTO `browse_history` (`id`, `user_id`, `series_id`, `browse_type`, `last_episode_number`, `visit_count`, `user_agent`, `ip_address`, `created_at`, `updated_at`) VALUES (22, 7845078844, 1001, 'episode_list', 2, 14, 'curl/7.81.0', '::ffff:127.0.0.1', '2025-08-16 02:44:52.752340', '2025-08-18 23:45:34.127000');
INSERT INTO `browse_history` (`id`, `user_id`, `series_id`, `browse_type`, `last_episode_number`, `visit_count`, `user_agent`, `ip_address`, `created_at`, `updated_at`) VALUES (23, 6702079700, 2003, 'episode_list', 12, 17, 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36 Edg/139.0.0.0', '::ffff:13.250.251.250', '2025-08-16 04:53:00.148471', '2025-08-23 20:13:49.471000');
COMMIT;

SET FOREIGN_KEY_CHECKS = 1;
