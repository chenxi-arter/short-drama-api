# Ingest API 完整指南

## 📖 概述

Ingest API 是短剧系统的核心数据采集接口，提供完整的系列、剧集和播放地址管理功能。支持单个系列入库、批量系列入库和增量更新等操作。

> 最近更新（与运行代码保持一致）
> - 系列状态不再持久化字符串字段 `series.status`，统一通过 `statusOptionName`/`status_option_id` 表达；`status` 字段仅用于软删除（deleted）与辅助维护 `isCompleted`。
> - `status` 仍为请求体字段，用途仅限：1) 软删除（`deleted`），2) 维护 `isCompleted`（`completed`/`on-going`）。该值不会写入数据库的系列表。
> - 列表/筛选接口新增计数字段（聚合自 episodes）：`likeCount`、`dislikeCount`、`favoriteCount`（文档末尾“相关接口变更”小节说明）。
> - `upCount` 的语义更新为“当日新增集数”的实时统计（不再依赖数据库持久化字段）。
> - 筛选维度调整：第二组固定为题材(`genre`)，支持多选（连字符），旧 `type` 组已移除。

## 🚀 基础信息

- **基础路径**: `/api/admin/ingest`
- **认证方式**: 需要管理员权限
- **数据格式**: JSON
- **字符编码**: UTF-8

## 🔑 核心概念

### External ID 系统
- **用途**: 外部系统的唯一业务标识符，用于数据同步和关联
- **格式**: 字符串，建议使用有意义的业务标识
- **生成规则**: 由外部系统或业务方定义，确保在业务域内唯一
- **使用场景**: 数据同步、增量更新、跨系统关联、业务追踪
- **特点**: 业务语义明确，便于理解和维护

### Short ID 系统
- **用途**: 为每个系列生成唯一的短标识符（防枚举、对外展示）
- **格式**: 11 位不易混淆的字母数字字符串（例如 "Ab3K7mP2XyZ"）
- **生成规则**: 系统自动分配，使用自定义字符集的随机生成算法，保证高熵唯一性
- **使用场景**: 前端参数、分享短链、防枚举访问标识，不建议替代数据库数值ID

### Access Key 系统
- **用途**: 为每个播放地址生成唯一的访问密钥
- **格式**: 32位十六进制字符串（SHA-256 截断）
- **生成规则**: 基于 `externalId:episodeNumber:quality` 与应用密钥（APP_SECRET）经 SHA-256 计算后截取前32位
- **使用场景**: 播放地址访问、防盗链、统计分析
- **特点**: 确定性生成（同参数与同密钥下恒定）、不可逆、安全性更高

## 📋 API 端点列表

### 1. 单个系列入库（已实现）
- **端点**: `POST /api/admin/ingest/series`
- **用途**: 创建或更新单个系列及其剧集信息
- **适用场景**: 新系列入库、单个系列数据更新

### 2. 批量系列入库（已实现）
- **端点**: `POST /api/admin/ingest/series/batch`
- **用途**: 批量创建或更新多个系列
- **适用场景**: 大量数据导入、数据迁移

### 3. 增量更新（已实现）
- **端点**: `POST /api/admin/ingest/series/update`
- **用途**: 基于 externalId 更新已有系列
- **适用场景**: 数据同步、增量更新、内容维护

## 🔧 详细接口说明

### 1. 单个系列入库

#### 请求信息
- **方法**: `POST`
- **URL**: `http://localhost:8080/api/admin/ingest/series`
- **Content-Type**: `application/json`

#### 请求体结构
```json
{
  "title": "系列标题",
  "externalId": "唯一外部标识",
  "description": "系列描述",
  "coverUrl": "封面图片URL",
  "categoryId": 1,
  "releaseDate": "2024-01-01",
  "isCompleted": false,
  "score": 8.5,
  "playCount": 1000,
  "starring": "主演",
  "actor": "演员",
  "director": "导演",
  "regionOptionName": "大陆",
  "languageOptionName": "国语",
  "statusOptionName": "连载中",
  "yearOptionName": "2025",
  "genreOptionNames": ["言情", "玄幻"],
  "episodes": [
    {
      "episodeNumber": 1,
      "title": "第1集标题",
      "duration": 1800,
      "status": "published",
      "urls": [
        {
          "quality": "720p",
          "ossUrl": "https://oss.example.com/ep1.m3u8",
          "cdnUrl": "https://cdn.example.com/ep1.m3u8",
          "originUrl": "https://origin.example.com/ep1",
          "subtitleUrl": "https://subtitle.example.com/ep1.srt"
        }
      ]
    }
  ]
}
```

