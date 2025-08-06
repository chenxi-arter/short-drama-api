# 短剧API数据库字段及关系整理文档

## 📋 概述

本文档详细整理了短剧API项目中所有数据库表的字段定义和实体关系，基于TypeORM实体类分析生成。

## 🗂️ 数据库表结构

### 1. 用户相关表

#### 1.1 users（用户表）

| 字段名 | 数据类型 | 约束 | 描述 |
|--------|----------|------|------|
| id | bigint | PRIMARY KEY | 用户主键ID（可能来自外部系统如Telegram） |
| uuid | varchar(36) | UNIQUE, NULLABLE | UUID标识符（防枚举攻击） |
| first_name | varchar(255) | NOT NULL | 用户名字 |
| last_name | varchar(255) | NOT NULL | 用户姓氏 |
| username | varchar(255) | UNIQUE, NOT NULL | 用户名（登录标识） |
| is_active | tinyint | DEFAULT 1 | 是否激活 |
| created_at | datetime(6) | DEFAULT CURRENT_TIMESTAMP(6) | 创建时间 |

**关系：**
- 一对多：comments（用户评论）
- 一对多：watchProgresses（观看进度）
- 一对多：refreshTokens（刷新令牌）

#### 1.2 refresh_tokens（刷新令牌表）

| 字段名 | 数据类型 | 约束 | 描述 |
|--------|----------|------|------|
| id | int | PRIMARY KEY AUTO_INCREMENT | 主键ID |
| user_id | bigint | NOT NULL, FOREIGN KEY | 用户ID（关联users.id） |
| token | varchar(255) | UNIQUE, NOT NULL | Refresh Token值 |
| expires_at | timestamp | NOT NULL | 过期时间 |
| created_at | datetime(6) | DEFAULT CURRENT_TIMESTAMP(6) | 创建时间 |
| is_revoked | tinyint | DEFAULT 0 | 是否已撤销 |
| device_info | varchar(500) | NULLABLE | 设备信息 |
| ip_address | varchar(45) | NULLABLE | IP地址 |

**关系：**
- 多对一：user（所属用户）

### 2. 视频内容相关表

#### 2.1 categories（分类表）

| 字段名 | 数据类型 | 约束 | 描述 |
|--------|----------|------|------|
| id | int | PRIMARY KEY AUTO_INCREMENT | 分类主键ID |
| name | varchar(100) | NOT NULL | 分类名称 |
| description | text | NULLABLE | 分类描述 |
| is_active | tinyint | DEFAULT 1 | 是否启用 |
| sort_order | int | DEFAULT 0 | 排序顺序 |
| created_at | datetime(6) | DEFAULT CURRENT_TIMESTAMP(6) | 创建时间 |
| updated_at | timestamp | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**关系：**
- 一对多：series（电视剧系列）
- 一对多：shortVideos（短视频）
- 一对多：banners（轮播图）

#### 2.2 series（剧集系列表）

| 字段名 | 数据类型 | 约束 | 描述 |
|--------|----------|------|------|
| id | int | PRIMARY KEY AUTO_INCREMENT | 系列主键ID |
| uuid | varchar(36) | UNIQUE, NULLABLE | UUID标识符（防枚举攻击） |
| title | varchar(255) | NOT NULL | 电视剧标题 |
| description | text | NULLABLE | 简介/描述 |
| cover_url | varchar(255) | NULLABLE | 封面图OSS地址 |
| total_episodes | int | DEFAULT 0 | 总集数（冗余字段） |
| category_id | int | NULLABLE, FOREIGN KEY | 分类ID（关联categories.id） |
| score | float | DEFAULT 0 | 评分 |
| play_count | int | DEFAULT 0 | 播放次数 |
| status | varchar(255) | DEFAULT 'on-going' | 状态（on-going/completed等） |
| up_status | varchar(50) | NULLABLE | 更新状态（如：更新到第10集） |
| up_count | int | DEFAULT 0 | 更新次数 |
| starring | text | NULLABLE | 主演名单（逗号分隔） |
| actor | text | NULLABLE | 演员名单（逗号分隔） |
| director | varchar(255) | NULLABLE | 导演（逗号分隔） |
| region | varchar(50) | NULLABLE | 地区 |
| language | varchar(50) | NULLABLE | 语言 |
| release_date | date | NULLABLE | 发布日期 |
| is_completed | boolean | DEFAULT false | 是否完结 |
| created_at | datetime(6) | DEFAULT CURRENT_TIMESTAMP(6) | 创建时间 |
| updated_at | timestamp | NULLABLE | 更新时间 |

