-- migrations/add_episode_reactions.sql
-- 创建用户对剧集的点赞/点踩记录表

CREATE TABLE IF NOT EXISTS `episode_reactions` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `episode_id` INT NOT NULL COMMENT '剧集ID',
  `reaction_type` VARCHAR(20) NOT NULL COMMENT '反应类型：like=点赞, dislike=点踩',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_episode_id` (`episode_id`),
  INDEX `idx_reaction_type` (`reaction_type`),
  UNIQUE INDEX `idx_user_episode` (`user_id`, `episode_id`),
  
  CONSTRAINT `fk_reaction_user` 
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) 
    ON DELETE CASCADE,
  CONSTRAINT `fk_reaction_episode` 
    FOREIGN KEY (`episode_id`) REFERENCES `episodes` (`id`) 
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户对剧集的点赞点踩记录表';

