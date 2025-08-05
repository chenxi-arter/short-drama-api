# 短剧API数据库表结构

## 版本信息
- **版本**: v2.0.0
- **更新日期**: 2025-01-31
- **主要变更**: 新增UUID防枚举攻击支持，增强安全特性

## 安全特性
- ✅ UUID防枚举攻击保护
- ✅ AccessKey播放地址保护
- ✅ 索引优化查询性能
- ✅ 向后兼容性支持

## 表结构说明

### 1. users（用户表）
| 表名 | 字段名 | 类型 | 是否为空 | 默认值 | 索引 | 说明 |
|------|--------|------|----------|--------|------|------|
| users | id | BIGINT PK AI | NO | - | PRIMARY | 用户主键ID |
| users | telegram_id | BIGINT | NO | - | UNIQUE | Telegram用户ID |
| users | first_name | VARCHAR(255) | NO | - | - | 名字 |
| users | last_name | VARCHAR(255) | YES | NULL | - | 姓氏 |
| users | username | VARCHAR(255) | YES | NULL | INDEX | 用户名 |
| users | is_active | TINYINT | NO | 1 | - | 是否激活 |
| users | created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | - | 创建时间 |
| users | updated_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | - | 更新时间 |

### 2. categories（分类表）
| 表名 | 字段名 | 类型 | 是否为空 | 默认值 | 索引 | 说明 |
|------|--------|------|----------|--------|------|------|
| categories | id | INT PK AI | NO | - | PRIMARY | 分类主键ID |
| categories | name | VARCHAR(100) | NO | - | UNIQUE | 分类名称 |
| categories | description | TEXT | YES | NULL | - | 分类描述 |
| categories | sort_order | INT | NO | 0 | INDEX | 排序 |
| categories | is_active | TINYINT | NO | 1 | INDEX | 是否激活 |
| categories | created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | - | 创建时间 |
| categories | updated_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | - | 更新时间 |

### 3. tags（标签表）
| 表名 | 字段名 | 类型 | 是否为空 | 默认值 | 索引 | 说明 |
|------|--------|------|----------|--------|------|------|
| tags | id | INT PK AI | NO | - | PRIMARY | 标签主键ID |
| tags | name | VARCHAR(50) | NO | - | UNIQUE | 标签名称 |
| tags | color | VARCHAR(7) | YES | #007bff | - | 标签颜色 |
| tags | is_active | TINYINT | NO | 1 | INDEX | 是否激活 |
| tags | created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | - | 创建时间 |
| tags | updated_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | - | 更新时间 |

### 4. series（系列表）🔒
| 表名 | 字段名 | 类型 | 是否为空 | 默认值 | 索引 | 说明 |
|------|--------|------|----------|--------|------|------|
| series | id | INT PK AI | NO | - | PRIMARY | 系列主键ID |
| series | **uuid** | **VARCHAR(36)** | **NO** | **UUID()** | **UNIQUE** | **🔒 公开UUID标识符** |
| series | title | VARCHAR(255) | NO | - | INDEX | 系列标题 |
| series | description | TEXT | YES | NULL | - | 系列描述 |
| series | cover_image | VARCHAR(500) | YES | NULL | - | 封面图片URL |
| series | category_id | INT | NO | - | INDEX | 分类ID |
| series | total_episodes | INT | NO | 0 | - | 总集数 |
| series | status | ENUM | NO | ongoing | INDEX | 状态(ongoing/completed/paused) |
| series | rating | DECIMAL(3,2) | YES | 0.00 | INDEX | 评分 |
| series | view_count | BIGINT | NO | 0 | INDEX | 观看次数 |
| series | like_count | BIGINT | NO | 0 | INDEX | 点赞数 |
| series | up_status | TINYINT | NO | 0 | - | 更新状态 |
| series | up_count | INT | NO | 0 | - | 更新集数 |
| series | starring | TEXT | YES | NULL | - | 主演信息 |
| series | director | VARCHAR(255) | YES | NULL | - | 导演信息 |
| series | is_featured | TINYINT | NO | 0 | INDEX | 是否推荐 |
| series | is_active | TINYINT | NO | 1 | INDEX | 是否激活 |
| series | created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | - | 创建时间 |
| series | updated_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | - | 更新时间 |

