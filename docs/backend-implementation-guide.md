# 广告投放计划管理系统 - 后端实现指南

## 📋 项目概述

为支持多平台广告投放和效果追踪，需要在现有后端系统中新增广告投放计划管理功能。本文档提供完整的后端实现指南。

## 🗄️ 数据库设计

### 1. 广告投放平台表 (advertising_platforms)

```sql
CREATE TABLE advertising_platforms (
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

-- 插入默认平台数据
INSERT INTO advertising_platforms (name, code, description, color, sort_order, is_enabled) VALUES
('抖音', 'tiktok', '抖音短视频平台', '#ff0050', 1, true),
('微信', 'wechat', '微信生态平台', '#07c160', 2, true),
('百度', 'baidu', '百度搜索引擎', '#2932e1', 3, true),
('Google', 'google', 'Google广告平台', '#4285f4', 4, true),
('微博', 'weibo', '新浪微博平台', '#e6162d', 5, true),
('小红书', 'xiaohongshu', '小红书种草平台', '#ff2442', 6, true),
('快手', 'kuaishou', '快手短视频平台', '#ff6600', 7, true);
```

### 2. 广告投放计划表 (advertising_campaigns)

```sql
CREATE TABLE advertising_campaigns (
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
  status ENUM('draft', 'active', 'paused', 'completed', 'cancelled') DEFAULT 'draft',
  is_active BOOLEAN DEFAULT true,
  
  -- 元数据
  created_by VARCHAR(100) COMMENT '创建人',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (platform_id) REFERENCES advertising_platforms(id),
  INDEX idx_platform_id (platform_id),
  INDEX idx_platform_code (platform_code),
  INDEX idx_status (status),
  INDEX idx_campaign_code (campaign_code),
  INDEX idx_date_range (start_date, end_date),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. 广告事件追踪表 (advertising_events)

```sql
CREATE TABLE advertising_events (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  campaign_id BIGINT NOT NULL,
  campaign_code VARCHAR(50) NOT NULL,
  
  -- 事件信息
  event_type ENUM('click', 'view', 'register', 'login', 'play', 'share') NOT NULL,
  event_data JSON COMMENT '事件详细数据',
  
  -- 用户信息
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
  event_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (campaign_id) REFERENCES advertising_campaigns(id) ON DELETE CASCADE,
  INDEX idx_campaign (campaign_id),
  INDEX idx_campaign_code (campaign_code),
  INDEX idx_event_type (event_type),
  INDEX idx_event_time (event_time),
  INDEX idx_user_id (user_id),
  INDEX idx_session_id (session_id),
  INDEX idx_device_id (device_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3. 广告转化追踪表 (advertising_conversions)

```sql
CREATE TABLE advertising_conversions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  campaign_id BIGINT NOT NULL,
  campaign_code VARCHAR(50) NOT NULL,
  
  -- 转化信息
  conversion_type ENUM('register', 'first_play', 'subscription', 'purchase') NOT NULL,
  conversion_value DECIMAL(10,2) COMMENT '转化价值',
  
  -- 用户信息
  user_id BIGINT NOT NULL,
  session_id VARCHAR(100),
  device_id VARCHAR(100),
  
  -- 转化路径
  first_click_time TIMESTAMP COMMENT '首次点击时间',
  conversion_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  time_to_conversion INT COMMENT '转化耗时（秒）',
  
  -- 归因信息
  attribution_model VARCHAR(50) DEFAULT 'last_click' COMMENT '归因模型',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (campaign_id) REFERENCES advertising_campaigns(id) ON DELETE CASCADE,
  INDEX idx_campaign (campaign_id),
  INDEX idx_campaign_code (campaign_code),
  INDEX idx_conversion_type (conversion_type),
  INDEX idx_user_id (user_id),
  INDEX idx_conversion_time (conversion_time),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 4. 广告统计缓存表 (advertising_campaign_stats)

```sql
CREATE TABLE advertising_campaign_stats (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  campaign_id BIGINT NOT NULL,
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
```

## 🔌 API 接口实现

### 1. 平台管理接口

#### 1.1 获取平台列表

```http
GET /api/admin/advertising/platforms
```

**请求参数：**
```json
{
  "enabled": true  // 可选，是否只返回启用的平台
}
```

**响应格式：**
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "name": "抖音",
      "code": "tiktok",
      "description": "抖音短视频平台",
      "iconUrl": "https://example.com/icons/tiktok.png",
      "color": "#ff0050",
      "isEnabled": true,
      "sortOrder": 1,
      "config": {
        "maxBudget": 100000,
        "supportedFormats": ["video", "image"]
      },
      "createdAt": "2024-11-15T10:00:00Z",
      "updatedAt": "2024-11-15T10:00:00Z"
    }
  ]
}
```

#### 1.2 创建平台

```http
POST /api/admin/advertising/platforms
```

**请求体：**
```json
{
  "name": "新平台",
  "code": "new_platform",
  "description": "新平台描述",
  "iconUrl": "https://example.com/icon.png",
  "color": "#1890ff",
  "config": {
    "maxBudget": 50000,
    "supportedFormats": ["image"]
  }
}
```

#### 1.3 更新平台

```http
PUT /api/admin/advertising/platforms/{id}
```

#### 1.4 删除平台

```http
DELETE /api/admin/advertising/platforms/{id}
```

**注意：** 删除平台前需要检查是否有关联的投放计划

#### 1.5 更新平台状态

```http
PUT /api/admin/advertising/platforms/{id}/status
```

**请求体：**
```json
{
  "isEnabled": false
}
```

#### 1.6 更新平台排序

```http
PUT /api/admin/advertising/platforms/sort
```

**请求体：**
```json
{
  "platforms": [
    {"id": 1, "sortOrder": 1},
    {"id": 2, "sortOrder": 2}
  ]
}
```

### 2. 投放计划管理接口

#### 1.1 获取投放计划列表

```http
GET /api/admin/advertising/campaigns
```

**请求参数：**
```json
{
  "page": 1,
  "size": 20,
  "platform": "tiktok",
  "status": "active",
  "keyword": "搜索关键词",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}
```

**响应格式：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "抖音推广计划001",
        "description": "针对年轻用户的短剧推广",
        "platform": "tiktok",
        "campaignCode": "TK001_20241115",
        "targetUrl": "https://m.xgshort.com/",
        "budget": 10000.00,
        "targetClicks": 50000,
        "targetConversions": 1000,
        "startDate": "2024-11-15T00:00:00Z",
        "endDate": "2024-12-15T23:59:59Z",
        "status": "active",
        "isActive": true,
        "stats": {
          "totalClicks": 12500,
          "totalViews": 45000,
          "totalConversions": 250,
          "conversionRate": 0.02,
          "cost": 2500.00,
          "cpc": 0.20,
          "cpa": 10.00
        },
        "createdBy": "admin",
        "createdAt": "2024-11-15T10:00:00Z",
        "updatedAt": "2024-11-15T10:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "size": 20
  }
}
```

#### 1.2 创建投放计划

```http
POST /api/admin/advertising/campaigns
```

**请求体：**
```json
{
  "name": "抖音推广计划001",
  "description": "针对年轻用户的短剧推广",
  "platform": "tiktok",
  "targetUrl": "https://m.xgshort.com/",
  "budget": 10000.00,
  "targetClicks": 50000,
  "targetConversions": 1000,
  "startDate": "2024-11-15T00:00:00Z",
  "endDate": "2024-12-15T23:59:59Z"
}
```

**实现要点：**
- 自动生成唯一的 `campaign_code`（建议格式：`{PLATFORM}_{YYYYMMDD}_{RANDOM}`）
- 验证 `targetUrl` 格式
- 验证时间范围（开始时间不能早于当前时间）
- 记录创建人信息

#### 1.3 更新投放计划

```http
PUT /api/admin/advertising/campaigns/{id}
```

#### 1.4 删除投放计划

```http
DELETE /api/admin/advertising/campaigns/{id}
```

#### 1.5 更新计划状态

```http
PUT /api/admin/advertising/campaigns/{id}/status
```

**请求体：**
```json
{
  "status": "paused"
}
```

### 2. 事件追踪接口

#### 2.1 记录单个事件

```http
POST /api/tracking/advertising/event
```

**请求体：**
```json
{
  "campaignCode": "TK001_20241115",
  "eventType": "click",
  "eventData": {
    "platform": "tiktok",
    "adId": "ad_001",
    "creative": "video_001",
    "timestamp": 1700000000000,
    "url": "https://m.xgshort.com/",
    "title": "西瓜短剧首页"
  },
  "sessionId": "session_1700000000_abc123",
  "deviceId": "device_1700000000_def456",
  "referrer": "https://www.tiktok.com/",
  "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15"
}
```

**实现要点：**
- 根据 `campaignCode` 查找对应的 `campaign_id`
- 解析 IP 地址获取地理位置信息
- 异步处理，快速响应
- 考虑使用消息队列处理高并发

#### 2.2 批量记录事件

```http
POST /api/tracking/advertising/events/batch
```

**请求体：**
```json
{
  "events": [
    {
      "campaignCode": "TK001_20241115",
      "eventType": "view",
      "eventData": {...},
      "sessionId": "session_1700000000_abc123",
      "deviceId": "device_1700000000_def456",
      "referrer": "https://www.tiktok.com/",
      "userAgent": "Mozilla/5.0..."
    }
  ]
}
```

#### 2.3 记录转化事件

```http
POST /api/tracking/advertising/conversion
```

**请求体：**
```json
{
  "campaignCode": "TK001_20241115",
  "conversionType": "register",
  "conversionValue": 0,
  "userId": 12345,
  "sessionId": "session_1700000000_abc123",
  "deviceId": "device_1700000000_def456"
}
```

**实现要点：**
- 查找用户的首次点击时间（从 `advertising_events` 表）
- 计算转化耗时
- 处理重复转化（同一用户同一类型转化只记录一次）

### 3. 统计分析接口

#### 3.1 获取投放计划统计

```http
GET /api/admin/advertising/campaigns/{id}/stats?from=2024-11-01&to=2024-11-30
```

**响应格式：**
```json
{
  "code": 200,
  "data": {
    "overview": {
      "totalClicks": 12500,
      "totalViews": 45000,
      "totalConversions": 250,
      "conversionRate": 0.02,
      "cost": 2500.00,
      "cpc": 0.20,
      "cpa": 10.00
    },
    "timeline": [
      {
        "date": "2024-11-01",
        "clicks": 500,
        "views": 1800,
        "conversions": 10
      },
      {
        "date": "2024-11-02",
        "clicks": 520,
        "views": 1900,
        "conversions": 12
      }
    ]
  }
}
```

#### 3.2 获取仪表盘概览

```http
GET /api/admin/advertising/dashboard?from=2024-11-01&to=2024-11-30
```

**响应格式：**
```json
{
  "code": 200,
  "data": {
    "totalCampaigns": 5,
    "activeCampaigns": 3,
    "totalSpend": 25000.00,
    "totalClicks": 125000,
    "totalConversions": 2500,
    "avgConversionRate": 0.02,
    "platformStats": [
      {
        "platform": "tiktok",
        "campaigns": 2,
        "clicks": 50000,
        "conversions": 1000,
        "spend": 10000.00
      },
      {
        "platform": "wechat",
        "campaigns": 1,
        "clicks": 30000,
        "conversions": 600,
        "spend": 6000.00
      }
    ],
    "recentEvents": [
      {
        "id": 12345,
        "campaignCode": "TK001_20241115",
        "eventType": "register",
        "eventTime": "2024-11-15T12:00:00Z"
      }
    ]
  }
}
```

#### 3.3 获取平台对比数据

```http
GET /api/admin/advertising/platform-comparison?from=2024-11-01&to=2024-11-30
```

## 🛠️ 实现细节

### 1. 计划代码生成算法

```python
def generate_campaign_code(platform: str) -> str:
    """生成唯一的投放计划代码"""
    import time
    import random
    import string
    
    # 平台代码映射
    platform_codes = {
        'tiktok': 'TK',
        'wechat': 'WX',
        'baidu': 'BD',
        'google': 'GG',
        'weibo': 'WB',
        'xiaohongshu': 'XHS',
        'kuaishou': 'KS',
        'other': 'OT'
    }
    
    platform_code = platform_codes.get(platform, 'OT')
    date_str = time.strftime('%Y%m%d')
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    
    return f"{platform_code}_{date_str}_{random_str}"
```

### 2. IP地址地理位置解析

```python
def get_location_from_ip(ip_address: str) -> dict:
    """从IP地址获取地理位置信息"""
    # 可以使用 GeoIP2、IP2Location 等服务
    # 示例使用免费的 ip-api.com
    import requests
    
    try:
        response = requests.get(f"http://ip-api.com/json/{ip_address}")
        data = response.json()
        
        if data['status'] == 'success':
            return {
                'country': data.get('country'),
                'region': data.get('regionName'),
                'city': data.get('city')
            }
    except Exception as e:
        print(f"获取地理位置失败: {e}")
    
    return {'country': None, 'region': None, 'city': None}
```

### 3. 统计数据计算

```python
def calculate_campaign_stats(campaign_id: int, start_date: str, end_date: str) -> dict:
    """计算投放计划统计数据"""
    
    # 查询事件统计
    events_query = """
        SELECT 
            event_type,
            COUNT(*) as count
        FROM advertising_events 
        WHERE campaign_id = %s 
            AND event_time BETWEEN %s AND %s
        GROUP BY event_type
    """
    
    # 查询转化统计
    conversions_query = """
        SELECT 
            conversion_type,
            COUNT(*) as count,
            SUM(conversion_value) as total_value
        FROM advertising_conversions 
        WHERE campaign_id = %s 
            AND conversion_time BETWEEN %s AND %s
        GROUP BY conversion_type
    """
    
    # 执行查询并计算指标
    events = execute_query(events_query, [campaign_id, start_date, end_date])
    conversions = execute_query(conversions_query, [campaign_id, start_date, end_date])
    
    total_clicks = sum(e['count'] for e in events if e['event_type'] == 'click')
    total_views = sum(e['count'] for e in events if e['event_type'] == 'view')
    total_conversions = sum(c['count'] for c in conversions)
    
    conversion_rate = total_conversions / total_clicks if total_clicks > 0 else 0
    
    # 从投放计划表获取预算信息计算成本
    campaign = get_campaign_by_id(campaign_id)
    cost = calculate_cost_by_date_range(campaign, start_date, end_date)
    
    cpc = cost / total_clicks if total_clicks > 0 else 0
    cpa = cost / total_conversions if total_conversions > 0 else 0
    
    return {
        'totalClicks': total_clicks,
        'totalViews': total_views,
        'totalConversions': total_conversions,
        'conversionRate': conversion_rate,
        'cost': cost,
        'cpc': cpc,
        'cpa': cpa
    }
```

### 4. 数据统计缓存策略

```python
def update_campaign_stats_cache():
    """更新投放计划统计缓存（定时任务）"""
    
    # 获取所有活跃的投放计划
    active_campaigns = get_active_campaigns()
    
    for campaign in active_campaigns:
        # 计算昨天的统计数据
        yesterday = (datetime.now() - timedelta(days=1)).date()
        
        stats = calculate_campaign_stats(
            campaign['id'], 
            yesterday.strftime('%Y-%m-%d'),
            yesterday.strftime('%Y-%m-%d')
        )
        
        # 更新或插入缓存数据
        upsert_campaign_stats_cache(campaign['id'], yesterday, stats)
```

### 5. 高并发处理方案

#### 5.1 使用消息队列

```python
# 使用 Redis/RabbitMQ 处理事件追踪
import redis
import json

redis_client = redis.Redis(host='localhost', port=6379, db=0)

def queue_tracking_event(event_data: dict):
    """将追踪事件加入队列"""
    redis_client.lpush('advertising_events_queue', json.dumps(event_data))

def process_tracking_events():
    """处理队列中的追踪事件（后台任务）"""
    while True:
        event_json = redis_client.brpop('advertising_events_queue', timeout=1)
        if event_json:
            event_data = json.loads(event_json[1])
            save_tracking_event_to_db(event_data)
```

#### 5.2 批量插入优化

```python
def batch_insert_events(events: list):
    """批量插入事件数据"""
    if not events:
        return
    
    # 构建批量插入SQL
    values = []
    params = []
    
    for event in events:
        values.append("(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)")
        params.extend([
            event['campaign_id'],
            event['campaign_code'],
            event['event_type'],
            json.dumps(event['event_data']),
            event.get('user_id'),
            event['session_id'],
            event.get('device_id'),
            event.get('referrer'),
            event.get('user_agent'),
            event.get('ip_address'),
            event['event_time']
        ])
    
    sql = f"""
        INSERT INTO advertising_events 
        (campaign_id, campaign_code, event_type, event_data, user_id, 
         session_id, device_id, referrer, user_agent, ip_address, event_time)
        VALUES {','.join(values)}
    """
    
    execute_query(sql, params)
```

## 🔧 配置和部署

### 1. 环境变量配置

```bash
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=short_drama_admin
DB_USER=admin
DB_PASSWORD=password

# Redis配置（用于队列）
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# 地理位置服务配置
GEO_IP_API_KEY=your_api_key
GEO_IP_SERVICE_URL=http://ip-api.com/json/

# 统计缓存更新频率（分钟）
STATS_CACHE_UPDATE_INTERVAL=60
```

### 2. 定时任务配置

```bash
# 每小时更新统计缓存
0 * * * * /usr/bin/python /path/to/update_stats_cache.py

# 每天凌晨清理过期事件数据（保留90天）
0 2 * * * /usr/bin/python /path/to/cleanup_old_events.py

# 每5分钟处理事件队列
*/5 * * * * /usr/bin/python /path/to/process_event_queue.py
```

### 3. 数据库索引优化

```sql
-- 为高频查询添加复合索引
CREATE INDEX idx_events_campaign_time ON advertising_events(campaign_id, event_time);
CREATE INDEX idx_events_session_time ON advertising_events(session_id, event_time);
CREATE INDEX idx_conversions_campaign_time ON advertising_conversions(campaign_id, conversion_time);

-- 为统计查询添加覆盖索引
CREATE INDEX idx_events_stats ON advertising_events(campaign_id, event_type, event_time);
CREATE INDEX idx_conversions_stats ON advertising_conversions(campaign_id, conversion_type, conversion_time);
```

## 🚨 注意事项

### 1. 数据安全
- 不要记录用户敏感信息（密码、身份证等）
- IP地址脱敏处理
- 定期清理过期数据

### 2. 性能优化
- 事件追踪接口必须快速响应（<100ms）
- 使用异步处理和消息队列
- 统计数据使用缓存机制

### 3. 容错处理
- 追踪失败不应影响用户正常使用
- 实现重试机制
- 监控和告警机制

### 4. 数据一致性
- 转化事件去重处理
- 统计数据定期校验
- 异常数据清理机制

## 📊 监控指标

### 1. 系统指标
- 事件追踪接口响应时间
- 事件处理队列长度
- 数据库连接池状态
- 缓存命中率

### 2. 业务指标
- 每日事件数量
- 转化率趋势
- 异常事件比例
- 数据延迟情况

## 🔄 API 测试用例

### 1. 创建投放计划测试

```bash
curl -X POST http://localhost:8080/api/admin/advertising/campaigns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "测试投放计划",
    "platform": "tiktok",
    "targetUrl": "https://m.xgshort.com/",
    "budget": 1000,
    "startDate": "2024-11-15T00:00:00Z"
  }'
```

### 2. 事件追踪测试

```bash
curl -X POST http://localhost:8080/api/tracking/advertising/event \
  -H "Content-Type: application/json" \
  -d '{
    "campaignCode": "TK_20241115_ABC123",
    "eventType": "click",
    "sessionId": "test_session_001",
    "deviceId": "test_device_001"
  }'
```

这个实现指南提供了完整的后端开发规范，请按照文档要求实现相应功能。如有技术问题，请及时沟通。
