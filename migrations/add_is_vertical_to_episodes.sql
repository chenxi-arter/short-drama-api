-- 添加 is_vertical 字段到 episodes 表
-- 用于标识视频是横屏（false）还是竖屏（true）播放

ALTER TABLE `episodes`
ADD COLUMN `is_vertical` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否竖屏播放（0=横屏，1=竖屏）' AFTER `status`;

-- 为字段添加索引（可选，如果需要按播放方向筛选）
-- CREATE INDEX `idx_is_vertical` ON `episodes` (`is_vertical`);

-- 示例：更新某些剧集为竖屏
-- UPDATE `episodes` SET `is_vertical` = 1 WHERE `id` IN (1, 2, 3);