### 5. episodes（剧集表）🔒
| 表名 | 字段名 | 类型 | 是否为空 | 默认值 | 索引 | 说明 |
|------|--------|------|----------|--------|------|------|
| episodes | id | INT PK AI | NO | - | PRIMARY | 剧集主键ID |
| episodes | **uuid** | **VARCHAR(36)** | **NO** | **UUID()** | **UNIQUE** | **🔒 公开UUID标识符** |
| episodes | series_id | INT | NO | - | INDEX | 系列ID |
| episodes | episode_number | INT | NO | - | INDEX | 集数编号 |
| episodes | title | VARCHAR(255) | NO | - | INDEX | 剧集标题 |
| episodes | description | TEXT | YES | NULL | - | 剧集描述 |
| episodes | video_url | VARCHAR(500) | NO | - | - | 视频URL |
| episodes | thumbnail | VARCHAR(500) | YES | NULL | - | 缩略图URL |
| episodes | duration | INT | NO | 0 | - | 时长(秒) |
| episodes | view_count | BIGINT | NO | 0 | INDEX | 观看次数 |
| episodes | like_count | BIGINT | NO | 0 | INDEX | 点赞数 |
| episodes | is_active | TINYINT | NO | 1 | INDEX | 是否激活 |
| episodes | created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | - | 创建时间 |
| episodes | updated_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | - | 更新时间 |

### 6. episode_urls（播放地址表）🔒
| 表名 | 字段名 | 类型 | 是否为空 | 默认值 | 索引 | 说明 |
|------|--------|------|----------|--------|------|------|
| episode_urls | id | INT PK AI | NO | - | PRIMARY | 播放地址主键ID |
| episode_urls | episode_id | INT | NO | - | INDEX | 剧集ID |
| episode_urls | **access_key** | **VARCHAR(64)** | **NO** | **RANDOM()** | **UNIQUE** | **🔒 访问密钥** |
| episode_urls | url | VARCHAR(500) | NO | - | - | 播放地址URL |
| episode_urls | quality | VARCHAR(20) | YES | HD | INDEX | 清晰度 |
| episode_urls | file_size | BIGINT | YES | NULL | - | 文件大小(字节) |
| episode_urls | format | VARCHAR(10) | YES | mp4 | - | 视频格式 |
| episode_urls | is_active | TINYINT | NO | 1 | INDEX | 是否激活 |
| episode_urls | created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | - | 创建时间 |
| episode_urls | updated_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | - | 更新时间 |

### 7. videos（短视频表）🔒
| 表名 | 字段名 | 类型 | 是否为空 | 默认值 | 索引 | 说明 |
|------|--------|------|----------|--------|------|------|
| videos | id | INT PK AI | NO | - | PRIMARY | 视频主键ID |
| videos | **uuid** | **VARCHAR(36)** | **NO** | **UUID()** | **UNIQUE** | **🔒 公开UUID标识符** |
| videos | title | VARCHAR(255) | NO | - | INDEX | 视频标题 |
| videos | description | TEXT | YES | NULL | - | 视频描述 |
| videos | video_url | VARCHAR(500) | NO | - | - | 视频URL |
| videos | thumbnail | VARCHAR(500) | YES | NULL | - | 缩略图URL |
| videos | duration | INT | NO | 0 | - | 时长(秒) |
| videos | category_id | INT | NO | - | INDEX | 分类ID |
| videos | view_count | BIGINT | NO | 0 | INDEX | 观看次数 |
| videos | like_count | BIGINT | NO | 0 | INDEX | 点赞数 |
| videos | is_featured | TINYINT | NO | 0 | INDEX | 是否推荐 |
| videos | is_active | TINYINT | NO | 1 | INDEX | 是否激活 |
| videos | created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | - | 创建时间 |
| videos | updated_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | - | 更新时间 |

