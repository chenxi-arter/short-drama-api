-- 修复 watch_progress 表的外键约束
-- 解决删除episode时watch_progress表的外键约束问题

ALTER TABLE watch_progress DROP FOREIGN KEY FK_677f8579d5e79b6c77dce357160;
ALTER TABLE watch_progress 
ADD CONSTRAINT FK_677f8579d5e79b6c77dce357160 
FOREIGN KEY (episode_id) REFERENCES episodes(id) 
ON DELETE CASCADE ON UPDATE CASCADE;
