/*
 Navicat Premium Dump SQL

 Source Server         : short_test
 Source Server Type    : MySQL
 Source Server Version : 80043 (8.0.43)
 Source Host           : localhost:3306
 Source Schema         : short_drama

 Target Server Type    : MySQL
 Target Server Version : 80043 (8.0.43)
 File Encoding         : 65001

 Date: 06/08/2025 15:05:56
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for filter_options
-- ----------------------------
DROP TABLE IF EXISTS `filter_options`;
CREATE TABLE `filter_options` (
  `id` int NOT NULL AUTO_INCREMENT,
  `filter_type_id` int NOT NULL COMMENT '筛选器类型ID',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '选项名称',
  `value` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '选项值',
  `is_default` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否默认选中',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否启用',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序顺序',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `IDX_filter_options_filter_type_id` (`filter_type_id`),
  KEY `IDX_filter_options_sort_order` (`sort_order`),
  KEY `IDX_filter_options_is_active` (`is_active`),
  CONSTRAINT `FK_filter_options_filter_type_id` FOREIGN KEY (`filter_type_id`) REFERENCES `filter_types` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='筛选器选项表';

-- ----------------------------
-- Records of filter_options
-- ----------------------------
BEGIN;
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES (1, 1, '最新上传', 'latest', 1, 1, 1, '2025-08-05 15:11:27.371475', '2025-08-05 15:11:27.371475');
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES (2, 1, '最近更新', 'updated', 0, 1, 2, '2025-08-05 15:11:27.371475', '2025-08-05 15:11:27.371475');
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES (3, 1, '人气最高', 'popular', 0, 1, 3, '2025-08-05 15:11:27.371475', '2025-08-05 15:11:27.371475');
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES (4, 1, '评分最高', 'rating', 0, 1, 4, '2025-08-05 15:11:27.371475', '2025-08-05 15:11:27.371475');
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES (5, 2, '全部类型', 'all', 1, 1, 1, '2025-08-05 15:11:27.371475', '2025-08-05 15:11:27.371475');
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES (6, 2, '偶像', 'idol', 0, 1, 2, '2025-08-05 15:11:27.371475', '2025-08-05 15:11:27.371475');
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES (7, 2, '言情', 'romance', 0, 1, 3, '2025-08-05 15:11:27.371475', '2025-08-05 15:11:27.371475');
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES (8, 2, '爱情', 'love', 0, 1, 4, '2025-08-05 15:11:27.371475', '2025-08-05 15:11:27.371475');
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES (9, 2, '古装', 'costume', 0, 1, 5, '2025-08-05 15:11:27.371475', '2025-08-05 15:11:27.371475');
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES (10, 3, '全部地区', 'all', 1, 1, 1, '2025-08-05 15:11:27.371475', '2025-08-05 15:11:27.371475');
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES (11, 3, '大陆', 'mainland', 0, 1, 2, '2025-08-05 15:11:27.371475', '2025-08-05 15:11:27.371475');
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES (12, 3, '香港', 'hongkong', 0, 1, 3, '2025-08-05 15:11:27.371475', '2025-08-05 15:11:27.371475');
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES (13, 3, '台湾', 'taiwan', 0, 1, 4, '2025-08-05 15:11:27.371475', '2025-08-05 15:11:27.371475');
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES (14, 3, '日本', 'japan', 0, 1, 5, '2025-08-05 15:11:27.371475', '2025-08-05 15:11:27.371475');
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES (15, 4, '全部语言', 'all', 1, 1, 1, '2025-08-05 15:11:27.371475', '2025-08-05 15:11:27.371475');
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES (16, 4, '国语', 'mandarin', 0, 1, 2, '2025-08-05 15:11:27.371475', '2025-08-05 15:11:27.371475');
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES (17, 4, '粤语', 'cantonese', 0, 1, 3, '2025-08-05 15:11:27.371475', '2025-08-05 15:11:27.371475');
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES (18, 4, '英语', 'english', 0, 1, 4, '2025-08-05 15:11:27.371475', '2025-08-05 15:11:27.371475');
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES (19, 4, '韩语', 'korean', 0, 1, 5, '2025-08-05 15:11:27.371475', '2025-08-05 15:11:27.371475');
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES (20, 5, '全部年份', 'all', 1, 1, 1, '2025-08-05 15:11:27.371475', '2025-08-05 15:11:27.371475');
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES (21, 5, '2025年', '2025', 0, 1, 2, '2025-08-05 15:11:27.371475', '2025-08-05 15:11:27.371475');
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES (22, 5, '去年', '2024', 0, 1, 3, '2025-08-05 15:11:27.371475', '2025-08-05 15:13:04.048913');
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES (23, 5, '前年', '2023', 0, 1, 4, '2025-08-05 15:11:27.371475', '2025-08-05 15:26:27.092912');
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES (24, 5, '更早', 'earlier', 0, 1, 5, '2025-08-05 15:11:27.371475', '2025-08-05 15:11:27.371475');
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES (25, 5, '90年代', '1990s', 0, 1, 6, '2025-08-05 15:11:27.371475', '2025-08-05 15:11:27.371475');
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES (26, 6, '全部状态', 'all', 1, 1, 1, '2025-08-05 15:11:27.371475', '2025-08-05 15:11:27.371475');
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES (27, 6, '全集', 'complete', 0, 1, 2, '2025-08-05 15:11:27.371475', '2025-08-05 15:11:27.371475');
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES (28, 6, '连载中', 'ongoing', 0, 1, 3, '2025-08-05 15:11:27.371475', '2025-08-05 15:11:27.371475');
COMMIT;

SET FOREIGN_KEY_CHECKS = 1;