#### 字段说明

##### 系列基本信息
| 字段 | 类型 | 必填 | 说明 | 示例值 |
|------|------|------|------|--------|
| `title` | string | ✅ | 系列标题（≤255） | "我的短剧系列" |
| `externalId` | string | ✅ | 外部唯一标识 | "series-001" |
| `description` | string | ✅ | 系列描述 | "这是一个精彩的短剧系列" |
| `coverUrl` | string | ✅ | 封面图片URL（≤255） | "https://example.com/cover.jpg" |
| `categoryId` | number | ✅ | 分类ID（≥1） | 1 |
fix| `status` | string | ❌ | 仅用于软删除：传 `deleted` 触发软删除（`isActive=0`）；其他值忽略。系列状态统一使用 `statusOptionName` + `isCompleted` 表达。 | "deleted"（仅软删除时传入） |
| `releaseDate` | string | ✅ | 发布日期（ISO日期） | "2024-01-01" |
| `isCompleted` | boolean | ✅ | 系列完结标识：`true`=已完结，`false`=连载中。影响 `upStatus` 文案："已完结" 或 "更新至第X集"。 | true / false |
| `score` | number | ❌ | 评分（0-10） | 8.5 |
| `playCount` | number | ❌ | 播放次数（≥0） | 1000 |
| `upStatus` | string | 自动 | 系统自动生成（如“更新至第10集”/“已完结”，无需传入） | - |
| `upCount` | number | 自动 | 系统自动生成（当前已更新到的集数，无需传入） | - |
| `starring` | string | ❌ | 主演（逗号分隔） | "张三,李四" |
| `actor` | string | ❌ | 全演员（逗号分隔） | "张三,李四,王五" |
| `director` | string | ❌ | 导演（≤255） | "导演A" |
| `regionOptionName` | string | ✅ | 地区选项名称（不存在则自动创建） | "大陆" |
| `languageOptionName` | string | ✅ | 语言选项名称（不存在则自动创建） | "国语" |
| `statusOptionName` | string | ✅ | 状态选项名称（不存在则自动创建）。注意：系列状态以此为准（替代旧的字符串 `status` 持久化）。 | "连载中" |
| `yearOptionName` | string | ✅ | 年份选项名称（不存在则自动创建） | "2025" |
| `genreOptionNames` | string[] | ❌ | 题材选项名称数组（不存在则自动创建；多选） | ["言情", "玄幻"] |

###### 关于 Option 取值说明（名称必填，自动归类/创建）
- 仅需提供各选项的"名称"，系统会在对应的 `filter_types`（code: genre/region/language/status/year）下查找；若名称不存在，会在该类型下自动创建。
- 示例：题材「言情,玄幻」、地区「大陆」、语言「国语」、状态「连载中」、年份「2025」。
- 注意：接口不接收这些选项的数值ID，示例中的数值ID仅为内部数据库标识。
- 兼容：仍可传 `status` 字段，但仅用于软删除与 `isCompleted`，实际状态持久化依赖 `statusOptionName`。
  - 存储结构说明：选项实体 `filter_options` 的 `value` 字段为 `varchar(100)`，确保与 MySQL 兼容。

###### 关于 genreOptionNames（题材多选）
- 新增字段，支持为系列指定多个题材标签（如言情、玄幻、爱情等）。
- 存储方式：通过中间表 `series_genre_options(series_id, option_id)` 关联，支持多对多关系。
- 筛选支持：前端 ids 第二位支持单选（如 `1,2,0,0,0,0`）或多选（如 `1,2-5-7,0,0,0,0`）。
- 动态创建：传入不存在的题材名称会自动在 `filter_types(code='genre')` 下创建新选项。
- 示例：`genreOptionNames: ["言情", "玄幻", "都市"]` 会为该系列关联三个题材。

