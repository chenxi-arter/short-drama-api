/*
 Navicat Premium Data Transfer

 Source Server         : 34.96.247.183
 Source Server Type    : MySQL
 Source Server Version : 80042 (8.0.42)
 Source Host           : 34.96.247.183:3306
 Source Schema         : short_drama

 Target Server Type    : MySQL
 Target Server Version : 80042 (8.0.42)
 File Encoding         : 65001

 Date: 03/08/2025 18:12:20
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for categories
-- ----------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `UK_categories_name`(`name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 55 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of categories
-- ----------------------------
INSERT INTO `categories` VALUES (6, '动作剧');
INSERT INTO `categories` VALUES (19, '医疗剧');
INSERT INTO `categories` VALUES (14, '历史剧');
INSERT INTO `categories` VALUES (2, '古装剧');
INSERT INTO `categories` VALUES (5, '喜剧');
INSERT INTO `categories` VALUES (17, '家庭剧');
INSERT INTO `categories` VALUES (3, '悬疑剧');
INSERT INTO `categories` VALUES (15, '战争剧');
INSERT INTO `categories` VALUES (20, '校园剧');
INSERT INTO `categories` VALUES (22, '武侠剧');
INSERT INTO `categories` VALUES (4, '爱情剧');
INSERT INTO `categories` VALUES (18, '犯罪剧');
INSERT INTO `categories` VALUES (13, '科幻剧');
INSERT INTO `categories` VALUES (21, '职场剧');
INSERT INTO `categories` VALUES (1, '都市剧');
INSERT INTO `categories` VALUES (16, '青春剧');

-- ----------------------------
-- Table structure for comments
-- ----------------------------
DROP TABLE IF EXISTS `comments`;
CREATE TABLE `comments`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `episode_id` int NOT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `appear_second` int NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `FK_comments_user`(`user_id` ASC) USING BTREE,
  INDEX `FK_comments_episode`(`episode_id` ASC) USING BTREE,
  CONSTRAINT `FK_comments_episode` FOREIGN KEY (`episode_id`) REFERENCES `episodes` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `FK_comments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 71 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of comments
-- ----------------------------
INSERT INTO `comments` VALUES (1, 1001, 1, '这一集太精彩了！', 0, '2025-07-30 13:21:50');
INSERT INTO `comments` VALUES (2, 1002, 1, '男主角演技真好', 0, '2025-07-30 13:21:50');
INSERT INTO `comments` VALUES (3, 1003, 1, '剧情发展很有意思', 0, '2025-07-30 13:21:50');
INSERT INTO `comments` VALUES (4, 1004, 2, '第二集更加精彩', 0, '2025-07-30 13:21:50');
INSERT INTO `comments` VALUES (5, 1005, 2, '女主角好漂亮', 0, '2025-07-30 13:21:50');
INSERT INTO `comments` VALUES (6, 1006, 3, '这个转折太意外了', 0, '2025-07-30 13:21:50');
INSERT INTO `comments` VALUES (7, 1007, 3, '编剧太厉害了', 0, '2025-07-30 13:21:50');
INSERT INTO `comments` VALUES (8, 1008, 4, '感情戏很感人', 0, '2025-07-30 13:21:50');
INSERT INTO `comments` VALUES (9, 1009, 5, '这集有点虐心', 0, '2025-07-30 13:21:50');
INSERT INTO `comments` VALUES (10, 1010, 6, '古装剧就是好看', 0, '2025-07-30 13:21:50');
INSERT INTO `comments` VALUES (11, 1011, 7, '宫斗戏很精彩', 0, '2025-07-30 13:21:50');
INSERT INTO `comments` VALUES (12, 1012, 8, '这个角色很有魅力', 0, '2025-07-30 13:21:50');
INSERT INTO `comments` VALUES (13, 1013, 9, '悬疑剧情很烧脑', 0, '2025-07-30 13:21:50');
INSERT INTO `comments` VALUES (14, 1014, 10, '推理过程很精彩', 0, '2025-07-30 13:21:50');
INSERT INTO `comments` VALUES (15, 1015, 11, '科幻特效不错', 0, '2025-07-30 13:21:50');
INSERT INTO `comments` VALUES (16, 1001, 1, '哈哈哈笑死我了', 120, '2025-07-30 13:21:50');
INSERT INTO `comments` VALUES (17, 1002, 1, '这里的音乐很棒', 300, '2025-07-30 13:21:50');
INSERT INTO `comments` VALUES (18, 1003, 2, '男主好帅！', 180, '2025-07-30 13:21:50');
INSERT INTO `comments` VALUES (19, 1004, 2, '这个镜头拍得真美', 450, '2025-07-30 13:21:50');
INSERT INTO `comments` VALUES (20, 1005, 3, '剧情神转折', 600, '2025-07-30 13:21:50');
INSERT INTO `comments` VALUES (21, 1006, 3, '没想到是这样', 720, '2025-07-30 13:21:50');
INSERT INTO `comments` VALUES (22, 1007, 4, '太感动了', 360, '2025-07-30 13:21:50');
INSERT INTO `comments` VALUES (23, 1008, 5, '心疼女主', 240, '2025-07-30 13:21:50');
INSERT INTO `comments` VALUES (24, 1001, 1, '这一集太精彩了！', 0, '2025-07-30 14:14:48');
INSERT INTO `comments` VALUES (25, 1002, 1, '男主角演技真好', 0, '2025-07-30 14:14:48');
INSERT INTO `comments` VALUES (26, 1003, 1, '剧情发展很有意思', 0, '2025-07-30 14:14:48');
INSERT INTO `comments` VALUES (27, 1004, 2, '第二集更加精彩', 0, '2025-07-30 14:14:48');
INSERT INTO `comments` VALUES (28, 1005, 2, '女主角好漂亮', 0, '2025-07-30 14:14:48');
INSERT INTO `comments` VALUES (29, 1006, 3, '这个转折太意外了', 0, '2025-07-30 14:14:48');
INSERT INTO `comments` VALUES (30, 1007, 3, '编剧太厉害了', 0, '2025-07-30 14:14:48');
INSERT INTO `comments` VALUES (31, 1008, 4, '感情戏很感人', 0, '2025-07-30 14:14:48');
INSERT INTO `comments` VALUES (32, 1009, 5, '这集有点虐心', 0, '2025-07-30 14:14:48');
INSERT INTO `comments` VALUES (33, 1010, 6, '古装剧就是好看', 0, '2025-07-30 14:14:48');
INSERT INTO `comments` VALUES (34, 1011, 7, '宫斗戏很精彩', 0, '2025-07-30 14:14:48');
INSERT INTO `comments` VALUES (35, 1012, 8, '这个角色很有魅力', 0, '2025-07-30 14:14:48');
INSERT INTO `comments` VALUES (36, 1013, 9, '悬疑剧情很烧脑', 0, '2025-07-30 14:14:48');
INSERT INTO `comments` VALUES (37, 1014, 10, '推理过程很精彩', 0, '2025-07-30 14:14:48');
INSERT INTO `comments` VALUES (38, 1015, 11, '科幻特效不错', 0, '2025-07-30 14:14:48');
INSERT INTO `comments` VALUES (39, 1001, 1, '哈哈哈笑死我了', 120, '2025-07-30 14:14:48');
INSERT INTO `comments` VALUES (40, 1002, 1, '这里的音乐很棒', 300, '2025-07-30 14:14:48');
INSERT INTO `comments` VALUES (41, 1003, 2, '男主好帅！', 180, '2025-07-30 14:14:48');
INSERT INTO `comments` VALUES (42, 1004, 2, '这个镜头拍得真美', 450, '2025-07-30 14:14:48');
INSERT INTO `comments` VALUES (43, 1005, 3, '剧情神转折', 600, '2025-07-30 14:14:48');
INSERT INTO `comments` VALUES (44, 1006, 3, '没想到是这样', 720, '2025-07-30 14:14:48');
INSERT INTO `comments` VALUES (45, 1007, 4, '太感动了', 360, '2025-07-30 14:14:48');
INSERT INTO `comments` VALUES (46, 1008, 5, '心疼女主', 240, '2025-07-30 14:14:48');
INSERT INTO `comments` VALUES (47, 7845078844, 1, '女主好美！', 10, '2025-07-31 14:20:07');
INSERT INTO `comments` VALUES (48, 1001, 1, '这一集太精彩了！', 0, '2025-07-31 14:21:28');
INSERT INTO `comments` VALUES (49, 1002, 1, '男主角演技真好', 0, '2025-07-31 14:21:28');
INSERT INTO `comments` VALUES (50, 1003, 1, '剧情发展很有意思', 0, '2025-07-31 14:21:28');
INSERT INTO `comments` VALUES (51, 1004, 2, '第二集更加精彩', 0, '2025-07-31 14:21:28');
INSERT INTO `comments` VALUES (52, 1005, 2, '女主角好漂亮', 0, '2025-07-31 14:21:28');
INSERT INTO `comments` VALUES (53, 1006, 3, '这个转折太意外了', 0, '2025-07-31 14:21:28');
INSERT INTO `comments` VALUES (54, 1007, 3, '编剧太厉害了', 0, '2025-07-31 14:21:28');
INSERT INTO `comments` VALUES (55, 1008, 4, '感情戏很感人', 0, '2025-07-31 14:21:28');
INSERT INTO `comments` VALUES (56, 1009, 5, '这集有点虐心', 0, '2025-07-31 14:21:28');
INSERT INTO `comments` VALUES (57, 1010, 6, '古装剧就是好看', 0, '2025-07-31 14:21:28');
INSERT INTO `comments` VALUES (58, 1011, 7, '宫斗戏很精彩', 0, '2025-07-31 14:21:28');
INSERT INTO `comments` VALUES (59, 1012, 8, '这个角色很有魅力', 0, '2025-07-31 14:21:28');
INSERT INTO `comments` VALUES (60, 1013, 9, '悬疑剧情很烧脑', 0, '2025-07-31 14:21:28');
INSERT INTO `comments` VALUES (61, 1014, 10, '推理过程很精彩', 0, '2025-07-31 14:21:28');
INSERT INTO `comments` VALUES (62, 1015, 11, '科幻特效不错', 0, '2025-07-31 14:21:28');
INSERT INTO `comments` VALUES (63, 1001, 1, '哈哈哈笑死我了', 120, '2025-07-31 14:21:28');
INSERT INTO `comments` VALUES (64, 1002, 1, '这里的音乐很棒', 300, '2025-07-31 14:21:28');
INSERT INTO `comments` VALUES (65, 1003, 2, '男主好帅！', 180, '2025-07-31 14:21:28');
INSERT INTO `comments` VALUES (66, 1004, 2, '这个镜头拍得真美', 450, '2025-07-31 14:21:28');
INSERT INTO `comments` VALUES (67, 1005, 3, '剧情神转折', 600, '2025-07-31 14:21:28');
INSERT INTO `comments` VALUES (68, 1006, 3, '没想到是这样', 720, '2025-07-31 14:21:28');
INSERT INTO `comments` VALUES (69, 1007, 4, '太感动了', 360, '2025-07-31 14:21:28');
INSERT INTO `comments` VALUES (70, 1008, 5, '心疼女主', 240, '2025-07-31 14:21:28');

-- ----------------------------
-- Table structure for episode_tags
-- ----------------------------
DROP TABLE IF EXISTS `episode_tags`;
CREATE TABLE `episode_tags`  (
  `episode_id` int NOT NULL,
  `tag_id` int NOT NULL,
  PRIMARY KEY (`episode_id`, `tag_id`) USING BTREE,
  INDEX `FK_episode_tags_tag`(`tag_id` ASC) USING BTREE,
  CONSTRAINT `FK_episode_tags_episode` FOREIGN KEY (`episode_id`) REFERENCES `episodes` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `FK_episode_tags_tag` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of episode_tags
-- ----------------------------
INSERT INTO `episode_tags` VALUES (1, 1);
INSERT INTO `episode_tags` VALUES (3, 2);
INSERT INTO `episode_tags` VALUES (9, 2);
INSERT INTO `episode_tags` VALUES (2, 4);
INSERT INTO `episode_tags` VALUES (6, 5);
INSERT INTO `episode_tags` VALUES (1, 8);
INSERT INTO `episode_tags` VALUES (2, 9);
INSERT INTO `episode_tags` VALUES (3, 21);
INSERT INTO `episode_tags` VALUES (10, 21);
INSERT INTO `episode_tags` VALUES (15, 29);
INSERT INTO `episode_tags` VALUES (18, 30);

-- ----------------------------
-- Table structure for episode_urls
-- ----------------------------
DROP TABLE IF EXISTS `episode_urls`;
CREATE TABLE `episode_urls`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `episode_id` int NOT NULL,
  `quality` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `oss_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cdn_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `subtitle_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `access_key` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '加密索引键，用于防止枚举攻击',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_access_key`(`access_key` ASC) USING BTREE,
  INDEX `FK_episode_urls_episode`(`episode_id` ASC) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE,
  INDEX `idx_updated_at`(`updated_at` ASC) USING BTREE,
  CONSTRAINT `FK_episode_urls_episode` FOREIGN KEY (`episode_id`) REFERENCES `episodes` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 37 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of episode_urls
-- ----------------------------
INSERT INTO `episode_urls` VALUES (1, 1, '720p', 'https://oss.example.com/ep1_720p.mp4', 'https://cdn.example.com/ep1_720p.mp4', 'https://cdn.example.com/ep1_sub.srt', '873f33d66e1d11f0a79246ab21e67dc1', '2025-07-31 15:34:13', '2025-07-31 15:34:13');
INSERT INTO `episode_urls` VALUES (2, 1, '1080p', 'https://oss.example.com/ep1_1080p.mp4', 'https://cdn.example.com/ep1_1080p.mp4', 'https://cdn.example.com/ep1_sub.srt', '873f3eb96e1d11f0a79246ab21e67dc1', '2025-07-31 15:34:13', '2025-07-31 15:34:13');
INSERT INTO `episode_urls` VALUES (3, 1, '4K', 'https://oss.example.com/ep1_4k.mp4', 'https://cdn.example.com/ep1_4k.mp4', 'https://cdn.example.com/ep1_sub.srt', '873f40026e1d11f0a79246ab21e67dc1', '2025-07-31 15:34:13', '2025-07-31 15:34:13');
INSERT INTO `episode_urls` VALUES (4, 2, '720p', 'https://oss.example.com/ep2_720p.mp4', 'https://cdn.example.com/ep2_720p.mp4', 'https://cdn.example.com/ep2_sub.srt', '873f40cd6e1d11f0a79246ab21e67dc1', '2025-07-31 15:34:13', '2025-07-31 15:34:13');
INSERT INTO `episode_urls` VALUES (5, 2, '1080p', 'https://oss.example.com/ep2_1080p.mp4', 'https://cdn.example.com/ep2_1080p.mp4', 'https://cdn.example.com/ep2_sub.srt', '873f41996e1d11f0a79246ab21e67dc1', '2025-07-31 15:34:13', '2025-07-31 15:34:13');
INSERT INTO `episode_urls` VALUES (6, 3, '720p', 'https://oss.example.com/ep3_720p.mp4', 'https://cdn.example.com/ep3_720p.mp4', NULL, '873f424d6e1d11f0a79246ab21e67dc1', '2025-07-31 15:34:13', '2025-07-31 15:34:13');
INSERT INTO `episode_urls` VALUES (7, 3, '1080p', 'https://oss.example.com/ep3_1080p.mp4', 'https://cdn.example.com/ep3_1080p.mp4', NULL, '873f43076e1d11f0a79246ab21e67dc1', '2025-07-31 15:34:13', '2025-07-31 15:34:13');
INSERT INTO `episode_urls` VALUES (8, 4, '720p', 'https://oss.example.com/ep4_720p.mp4', 'https://cdn.example.com/ep4_720p.mp4', NULL, '873f43b96e1d11f0a79246ab21e67dc1', '2025-07-31 15:34:13', '2025-07-31 15:34:13');
INSERT INTO `episode_urls` VALUES (9, 5, '720p', 'https://oss.example.com/ep5_720p.mp4', 'https://cdn.example.com/ep5_720p.mp4', NULL, '873f44686e1d11f0a79246ab21e67dc1', '2025-07-31 15:34:13', '2025-07-31 15:34:13');
INSERT INTO `episode_urls` VALUES (10, 6, '1080p', 'https://oss.example.com/ep6_1080p.mp4', 'https://cdn.example.com/ep6_1080p.mp4', 'https://cdn.example.com/ep6_sub.srt', '873f45116e1d11f0a79246ab21e67dc1', '2025-07-31 15:34:13', '2025-07-31 15:34:13');
INSERT INTO `episode_urls` VALUES (11, 7, '720p', 'https://oss.example.com/ep7_720p.mp4', 'https://cdn.example.com/ep7_720p.mp4', NULL, '873f45b86e1d11f0a79246ab21e67dc1', '2025-07-31 15:34:13', '2025-07-31 15:34:13');
INSERT INTO `episode_urls` VALUES (12, 8, '1080p', 'https://oss.example.com/ep8_1080p.mp4', 'https://cdn.example.com/ep8_1080p.mp4', NULL, '873f46566e1d11f0a79246ab21e67dc1', '2025-07-31 15:34:13', '2025-07-31 15:34:13');
INSERT INTO `episode_urls` VALUES (13, 1, '720p', 'https://oss.example.com/ep1_720p.mp4', 'https://cdn.example.com/ep1_720p.mp4', 'https://cdn.example.com/ep1_sub.srt', '873f47326e1d11f0a79246ab21e67dc1', '2025-07-31 15:34:13', '2025-07-31 15:34:13');
INSERT INTO `episode_urls` VALUES (14, 1, '1080p', 'https://oss.example.com/ep1_1080p.mp4', 'https://cdn.example.com/ep1_1080p.mp4', 'https://cdn.example.com/ep1_sub.srt', '873f47e16e1d11f0a79246ab21e67dc1', '2025-07-31 15:34:13', '2025-07-31 15:34:13');
INSERT INTO `episode_urls` VALUES (15, 1, '4K', 'https://oss.example.com/ep1_4k.mp4', 'https://cdn.example.com/ep1_4k.mp4', 'https://cdn.example.com/ep1_sub.srt', '873f48816e1d11f0a79246ab21e67dc1', '2025-07-31 15:34:13', '2025-07-31 15:34:13');
INSERT INTO `episode_urls` VALUES (16, 2, '720p', 'https://oss.example.com/ep2_720p.mp4', 'https://cdn.example.com/ep2_720p.mp4', 'https://cdn.example.com/ep2_sub.srt', '873f49206e1d11f0a79246ab21e67dc1', '2025-07-31 15:34:13', '2025-07-31 15:34:13');
INSERT INTO `episode_urls` VALUES (17, 2, '1080p', 'https://oss.example.com/ep2_1080p.mp4', 'https://cdn.example.com/ep2_1080p.mp4', 'https://cdn.example.com/ep2_sub.srt', '873f49ca6e1d11f0a79246ab21e67dc1', '2025-07-31 15:34:13', '2025-07-31 15:34:13');
INSERT INTO `episode_urls` VALUES (18, 3, '720p', 'https://oss.example.com/ep3_720p.mp4', 'https://cdn.example.com/ep3_720p.mp4', NULL, '873f4a6f6e1d11f0a79246ab21e67dc1', '2025-07-31 15:34:13', '2025-07-31 15:34:13');
INSERT INTO `episode_urls` VALUES (19, 3, '1080p', 'https://oss.example.com/ep3_1080p.mp4', 'https://cdn.example.com/ep3_1080p.mp4', NULL, '873f4b116e1d11f0a79246ab21e67dc1', '2025-07-31 15:34:13', '2025-07-31 15:34:13');
INSERT INTO `episode_urls` VALUES (20, 4, '720p', 'https://oss.example.com/ep4_720p.mp4', 'https://cdn.example.com/ep4_720p.mp4', NULL, '873f4bb06e1d11f0a79246ab21e67dc1', '2025-07-31 15:34:13', '2025-07-31 15:34:13');
INSERT INTO `episode_urls` VALUES (21, 5, '720p', 'https://oss.example.com/ep5_720p.mp4', 'https://cdn.example.com/ep5_720p.mp4', NULL, '873f4c4d6e1d11f0a79246ab21e67dc1', '2025-07-31 15:34:13', '2025-07-31 15:34:13');
INSERT INTO `episode_urls` VALUES (22, 6, '1080p', 'https://oss.example.com/ep6_1080p.mp4', 'https://cdn.example.com/ep6_1080p.mp4', 'https://cdn.example.com/ep6_sub.srt', '873f4cea6e1d11f0a79246ab21e67dc1', '2025-07-31 15:34:13', '2025-07-31 15:34:13');
INSERT INTO `episode_urls` VALUES (23, 7, '720p', 'https://oss.example.com/ep7_720p.mp4', 'https://cdn.example.com/ep7_720p.mp4', NULL, '873f4d876e1d11f0a79246ab21e67dc1', '2025-07-31 15:34:13', '2025-07-31 15:34:13');
INSERT INTO `episode_urls` VALUES (24, 8, '1080p', 'https://oss.example.com/ep8_1080p.mp4', 'https://cdn.example.com/ep8_1080p.mp4', NULL, '873f4e256e1d11f0a79246ab21e67dc1', '2025-07-31 15:34:13', '2025-07-31 15:34:13');
INSERT INTO `episode_urls` VALUES (25, 1, '720p', 'https://oss.example.com/ep1_720p.mp4', 'https://cdn.example.com/ep1_720p.mp4', 'https://cdn.example.com/ep1_sub.srt', '873f4ec26e1d11f0a79246ab21e67dc1', '2025-07-31 15:34:13', '2025-07-31 15:34:13');
INSERT INTO `episode_urls` VALUES (26, 1, '1080p', 'https://oss.example.com/ep1_1080p.mp4', 'https://cdn.example.com/ep1_1080p.mp4', 'https://cdn.example.com/ep1_sub.srt', '873f4f656e1d11f0a79246ab21e67dc1', '2025-07-31 15:34:13', '2025-07-31 15:34:13');
INSERT INTO `episode_urls` VALUES (27, 1, '4K', 'https://oss.example.com/ep1_4k.mp4', 'https://cdn.example.com/ep1_4k.mp4', 'https://cdn.example.com/ep1_sub.srt', '873f51ad6e1d11f0a79246ab21e67dc1', '2025-07-31 15:34:13', '2025-07-31 15:34:13');
INSERT INTO `episode_urls` VALUES (28, 2, '720p', 'https://oss.example.com/ep2_720p.mp4', 'https://cdn.example.com/ep2_720p.mp4', 'https://cdn.example.com/ep2_sub.srt', '873f52c16e1d11f0a79246ab21e67dc1', '2025-07-31 15:34:13', '2025-07-31 15:34:13');
INSERT INTO `episode_urls` VALUES (29, 2, '1080p', 'https://oss.example.com/ep2_1080p.mp4', 'https://cdn.example.com/ep2_1080p.mp4', 'https://cdn.example.com/ep2_sub.srt', '873f536f6e1d11f0a79246ab21e67dc1', '2025-07-31 15:34:13', '2025-07-31 15:34:13');
INSERT INTO `episode_urls` VALUES (30, 3, '720p', 'https://oss.example.com/ep3_720p.mp4', 'https://cdn.example.com/ep3_720p.mp4', NULL, '873f54116e1d11f0a79246ab21e67dc1', '2025-07-31 15:34:13', '2025-07-31 15:34:13');
INSERT INTO `episode_urls` VALUES (31, 3, '1080p', 'https://oss.example.com/ep3_1080p.mp4', 'https://cdn.example.com/ep3_1080p.mp4', NULL, '873f54b16e1d11f0a79246ab21e67dc1', '2025-07-31 15:34:13', '2025-07-31 15:34:13');
INSERT INTO `episode_urls` VALUES (32, 4, '720p', 'https://oss.example.com/ep4_720p.mp4', 'https://cdn.example.com/ep4_720p.mp4', NULL, '873f554e6e1d11f0a79246ab21e67dc1', '2025-07-31 15:34:13', '2025-07-31 15:34:13');
INSERT INTO `episode_urls` VALUES (33, 5, '720p', 'https://oss.example.com/ep5_720p.mp4', 'https://cdn.example.com/ep5_720p.mp4', NULL, '873f564d6e1d11f0a79246ab21e67dc1', '2025-07-31 15:34:13', '2025-07-31 15:34:13');
INSERT INTO `episode_urls` VALUES (34, 6, '1080p', 'https://oss.example.com/ep6_1080p.mp4', 'https://cdn.example.com/ep6_1080p.mp4', 'https://cdn.example.com/ep6_sub.srt', '873f56ef6e1d11f0a79246ab21e67dc1', '2025-07-31 15:34:13', '2025-07-31 15:34:13');
INSERT INTO `episode_urls` VALUES (35, 7, '720p', 'https://oss.example.com/ep7_720p.mp4', 'https://cdn.example.com/ep7_720p.mp4', NULL, '873f57906e1d11f0a79246ab21e67dc1', '2025-07-31 15:34:13', '2025-07-31 15:34:13');
INSERT INTO `episode_urls` VALUES (36, 8, '1080p', 'https://oss.example.com/ep8_1080p.mp4', 'https://cdn.example.com/ep8_1080p.mp4', NULL, '873f582e6e1d11f0a79246ab21e67dc1', '2025-07-31 15:34:13', '2025-07-31 15:34:13');

-- ----------------------------
-- Table structure for episodes
-- ----------------------------
DROP TABLE IF EXISTS `episodes`;
CREATE TABLE `episodes`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `series_id` int NOT NULL,
  `episode_number` int NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `duration` int NOT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'published',
  `playCount` int NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `has_sequel` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否有续集',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `FK_episodes_series`(`series_id` ASC) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE,
  INDEX `idx_updated_at`(`updated_at` ASC) USING BTREE,
  INDEX `idx_has_sequel`(`has_sequel` ASC) USING BTREE,
  CONSTRAINT `FK_episodes_series` FOREIGN KEY (`series_id`) REFERENCES `series` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 61 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of episodes
-- ----------------------------
INSERT INTO `episodes` VALUES (1, 1, 1, '初次相遇', 2400, 'published', 1500, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (2, 1, 2, '误会重重', 2450, 'published', 1400, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (3, 1, 3, '真相大白', 2380, 'published', 1300, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (4, 1, 4, '感情升温', 2420, 'published', 1200, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (5, 1, 5, '分手危机', 2500, 'published', 1100, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (6, 2, 1, '入宫序曲', 2600, 'published', 2000, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (7, 2, 2, '宫廷斗争', 2550, 'published', 1900, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (8, 2, 3, '爱恨情仇', 2480, 'published', 1800, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (9, 2, 4, '权力游戏', 2520, 'published', 1700, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (10, 2, 5, '生死抉择', 2580, 'published', 1600, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (11, 3, 1, '神秘案件', 2300, 'published', 1200, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (12, 3, 2, '线索追踪', 2350, 'published', 1150, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (13, 3, 3, '真凶浮现', 2400, 'published', 1100, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (14, 3, 4, '最后审判', 2450, 'published', 1050, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (15, 4, 1, '未来启示', 2500, 'published', 800, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (16, 4, 2, '机器觉醒', 2480, 'published', 750, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (17, 4, 3, '人类反击', 2520, 'published', 700, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (18, 5, 1, '王朝兴起', 2700, 'published', 1800, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (19, 5, 2, '权臣当道', 2650, 'published', 1750, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (20, 5, 3, '民间疾苦', 2600, 'published', 1700, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (21, 1, 1, '初次相遇', 2400, 'published', 1500, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (22, 1, 2, '误会重重', 2450, 'published', 1400, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (23, 1, 3, '真相大白', 2380, 'published', 1300, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (24, 1, 4, '感情升温', 2420, 'published', 1200, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (25, 1, 5, '分手危机', 2500, 'published', 1100, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (26, 2, 1, '入宫序曲', 2600, 'published', 2000, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (27, 2, 2, '宫廷斗争', 2550, 'published', 1900, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (28, 2, 3, '爱恨情仇', 2480, 'published', 1800, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (29, 2, 4, '权力游戏', 2520, 'published', 1700, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (30, 2, 5, '生死抉择', 2580, 'published', 1600, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (31, 3, 1, '神秘案件', 2300, 'published', 1200, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (32, 3, 2, '线索追踪', 2350, 'published', 1150, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (33, 3, 3, '真凶浮现', 2400, 'published', 1100, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (34, 3, 4, '最后审判', 2450, 'published', 1050, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (35, 4, 1, '未来启示', 2500, 'published', 800, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (36, 4, 2, '机器觉醒', 2480, 'published', 750, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (37, 4, 3, '人类反击', 2520, 'published', 700, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (38, 5, 1, '王朝兴起', 2700, 'published', 1800, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (39, 5, 2, '权臣当道', 2650, 'published', 1750, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (40, 5, 3, '民间疾苦', 2600, 'published', 1700, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (41, 1, 1, '初次相遇', 2400, 'published', 1500, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (42, 1, 2, '误会重重', 2450, 'published', 1400, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (43, 1, 3, '真相大白', 2380, 'published', 1300, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (44, 1, 4, '感情升温', 2420, 'published', 1200, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (45, 1, 5, '分手危机', 2500, 'published', 1100, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (46, 2, 1, '入宫序曲', 2600, 'published', 2000, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (47, 2, 2, '宫廷斗争', 2550, 'published', 1900, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (48, 2, 3, '爱恨情仇', 2480, 'published', 1800, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (49, 2, 4, '权力游戏', 2520, 'published', 1700, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (50, 2, 5, '生死抉择', 2580, 'published', 1600, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (51, 3, 1, '神秘案件', 2300, 'published', 1200, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (52, 3, 2, '线索追踪', 2350, 'published', 1150, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (53, 3, 3, '真凶浮现', 2400, 'published', 1100, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (54, 3, 4, '最后审判', 2450, 'published', 1050, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (55, 4, 1, '未来启示', 2500, 'published', 800, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (56, 4, 2, '机器觉醒', 2480, 'published', 750, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (57, 4, 3, '人类反击', 2520, 'published', 700, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (58, 5, 1, '王朝兴起', 2700, 'published', 1800, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (59, 5, 2, '权臣当道', 2650, 'published', 1750, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);
INSERT INTO `episodes` VALUES (60, 5, 3, '民间疾苦', 2600, 'published', 1700, '2025-07-31 14:49:12', '2025-07-31 14:49:12', 0);

-- ----------------------------
-- Table structure for refresh_tokens
-- ----------------------------
DROP TABLE IF EXISTS `refresh_tokens`;
CREATE TABLE `refresh_tokens`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` bigint NOT NULL COMMENT '用户ID，外键关联users表',
  `token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'refresh token值，唯一标识',
  `expires_at` timestamp NOT NULL COMMENT 'token过期时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `is_revoked` tinyint(1) NULL DEFAULT 0 COMMENT '是否已撤销，0=有效，1=已撤销',
  `device_info` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '设备信息，用于设备管理',
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT 'IP地址，用于安全审计',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `token`(`token` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE COMMENT '用户ID索引',
  INDEX `idx_token`(`token` ASC) USING BTREE COMMENT 'token索引',
  INDEX `idx_expires_at`(`expires_at` ASC) USING BTREE COMMENT '过期时间索引',
  INDEX `idx_user_active`(`user_id` ASC, `is_revoked` ASC, `expires_at` ASC) USING BTREE COMMENT '用户活跃token复合索引',
  CONSTRAINT `refresh_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 10 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '刷新令牌表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of refresh_tokens
-- ----------------------------
INSERT INTO `refresh_tokens` VALUES (1, 7845078844, '7fcd12b3fb085ed4994c23041f616e604b026311f7b15fdd5d928615706f9e49', '2025-08-06 22:32:44', '2025-07-30 14:32:44', 0, 'dinghe987', NULL);
INSERT INTO `refresh_tokens` VALUES (2, 7845078844, 'c6e69892b29786c6ff473f81206b89a3cfcca696aa64507822f9900dc2200e34', '2025-08-06 22:32:55', '2025-07-30 14:32:55', 0, 'dinghe987', NULL);
INSERT INTO `refresh_tokens` VALUES (3, 7845078844, 'eddd4074e8c71c6a5ad345297e8494b86594b5f0f868f0dbbd9afda6cf2bf2b8', '2025-08-06 23:18:33', '2025-07-30 15:18:33', 0, 'dinghe987', NULL);
INSERT INTO `refresh_tokens` VALUES (4, 7845078844, '74453daa207394087f6aa461381baeaf9ba20542fbe6f0a765c868d3351f73f3', '2025-08-06 23:19:12', '2025-07-30 15:19:12', 0, 'dinghe987', NULL);
INSERT INTO `refresh_tokens` VALUES (5, 7845078844, 'c588fcae847d1d5c554715db3442c2449f51a3cb96da7fcd92c721a62bdbd8b4', '2025-08-06 23:24:08', '2025-07-30 15:24:08', 0, 'dinghe987', NULL);
INSERT INTO `refresh_tokens` VALUES (6, 7845078844, '3038415d36f03d1ef7584882538b5685535e10be8d688a5a5622646c58d89431', '2025-08-06 23:27:13', '2025-07-30 15:27:13', 0, 'dinghe987', NULL);
INSERT INTO `refresh_tokens` VALUES (7, 7845078844, '0063919b32305707f806610fe63de6aba0a2767de852479a069eaf6acc9f9174', '2025-08-06 15:32:44', '2025-07-30 15:32:43', 0, 'dinghe987', NULL);
INSERT INTO `refresh_tokens` VALUES (8, 7845078844, 'bfafd8f740217074ea9fbe59c5f0b45a500c7fa3514f59501257be4159dfdfe3', '2025-08-07 16:35:33', '2025-07-31 16:35:33', 0, 'dinghe987', NULL);
INSERT INTO `refresh_tokens` VALUES (9, 7845078844, 'a6984b57a90f280571971899de3dcde5cd20d5de78516bef01e6ac216b513093', '2025-08-07 16:40:23', '2025-07-31 16:40:24', 0, 'dinghe987', NULL);

-- ----------------------------
-- Table structure for series
-- ----------------------------
DROP TABLE IF EXISTS `series`;
CREATE TABLE `series`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `cover_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `total_episodes` int NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `score` float NOT NULL DEFAULT 0,
  `playCount` int NOT NULL DEFAULT 0,
  `status` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'on-going',
  `up_status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '更新状态，如：更新到第10集、全集',
  `up_count` int NOT NULL DEFAULT 0 COMMENT '更新次数',
  `has_sequel` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否有续集',
  `category_id` int NULL DEFAULT NULL,
  `starring` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '主演名单，多个演员用逗号分隔',
  `actor` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '演员名单，多个演员用逗号分隔',
  `director` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '导演信息，多个导演用逗号分隔',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `FK_series_category`(`category_id` ASC) USING BTREE,
  CONSTRAINT `FK_series_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 58 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of series
-- ----------------------------
INSERT INTO `series` VALUES (1, '都市爱情故事', '一部现代都市爱情剧', 'https://example.com/cover1.jpg', 24, '2025-07-30 13:08:43', '2025-07-31 14:22:27', 8.5, 10000, 'on-going', '更新到第12集', 12, 0, 1, NULL, NULL, NULL);
INSERT INTO `series` VALUES (2, '古装传奇', '古代宫廷传奇故事', 'https://example.com/cover2.jpg', 36, '2025-07-30 13:08:43', '2025-07-31 14:22:27', 9, 15000, 'completed', '全集', 36, 0, 2, NULL, NULL, NULL);
INSERT INTO `series` VALUES (3, '悬疑推理', '烧脑悬疑推理剧', 'https://example.com/cover3.jpg', 20, '2025-07-30 13:08:43', '2025-07-31 14:22:27', 8.8, 8000, 'on-going', '更新到第8集', 8, 0, 3, NULL, NULL, NULL);
INSERT INTO `series` VALUES (4, '都市爱情故事', '一部现代都市爱情剧', 'https://example.com/cover1.jpg', 24, '2025-07-30 13:21:46', '2025-07-31 14:22:27', 8.5, 10000, 'on-going', '更新到第12集', 12, 0, 1, NULL, NULL, NULL);
INSERT INTO `series` VALUES (5, '古装传奇', '古代宫廷传奇故事', 'https://example.com/cover2.jpg', 36, '2025-07-30 13:21:46', '2025-07-31 14:22:27', 9, 15000, 'completed', '全集', 36, 0, 2, NULL, NULL, NULL);
INSERT INTO `series` VALUES (6, '悬疑推理', '烧脑悬疑推理剧', 'https://example.com/cover3.jpg', 20, '2025-07-30 13:21:46', '2025-07-31 14:22:27', 8.8, 8000, 'on-going', '更新到第8集', 8, 0, 3, NULL, NULL, NULL);
INSERT INTO `series` VALUES (7, '白衣天使', '医院生活剧', 'https://example.com/medical1.jpg', 26, '2025-07-30 13:21:48', '2025-07-31 14:22:27', 8.8, 13000, 'on-going', '更新到第18集', 18, 0, 13, NULL, NULL, NULL);
INSERT INTO `series` VALUES (8, '大学时光', '大学校园故事', 'https://example.com/campus1.jpg', 22, '2025-07-30 13:21:48', '2025-07-31 14:22:27', 8.4, 8500, 'completed', '全集', 22, 0, 14, NULL, NULL, NULL);
INSERT INTO `series` VALUES (9, '职场风云', '商战职场剧', 'https://example.com/office1.jpg', 34, '2025-07-30 13:21:48', '2025-07-31 14:22:27', 8.7, 14000, 'on-going', '更新到第25集', 25, 0, 15, NULL, NULL, NULL);
INSERT INTO `series` VALUES (10, '江湖侠客', '武侠江湖传说', 'https://example.com/wuxia1.jpg', 38, '2025-07-30 13:21:48', '2025-07-31 14:22:27', 9, 17000, 'completed', '全集', 38, 0, 16, NULL, NULL, NULL);
INSERT INTO `series` VALUES (11, '都市夜生活', '现代都市群像', 'https://example.com/urban1.jpg', 20, '2025-07-30 13:21:48', '2025-07-31 14:22:27', 8.2, 7000, 'on-going', '更新到第12集', 12, 0, 1, NULL, NULL, NULL);
INSERT INTO `series` VALUES (12, '宫廷秘史', '清朝宫廷剧', 'https://example.com/palace1.jpg', 42, '2025-07-30 13:21:48', '2025-07-31 14:22:27', 8.9, 19000, 'completed', '全集', 42, 0, 2, NULL, NULL, NULL);
INSERT INTO `series` VALUES (13, '推理大师', '侦探推理剧', 'https://example.com/detective1.jpg', 16, '2025-07-30 13:21:48', '2025-07-31 14:22:27', 9.3, 21000, 'completed', '全集', 16, 0, 3, NULL, NULL, NULL);
INSERT INTO `series` VALUES (14, '浪漫爱情', '现代爱情故事', 'https://example.com/romance1.jpg', 18, '2025-07-30 13:21:48', '2025-07-31 14:22:27', 8.5, 10500, 'on-going', '更新到第14集', 14, 0, 4, NULL, NULL, NULL);
INSERT INTO `series` VALUES (15, '爆笑生活', '都市喜剧', 'https://example.com/comedy1.jpg', 25, '2025-07-30 13:21:48', '2025-07-31 14:22:27', 8.1, 6500, 'on-going', '更新到第16集', 16, 0, 5, NULL, NULL, NULL);
INSERT INTO `series` VALUES (22, '都市爱情故事', '一部现代都市爱情剧', 'https://example.com/cover1.jpg', 24, '2025-07-30 14:14:43', '2025-07-31 14:22:27', 8.5, 10000, 'on-going', '更新到第12集', 12, 0, 1, NULL, NULL, NULL);
INSERT INTO `series` VALUES (23, '古装传奇', '古代宫廷传奇故事', 'https://example.com/cover2.jpg', 36, '2025-07-30 14:14:43', '2025-07-31 14:22:27', 9, 15000, 'completed', '全集', 36, 0, 2, NULL, NULL, NULL);
INSERT INTO `series` VALUES (24, '悬疑推理', '烧脑悬疑推理剧', 'https://example.com/cover3.jpg', 20, '2025-07-30 14:14:43', '2025-07-31 14:22:27', 8.8, 8000, 'on-going', '更新到第8集', 8, 0, 3, NULL, NULL, NULL);
INSERT INTO `series` VALUES (25, '白衣天使', '医院生活剧', 'https://example.com/medical1.jpg', 26, '2025-07-30 14:14:46', '2025-07-31 14:22:27', 8.8, 13000, 'on-going', '更新到第18集', 18, 0, 13, NULL, NULL, NULL);
INSERT INTO `series` VALUES (26, '大学时光', '大学校园故事', 'https://example.com/campus1.jpg', 22, '2025-07-30 14:14:46', '2025-07-31 14:22:27', 8.4, 8500, 'completed', '全集', 22, 0, 14, NULL, NULL, NULL);
INSERT INTO `series` VALUES (27, '职场风云', '商战职场剧', 'https://example.com/office1.jpg', 34, '2025-07-30 14:14:46', '2025-07-31 14:22:27', 8.7, 14000, 'on-going', '更新到第25集', 25, 0, 15, NULL, NULL, NULL);
INSERT INTO `series` VALUES (28, '江湖侠客', '武侠江湖传说', 'https://example.com/wuxia1.jpg', 38, '2025-07-30 14:14:46', '2025-07-31 14:22:27', 9, 17000, 'completed', '全集', 38, 0, 16, NULL, NULL, NULL);
INSERT INTO `series` VALUES (29, '都市夜生活', '现代都市群像', 'https://example.com/urban1.jpg', 20, '2025-07-30 14:14:46', '2025-07-31 14:22:27', 8.2, 7000, 'on-going', '更新到第12集', 12, 0, 1, NULL, NULL, NULL);
INSERT INTO `series` VALUES (30, '宫廷秘史', '清朝宫廷剧', 'https://example.com/palace1.jpg', 42, '2025-07-30 14:14:46', '2025-07-31 14:22:27', 8.9, 19000, 'completed', '全集', 42, 0, 2, NULL, NULL, NULL);
INSERT INTO `series` VALUES (31, '推理大师', '侦探推理剧', 'https://example.com/detective1.jpg', 16, '2025-07-30 14:14:46', '2025-07-31 14:22:27', 9.3, 21000, 'completed', '全集', 16, 0, 3, NULL, NULL, NULL);
INSERT INTO `series` VALUES (32, '浪漫爱情', '现代爱情故事', 'https://example.com/romance1.jpg', 18, '2025-07-30 14:14:46', '2025-07-31 14:22:27', 8.5, 10500, 'on-going', '更新到第14集', 14, 0, 4, NULL, NULL, NULL);
INSERT INTO `series` VALUES (33, '爆笑生活', '都市喜剧', 'https://example.com/comedy1.jpg', 25, '2025-07-30 14:14:46', '2025-07-31 14:22:27', 8.1, 6500, 'on-going', '更新到第16集', 16, 0, 5, NULL, NULL, NULL);
INSERT INTO `series` VALUES (40, '都市爱情故事', '一部现代都市爱情剧', 'https://example.com/cover1.jpg', 24, '2025-07-31 14:21:24', '2025-07-31 14:22:27', 8.5, 10000, 'on-going', '更新到第12集', 12, 0, 1, NULL, NULL, NULL);
INSERT INTO `series` VALUES (41, '古装传奇', '古代宫廷传奇故事', 'https://example.com/cover2.jpg', 36, '2025-07-31 14:21:24', '2025-07-31 14:22:27', 9, 15000, 'completed', '全集', 36, 0, 2, NULL, NULL, NULL);
INSERT INTO `series` VALUES (42, '悬疑推理', '烧脑悬疑推理剧', 'https://example.com/cover3.jpg', 20, '2025-07-31 14:21:24', '2025-07-31 14:22:27', 8.8, 8000, 'on-going', '更新到第8集', 8, 0, 3, NULL, NULL, NULL);
INSERT INTO `series` VALUES (43, '白衣天使', '医院生活剧', 'https://example.com/medical1.jpg', 26, '2025-07-31 14:21:26', '2025-07-31 14:22:27', 8.8, 13000, 'on-going', '更新到第18集', 18, 0, 13, NULL, NULL, NULL);
INSERT INTO `series` VALUES (44, '大学时光', '大学校园故事', 'https://example.com/campus1.jpg', 22, '2025-07-31 14:21:26', '2025-07-31 14:22:27', 8.4, 8500, 'completed', '全集', 22, 0, 14, NULL, NULL, NULL);
INSERT INTO `series` VALUES (45, '职场风云', '商战职场剧', 'https://example.com/office1.jpg', 34, '2025-07-31 14:21:26', '2025-07-31 14:22:27', 8.7, 14000, 'on-going', '更新到第25集', 25, 0, 15, NULL, NULL, NULL);
INSERT INTO `series` VALUES (46, '江湖侠客', '武侠江湖传说', 'https://example.com/wuxia1.jpg', 38, '2025-07-31 14:21:26', '2025-07-31 14:22:27', 9, 17000, 'completed', '全集', 38, 0, 16, NULL, NULL, NULL);
INSERT INTO `series` VALUES (47, '都市夜生活', '现代都市群像', 'https://example.com/urban1.jpg', 20, '2025-07-31 14:21:26', '2025-07-31 14:22:27', 8.2, 7000, 'on-going', '更新到第12集', 12, 0, 1, NULL, NULL, NULL);
INSERT INTO `series` VALUES (48, '宫廷秘史', '清朝宫廷剧', 'https://example.com/palace1.jpg', 42, '2025-07-31 14:21:26', '2025-07-31 14:22:27', 8.9, 19000, 'completed', '全集', 42, 0, 2, NULL, NULL, NULL);
INSERT INTO `series` VALUES (49, '推理大师', '侦探推理剧', 'https://example.com/detective1.jpg', 16, '2025-07-31 14:21:26', '2025-07-31 14:22:27', 9.3, 21000, 'completed', '全集', 16, 0, 3, NULL, NULL, NULL);
INSERT INTO `series` VALUES (50, '浪漫爱情', '现代爱情故事', 'https://example.com/romance1.jpg', 18, '2025-07-31 14:21:26', '2025-07-31 14:22:27', 8.5, 10500, 'on-going', '更新到第14集', 14, 0, 4, NULL, NULL, NULL);
INSERT INTO `series` VALUES (51, '爆笑生活', '都市喜剧', 'https://example.com/comedy1.jpg', 25, '2025-07-31 14:21:26', '2025-07-31 14:22:27', 8.1, 6500, 'on-going', '更新到第16集', 16, 0, 5, NULL, NULL, NULL);

-- ----------------------------
-- Table structure for series_tags
-- ----------------------------
DROP TABLE IF EXISTS `series_tags`;
CREATE TABLE `series_tags`  (
  `series_id` int NOT NULL,
  `tag_id` int NOT NULL,
  PRIMARY KEY (`series_id`, `tag_id`) USING BTREE,
  INDEX `FK_series_tags_tag`(`tag_id` ASC) USING BTREE,
  CONSTRAINT `FK_series_tags_series` FOREIGN KEY (`series_id`) REFERENCES `series` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `FK_series_tags_tag` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of series_tags
-- ----------------------------
INSERT INTO `series_tags` VALUES (1, 1);
INSERT INTO `series_tags` VALUES (3, 2);
INSERT INTO `series_tags` VALUES (1, 3);
INSERT INTO `series_tags` VALUES (1, 4);
INSERT INTO `series_tags` VALUES (2, 5);
INSERT INTO `series_tags` VALUES (6, 7);
INSERT INTO `series_tags` VALUES (1, 8);
INSERT INTO `series_tags` VALUES (6, 8);
INSERT INTO `series_tags` VALUES (2, 9);
INSERT INTO `series_tags` VALUES (3, 21);
INSERT INTO `series_tags` VALUES (8, 21);
INSERT INTO `series_tags` VALUES (4, 22);
INSERT INTO `series_tags` VALUES (9, 22);
INSERT INTO `series_tags` VALUES (5, 23);
INSERT INTO `series_tags` VALUES (7, 24);
INSERT INTO `series_tags` VALUES (9, 25);
INSERT INTO `series_tags` VALUES (8, 26);
INSERT INTO `series_tags` VALUES (10, 27);
INSERT INTO `series_tags` VALUES (4, 29);
INSERT INTO `series_tags` VALUES (5, 30);

-- ----------------------------
-- Table structure for short_videos
-- ----------------------------
DROP TABLE IF EXISTS `short_videos`;
CREATE TABLE `short_videos`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `cover_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `video_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `duration` int NOT NULL DEFAULT 0,
  `play_count` int NOT NULL DEFAULT 0,
  `like_count` int NOT NULL DEFAULT 0,
  `platform_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '官方平台',
  `category_id` int NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `FK_short_videos_category`(`category_id` ASC) USING BTREE,
  CONSTRAINT `FK_short_videos_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 45 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of short_videos
-- ----------------------------
INSERT INTO `short_videos` VALUES (1, '搞笑短片1', '超级搞笑的短视频', 'https://example.com/short1.jpg', 'https://example.com/video1.mp4', 60, 5000, 200, '官方平台', 5, '2025-07-30 13:08:44');
INSERT INTO `short_videos` VALUES (2, '动作片段', '精彩动作场面', 'https://example.com/short2.jpg', 'https://example.com/video2.mp4', 90, 3000, 150, '官方平台', 6, '2025-07-30 13:08:44');
INSERT INTO `short_videos` VALUES (3, '搞笑短片1', '超级搞笑的短视频', 'https://example.com/short1.jpg', 'https://example.com/video1.mp4', 60, 5000, 200, '官方平台', 5, '2025-07-30 13:21:46');
INSERT INTO `short_videos` VALUES (4, '动作片段', '精彩动作场面', 'https://example.com/short2.jpg', 'https://example.com/video2.mp4', 90, 3000, 150, '官方平台', 6, '2025-07-30 13:21:46');
INSERT INTO `short_videos` VALUES (5, '都市生活片段', '现代都市生活记录', 'https://example.com/short_urban1.jpg', 'https://example.com/video_urban1.mp4', 45, 2500, 120, '官方平台', 1, '2025-07-30 13:21:50');
INSERT INTO `short_videos` VALUES (6, '古风舞蹈', '传统古典舞蹈表演', 'https://example.com/short_dance1.jpg', 'https://example.com/video_dance1.mp4', 180, 8000, 400, '官方平台', 2, '2025-07-30 13:21:50');
INSERT INTO `short_videos` VALUES (7, '悬疑短片', '3分钟悬疑故事', 'https://example.com/short_mystery1.jpg', 'https://example.com/video_mystery1.mp4', 180, 6000, 300, '官方平台', 3, '2025-07-30 13:21:50');
INSERT INTO `short_videos` VALUES (8, '爱情微电影', '浪漫爱情短片', 'https://example.com/short_love1.jpg', 'https://example.com/video_love1.mp4', 300, 12000, 600, '官方平台', 4, '2025-07-30 13:21:50');
INSERT INTO `short_videos` VALUES (9, '搞笑段子', '爆笑生活片段', 'https://example.com/short_funny1.jpg', 'https://example.com/video_funny1.mp4', 30, 15000, 800, '官方平台', 5, '2025-07-30 13:21:50');
INSERT INTO `short_videos` VALUES (10, '动作特技', '精彩动作镜头', 'https://example.com/short_action1.jpg', 'https://example.com/video_action1.mp4', 120, 7000, 350, '官方平台', 6, '2025-07-30 13:21:50');
INSERT INTO `short_videos` VALUES (11, '职场励志', '职场正能量', 'https://example.com/short_office1.jpg', 'https://example.com/video_office1.mp4', 180, 4500, 220, '官方平台', 15, '2025-07-30 13:21:50');
INSERT INTO `short_videos` VALUES (12, '武侠片段', '武侠动作场面', 'https://example.com/short_wuxia1.jpg', 'https://example.com/video_wuxia1.mp4', 120, 6500, 320, '官方平台', 16, '2025-07-30 13:21:50');
INSERT INTO `short_videos` VALUES (17, '搞笑短片1', '超级搞笑的短视频', 'https://example.com/short1.jpg', 'https://example.com/video1.mp4', 60, 5000, 200, '官方平台', 5, '2025-07-30 14:14:44');
INSERT INTO `short_videos` VALUES (18, '动作片段', '精彩动作场面', 'https://example.com/short2.jpg', 'https://example.com/video2.mp4', 90, 3000, 150, '官方平台', 6, '2025-07-30 14:14:44');
INSERT INTO `short_videos` VALUES (19, '都市生活片段', '现代都市生活记录', 'https://example.com/short_urban1.jpg', 'https://example.com/video_urban1.mp4', 45, 2500, 120, '官方平台', 1, '2025-07-30 14:14:47');
INSERT INTO `short_videos` VALUES (20, '古风舞蹈', '传统古典舞蹈表演', 'https://example.com/short_dance1.jpg', 'https://example.com/video_dance1.mp4', 180, 8000, 400, '官方平台', 2, '2025-07-30 14:14:47');
INSERT INTO `short_videos` VALUES (21, '悬疑短片', '3分钟悬疑故事', 'https://example.com/short_mystery1.jpg', 'https://example.com/video_mystery1.mp4', 180, 6000, 300, '官方平台', 3, '2025-07-30 14:14:47');
INSERT INTO `short_videos` VALUES (22, '爱情微电影', '浪漫爱情短片', 'https://example.com/short_love1.jpg', 'https://example.com/video_love1.mp4', 300, 12000, 600, '官方平台', 4, '2025-07-30 14:14:47');
INSERT INTO `short_videos` VALUES (23, '搞笑段子', '爆笑生活片段', 'https://example.com/short_funny1.jpg', 'https://example.com/video_funny1.mp4', 30, 15000, 800, '官方平台', 5, '2025-07-30 14:14:47');
INSERT INTO `short_videos` VALUES (24, '动作特技', '精彩动作镜头', 'https://example.com/short_action1.jpg', 'https://example.com/video_action1.mp4', 120, 7000, 350, '官方平台', 6, '2025-07-30 14:14:47');
INSERT INTO `short_videos` VALUES (25, '职场励志', '职场正能量', 'https://example.com/short_office1.jpg', 'https://example.com/video_office1.mp4', 180, 4500, 220, '官方平台', 15, '2025-07-30 14:14:47');
INSERT INTO `short_videos` VALUES (26, '武侠片段', '武侠动作场面', 'https://example.com/short_wuxia1.jpg', 'https://example.com/video_wuxia1.mp4', 120, 6500, 320, '官方平台', 16, '2025-07-30 14:14:47');
INSERT INTO `short_videos` VALUES (31, '搞笑短片1', '超级搞笑的短视频', 'https://example.com/short1.jpg', 'https://example.com/video1.mp4', 60, 5000, 200, '官方平台', 5, '2025-07-31 14:21:24');
INSERT INTO `short_videos` VALUES (32, '动作片段', '精彩动作场面', 'https://example.com/short2.jpg', 'https://example.com/video2.mp4', 90, 3000, 150, '官方平台', 6, '2025-07-31 14:21:24');
INSERT INTO `short_videos` VALUES (33, '都市生活片段', '现代都市生活记录', 'https://example.com/short_urban1.jpg', 'https://example.com/video_urban1.mp4', 45, 2500, 120, '官方平台', 1, '2025-07-31 14:21:27');
INSERT INTO `short_videos` VALUES (34, '古风舞蹈', '传统古典舞蹈表演', 'https://example.com/short_dance1.jpg', 'https://example.com/video_dance1.mp4', 180, 8000, 400, '官方平台', 2, '2025-07-31 14:21:27');
INSERT INTO `short_videos` VALUES (35, '悬疑短片', '3分钟悬疑故事', 'https://example.com/short_mystery1.jpg', 'https://example.com/video_mystery1.mp4', 180, 6000, 300, '官方平台', 3, '2025-07-31 14:21:27');
INSERT INTO `short_videos` VALUES (36, '爱情微电影', '浪漫爱情短片', 'https://example.com/short_love1.jpg', 'https://example.com/video_love1.mp4', 300, 12000, 600, '官方平台', 4, '2025-07-31 14:21:27');
INSERT INTO `short_videos` VALUES (37, '搞笑段子', '爆笑生活片段', 'https://example.com/short_funny1.jpg', 'https://example.com/video_funny1.mp4', 30, 15000, 800, '官方平台', 5, '2025-07-31 14:21:27');
INSERT INTO `short_videos` VALUES (38, '动作特技', '精彩动作镜头', 'https://example.com/short_action1.jpg', 'https://example.com/video_action1.mp4', 120, 7000, 350, '官方平台', 6, '2025-07-31 14:21:27');
INSERT INTO `short_videos` VALUES (39, '职场励志', '职场正能量', 'https://example.com/short_office1.jpg', 'https://example.com/video_office1.mp4', 180, 4500, 220, '官方平台', 15, '2025-07-31 14:21:27');
INSERT INTO `short_videos` VALUES (40, '武侠片段', '武侠动作场面', 'https://example.com/short_wuxia1.jpg', 'https://example.com/video_wuxia1.mp4', 120, 6500, 320, '官方平台', 16, '2025-07-31 14:21:27');

-- ----------------------------
-- Table structure for tags
-- ----------------------------
DROP TABLE IF EXISTS `tags`;
CREATE TABLE `tags`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'content_type' COMMENT '标签类型：video_meta（最新上传、年份、连载）、content_type（类型、地区、语言）',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `UK_tags_name`(`name` ASC) USING BTREE,
  INDEX `idx_type`(`type` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 86 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of tags
-- ----------------------------
INSERT INTO `tags` VALUES (1, '2025热映', 'video_meta');
INSERT INTO `tags` VALUES (2, '悬疑', 'content_type');
INSERT INTO `tags` VALUES (3, '都市', 'content_type');
INSERT INTO `tags` VALUES (4, '爱情', 'content_type');
INSERT INTO `tags` VALUES (5, '古装', 'content_type');
INSERT INTO `tags` VALUES (6, '喜剧', 'content_type');
INSERT INTO `tags` VALUES (7, '动作', 'content_type');
INSERT INTO `tags` VALUES (8, '热门', 'content_type');
INSERT INTO `tags` VALUES (9, '推荐', 'content_type');
INSERT INTO `tags` VALUES (10, '新剧', 'content_type');
INSERT INTO `tags` VALUES (21, '高分推荐', 'content_type');
INSERT INTO `tags` VALUES (22, '经典重温', 'content_type');
INSERT INTO `tags` VALUES (23, '新人演员', 'content_type');
INSERT INTO `tags` VALUES (24, '大制作', 'content_type');
INSERT INTO `tags` VALUES (25, '小成本', 'content_type');
INSERT INTO `tags` VALUES (26, '网络热播', 'content_type');
INSERT INTO `tags` VALUES (27, '口碑佳作', 'content_type');
INSERT INTO `tags` VALUES (28, '话题之作', 'content_type');
INSERT INTO `tags` VALUES (29, '年度必看', 'content_type');
INSERT INTO `tags` VALUES (30, '青春校园', 'content_type');
INSERT INTO `tags` VALUES (31, '职场励志', 'content_type');
INSERT INTO `tags` VALUES (32, '家庭温情', 'content_type');
INSERT INTO `tags` VALUES (33, '武侠江湖', 'content_type');
INSERT INTO `tags` VALUES (34, '科幻未来', 'content_type');
INSERT INTO `tags` VALUES (35, '历史传奇', 'content_type');

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` bigint NOT NULL,
  `first_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `UK_users_username`(`username` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES (1001, '张', '三', 'zhangsan', 1, '2025-07-30 13:21:50');
INSERT INTO `users` VALUES (1002, '李', '四', 'lisi', 1, '2025-07-30 13:21:50');
INSERT INTO `users` VALUES (1003, '王', '五', 'wangwu', 1, '2025-07-30 13:21:50');
INSERT INTO `users` VALUES (1004, '赵', '六', 'zhaoliu', 1, '2025-07-30 13:21:50');
INSERT INTO `users` VALUES (1005, '钱', '七', 'qianqi', 1, '2025-07-30 13:21:50');
INSERT INTO `users` VALUES (1006, '孙', '八', 'sunba', 1, '2025-07-30 13:21:50');
INSERT INTO `users` VALUES (1007, '周', '九', 'zhoujiu', 1, '2025-07-30 13:21:50');
INSERT INTO `users` VALUES (1008, '吴', '十', 'wushi', 1, '2025-07-30 13:21:50');
INSERT INTO `users` VALUES (1009, '郑', '一', 'zhengyi', 1, '2025-07-30 13:21:50');
INSERT INTO `users` VALUES (1010, '冯', '二', 'fenger', 1, '2025-07-30 13:21:50');
INSERT INTO `users` VALUES (1011, 'John', 'Doe', 'johndoe', 1, '2025-07-30 13:21:50');
INSERT INTO `users` VALUES (1012, 'Jane', 'Smith', 'janesmith', 1, '2025-07-30 13:21:50');
INSERT INTO `users` VALUES (1013, 'Mike', 'Johnson', 'mikejohnson', 1, '2025-07-30 13:21:50');
INSERT INTO `users` VALUES (1014, 'Sarah', 'Wilson', 'sarahwilson', 1, '2025-07-30 13:21:50');
INSERT INTO `users` VALUES (1015, 'David', 'Brown', 'davidbrown', 1, '2025-07-30 13:21:50');
INSERT INTO `users` VALUES (7845078844, '西', '陈', 'dinghe987', 1, '2025-07-30 14:32:42');

-- ----------------------------
-- Table structure for watch_progress
-- ----------------------------
DROP TABLE IF EXISTS `watch_progress`;
CREATE TABLE `watch_progress`  (
  `user_id` bigint NOT NULL,
  `episode_id` int NOT NULL,
  `stop_at_second` int NOT NULL DEFAULT 0,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `episode_id`) USING BTREE,
  INDEX `FK_watch_progress_episode`(`episode_id` ASC) USING BTREE,
  CONSTRAINT `FK_watch_progress_episode` FOREIGN KEY (`episode_id`) REFERENCES `episodes` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `FK_watch_progress_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of watch_progress
-- ----------------------------
INSERT INTO `watch_progress` VALUES (1001, 1, 1200, '2025-07-30 13:21:51');
INSERT INTO `watch_progress` VALUES (1001, 2, 800, '2025-07-30 13:21:51');
INSERT INTO `watch_progress` VALUES (1002, 1, 2400, '2025-07-30 13:21:51');
INSERT INTO `watch_progress` VALUES (1002, 2, 1500, '2025-07-30 13:21:51');
INSERT INTO `watch_progress` VALUES (1002, 3, 600, '2025-07-30 13:21:51');
INSERT INTO `watch_progress` VALUES (1003, 1, 2000, '2025-07-30 13:21:51');
INSERT INTO `watch_progress` VALUES (1003, 6, 1800, '2025-07-30 13:21:51');
INSERT INTO `watch_progress` VALUES (1004, 7, 1200, '2025-07-30 13:21:51');
INSERT INTO `watch_progress` VALUES (1005, 8, 900, '2025-07-30 13:21:51');
INSERT INTO `watch_progress` VALUES (1006, 9, 1500, '2025-07-30 13:21:51');
INSERT INTO `watch_progress` VALUES (1007, 10, 2100, '2025-07-30 13:21:51');
INSERT INTO `watch_progress` VALUES (1008, 11, 800, '2025-07-30 13:21:51');
INSERT INTO `watch_progress` VALUES (1009, 1, 300, '2025-07-30 13:21:51');
INSERT INTO `watch_progress` VALUES (1010, 2, 1800, '2025-07-30 13:21:51');
INSERT INTO `watch_progress` VALUES (1011, 3, 2200, '2025-07-30 13:21:51');
INSERT INTO `watch_progress` VALUES (1012, 4, 1000, '2025-07-30 13:21:51');
INSERT INTO `watch_progress` VALUES (1013, 5, 1600, '2025-07-30 13:21:51');
INSERT INTO `watch_progress` VALUES (1014, 6, 2000, '2025-07-30 13:21:51');
INSERT INTO `watch_progress` VALUES (1015, 7, 1400, '2025-07-30 13:21:51');

-- ----------------------------
-- Event structure for cleanup_expired_refresh_tokens
-- ----------------------------
DROP EVENT IF EXISTS `cleanup_expired_refresh_tokens`;
delimiter ;;
CREATE EVENT `cleanup_expired_refresh_tokens`
ON SCHEDULE
EVERY '1' DAY STARTS '2025-07-30 14:14:51'
DO BEGIN
  -- 删除过期超过7天的refresh token
  DELETE FROM refresh_tokens 
  WHERE expires_at < DATE_SUB(NOW(), INTERVAL 7 DAY);
  
  -- 删除已撤销超过30天的refresh token
  DELETE FROM refresh_tokens 
  WHERE is_revoked = 1 AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
END
;;
delimiter ;

SET FOREIGN_KEY_CHECKS = 1;
