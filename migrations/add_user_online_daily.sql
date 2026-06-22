-- 用户每日在线时长记录表
-- 2026-06-22

CREATE TABLE IF NOT EXISTS user_online_daily (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  date DATE NOT NULL,
  duration INT NOT NULL DEFAULT 0 COMMENT '在线时长（秒）',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_date (user_id, date),
  INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户每日在线时长';