### 8. series_tags（系列标签关联表）
| 表名 | 字段名 | 类型 | 是否为空 | 默认值 | 索引 | 说明 |
|------|--------|------|----------|--------|------|------|
| series_tags | id | INT PK AI | NO | - | PRIMARY | 关联主键ID |
| series_tags | series_id | INT | NO | - | INDEX | 系列ID |
| series_tags | tag_id | INT | NO | - | INDEX | 标签ID |
| series_tags | created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | - | 创建时间 |

**复合索引**: `UNIQUE(series_id, tag_id)`

### 9. episode_tags（剧集标签关联表）
| 表名 | 字段名 | 类型 | 是否为空 | 默认值 | 索引 | 说明 |
|------|--------|------|----------|--------|------|------|
| episode_tags | id | INT PK AI | NO | - | PRIMARY | 关联主键ID |
| episode_tags | episode_id | INT | NO | - | INDEX | 剧集ID |
| episode_tags | tag_id | INT | NO | - | INDEX | 标签ID |
| episode_tags | created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | - | 创建时间 |

**复合索引**: `UNIQUE(episode_id, tag_id)`

### 10. video_tags（视频标签关联表）
| 表名 | 字段名 | 类型 | 是否为空 | 默认值 | 索引 | 说明 |
|------|--------|------|----------|--------|------|------|
| video_tags | id | INT PK AI | NO | - | PRIMARY | 关联主键ID |
| video_tags | video_id | INT | NO | - | INDEX | 视频ID |
| video_tags | tag_id | INT | NO | - | INDEX | 标签ID |
| video_tags | created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | - | 创建时间 |

**复合索引**: `UNIQUE(video_id, tag_id)`

### 11. comments（评论表）
| 表名 | 字段名 | 类型 | 是否为空 | 默认值 | 索引 | 说明 |
|------|--------|------|----------|--------|------|------|
| comments | id | BIGINT PK AI | NO | - | PRIMARY | 评论主键ID |
| comments | user_id | BIGINT | NO | - | INDEX | 用户ID |
| comments | content_type | ENUM | NO | - | INDEX | 内容类型(series/episode/video) |
| comments | content_id | INT | NO | - | INDEX | 内容ID |
| comments | content | TEXT | NO | - | - | 评论内容 |
| comments | comment_type | ENUM | NO | comment | INDEX | 评论类型(comment/danmu) |
| comments | time_position | INT | YES | NULL | - | 弹幕时间位置(秒) |
| comments | parent_id | BIGINT | YES | NULL | INDEX | 父评论ID |
| comments | like_count | INT | NO | 0 | INDEX | 点赞数 |
| comments | is_active | TINYINT | NO | 1 | INDEX | 是否激活 |
| comments | created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | INDEX | 创建时间 |
| comments | updated_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | - | 更新时间 |

**复合索引**: `INDEX(content_type, content_id, created_at)`

### 12. watch_progress（观看进度表）
| 表名 | 字段名 | 类型 | 是否为空 | 默认值 | 索引 | 说明 |
|------|--------|------|----------|--------|------|------|
| watch_progress | id | BIGINT PK AI | NO | - | PRIMARY | 进度主键ID |
| watch_progress | user_id | BIGINT | NO | - | INDEX | 用户ID |
| watch_progress | content_type | ENUM | NO | - | INDEX | 内容类型(episode/video) |
| watch_progress | content_id | INT | NO | - | INDEX | 内容ID |
| watch_progress | progress_seconds | INT | NO | 0 | - | 观看进度(秒) |
| watch_progress | total_seconds | INT | NO | 0 | - | 总时长(秒) |
| watch_progress | is_completed | TINYINT | NO | 0 | INDEX | 是否看完 |
| watch_progress | last_watched_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | INDEX | 最后观看时间 |
| watch_progress | created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | - | 创建时间 |
| watch_progress | updated_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | - | 更新时间 |

