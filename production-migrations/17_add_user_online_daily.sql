-- 用户每日在线时长记录表
-- 用于心跳上报统计，支持 DAU/WAU/MAU 精确计算
-- 2026-06-23

CREATE TABLE IF NOT EXISTS user_online_daily (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  date DATE NOT NULL,
  duration INT NOT NULL DEFAULT 0 COMMENT '在线时长（秒），每次心跳累加60',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_date (user_id, date),
  INDEX idx_date (date),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户每日在线时长（心跳统计）';
