-- 删除 browse_history 表中的 duration_seconds 字段
-- 观看进度应该从 watch_progress 表获取，不需要在浏览历史中重复记录

ALTER TABLE `browse_history` DROP COLUMN `duration_seconds`;

-- 添加注释说明
ALTER TABLE `browse_history` COMMENT = '用户浏览历史记录表 - 记录用户浏览行为，观看进度请查询 watch_progress 表';