###### 关于 status 与 isCompleted 字段（最新规则）
- **status 字段**：改为可选字段，仅用于软删除，传 `deleted` 触发软删除（`isActive=0`），其他值忽略。
- **isCompleted 字段**：改为必填布尔字段，明确表示系列完结状态：
  - `true`：系列已完结，`upStatus` 显示为"已完结"
  - `false`：系列连载中，`upStatus` 显示为"更新至第X集"
- **statusOptionName**：对外展示与筛选的状态标签，存储在 `status_option_id` 外键
- **推荐用法**：
  - 连载系列：`isCompleted: false` + `statusOptionName: "连载中"`
  - 完结系列：`isCompleted: true` + `statusOptionName: "已完结"`
  - 软删除：`status: "deleted"`（其他字段可省略）

###### 关于分类 categoryId 的取值
- 当前内置分类如下：

| id | category_id | 名称 |
|----|-------------|------|
| 1 | drama | 短剧 |
| 2 | movie | 电影 |
| 3 | variety | 综艺 |

- 使用时在请求体中传 `categoryId` 的数值（如 1/2/3）。

##### 剧集信息
| 字段 | 类型 | 必填 | 说明 | 示例值 |
|------|------|------|------|--------|
| `episodeNumber` | number | ✅ | 剧集编号（≥1） | 1 |
| `title` | string | ✅ | 剧集标题（≤255） | "第1集：开始" |
| `duration` | number | ✅ | 时长(秒)（≥1） | 1800 |
| `status` | string | ✅ | 剧集状态 | "published", "hidden", "draft" |

##### 播放地址信息
| 字段 | 类型 | 必填 | 说明 | 示例值 |
|------|------|------|------|--------|
| `quality` | string | ✅ | 视频清晰度 | "360p", "480p", "720p", "1080p", "4K" |
| `ossUrl` | string | ❌ | OSS原始地址 | "https://oss.example.com/ep1.m3u8" |
| `cdnUrl` | string | ✅ | CDN加速地址 | "https://cdn.example.com/ep1.m3u8" |
| `originUrl` | string | ✅ | 原站地址 | "https://origin.example.com/ep1" |
| `subtitleUrl` | string | ❌ | 字幕文件地址 | "https://subtitle.example.com/ep1.srt" |

#### 响应格式（与批量一致：summary + items）
```json
{
  "code": 200,
  "data": {
    "summary": { "created": 1, "updated": 0, "failed": 0, "total": 1 },
    "items": [
      { "statusCode": 200, "seriesId": 1001, "shortId": "Ab3K7mP2XyZ", "externalId": "series-001", "action": "created", "title": "系列1" }
    ]
  },
  "message": "系列采集写入完成",
  "success": true,
  "timestamp": 1756402868040
}
```

#### 成功响应字段
| 字段 | 类型 | 说明 |
|------|------|------|
| `code` | number | 状态码，200表示成功 |
| `data.summary` | object | 统计：created/updated/failed/total |
| `data.items[].seriesId` | number | 系列内部数值ID |
| `data.items[].shortId` | string | 11位短ID（可能为null） |
| `data.items[].externalId` | string | 外部业务ID（可能为null） |
| `data.items[].action` | string | "created" 或 "updated" |
| `data.items[].statusCode` | number | 单条结果状态码（200/4xx） |
| `message` | string | 成功消息 |
| `success` | boolean | 操作是否成功 |
| `timestamp` | number | 时间戳 |

### 2. 批量系列入库

#### 请求信息
- **方法**: `POST`
- **URL**: `http://localhost:8080/api/admin/ingest/series/batch`
- **Content-Type**: `application/json`

#### 请求体结构
```json
{
  "items": [
    {
      "title": "系列1",
      "externalId": "series-001",
      "episodes": [...]
    },
    {
      "title": "系列2", 
      "externalId": "series-002",
      "episodes": [...]
    }
  ]
}
```

#### 响应格式（含统计与逐条结果）
```json
{
  "code": 200,
  "data": {
    "summary": {
      "created": 1,
      "updated": 1,
      "failed": 1,
      "total": 3
    },
    "items": [
      { "statusCode": 200, "seriesId": 1001, "shortId": "Ab3K7mP2XyZ", "action": "created", "externalId": "series-001", "title": "系列1" },
      { "statusCode": 200, "seriesId": 1002, "shortId": "Cd9LmQ8RtUv", "action": "updated", "externalId": "series-002", "title": "系列2" },
      { "statusCode": 404, "error": "系列不存在：externalId=bad-id", "externalId": "bad-id", "title": "坏数据" }
    ]
  },
  "message": "批量系列采集写入完成",
  "success": true,
  "timestamp": 1756402868040
}
```