**复合索引**: `UNIQUE(user_id, content_type, content_id)`

### 13. refresh_tokens（刷新令牌表）
| 表名 | 字段名 | 类型 | 是否为空 | 默认值 | 索引 | 说明 |
|------|--------|------|----------|--------|------|------|
| refresh_tokens | id | BIGINT PK AI | NO | - | PRIMARY | 刷新令牌主键ID |
| refresh_tokens | user_id | BIGINT | NO | - | INDEX | 用户ID |
| refresh_tokens | token | VARCHAR(255) | NO | - | UNIQUE | 刷新令牌 |
| refresh_tokens | expires_at | TIMESTAMP | NO | - | INDEX | 过期时间 |
| refresh_tokens | created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | - | 创建时间 |
| refresh_tokens | is_revoked | TINYINT | NO | 0 | INDEX | 是否撤销 |
| refresh_tokens | device_info | VARCHAR(500) | YES | NULL | - | 设备信息 |
| refresh_tokens | ip_address | VARCHAR(45) | YES | NULL | - | IP地址 |

### 14. filter_types（筛选器类型表）
| 表名 | 字段名 | 类型 | 是否为空 | 默认值 | 索引 | 说明 |
|------|--------|------|----------|--------|------|------|
| filter_types | id | INT PK AI | NO | - | PRIMARY | 筛选器类型主键ID |
| filter_types | name | VARCHAR(50) | NO | - | UNIQUE | 筛选器名称 |
| filter_types | code | VARCHAR(50) | NO | - | UNIQUE | 筛选器代码 |
| filter_types | index_position | INT | NO | 0 | INDEX | 显示位置 |
| filter_types | is_active | TINYINT | NO | 1 | INDEX | 是否激活 |
| filter_types | sort_order | INT | NO | 0 | INDEX | 排序 |
| filter_types | created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | - | 创建时间 |
| filter_types | updated_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | - | 更新时间 |

### 15. filter_options（筛选器选项表）
| 表名 | 字段名 | 类型 | 是否为空 | 默认值 | 索引 | 说明 |
|------|--------|------|----------|--------|------|------|
| filter_options | id | INT PK AI | NO | - | PRIMARY | 筛选器选项主键ID |
| filter_options | filter_type_id | INT | NO | - | INDEX | 筛选器类型ID |
| filter_options | name | VARCHAR(100) | NO | - | INDEX | 选项名称 |
| filter_options | value | VARCHAR(100) | NO | - | INDEX | 选项值 |
| filter_options | is_default | TINYINT | NO | 0 | INDEX | 是否默认选项 |
| filter_options | is_active | TINYINT | NO | 1 | INDEX | 是否激活 |
| filter_options | sort_order | INT | NO | 0 | INDEX | 排序 |
| filter_options | created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | - | 创建时间 |
| filter_options | updated_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | - | 更新时间 |

**复合索引**: `INDEX(filter_type_id, sort_order)`

## 🔒 安全特性说明

### UUID防枚举攻击
- **实施表**: `series`, `episodes`, `videos`
- **字段格式**: VARCHAR(36) UNIQUE
- **生成方式**: MySQL UUID()函数或应用层生成
- **索引优化**: 为UUID字段创建唯一索引
- **向后兼容**: 保留原有ID字段，支持双重查询

### AccessKey播放保护
- **实施表**: `episode_urls`
- **字段格式**: VARCHAR(64) UNIQUE
- **生成方式**: 随机字符串或哈希算法
- **访问控制**: 通过AccessKey验证播放权限
- **时效性**: 可配置过期时间和访问次数限制

### 索引优化策略
- **主键索引**: 所有表的主键自动创建聚簇索引
- **外键索引**: 关联字段创建普通索引提升JOIN性能
- **查询索引**: 常用查询字段创建复合索引
- **唯一索引**: UUID和AccessKey字段创建唯一索引

