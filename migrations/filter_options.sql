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

 Date: 13/09/2025 00:45:40
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
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '选项名称',
  `value` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '选项值',
  `is_default` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否默认选中',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否启用',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序顺序',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  `display_order` int NOT NULL DEFAULT '0' COMMENT '显示顺序（对应ids中的数字）',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `FK_2c145bc2913ac7b99ffbafa02bd` (`filter_type_id`) USING BTREE,
  CONSTRAINT `FK_2c145bc2913ac7b99ffbafa02bd` FOREIGN KEY (`filter_type_id`) REFERENCES `filter_types` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- Records of filter_options
-- ----------------------------
BEGIN;
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`, `display_order`) VALUES (1, 1, '全部', 'all', 1, 1, 0, '2025-09-10 14:56:51.000000', '2025-09-12 15:51:17.376368', 0);
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`, `display_order`) VALUES (2, 1, '最近上传', 'latest', 0, 1, 1, '2025-09-10 14:56:51.000000', '2025-09-12 15:51:17.376368', 1);
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`, `display_order`) VALUES (4, 1, '人气最高', 'popular', 0, 1, 3, '2025-09-10 14:56:51.000000', '2025-09-12 15:54:16.740919', 2);
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`, `display_order`) VALUES (5, 1, '评分最高', 'rating', 0, 1, 4, '2025-09-10 14:56:51.000000', '2025-09-12 15:54:16.740919', 3);
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`, `display_order`) VALUES (11, 3, '全部地区', 'all', 1, 1, 0, '2025-09-10 14:56:51.000000', '2025-09-10 14:56:51.000000', 0);
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`, `display_order`) VALUES (12, 3, '大陆', 'mainland', 0, 1, 1, '2025-09-10 14:56:51.000000', '2025-09-10 14:56:51.000000', 1);
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`, `display_order`) VALUES (13, 3, '香港', 'hongkong', 0, 1, 2, '2025-09-10 14:56:51.000000', '2025-09-10 14:56:51.000000', 2);
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`, `display_order`) VALUES (14, 3, '台湾', 'taiwan', 0, 1, 3, '2025-09-10 14:56:51.000000', '2025-09-10 14:56:51.000000', 3);
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`, `display_order`) VALUES (15, 3, '日本', 'japan', 0, 1, 4, '2025-09-10 14:56:51.000000', '2025-09-10 14:56:51.000000', 4);
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`, `display_order`) VALUES (16, 3, '韩国', 'korea', 0, 1, 5, '2025-09-10 14:56:51.000000', '2025-09-10 14:56:51.000000', 5);
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`, `display_order`) VALUES (17, 3, '美国', 'usa', 0, 1, 6, '2025-09-10 14:56:51.000000', '2025-09-10 14:56:51.000000', 6);
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`, `display_order`) VALUES (18, 3, '新加坡', 'singapore', 0, 1, 7, '2025-09-10 14:56:51.000000', '2025-09-10 14:56:51.000000', 7);
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`, `display_order`) VALUES (19, 4, '全部语言', 'all', 1, 1, 0, '2025-09-10 14:56:51.000000', '2025-09-10 14:56:51.000000', 0);
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`, `display_order`) VALUES (20, 4, '国语', 'mandarin', 0, 1, 1, '2025-09-10 14:56:51.000000', '2025-09-10 14:56:51.000000', 1);
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`, `display_order`) VALUES (21, 4, '粤语', 'cantonese', 0, 1, 2, '2025-09-10 14:56:51.000000', '2025-09-10 14:56:51.000000', 2);
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`, `display_order`) VALUES (22, 4, '英语', 'english', 0, 1, 3, '2025-09-10 14:56:51.000000', '2025-09-10 14:56:51.000000', 3);
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`, `display_order`) VALUES (23, 4, '韩语', 'korean', 0, 1, 4, '2025-09-10 14:56:51.000000', '2025-09-10 14:56:51.000000', 4);
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`, `display_order`) VALUES (24, 4, '马来语', 'malay', 0, 1, 5, '2025-09-10 14:56:51.000000', '2025-09-10 14:56:51.000000', 5);
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`, `display_order`) VALUES (25, 5, '全部年份', 'all', 1, 1, 0, '2025-09-10 14:56:51.000000', '2025-09-10 14:56:51.000000', 0);
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`, `display_order`) VALUES (26, 5, '2025年', '2025', 0, 1, 1, '2025-09-10 14:56:51.000000', '2025-09-10 14:56:51.000000', 1);
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`, `display_order`) VALUES (27, 5, '去年', '2024', 0, 1, 2, '2025-09-10 14:56:51.000000', '2025-09-10 14:56:51.000000', 2);
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`, `display_order`) VALUES (28, 5, '前年', '2023', 0, 1, 3, '2025-09-10 14:56:51.000000', '2025-09-10 14:56:51.000000', 3);
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`, `display_order`) VALUES (29, 5, '更早', 'earlier', 0, 1, 4, '2025-09-10 14:56:51.000000', '2025-09-10 14:56:51.000000', 4);
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`, `display_order`) VALUES (30, 5, '90年代', '1990s', 0, 1, 5, '2025-09-10 14:56:51.000000', '2025-09-10 14:56:51.000000', 5);
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`, `display_order`) VALUES (31, 5, '2026年', '2026', 0, 1, 6, '2025-09-10 14:56:51.000000', '2025-09-10 14:56:51.000000', 6);
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`, `display_order`) VALUES (32, 6, '全部状态', 'all', 1, 1, 0, '2025-09-10 14:56:51.000000', '2025-09-10 14:56:51.000000', 0);
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`, `display_order`) VALUES (33, 6, '已完结', 'complete', 0, 1, 1, '2025-09-10 14:56:51.000000', '2025-09-10 16:01:44.393332', 1);
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`, `display_order`) VALUES (34, 6, '连载中', 'ongoing', 0, 1, 2, '2025-09-10 14:56:51.000000', '2025-09-10 14:56:51.000000', 2);
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`, `display_order`) VALUES (35, 6, '预告中', 'preview', 0, 1, 3, '2025-09-10 14:56:51.000000', '2025-09-10 14:56:51.000000', 3);
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`, `display_order`) VALUES (36, 5, '2025', '2025', 0, 1, 7, '2025-09-11 05:36:53.373789', '2025-09-11 05:36:53.373789', 7);
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`, `display_order`) VALUES (37, 5, '2019', '2019', 0, 1, 8, '2025-09-11 05:41:40.626437', '2025-09-11 05:41:40.626437', 8);
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`, `display_order`) VALUES (38, 3, '泰国', '泰国', 0, 1, 8, '2025-09-11 05:41:41.202958', '2025-09-11 05:41:41.202958', 8);
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`, `display_order`) VALUES (39, 4, '泰语', '泰语', 0, 1, 6, '2025-09-11 05:41:41.214672', '2025-09-11 05:41:41.214672', 6);
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`, `display_order`) VALUES (40, 5, '2021', '2021', 0, 1, 9, '2025-09-11 05:41:41.225537', '2025-09-11 05:41:41.225537', 9);
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`, `display_order`) VALUES (41, 4, '日语', '日语', 0, 1, 7, '2025-09-11 05:41:41.286352', '2025-09-11 05:41:41.286352', 7);
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`, `display_order`) VALUES (42, 3, '印度', '印度', 0, 1, 9, '2025-09-11 05:41:41.854962', '2025-09-11 05:41:41.854962', 9);
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`, `display_order`) VALUES (43, 5, '2024', '2024', 0, 1, 10, '2025-09-11 05:41:41.870301', '2025-09-11 05:41:41.870301', 10);
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`, `display_order`) VALUES (44, 2, '言情', 'yanqing', 0, 1, 1, '2025-09-11 13:07:29.606384', '2025-09-11 14:25:31.370495', 1);
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`, `display_order`) VALUES (45, 2, '玄幻', 'xuanhuan', 0, 1, 2, '2025-09-11 13:07:29.606384', '2025-09-11 14:25:31.375398', 2);
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`, `display_order`) VALUES (46, 2, '爱情', 'aiqing', 0, 1, 3, '2025-09-11 13:07:29.606384', '2025-09-11 14:25:31.376798', 3);
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`, `display_order`) VALUES (47, 2, '都市', 'dushi', 0, 1, 4, '2025-09-11 13:07:29.606384', '2025-09-11 14:25:31.378630', 4);
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`, `display_order`) VALUES (48, 2, '古风', 'gufeng', 0, 1, 5, '2025-09-11 13:07:29.606384', '2025-09-11 14:25:31.380493', 5);
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`, `display_order`) VALUES (49, 2, '校园', 'xiaoyuan', 0, 1, 6, '2025-09-11 13:07:29.606384', '2025-09-11 14:25:31.381847', 6);
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`, `display_order`) VALUES (50, 2, '职场', 'zhichang', 0, 1, 7, '2025-09-11 13:07:29.606384', '2025-09-11 14:25:31.383511', 7);
INSERT INTO `filter_options` (`id`, `filter_type_id`, `name`, `value`, `is_default`, `is_active`, `sort_order`, `created_at`, `updated_at`, `display_order`) VALUES (58, 2, '全部类型', '全部类型', 1, 1, 0, '2025-09-11 13:26:13.450005', '2025-09-11 13:29:30.282765', 0);
COMMIT;

SET FOREIGN_KEY_CHECKS = 1;