### 3. 增量更新

#### 请求信息
- **方法**: `POST`
- **URL**: `http://localhost:8080/api/admin/ingest/series/update`
- **Content-Type**: `application/json`

#### 请求体结构
```json
{
  "externalId": "series-001",
  "title": "更新后的标题",
  "episodes": [
    {
      "episodeNumber": 1,
      "title": "更新后的剧集标题",
      "urls": [
        {
          "quality": "720p",
          "ossUrl": "https://oss.example.com/ep1-updated.m3u8",
          "cdnUrl": "https://cdn.example.com/ep1-updated.m3u8",
          "originUrl": "https://origin.example.com/ep1-updated"
        }
      ]
    }
  ],
  "removeMissingEpisodes": true,
  "removeMissingUrls": true
}
```

#### 特殊字段说明
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `externalId` | string | ✅ | 用于定位要更新的系列 |
| `removeMissingEpisodes` | boolean | ❌ | 是否删除请求中未包含的剧集 |
| `removeMissingUrls` | boolean | ❌ | 是否删除请求中未包含的URL |

#### 响应格式（与单条/批量一致：summary + items）
```json
{
  "code": 200,
  "data": {
    "summary": { "created": 0, "updated": 1, "failed": 0, "total": 1 },
    "items": [
      { "statusCode": 200, "seriesId": 1001, "shortId": "Ab3K7mP2XyZ", "externalId": "series-001", "action": "updated", "title": "更新后的标题" }
    ]
  },
  "message": "系列采集写入完成",
  "success": true,
  "timestamp": 1756402868040
}
```

#### 在增量更新中新增剧集（并保留已有）
> 将新剧集直接放进 `episodes` 数组即可；服务会按 `(seriesId, episodeNumber)` upsert：
> - 若该 `episodeNumber` 不存在则创建
> - 若存在则按提供字段更新
> - 仅当显式传入 `removeMissingEpisodes: true` 才会删除本次未包含的剧集

```bash
curl -X POST http://localhost:8080/api/admin/ingest/series/update \
  -H "Content-Type: application/json" \
  -d '{
    "externalId": "series-001",
    "episodes": [
      {
        "episodeNumber": 3,                // 新增的集数（原来不存在）
        "title": "第3集：新的开始",
        "duration": 1500,
        "status": "published",
        "urls": [
          {
            "quality": "720p",
            "ossUrl": "https://oss.example.com/ep3.m3u8",
            "cdnUrl": "https://cdn.example.com/ep3.m3u8",
            "originUrl": "https://origin.example.com/ep3"
          }
        ]
      }
    ]
  }'
```

#### 在增量更新中为已有剧集新增清晰度URL
> 指定已存在的 `episodeNumber`，在其 `urls` 中放入新的 `quality`（如新增 1080p）；
> - 若该 `quality` 对应的 URL 已存在则更新
> - 若不存在则创建
> - 仅当显式传入 `removeMissingUrls: true` 才会删除本次未包含的清晰度URL

```bash
curl -X POST http://localhost:8080/api/admin/ingest/series/update \
  -H "Content-Type: application/json" \
  -d '{
    "externalId": "series-001",
    "episodes": [
      {
        "episodeNumber": 1,                // 已有的集数
        "urls": [
          {
            "quality": "1080p",           // 新增的清晰度
            "ossUrl": "https://oss.example.com/ep1-1080.m3u8",
            "cdnUrl": "https://cdn.example.com/ep1-1080.m3u8",
            "originUrl": "https://origin.example.com/ep1-1080"
          }
        ]
      }
    ]
  }'
```

## 🔑 ID和Key系统详解