**关系：**
- 一对多：episodes（剧集）
- 多对一：category（所属分类）
- 一对多：banners（轮播图）

#### 2.3 episodes（剧集表）

| 字段名 | 数据类型 | 约束 | 描述 |
|--------|----------|------|------|
| id | int | PRIMARY KEY AUTO_INCREMENT | 剧集主键ID |
| uuid | varchar(36) | UNIQUE, NULLABLE | UUID标识符（防枚举攻击） |
| series_id | int | NOT NULL, FOREIGN KEY | 所属系列ID（关联series.id） |
| episode_number | int | NOT NULL | 集数编号 |
| title | varchar(255) | NOT NULL | 剧集标题 |
| duration | int | DEFAULT 0 | 时长（秒） |
| status | varchar(50) | DEFAULT 'draft' | 状态（draft/published等） |
| play_count | int | DEFAULT 0 | 播放次数 |
| has_sequel | boolean | DEFAULT false | 是否有续集 |
| created_at | datetime(6) | DEFAULT CURRENT_TIMESTAMP(6) | 创建时间 |
| updated_at | datetime(6) | DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) | 更新时间 |

**关系：**
- 多对一：series（所属系列）
- 一对多：urls（播放地址）
- 一对多：watchProgresses（观看进度）
- 一对多：comments（评论/弹幕）

#### 2.4 episode_urls（剧集播放地址表）

| 字段名 | 数据类型 | 约束 | 描述 |
|--------|----------|------|------|
| id | int | PRIMARY KEY AUTO_INCREMENT | 播放地址主键ID |
| episode_id | int | NOT NULL, FOREIGN KEY | 所属剧集ID（关联episodes.id） |
| quality | varchar(50) | NOT NULL | 视频清晰度（720p/1080p/4K等） |
| oss_url | varchar(255) | NOT NULL | OSS原始地址 |
| cdn_url | varchar(255) | NOT NULL | CDN加速播放地址 |
| subtitle_url | varchar(255) | NULLABLE | 外挂字幕地址 |
| access_key | varchar(64) | UNIQUE, NOT NULL | 加密索引键（防枚举攻击） |
| created_at | datetime(6) | DEFAULT CURRENT_TIMESTAMP(6) | 创建时间 |
| updated_at | datetime(6) | DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) | 更新时间 |

**关系：**
- 多对一：episode（所属剧集）

#### 2.5 short_videos（短视频表）

| 字段名 | 数据类型 | 约束 | 描述 |
|--------|----------|------|------|
| id | int | PRIMARY KEY AUTO_INCREMENT | 短视频主键ID |
| uuid | varchar(36) | UNIQUE, NULLABLE | UUID标识符（防枚举攻击） |
| title | varchar(255) | NOT NULL | 短视频标题 |
| description | text | NULLABLE | 简介/描述 |
| cover_url | varchar(255) | NOT NULL | 竖屏封面OSS地址 |
| video_url | varchar(255) | NOT NULL | 竖屏mp4/hls播放地址 |
| duration | int | DEFAULT 0 | 时长（秒） |
| play_count | int | DEFAULT 0 | 播放次数 |
| like_count | int | DEFAULT 0 | 点赞次数 |
| platform_name | varchar(50) | DEFAULT '官方平台' | 发布平台名称 |
| category_id | int | NOT NULL, FOREIGN KEY | 所属分类ID（关联categories.id） |
| created_at | datetime(6) | DEFAULT CURRENT_TIMESTAMP(6) | 创建时间 |

**关系：**
- 多对一：category（所属分类）

### 3. 用户交互相关表

#### 3.1 comments（评论/弹幕表）

| 字段名 | 数据类型 | 约束 | 描述 |
|--------|----------|------|------|
| id | int | PRIMARY KEY AUTO_INCREMENT | 评论主键ID |
| user_id | bigint | NOT NULL, FOREIGN KEY | 发表评论的用户ID（关联users.id） |
| episode_id | int | NOT NULL, FOREIGN KEY | 评论所属的剧集ID（关联episodes.id） |
| content | text | NOT NULL | 评论/弹幕文字内容 |
| appear_second | int | DEFAULT 0 | 弹幕出现时间（秒，普通评论为0） |
| created_at | datetime(6) | DEFAULT CURRENT_TIMESTAMP(6) | 创建时间 |