## 📊 数据库关系

### 一对多关系 (1:N)
- `users` → `refresh_tokens`
- `users` → `comments`
- `users` → `watch_progress`
- `categories` → `series`
- `categories` → `videos`
- `series` → `episodes`
- `episodes` → `episode_urls`
- `filter_types` → `filter_options`

### 多对多关系 (M:N)
- `series` ↔ `tags` (通过 `series_tags`)
- `episodes` ↔ `tags` (通过 `episode_tags`)
- `videos` ↔ `tags` (通过 `video_tags`)

### 复合关系
- `comments`: 支持多种内容类型的评论
- `watch_progress`: 支持多种内容类型的观看进度

## 🚀 性能优化建议

### 查询优化
1. **UUID查询**: 优先使用UUID字段查询，避免ID枚举
2. **分页查询**: 使用LIMIT和OFFSET进行分页
3. **索引覆盖**: 设计覆盖索引减少回表查询
4. **查询缓存**: 对热点数据启用查询缓存

### 存储优化
1. **分区表**: 对大表按时间或类型进行分区
2. **归档策略**: 定期归档历史数据
3. **压缩存储**: 启用InnoDB压缩减少存储空间

### 安全优化
1. **访问控制**: 限制数据库用户权限
2. **连接加密**: 启用SSL连接加密
3. **审计日志**: 记录敏感操作日志
4. **备份策略**: 定期备份和恢复测试

## 📝 迁移脚本

### 添加UUID字段
```sql
-- 为series表添加UUID字段
ALTER TABLE `series` ADD COLUMN `uuid` VARCHAR(36) UNIQUE AFTER `id`;
UPDATE `series` SET `uuid` = UUID() WHERE `uuid` IS NULL;
CREATE INDEX `idx_series_uuid` ON `series`(`uuid`);

-- 为episodes表添加UUID字段
ALTER TABLE `episodes` ADD COLUMN `uuid` VARCHAR(36) UNIQUE AFTER `id`;
UPDATE `episodes` SET `uuid` = UUID() WHERE `uuid` IS NULL;
CREATE INDEX `idx_episodes_uuid` ON `episodes`(`uuid`);

-- 为videos表添加UUID字段
ALTER TABLE `videos` ADD COLUMN `uuid` VARCHAR(36) UNIQUE AFTER `id`;
UPDATE `videos` SET `uuid` = UUID() WHERE `uuid` IS NULL;
CREATE INDEX `idx_videos_uuid` ON `videos`(`uuid`);
```

### 添加AccessKey字段
```sql
-- 为episode_urls表添加AccessKey字段
ALTER TABLE `episode_urls` ADD COLUMN `access_key` VARCHAR(64) UNIQUE AFTER `episode_id`;
UPDATE `episode_urls` SET `access_key` = SHA2(CONCAT(id, RAND(), NOW()), 256) WHERE `access_key` IS NULL;
CREATE INDEX `idx_episode_urls_access_key` ON `episode_urls`(`access_key`);
```

## 📈 版本历史

### v2.0.0 (2025-01-31)
- ✅ 新增UUID防枚举攻击支持
- ✅ 新增AccessKey播放地址保护
- ✅ 优化索引结构提升查询性能
- ✅ 增强安全特性和访问控制
- ✅ 完善数据库关系和约束

### v1.2.0 (2024-12-01)
- ✅ 新增筛选器系统支持
- ✅ 优化评论和弹幕功能
- ✅ 增强观看进度跟踪

### v1.1.0 (2024-10-01)
- ✅ 完善用户认证系统
- ✅ 新增刷新令牌机制
- ✅ 优化数据库结构

### v1.0.0 (2024-08-01)
- ✅ 初始数据库结构设计
- ✅ 基础实体关系建立
- ✅ 核心功能表创建

---

**注意**: 🔒 标记的表包含安全特性，建议在生产环境中启用相关保护机制。