### External ID 设计原则
```typescript
// External ID 是业务系统的核心标识符
// 设计原则：
// 1. 业务语义明确：如 "drama-2024-001", "movie-action-001"
// 2. 全局唯一性：在业务域内确保不重复
// 3. 可读性强：便于业务人员理解和维护
// 4. 稳定性：一旦分配，不建议随意修改
// 5. 扩展性：支持业务增长和分类扩展

// 命名规范示例：
// 格式：{业务类型}-{年份}-{序号}
// 示例：
// - "drama-2024-001"     // 2024年短剧第1部
// - "movie-action-2024-001" // 2024年动作电影第1部
// - "series-romance-001"  // 浪漫系列第1部
// - "webtoon-fantasy-001" // 奇幻网漫第1部

// 使用场景：
// 1. 数据同步：外部系统通过externalId同步数据
// 2. 增量更新：基于externalId进行部分数据更新
// 3. 业务关联：关联外部系统的业务数据
// 4. 数据追踪：追踪数据来源和变更历史
// 5. 跨系统集成：多个系统间的数据关联
```

### Short ID 生成机制
```typescript
// 系统自动分配，使用自定义字符集生成 11 位短ID（如 "Ab3K7mP2XyZ"）
// 特点：
// 1. 高熵随机、唯一性强
// 2. 不连续、不可预测（防枚举）
// 3. 适合对外展示与链接参数
// 注意：仍保留数值自增ID用于数据库关联与内部查询
```

### Access Key 生成算法
```typescript
// 基于以下参数生成稳定的访问密钥（SHA-256 + 应用密钥）：
// 1. externalId: 外部唯一标识
// 2. episodeNumber: 剧集编号
// 3. quality: 视频清晰度

// 生成公式（伪代码）：
// const raw = `${externalId}:${episodeNumber}:${quality}`;
// accessKey = SHA256(raw + '_' + APP_SECRET).hex().substring(0, 32);

// 示例（结果为32位十六进制字符串）：
// externalId: "test-series-001"
// episodeNumber: 1
// quality: "720p"
// 生成: "7f1a9c0d6b2e4a1f0c3d5e7a9b0c1d2e" // 示例值

// 特点：
// 1. 确定性：相同参数（在相同 APP_SECRET 下）总是生成相同的key
// 2. 唯一性：不同参数组合生成不同的key
// 3. 安全性：引入应用密钥，提高防伪造能力
// 4. 一致性：支持跨系统同步
```

### 使用场景示例

#### 1. 播放地址访问
```bash
# 通过Access Key访问播放地址（需要用户JWT认证）
curl -X GET \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  http://localhost:8080/api/video/episode-url/458ce373ef70440061d0a50a569b09d3

# 响应示例
{
  "ossUrl": "https://oss.example.com/ep1.m3u8",
  "cdnUrl": "https://cdn.example.com/ep1.m3u8",
  "originUrl": "https://origin.example.com/ep1"
}
```

#### 2. 系列页面访问
```bash
# 通过ID访问系列详情（当前接口使用数值ID）
GET /api/public/video/series/1001

# 响应示例
{
  "id": 1001,
  "title": "我的短剧系列",
  "episodes": [...]
}
```

#### 3. 数据同步
```bash
# 使用externalId进行增量更新
POST /api/admin/ingest/series/update
{
  "externalId": "test-series-001",
  "episodes": [...]
}
```

#### 4. 外部系统集成
```bash
# 外部CMS系统通过externalId同步数据
POST /api/admin/ingest/series
{
  "title": "来自CMS的短剧",
  "externalId": "cms-drama-2024-001",  // CMS系统的业务ID
  "description": "CMS系统同步的短剧内容",
  "episodes": [
    {
      "episodeNumber": 1,
      "title": "第1集",
      "urls": [
        {
          "quality": "720p",
          "ossUrl": "https://cms.example.com/ep1.m3u8",
          "cdnUrl": "https://cdn.example.com/ep1.m3u8",
          "originUrl": "https://cms.example.com/ep1"
        }
      ]
    }
  ]
}

# 后续通过externalId更新
POST /api/admin/ingest/series/update
{
  "externalId": "cms-drama-2024-001",  // 使用相同的externalId
  "title": "更新后的标题"
}
```

## 🔍 数据验证规则