**关系：**
- 多对一：user（评论作者）
- 多对一：episode（所属剧集）

#### 3.2 watch_progress（观看进度表）

| 字段名 | 数据类型 | 约束 | 描述 |
|--------|----------|------|------|
| user_id | bigint | PRIMARY KEY, FOREIGN KEY | 用户ID（关联users.id） |
| episode_id | int | PRIMARY KEY, FOREIGN KEY | 剧集ID（关联episodes.id） |
| stop_at_second | int | DEFAULT 0 | 观看进度（停止播放的秒数） |
| updated_at | timestamp | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

**说明：** 使用联合主键(user_id, episode_id)，一个用户对一个剧集只有一条进度记录

**关系：**
- 多对一：user（用户）
- 多对一：episode（剧集）

### 4. 运营管理相关表

#### 4.1 banners（轮播图表）

| 字段名 | 数据类型 | 约束 | 描述 |
|--------|----------|------|------|
| id | int | PRIMARY KEY AUTO_INCREMENT | 轮播图主键ID |
| title | varchar(255) | NOT NULL | 轮播图标题 |
| image_url | varchar(500) | NOT NULL | 轮播图图片URL |
| series_id | int | NULLABLE, FOREIGN KEY | 关联的视频系列ID（关联series.id） |
| category_id | int | NOT NULL, FOREIGN KEY | 关联的分类ID（关联categories.id） |
| link_url | varchar(500) | NULLABLE | 跳转链接（如果不关联视频系列） |
| weight | int | DEFAULT 0 | 排序权重（数字越大越靠前） |
| is_active | boolean | DEFAULT true | 是否启用 |
| start_time | datetime | NULLABLE | 开始展示时间 |
| end_time | datetime | NULLABLE | 结束展示时间 |
| description | text | NULLABLE | 描述信息 |
| created_at | datetime(6) | DEFAULT CURRENT_TIMESTAMP(6) | 创建时间 |
| updated_at | datetime(6) | DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) | 更新时间 |

**关系：**
- 多对一：category（关联分类）
- 多对一：series（关联系列，可选）

## 🔗 实体关系图

```
用户模块:
User (1) -----> (N) RefreshToken
User (1) -----> (N) Comment
User (1) -----> (N) WatchProgress

视频内容模块:
Category (1) -----> (N) Series
Category (1) -----> (N) ShortVideo
Category (1) -----> (N) Banner

Series (1) -----> (N) Episode
Series (1) <----- (N) Banner (可选关联)

Episode (1) -----> (N) EpisodeUrl
Episode (1) -----> (N) Comment
Episode (1) -----> (N) WatchProgress

交叉关系:
User (N) -----> (N) Episode (通过WatchProgress)
User (N) -----> (N) Episode (通过Comment)
```

## 📊 数据库设计特点

### 1. 安全性设计
- **UUID字段**：所有主要实体都包含UUID字段，防止ID枚举攻击
- **访问密钥**：EpisodeUrl使用access_key字段进行安全访问控制
- **软删除支持**：通过is_active等字段支持软删除

### 2. 性能优化
- **冗余字段**：Series.total_episodes等冗余字段减少关联查询
- **索引设计**：主键、外键、UUID字段都有相应索引
- **分页支持**：所有列表查询都支持分页

### 3. 扩展性设计
- **分类系统**：统一的Category实体支持多种内容分类
- **状态管理**：Series.status、Episode.status等支持多种状态
- **时间戳**：完整的created_at/updated_at时间戳记录

### 4. 业务逻辑支持
- **观看进度**：WatchProgress支持断点续播功能
- **评论弹幕**：Comment.appear_second支持弹幕时间定位
- **多清晰度**：EpisodeUrl支持多种视频清晰度
- **运营管理**：Banner支持轮播图运营和权重排序

## 🔧 数据库配置

### 命名策略
- **表名**：使用snake_case命名（如：episode_urls）
- **字段名**：实体属性camelCase自动转换为数据库snake_case
- **关系名**：保持原始属性名
- **索引名**：格式为IDX_{表名}_{字段名}

### 字符集配置
- **字符集**：utf8mb4
- **排序规则**：utf8mb4_unicode_ci
- **支持emoji**：完整的Unicode字符支持

---

*本文档基于TypeORM实体类自动生成，如有数据库结构变更，请及时更新此文档。*