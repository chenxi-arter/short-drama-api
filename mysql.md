# 短剧API数据库表结构

## 表结构说明

### 1. users（用户表）
| 表名 | 字段名 | 类型 | 是否为空 | 默认值 | 说明 |
|------|--------|------|----------|--------|------|
| users | id | BIGINT PK | NO | - | 用户主键ID |
| users | telegram_id | BIGINT | NO | - | Telegram用户ID |
| users | first_name | VARCHAR(255) | NO | - | 名字 |
| users | last_name | VARCHAR(255) | YES | NULL | 姓氏 |
| users | username | VARCHAR(255) | YES | NULL | 用户名 |
| users | is_active | TINYINT | NO | 1 | 是否激活 |
| users | created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 创建时间 |
| users | updated_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 更新时间 |

### 2. categories（分类表）
| 表名 | 字段名 | 类型 | 是否为空 | 默认值 | 说明 |
|------|--------|------|----------|--------|------|
| categories | id | INT PK AI | NO | - | 分类主键ID |
| categories | name | VARCHAR(100) | NO | - | 分类名称 |
| categories | description | TEXT | YES | NULL | 分类描述 |
| categories | sort_order | INT | NO | 0 | 排序 |
| categories | is_active | TINYINT | NO | 1 | 是否激活 |
| categories | created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 创建时间 |
| categories | updated_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 更新时间 |

### 3. tags（标签表）
| 表名 | 字段名 | 类型 | 是否为空 | 默认值 | 说明 |
|------|--------|------|----------|--------|------|
| tags | id | INT PK AI | NO | - | 标签主键ID |
| tags | name | VARCHAR(50) | NO | - | 标签名称 |
| tags | color | VARCHAR(7) | YES | #007bff | 标签颜色 |
| tags | is_active | TINYINT | NO | 1 | 是否激活 |
| tags | created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 创建时间 |
| tags | updated_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 更新时间 |

### 4. series（系列表）
| 表名 | 字段名 | 类型 | 是否为空 | 默认值 | 说明 |
|------|--------|------|----------|--------|------|
| series | id | INT PK AI | NO | - | 系列主键ID |
| series | title | VARCHAR(255) | NO | - | 系列标题 |
| series | description | TEXT | YES | NULL | 系列描述 |
| series | cover_image | VARCHAR(500) | YES | NULL | 封面图片URL |
| series | category_id | INT | NO | - | 分类ID |
| series | total_episodes | INT | NO | 0 | 总集数 |
| series | status | ENUM | NO | ongoing | 状态(ongoing/completed/paused) |
| series | rating | DECIMAL(3,2) | YES | 0.00 | 评分 |
| series | view_count | BIGINT | NO | 0 | 观看次数 |
| series | like_count | BIGINT | NO | 0 | 点赞数 |
| series | up_status | TINYINT | NO | 0 | 更新状态 |
| series | up_count | INT | NO | 0 | 更新集数 |
| series | is_featured | TINYINT | NO | 0 | 是否推荐 |
| series | is_active | TINYINT | NO | 1 | 是否激活 |
| series | created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 创建时间 |
| series | updated_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 更新时间 |

### 5. episodes（剧集表）
| 表名 | 字段名 | 类型 | 是否为空 | 默认值 | 说明 |
|------|--------|------|----------|--------|------|
| episodes | id | INT PK AI | NO | - | 剧集主键ID |
| episodes | series_id | INT | NO | - | 系列ID |
| episodes | episode_number | INT | NO | - | 集数编号 |
| episodes | title | VARCHAR(255) | NO | - | 剧集标题 |
| episodes | description | TEXT | YES | NULL | 剧集描述 |
| episodes | video_url | VARCHAR(500) | NO | - | 视频URL |
| episodes | thumbnail | VARCHAR(500) | YES | NULL | 缩略图URL |
| episodes | duration | INT | NO | 0 | 时长(秒) |
| episodes | view_count | BIGINT | NO | 0 | 观看次数 |
| episodes | like_count | BIGINT | NO | 0 | 点赞数 |
| episodes | is_active | TINYINT | NO | 1 | 是否激活 |
| episodes | created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 创建时间 |
| episodes | updated_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 更新时间 |

