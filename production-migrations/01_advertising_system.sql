-- 广告投放计划管理系统数据库迁移
-- 创建时间: 2024-11-15
-- 执行环境: 生产环境

-- 设置字符集确保中文正确显示
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 1. 创建广告投放平台表
CREATE TABLE IF NOT EXISTS advertising_platforms (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '平台名称',
  code VARCHAR(50) UNIQUE NOT NULL COMMENT '平台代码（用于生成campaign_code）',
  description TEXT COMMENT '平台描述',
  icon_url VARCHAR(500) COMMENT '平台图标URL',
  color VARCHAR(20) DEFAULT '#1890ff' COMMENT '平台主题色',
  
  -- 平台配置
  is_enabled BOOLEAN DEFAULT true COMMENT '是否启用',
  sort_order INT DEFAULT 0 COMMENT '排序权重',
  
  -- 平台特有配置（JSON格式）
  config JSON COMMENT '平台特有配置信息',
  
  -- 元数据
  created_by VARCHAR(100) COMMENT '创建人',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_code (code),
  INDEX idx_enabled (is_enabled),
  INDEX idx_sort_order (sort_order),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 创建广告投放计划表
CREATE TABLE IF NOT EXISTS advertising_campaigns (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL COMMENT '计划名称',
  description TEXT COMMENT '计划描述',
  platform_id BIGINT NOT NULL COMMENT '投放平台ID',
  platform_code VARCHAR(50) NOT NULL COMMENT '平台代码（冗余字段，便于查询）',
  campaign_code VARCHAR(50) UNIQUE NOT NULL COMMENT '计划唯一标识码',
  target_url TEXT NOT NULL COMMENT '目标落地页URL',
  
  -- 投放设置
  budget DECIMAL(10,2) COMMENT '预算金额',
  target_clicks INT COMMENT '目标点击量',
  target_conversions INT COMMENT '目标转化量',
  
  -- 时间设置
  start_date DATETIME NOT NULL COMMENT '开始时间',
  end_date DATETIME COMMENT '结束时间',
  
  -- 状态管理
  status ENUM('draft', 'active', 'paused', 'completed', 'cancelled') DEFAULT 'draft' COMMENT '状态',
  is_active BOOLEAN DEFAULT true COMMENT '是否活跃',
  
  -- 元数据
  created_by VARCHAR(100) COMMENT '创建人',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (platform_id) REFERENCES advertising_platforms(id) ON DELETE RESTRICT,
  INDEX idx_platform_id (platform_id),
  INDEX idx_platform_code (platform_code),
  INDEX idx_campaign_code (campaign_code),
  INDEX idx_status (status),
  INDEX idx_date_range (start_date, end_date),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 创建广告事件追踪表
CREATE TABLE IF NOT EXISTS advertising_events (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  campaign_id BIGINT NOT NULL COMMENT '投放计划ID',
  campaign_code VARCHAR(50) NOT NULL COMMENT '计划代码',
  event_type ENUM('click', 'view', 'register', 'login', 'play', 'share') NOT NULL COMMENT '事件类型',
  event_data JSON COMMENT '事件详细数据',
  
  -- 用户标识
  user_id BIGINT COMMENT '用户ID（如果已注册）',
  session_id VARCHAR(100) COMMENT '会话ID',
  device_id VARCHAR(100) COMMENT '设备唯一标识',
  
  -- 来源信息
  referrer TEXT COMMENT '来源页面',
  user_agent TEXT COMMENT '用户代理',
  ip_address VARCHAR(45) COMMENT 'IP地址',
  
  -- 地理位置
  country VARCHAR(100) COMMENT '国家',
  region VARCHAR(100) COMMENT '地区',
  city VARCHAR(100) COMMENT '城市',
  
  -- 时间戳
  event_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '事件时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (campaign_id) REFERENCES advertising_campaigns(id) ON DELETE CASCADE,
  INDEX idx_campaign_id (campaign_id),
  INDEX idx_campaign_code (campaign_code),
  INDEX idx_event_type (event_type),
  INDEX idx_event_time (event_time),
  INDEX idx_user_id (user_id),
  INDEX idx_session_id (session_id),
  INDEX idx_device_id (device_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 创建广告转化追踪表
CREATE TABLE IF NOT EXISTS advertising_conversions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  campaign_id BIGINT NOT NULL COMMENT '投放计划ID',
  campaign_code VARCHAR(50) NOT NULL COMMENT '计划代码',
  conversion_type ENUM('register', 'first_play', 'subscription', 'purchase') NOT NULL COMMENT '转化类型',
  conversion_value DECIMAL(10,2) COMMENT '转化价值',
  
  -- 用户信息
  user_id BIGINT NOT NULL COMMENT '用户ID',
  session_id VARCHAR(100) COMMENT '会话ID',
  device_id VARCHAR(100) COMMENT '设备ID',
  
  -- 归因信息
  first_click_time TIMESTAMP COMMENT '首次点击时间',
  conversion_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '转化时间',
  time_to_conversion INT COMMENT '转化耗时（秒）',
  attribution_model VARCHAR(50) DEFAULT 'last_click' COMMENT '归因模型',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (campaign_id) REFERENCES advertising_campaigns(id) ON DELETE CASCADE,
  INDEX idx_campaign_id (campaign_id),
  INDEX idx_campaign_code (campaign_code),
  INDEX idx_conversion_type (conversion_type),
  INDEX idx_user_id (user_id),
  INDEX idx_conversion_time (conversion_time),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. 创建广告计划统计表
CREATE TABLE IF NOT EXISTS advertising_campaign_stats (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  campaign_id BIGINT NOT NULL COMMENT '投放计划ID',
  stat_date DATE NOT NULL COMMENT '统计日期',
  
  -- 基础指标
  total_clicks INT DEFAULT 0 COMMENT '总点击量',
  total_views INT DEFAULT 0 COMMENT '总浏览量',
  total_conversions INT DEFAULT 0 COMMENT '总转化量',
  
  -- 计算指标
  conversion_rate DECIMAL(5,4) DEFAULT 0 COMMENT '转化率',
  cost DECIMAL(10,2) DEFAULT 0 COMMENT '花费',
  cpc DECIMAL(10,2) DEFAULT 0 COMMENT '单次点击成本',
  cpa DECIMAL(10,2) DEFAULT 0 COMMENT '单次获客成本',
  
  -- 用户指标
  new_users INT DEFAULT 0 COMMENT '新用户数',
  returning_users INT DEFAULT 0 COMMENT '回访用户数',
  
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (campaign_id) REFERENCES advertising_campaigns(id) ON DELETE CASCADE,
  UNIQUE KEY uk_campaign_date (campaign_id, stat_date),
  INDEX idx_stat_date (stat_date),
  INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. 设置字符集并插入默认平台数据
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT IGNORE INTO advertising_platforms (name, code, description, color, sort_order, is_enabled) VALUES
('抖音', 'tiktok', '抖音短视频平台', '#ff0050', 1, true),
('微信', 'wechat', '微信生态平台', '#07c160', 2, true),
('百度', 'baidu', '百度搜索引擎', '#2932e1', 3, true),
('Google', 'google', 'Google广告平台', '#4285f4', 4, true),
('微博', 'weibo', '新浪微博平台', '#e6162d', 5, true),
('小红书', 'xiaohongshu', '小红书种草平台', '#ff2442', 6, true),
('快手', 'kuaishou', '快手短视频平台', '#ff6600', 7, true);

-- 7. 为高频查询添加复合索引
CREATE INDEX idx_events_campaign_time ON advertising_events(campaign_id, event_time);
CREATE INDEX idx_events_session_time ON advertising_events(session_id, event_time);
CREATE INDEX idx_conversions_campaign_time ON advertising_conversions(campaign_id, conversion_time);

-- 8. 为统计查询添加覆盖索引
CREATE INDEX idx_events_stats ON advertising_events(campaign_id, event_type, event_time);
CREATE INDEX idx_conversions_stats ON advertising_conversions(campaign_id, conversion_type, conversion_time);