### 字段验证
- **title**: 最大长度255字符
- **description**: 无长度限制
- **coverUrl**: 最大长度255字符，应为有效URL
- **score**: 范围0-10，支持小数
- **playCount**: 非负整数
- **upCount**: 非负整数
- **episodeNumber**: 正整数，最小值为1
- **duration**: 正整数，最小值为1
- **quality**: 必须是预定义值之一：["360p", "480p", "720p", "1080p", "4K"]
- **status**: 系列状态仅支持 "deleted"（软删除，可选），剧集状态必须是 ["published", "hidden", "draft"]
- **isCompleted**: 布尔值，true 或 false
- **statusOptionName**: 必须是有效的状态选项名称（如"连载中"、"已完结"等）

### 必填字段
- 系列：`externalId`, `title`, `description`, `coverUrl`, `categoryId`, `releaseDate`, `isCompleted`, `regionOptionName`, `languageOptionName`, `statusOptionName`, `yearOptionName`, `episodes`
- 系列可选：`genreOptionNames`（题材多选）、`status`（仅软删除时传 "deleted"）
- 剧集：`episodeNumber`, `title`, `duration`, `status`, `urls`
- 播放地址：`quality`, `cdnUrl`, `originUrl`  （`ossUrl` 可选）

### ID和Key验证
- **externalId**: 最大长度255字符，建议使用有意义的标识符
- **episodeNumber**: 同一系列内必须唯一
- **quality**: 必须是预定义的清晰度值
- **Access Key**: 系统自动生成，无需手动提供

## ⚠️ 错误处理

### 常见错误码
| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 400 | 请求参数错误 | 检查必填字段和数据类型 |
| 404 | 系列不存在 | 确认externalId是否正确 |
| 500 | 服务器内部错误 | 联系技术支持 |

### 错误响应格式
```json
{
  "statusCode": 400,
  "message": "参数验证失败",
  "error": "Bad Request"
}
```

> Ingest 接口特别说明：上述为通用错误示例。Ingest 采集端点统一返回 HTTP 200，错误以 `data.items[].statusCode`（如 400/404）和可选 `details` 表达，外层 `code` 恒为 200，详见单条/批量/增量的响应示例。

## 💡 使用示例

### 示例1：创建新系列（含题材）
```bash
curl -X POST http://localhost:8080/api/admin/ingest/series \
  -H "Content-Type: application/json" \
  -d '{
    "title": "我的短剧系列",
    "externalId": "my-series-001",
    "description": "一个精彩的短剧系列",
    "categoryId": 1,
    "releaseDate": "2025-01-01",
    "isCompleted": false,
    "regionOptionName": "大陆",
    "languageOptionName": "国语",
    "statusOptionName": "连载中",
    "yearOptionName": "2025",
    "genreOptionNames": ["言情", "都市"],
    "episodes": [
      {
        "episodeNumber": 1,
        "title": "第1集：开始",
        "duration": 1800,
        "status": "published",
        "urls": [
          {
            "quality": "720p",
            "ossUrl": "https://oss.example.com/ep1.m3u8",
            "cdnUrl": "https://cdn.example.com/ep1.m3u8",
            "originUrl": "https://origin.example.com/ep1"
          }
        ]
      }
    ]
  }'

# 响应示例
{
  "code": 200,
  "data": {
    "summary": { "created": 1, "updated": 0, "failed": 0, "total": 1 },
    "items": [
      { "seriesId": 1001, "shortId": "Ab3K7mP2XyZ", "externalId": "my-series-001", "action": "created", "title": "我的短剧系列" }
    ]
  },
  "message": "系列采集写入完成",
  "success": true,
  "timestamp": 1756402868040
}
```

### 示例2：批量导入
```bash
curl -X POST http://localhost:8080/api/admin/ingest/series/batch \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "title": "系列A",
        "externalId": "series-a",
        "episodes": [...]
      },
      {
        "title": "系列B", 
        "externalId": "series-b",
        "episodes": [...]
      }
    ]
  }'

# 响应示例
{
  "code": 200,
  "data": {
    "summary": { "created": 2, "updated": 0, "failed": 0, "total": 2 },
    "items": [
      { "statusCode": 200, "seriesId": 1001, "shortId": "Ab3K7mP2XyZ", "externalId": "series-a", "action": "created", "title": "系列A" },
      { "statusCode": 200, "seriesId": 1002, "shortId": "Cd9LmQ8RtUv", "externalId": "series-b", "action": "created", "title": "系列B" }
    ]
  },
  "message": "批量系列采集写入完成",
  "success": true,
  "timestamp": 1756402868040
}
```