### 6. videos（短视频表）
| 表名 | 字段名 | 类型 | 是否为空 | 默认值 | 说明 |
|------|--------|------|----------|--------|------|
| videos | id | INT PK AI | NO | - | 视频主键ID |
| videos | title | VARCHAR(255) | NO | - | 视频标题 |
| videos | description | TEXT | YES | NULL | 视频描述 |
| videos | video_url | VARCHAR(500) | NO | - | 视频URL |
| videos | thumbnail | VARCHAR(500) | YES | NULL | 缩略图URL |
| videos | duration | INT | NO | 0 | 时长(秒) |
| videos | category_id | INT | NO | - | 分类ID |
| videos | view_count | BIGINT | NO | 0 | 观看次数 |
| videos | like_count | BIGINT | NO | 0 | 点赞数 |
| videos | is_featured | TINYINT | NO | 0 | 是否推荐 |
| videos | is_active | TINYINT | NO | 1 | 是否激活 |
| videos | created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 创建时间 |
| videos | updated_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 更新时间 |

### 7. series_tags（系列标签关联表）
| 表名 | 字段名 | 类型 | 是否为空 | 默认值 | 说明 |
|------|--------|------|----------|--------|------|
| series_tags | id | INT PK AI | NO | - | 关联主键ID |
| series_tags | series_id | INT | NO | - | 系列ID |
| series_tags | tag_id | INT | NO | - | 标签ID |
| series_tags | created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 创建时间 |

### 8. episode_tags（剧集标签关联表）
| 表名 | 字段名 | 类型 | 是否为空 | 默认值 | 说明 |
|------|--------|------|----------|--------|------|
| episode_tags | id | INT PK AI | NO | - | 关联主键ID |
| episode_tags | episode_id | INT | NO | - | 剧集ID |
| episode_tags | tag_id | INT | NO | - | 标签ID |
| episode_tags | created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 创建时间 |

### 9. video_tags（视频标签关联表）
| 表名 | 字段名 | 类型 | 是否为空 | 默认值 | 说明 |
|------|--------|------|----------|--------|------|
| video_tags | id | INT PK AI | NO | - | 关联主键ID |
| video_tags | video_id | INT | NO | - | 视频ID |
| video_tags | tag_id | INT | NO | - | 标签ID |
| video_tags | created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 创建时间 |

### 10. comments（评论表）
| 表名 | 字段名 | 类型 | 是否为空 | 默认值 | 说明 |
|------|--------|------|----------|--------|------|
| comments | id | BIGINT PK AI | NO | - | 评论主键ID |
| comments | user_id | BIGINT | NO | - | 用户ID |
| comments | content_type | ENUM | NO | - | 内容类型(series/episode/video) |
| comments | content_id | INT | NO | - | 内容ID |
| comments | content | TEXT | NO | - | 评论内容 |
| comments | comment_type | ENUM | NO | comment | 评论类型(comment/danmu) |
| comments | time_position | INT | YES | NULL | 弹幕时间位置(秒) |
| comments | parent_id | BIGINT | YES | NULL | 父评论ID |
| comments | like_count | INT | NO | 0 | 点赞数 |
| comments | is_active | TINYINT | NO | 1 | 是否激活 |
| comments | created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 创建时间 |
| comments | updated_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 更新时间 |

### 11. watch_progress（观看进度表）
| 表名 | 字段名 | 类型 | 是否为空 | 默认值 | 说明 |
|------|--------|------|----------|--------|------|
| watch_progress | id | BIGINT PK AI | NO | - | 进度主键ID |
| watch_progress | user_id | BIGINT | NO | - | 用户ID |
| watch_progress | content_type | ENUM | NO | - | 内容类型(episode/video) |
| watch_progress | content_id | INT | NO | - | 内容ID |
| watch_progress | progress_seconds | INT | NO | 0 | 观看进度(秒) |
| watch_progress | total_seconds | INT | NO | 0 | 总时长(秒) |
| watch_progress | is_completed | TINYINT | NO | 0 | 是否看完 |
| watch_progress | last_watched_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 最后观看时间 |
| watch_progress | created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 创建时间 |
| watch_progress | updated_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 更新时间 |

### 12. refresh_tokens（刷新令牌表）
| 表名 | 字段名 | 类型 | 是否为空 | 默认值 | 说明 |
|------|--------|------|----------|--------|------|
| refresh_tokens | id | BIGINT PK AI | NO | - | 刷新令牌主键ID |
| refresh_tokens | user_id | BIGINT | NO | - | 用户ID |
| refresh_tokens | token | VARCHAR(255) | NO | - | 刷新令牌 |
| refresh_tokens | expires_at | TIMESTAMP | NO | - | 过期时间 |
| refresh_tokens | created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 创建时间 |
| refresh_tokens | is_revoked | TINYINT | NO | 0 | 是否撤销 |
| refresh_tokens | device_info | VARCHAR(500) | YES | NULL | 设备信息 |
| refresh_tokens | ip_address | VARCHAR(45) | YES | NULL | IP地址 |