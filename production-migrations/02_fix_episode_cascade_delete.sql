-- 修复Episode相关表的级联删除问题
-- 解决删除episode时的外键约束错误

-- 1. 修改 episode_urls 表的外键约束为级联删除
ALTER TABLE episode_urls DROP FOREIGN KEY FK_cd7538592624868a77732a822d2;
ALTER TABLE episode_urls 
ADD CONSTRAINT FK_cd7538592624868a77732a822d2 
FOREIGN KEY (episode_id) REFERENCES episodes(id) 
ON DELETE CASCADE ON UPDATE CASCADE;