### 示例3：增量更新
```bash
curl -X POST http://localhost:8080/api/admin/ingest/series/update \
  -H "Content-Type: application/json" \
  -d '{
    "externalId": "my-series-001",
    "title": "更新后的标题",
    "episodes": [
      {
        "episodeNumber": 2,
        "title": "新增第2集",
        "urls": [
          {
            "quality": "720p",
            "ossUrl": "https://oss.example.com/ep2.m3u8",
            "cdnUrl": "https://cdn.example.com/ep2.m3u8",
            "originUrl": "https://origin.example.com/ep2"
          }
        ]
      }
    ]
  }'

# 响应示例
{
  "code": 200,
  "data": {
    "summary": { "created": 0, "updated": 1, "failed": 0, "total": 1 },
    "items": [
      { "statusCode": 200, "seriesId": 1001, "shortId": "Ab3K7mP2XyZ", "externalId": "my-series-001", "action": "updated", "title": "更新后的标题" }
    ]
  },
  "message": "系列采集写入完成",
  "success": true,
  "timestamp": 1756402868040
}
```

### 示例4：通过Access Key访问播放地址
```bash
# 假设已知Access Key（需要用户JWT认证）
curl -X GET -H "Authorization: Bearer <YOUR_JWT_TOKEN>" http://localhost:8080/api/video/episode-url/458ce373ef70440061d0a50a569b09d3

# 响应示例
{
  "ossUrl": "https://oss.example.com/ep1.m3u8",
  "cdnUrl": "https://cdn.example.com/ep1.m3u8",
  "originUrl": "https://origin.example.com/ep1",
  "quality": "720p"
}
```

### 示例5：外部系统集成
```bash
# 外部CMS系统同步数据
curl -X POST http://localhost:8080/api/admin/ingest/series \
  -H "Content-Type: application/json" \
  -d '{
    "title": "来自CMS的短剧",
    "externalId": "cms-drama-2024-001",
    "description": "CMS系统同步的短剧内容",
    "episodes": [
      {
        "episodeNumber": 1,
        "title": "第1集",
        "urls": [
          {
            "quality": "720p",
            "ossUrl": "https://cms.example.com/ep1.m3u8",
            "cdnUrl": "https://cdn.example.com/ep1.m3u8",
            "originUrl": "https://cms.example.com/ep1"
          }
        ]
      }
    ]
  }'

# 后续通过externalId更新
curl -X POST http://localhost:8080/api/admin/ingest/series/update \
  -H "Content-Type: application/json" \
  -d '{
    "externalId": "cms-drama-2024-001",
    "title": "CMS更新后的标题"
  }'
```

## 🔧 高级功能

### 1. 智能字段处理
- 只更新提供的字段，未提供的字段保持原值
- 支持从不同字段获取备选值（如创建时 cdnUrl 可回退为 ossUrl）

### 2. 自动清理机制
- `removeMissingEpisodes`: 清理不再需要的剧集
- `removeMissingUrls`: 清理不再需要的播放地址
 - 当 `status=deleted` 时，对系列进行软删除：`isActive=0, deletedAt=当前时间`；其它写入将自动恢复为活跃状态。

### 3. 自动计数更新
- 自动更新系列的totalEpisodes字段

### 4. AccessKey生成
- 自动为每个URL生成唯一的访问密钥
- 基于externalId、episodeNumber和quality生成确定性密钥
- 支持跨系统数据同步

### 5. Short ID管理
- 系统自动分配唯一标识符
- 支持大规模数据导入
- 确保ID不可预测性和唯一性

### 6. External ID管理
- 支持业务语义的标识符设计
- 便于跨系统数据同步和关联
- 支持增量更新和版本控制

## 📊 性能优化建议

### 1. 批量操作
- 优先使用批量接口处理大量数据
- 单次批量操作建议不超过100个系列

### 2. 增量更新
- 使用增量更新接口而不是重新创建
- 只更新需要修改的字段

### 3. 数据预处理
- 在客户端验证数据格式
- 确保必填字段完整

### 4. ID和Key优化
- 合理设计externalId，便于管理和查询
- 利用Access Key的确定性特性进行缓存
- 使用有意义的externalId便于业务追踪

## 🚨 注意事项

