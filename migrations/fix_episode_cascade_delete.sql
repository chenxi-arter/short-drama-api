-- 修复Episode相关表的级联删除问题
-- 解决删除episode时的外键约束错误

-- 1. 修改 episode_urls 表的外键约束为级联删除
ALTER TABLE episode_urls DROP FOREIGN KEY FK_cd7538592624868a77732a822d2;
ALTER TABLE episode_urls 
ADD CONSTRAINT FK_cd7538592624868a77732a822d2 
FOREIGN KEY (episode_id) REFERENCES episodes(id) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. 检查并修改 watch_progress 表的外键约束（如果存在）
-- 查看现有外键约束
-- SHOW CREATE TABLE watch_progress;

-- 如果 watch_progress 表也有类似问题，取消注释下面的语句：
-- ALTER TABLE watch_progress DROP FOREIGN KEY FK_watch_progress_episode_id;
-- ALTER TABLE watch_progress 
-- ADD CONSTRAINT FK_watch_progress_episode_id 
-- FOREIGN KEY (episode_id) REFERENCES episodes(id) 
-- ON DELETE CASCADE ON UPDATE CASCADE;

-- 3. 检查其他可能相关的表（episode_reactions等）
-- 如果有其他表引用episodes，也需要类似处理

-- 现在可以安全删除episode了，相关数据会自动级联删除
