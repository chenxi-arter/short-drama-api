# Ingest API 完整指南

## 📖 概述

Ingest API 是短剧系统的核心数据采集接口，提供完整的系列、剧集和播放地址管理功能。支持单个系列入库、批量系列入库和增量更新等操作。

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
- **格式**: 32位十六进制字符串，如 "458ce373ef70440061d0a50a569b09d3"
- **生成规则**: 基于 `externalId + episodeNumber + quality` 的MD5哈希
- **使用场景**: 播放地址访问、防盗链、统计分析
- **特点**: 确定性生成，相同参数总是生成相同的key

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
  "status": "on-going",
  "releaseDate": "2024-01-01",
  "isCompleted": false,
  "score": 8.5,
  "playCount": 1000,
  "upStatus": "up",
  "upCount": 50,
  "starring": "主演",
  "actor": "演员",
  "director": "导演",
  "regionOptionId": 1,
  "languageOptionId": 1,
  "statusOptionId": 1,
  "yearOptionId": 1,
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
| `status` | string | ✅ | 系列状态 | "on-going" 或 "completed" |
| `releaseDate` | string | ✅ | 发布日期（ISO日期） | "2024-01-01" |
| `isCompleted` | boolean | ✅ | 是否完结 | true/false |
| `score` | number | ❌ | 评分（0-10） | 8.5 |
| `playCount` | number | ❌ | 播放次数（≥0） | 1000 |
| `upStatus` | string | ❌ | 点赞状态（≤255） | "up" |
| `upCount` | number | ❌ | 点赞数量（≥0） | 50 |
| `starring` | string | ❌ | 主演（逗号分隔） | "张三,李四" |
| `actor` | string | ❌ | 全演员（逗号分隔） | "张三,李四,王五" |
| `director` | string | ❌ | 导演（≤255） | "导演A" |
| `regionOptionId` | number | ✅ | 地区选项ID（≥1） | 1 |
| `languageOptionId` | number | ✅ | 语言选项ID（≥1） | 1 |
| `statusOptionId` | number | ✅ | 状态选项ID（≥1） | 1 |
| `yearOptionId` | number | ✅ | 年份选项ID（≥1） | 1 |

###### 关于 OptionId 的取值说明（来自数据库 filter_options）
- 这些 ID 来自表 `filter_options`，按 `filter_types.code` 分类。下面列出系统内置映射，若你在库中新增/调整，会以库内为准。

1) 地区（`regionOptionId`，filter_types.code = "region"）
- 10: 全部地区 (all)
- 11: 大陆 (mainland)
- 12: 香港 (hongkong)
- 13: 台湾 (taiwan)
- 14: 日本 (japan)

2) 语言（`languageOptionId`，code = "language"）
- 15: 全部语言 (all)
- 16: 国语 (mandarin)
- 17: 粤语 (cantonese)
- 18: 英语 (english)
- 19: 韩语 (korean)

3) 年份（`yearOptionId`，code = "year"）
- 20: 全部年份 (all)
- 21: 2025
- 22: 2024
- 23: 2023
- 24: 更早 (earlier)
- 25: 90年代 (1990s)

4) 状态（`statusOptionId`，code = "status"）
- 26: 全部状态 (all)
- 27: 全集 (complete)
- 28: 连载中 (ongoing)

示例：大陆/国语/连载中/2025年 → `regionOptionId: 11`, `languageOptionId: 16`, `statusOptionId: 28`, `yearOptionId: 21`。

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
// 基于以下参数生成MD5哈希：
// 1. externalId: 外部唯一标识
// 2. episodeNumber: 剧集编号  
// 3. quality: 视频清晰度

// 生成公式：
// accessKey = MD5(externalId + episodeNumber + quality)

// 示例：
// externalId: "test-series-001"
// episodeNumber: 1
// quality: "720p"
// 生成: "458ce373ef70440061d0a50a569b09d3"

// 特点：
// 1. 确定性：相同参数总是生成相同的key
// 2. 唯一性：不同参数组合生成不同的key
// 3. 安全性：无法反向推导原始参数
// 4. 一致性：支持跨系统同步
```

### 使用场景示例

#### 1. 播放地址访问
```bash
# 通过Access Key访问播放地址
GET /api/video/episode-url/458ce373ef70440061d0a50a569b09d3

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
- **status**: 系列状态必须是 ["on-going", "completed"]，剧集状态必须是 ["published", "hidden", "draft"]

### 必填字段
- 系列：`externalId`, `title`, `description`, `coverUrl`, `categoryId`, `status`, `releaseDate`, `isCompleted`, `regionOptionId`, `languageOptionId`, `statusOptionId`, `yearOptionId`, `episodes`
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

## 💡 使用示例

### 示例1：创建新系列
```bash
curl -X POST http://localhost:8080/api/admin/ingest/series \
  -H "Content-Type: application/json" \
  -d '{
    "title": "我的短剧系列",
    "externalId": "my-series-001",
    "description": "一个精彩的短剧系列",
    "episodes": [
      {
        "episodeNumber": 1,
        "title": "第1集：开始",
        "duration": 1800,
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
# 假设已知Access Key
curl -X GET http://localhost:8080/api/video/episode-url/458ce373ef70440061d0a50a569b09d3

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
- 支持从不同字段获取备选值（如从ossUrl获取originUrl）

### 2. 自动清理机制
- `removeMissingEpisodes`: 清理不再需要的剧集
- `removeMissingUrls`: 清理不再需要的播放地址

### 3. 自动计数更新
- 自动更新系列的totalEpisodes字段

### 4. AccessKey生成
- 自动为每个URL生成唯一的访问密钥
- 基于externalId、episodeNumber和quality生成确定性密钥
- 支持跨系统数据同步

### 5. Short ID管理
- 系统自动分配唯一标识符
- 支持大规模数据导入
- 确保ID连续性和唯一性

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
- **播放地址访问**: `GET /api/video/episode-url/:accessKey`
- **系列详情**: `GET /api/public/video/series/:id`

## 📞 技术支持

如遇到问题，请提供以下信息：
1. 请求的完整URL和参数
2. 错误响应内容
3. 服务器日志信息
4. 复现步骤
5. 相关的externalId和Access Key信息

---

**文档版本**: 1.0.0  
**最后更新**: 2025-08-29  
**维护团队**: 短剧系统开发团队
