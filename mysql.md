| 表名 | 字段名 | 类型 | NULL | 默认值 | 说明 |
|---|---|---|---|---|---|
| categories | id | INT PK AI | NO | - | 分类主键 |
| categories | name | VARCHAR(50) | NO | - | 唯一分类名称 |
| comments | id | INT PK AI | NO | - | 弹幕/评论主键 |
| comments | user_id | BIGINT FK | NO | - | → users.id |
| comments | episode_id | INT FK | NO | - | → episodes.id |
| comments | content | TEXT | NO | - | 文字内容 |
| comments | appear_second | INT | NO | 0 | 弹幕出现秒数 |
| comments | created_at | DATETIME | NO | CURRENT_TIMESTAMP | 创建时间 |
| episode_urls | id | INT PK AI | NO | - | 播放地址主键 |
| episode_urls | episode_id | INT FK | NO | - | → episodes.id |
| episode_urls | quality | VARCHAR(50) | NO | - | 720p / 1080p / 4K |
| episode_urls | oss_url | VARCHAR(255) | NO | - | OSS 原始地址 |
| episode_urls | cdn_url | VARCHAR(255) | NO | - | CDN 加速地址 |
| episode_urls | subtitle_url | VARCHAR(255) | YES | NULL | 外挂字幕 |
| episodes | id | INT PK AI | NO | - | 剧集主键 |
| episodes | series_id | INT FK | NO | - | → series.id |
| episodes | episode_number | INT | NO | - | 第几集 |
| episodes | title | VARCHAR(255) | NO | - | 本集标题 |
| episodes | duration | INT | NO | - | 时长（秒） |
| episodes | status | VARCHAR(20) | NO | published | published / hidden / draft |
| series | id | INT PK AI | NO | - | 电视剧主键 |
| series | title | VARCHAR(255) | NO | - | 电视剧标题 |
| series | description | TEXT | YES | NULL | 简介 |
| series | cover_url | VARCHAR(255) | YES | NULL | 封面 OSS 地址 |
| series | total_episodes | INT | NO | 0 | 冗余总集数 |
| series | created_at | DATETIME | NO | CURRENT_TIMESTAMP | 创建时间 |
| series | category_id | INT FK | YES | NULL | → categories.id |
| short_videos | id | INT PK AI | NO | - | 短视频主键 |
| short_videos | title | VARCHAR(255) | NO | - | 标题 |
| short_videos | description | TEXT | YES | NULL | 简介 |
| short_videos | cover_url | VARCHAR(255) | NO | - | 竖屏封面 |
| short_videos | video_url | VARCHAR(255) | NO | - | 竖屏播放地址 |
| short_videos | duration | INT | NO | 0 | 时长（秒） |
| short_videos | play_count | INT | NO | 0 | 播放次数 |
| short_videos | like_count | INT | NO | 0 | 点赞次数 |
| short_videos | platform_name | VARCHAR(50) | NO | 官方平台 | 发布平台 |
| short_videos | category_id | INT FK | NO | - | → categories.id |
| short_videos | created_at | DATETIME | NO | CURRENT_TIMESTAMP | 创建时间 |
| users | id | BIGINT PK | NO | - | 用户主键 |
| users | first_name | VARCHAR(255) | NO | - | 名 |
| users | last_name | VARCHAR(255) | NO | - | 姓 |
| users | username | VARCHAR(255) | NO | - | 唯一用户名 |
| users | is_active | TINYINT(1) | NO | 1 | 是否激活 |
| users | created_at | DATETIME | NO | CURRENT_TIMESTAMP | 创建时间 |
| watch_progress | user_id | BIGINT PK FK | NO | - | → users.id（联合主键） |
| watch_progress | episode_id | INT PK FK | NO | - | → episodes.id（联合主键） |
| watch_progress | stop_at_second | INT | NO | 0 | 断点秒数 |
| watch_progress | updated_at | DATETIME | NO | CURRENT_TIMESTAMP | 更新时间 |