### 1. 数据一致性
- `externalId` 是唯一标识，请确保不重复
- 剧集编号在同一系列内必须唯一
- Short ID由系统自动管理，不要手动修改

### 2. URL格式
- 所有URL字段必须是有效的HTTP/HTTPS链接
- 建议使用HTTPS协议

### 3. 文件大小
- 单个请求体建议不超过10MB
- 大量数据建议分批处理

### 4. 并发限制
- 建议并发请求数不超过10个
- 避免短时间内大量请求

### 5. ID和Key注意事项
- **Short ID**: 系统自动生成，不要依赖特定值
- **Access Key**: 基于参数确定性生成，相同参数总是生成相同key
- **externalId**: 建议使用有意义的业务标识符，便于业务管理和追踪

### 6. External ID设计建议
- **命名规范**: 使用统一的命名规范，如 `{业务类型}-{年份}-{序号}`
- **业务语义**: 确保ID具有明确的业务含义
- **扩展性**: 考虑未来业务增长，预留扩展空间
- **稳定性**: 一旦分配，避免随意修改
- **唯一性**: 在业务域内确保全局唯一

## 🔗 相关接口

- **健康检查**: `GET /api/health`
- **缓存管理**: `GET /api/cache/stats`
- **系列管理**: `GET /api/admin/series`
- **播放地址访问**: `GET /api/video/episode-url/:accessKey`（需用户认证）
- **系列详情**: `GET /api/public/video/series/:id`

### 相关接口变更（计数字段与筛选规则）
- `/api/list/getfiltersdata` 列表项新增：`likeCount`, `dislikeCount`, `favoriteCount`（聚合所有已发布 episodes 的对应计数）。
- `/api/list/getfiltersdata` 的 `upCount` 改为"当日新增集数"的实时统计（按 episodes.created_at 在当天 00:00~次日 00:00 计数）。
- 筛选位顺序固定为 `[sort, genre, region, language, year, status]`；第二位 `genre` 支持多选（如 `1,2-5-7,0,0,0,0`）。

#### ids 参数规则详解
- **格式**：`sort,genre,region,language,year,status`（6位，不足自动补0）
- **第二位题材（genre）**：
  - 单选：`ids=0,2,0,0,0,0`（仅题材 display_order=2）
  - 多选：`ids=0,1-3-5,0,0,0,0`（同时具备题材 1、3、5 的系列）
  - 不筛选：`ids=0,0,0,0,0,0`（题材位为 0）
- **与频道关系**：先按 `channeid` 筛选频道分类，再按 `ids` 各位进一步筛选（交集）
- **存储方式**：题材通过中间表 `series_genre_options` 关联，其他维度通过 `series` 表的外键字段关联

## 📞 技术支持

如遇到问题，请提供以下信息：
1. 请求的完整URL和参数
2. 错误响应内容
3. 服务器日志信息
4. 复现步骤
5. 相关的externalId和Access Key信息

---

**文档版本**: 1.0.0  
**最后更新**: 2025-09-01  
**维护团队**: 短剧系统开发团队

## 4. 查询系列进度（新增）

### 请求信息
- 方法: `GET`
- URL: `http://localhost:8080/api/admin/ingest/series/progress/:externalId`
- Content-Type: `application/json`

### 路径参数
- `externalId`: 系列的外部唯一标识

### 功能说明
- 通过 `externalId` 查询该系列当前更新进度，返回已更新到第几集（`upCount`）、进度文案（`upStatus`）、总集数（`totalEpisodes`）以及是否完结（`isCompleted`）。
- 返回前会轻量刷新一次进度，确保数据最新。

### 成功响应
```json
{
  "code": 200,
  "data": {
    "seriesId": 1001,
    "shortId": "Ab3K7mP2XyZ",
    "externalId": "series-001",
    "upCount": 12,
    "upStatus": "更新至第12集",
    "totalEpisodes": 12,
    "isCompleted": false
  },
  "message": "系列进度获取成功",
  "success": true,
  "timestamp": 1756402868040
}
```

### 错误响应
- 所有错误保持 HTTP 200，错误通过外层 `code` 与 `message` 表达。
```json
{
  "code": 404,
  "data": null,
  "message": "系列不存在",
  "success": false,
  "timestamp": 1756402868040
}
```
