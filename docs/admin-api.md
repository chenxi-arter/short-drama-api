## Admin API 文档（供前端调用）

本模块提供基础的管理端 CRUD 接口，无需鉴权与参数验证（临时方案，后续可能增加）。

- 基础前缀（根据运行方式不同）
  - 拆分部署（推荐）：
    - 客户端 API: `http://localhost:3000/api`
    - 管理端 API: `http://localhost:8080/api`
  - 单进程（main.ts 全量运行）：
    - 所有接口: `http://localhost:3000/api`
- Admin 路由前缀: `/admin`
- 统一返回：
  - 列表：`{ total, items, page, size }`
  - 详情/创建/更新：返回实体对象
  - 删除：`{ success: true }`

---

### 关于环境不允许 PUT/DELETE 的兼容说明

部分前端运行环境或中间层会拦截或屏蔽 `PUT/DELETE` 方法，导致无法直接调用管理端的更新、删除接口。为兼容这类场景，服务端已在管理端入口启用“方法覆盖（method override）”能力：

- 支持使用 `POST` 发起请求，并通过以下任一方式声明真实意图：
  - 请求头：`X-HTTP-Method-Override: PUT`（或 `DELETE`/`PATCH`）
  - 查询参数：`?_method=PUT`（或 `DELETE`/`PATCH`）

示例：

```bash
# 用 POST 替代原本的 PUT /api/admin/categories/:id
curl -X POST "http://localhost:8080/api/admin/categories/123" \
  -H "Content-Type: application/json" \
  -H "X-HTTP-Method-Override: PUT" \
  -d '{ "name": "新名称" }'

# 用 POST + 查询参数替代原本的 DELETE /api/admin/categories/:id
curl -X POST "http://localhost:8080/api/admin/categories/123?_method=DELETE"
```

同时，服务端已开启 CORS，允许以下特性以满足浏览器预检：

- 回显来源（`origin: true`），允许携带凭据（`credentials: true`）
- 允许方法：`GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS`
- 允许请求头：`Content-Type, Authorization, Accept, X-Requested-With, X-HTTP-Method-Override`
- 预检成功码：`204`

前端如果仍遇到仅能 `GET` 的情况，请在浏览器控制台检查预检请求是否成功，以及响应头是否包含上述允许的字段。

---

### 用户管理 Users

资源路径: `/admin/users`

- 列表
  - `GET /api/admin/users?page=1&size=20`
  - 每个用户项附带最近登录信息与活跃会话数：`lastLoginAt`、`lastLoginIp`、`lastLoginDevice`、`activeLogins`
  - 响应示例：
```json
{
  "total": 123,
  "items": [
    {
      "id": 1001,
      "shortId": "abc123XYZ",
      "first_name": "Tom",
      "last_name": "",
      "username": "tom",
      "is_active": true,
      "created_at": "2025-01-01T12:00:00.000Z",
      "lastLoginAt": "2025-09-05T12:34:56.000Z",
      "lastLoginIp": "203.0.113.10",
      "lastLoginDevice": "iPhone 15 iOS 18",
      "activeLogins": 2
    }
  ],
  "page": 1,
  "size": 20
}
```

- 详情
  - `GET /api/admin/users/:id`
  - 返回同样包含 `lastLoginAt`、`lastLoginIp`、`lastLoginDevice`、`activeLogins`

- 新增（注意：`id` 为 bigint 主键，必填）
  - `POST /api/admin/users`
  - 请求示例：
```json
{ "id": 6702079700, "first_name": "随风", "last_name": "", "username": "seo99991", "is_active": true }
```

- 更新
  - `PUT /api/admin/users/:id`
  - 请求示例：
```json
{ "first_name": "Alice", "is_active": false }
```

- 删除
  - `DELETE /api/admin/users/:id`

---

### 轮播图管理 Banners

资源路径（标准化控制器）：`/banners` ；兼容旧简化路由：`/admin/banners`

- 列表（带筛选）
  - `GET /api/banners?categoryId=&isActive=&page=1&size=10`
  - 响应：`{ code,msg,data:{ data, total, page, size }, success, timestamp }`

- 详情
  - `GET /api/banners/:id`
  - 响应：`{ code,msg,data: BannerResponseDto, success, timestamp }`

- 新增（CreateBannerDto，含校验与时间顺序检查）
  - `POST /api/banners`
  - 字段：`title,imageUrl,categoryId,seriesId?,linkUrl?,weight?,isActive?,isAd?,startTime?,endTime?,description?`

- 更新（UpdateBannerDto）
  - `PUT /api/banners/:id`

- 删除
  - `DELETE /api/banners/:id`

- 启用/禁用
  - `PUT /api/banners/:id/status` Body: `{ "isActive": true|false }`

- 批量调权
  - `PUT /api/banners/weights` Body: `{ "updates": [{ "id": 12, "weight": 200 }] }`

- 获取活跃 Banner（前台）
  - `GET /api/banners/active/list?categoryId=&limit=5`
  - 返回项：`{ showURL,title,id,shortId,channeID,url,isAd }`

- 曝光/点击与统计
  - `POST /api/banners/:id/impression`、`POST /api/banners/:id/click`
  - `GET /api/banners/:id/stats?from=YYYY-MM-DD&to=YYYY-MM-DD`
  - 示例：`[{ "date": "2025-09-01", "impressions": 2300, "clicks": 80 }]`

#### 用途区分：广告位 vs 剧集轮播

- 广告位（Ad Banner）
  - 关键字段：`isAd=true`
  - 建议：`title,imageUrl,linkUrl,isActive,weight,categoryId`；可选 `startTime,endTime,impressions,clicks`
  - 通常不需要 `seriesId`
  - 示例（创建）：
```bash
curl -X POST "http://localhost:8080/api/admin/banners" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "首页顶部广告",
    "imageUrl": "https://static.656932.com/banners/ad_top.jpg",
    "linkUrl": "https://example.com/promo",
    "isAd": true,
    "isActive": true,
    "weight": 100,
    "categoryId": 1
  }'
```

- 剧集轮播（Series Banner）
  - 关键字段：`isAd=false`、`seriesId`（必填）
  - 建议：`title,imageUrl,seriesId,isActive,weight,categoryId`；可选 `linkUrl`
  - 示例（创建）：
```bash
curl -X POST "http://localhost:8080/api/admin/banners" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "热播 · 朱雀堂",
    "imageUrl": "https://static.656932.com/banners/series_zhuquetang.jpg",
    "seriesId": 2455,
    "isAd": false,
    "isActive": true,
    "weight": 200,
    "categoryId": 1
  }'
```

#### 图片上传并更新（直接绑定到某个 Banner）

- 直传文件（multipart/form-data）
  - `POST /api/admin/banners/:id/image`
  - 表单字段：`file`（图片文件）
  - 说明：服务端将图片存入 R2，并把生成的 URL（或 key）写回该 Banner 的 `imageUrl` 字段
  - cURL 示例：
```bash
curl -X POST "http://localhost:8080/api/admin/banners/123/image" \
  -H "Accept: application/json" \
  -F "file=@/path/to/banner.jpg"
```

- 通过 URL 抓取并更新图片
  - `POST /api/admin/banners/:id/image-from-url`
  - Body：`{ "url": "https://example.com/image.jpg" }`
  - 说明：后端从该 URL 抓取图片，上传到 R2，并更新 `imageUrl`
  - cURL 示例：
```bash
curl -X POST "http://localhost:8080/api/admin/banners/123/image-from-url" \
  -H "Content-Type: application/json" \
  -d '{ "url": "https://example.com/image.jpg" }'
```

---

<!-- 已移除通用上传接口，改为仅保留按 Banner 绑定的上传接口（见上文“图片上传并更新”） -->

### 分类管理 Categories

资源路径: `/admin/categories`

- 列表
  - `GET /api/admin/categories?page=1&size=20`
  - 响应：`{ total, items, page, size }`
  - Category 字段：`id, categoryId, name, routeName, isEnabled, createdAt, updatedAt`

- 新增
  - `POST /api/admin/categories`
  - 请求示例：
```json
{
  "categoryId": "test-cat",
  "name": "测试分类",
  "routeName": "test",
  "isEnabled": true
}
```

- 删除
  - `DELETE /api/admin/categories/:id`

说明：`isEnabled` 支持 `true/false`、`"true"/"false"`、`1/0`、`"1"/"0"` 的输入，服务端会做归一化。

---

### 系列管理 Series

资源路径: `/admin/series`

- 列表（默认仅显示未删除的系列）
  - `GET /api/admin/series?page=1&size=20&includeDeleted=false`
  - 参数：
    - `includeDeleted=true` 显示所有系列（包括已删除）
    - `includeDeleted=false` 或不传：仅显示未删除系列（默认）
  - 响应示例：
```json
{
  "total": 1200,
  "items": [
    {
      "id": 2455,
      "shortId": "kK22TBWdV7q",
      "title": "朱雀堂",
      "description": "一部精彩的短剧...",
      "coverUrl": "https://cdn.example.com/cover.jpg",
      "isActive": 1,
      "deletedAt": null,
      "createdAt": "2025-09-01T12:00:00.000Z",
      "updatedAt": "2025-10-11T08:25:28.000Z"
    }
  ],
  "page": 1,
  "size": 20
}
```

**字段说明**：
- `createdAt`: 创建时间（ISO 8601 格式，UTC时区）
- `updatedAt`: 最后更新时间（ISO 8601 格式，UTC时区）

- 已删除系列列表
  - `GET /api/admin/series/deleted?page=1&size=20`
  - 专门获取已删除的系列列表，按删除时间倒序排列
  - 响应示例：
```json
{
  "total": 5,
  "items": [
    {
      "id": 2456,
      "title": "已删除的系列",
      "isActive": 0,
      "deletedAt": "2025-09-20T15:30:00.000Z",
      "deletedBy": null
    }
  ],
  "page": 1,
  "size": 20
}
```

- 详情
  - `GET /api/admin/series/:id`

- 新增
  - `POST /api/admin/series`
  - 关键字段：
    - `title` string（必填）
    - `description` string（可选）
    - `coverUrl` string（可选）
    - `categoryId` number（可选）

- 更新
  - `PUT /api/admin/series/:id`

- 软删除（推荐使用，不会违反外键约束）
  - `DELETE /api/admin/series/:id`
  - 说明：使用软删除机制，数据不会被真正删除，只是标记为删除状态
  - 响应示例：
```json
{
  "success": true,
  "message": "剧集已成功删除"
}
```

- 恢复已删除的系列
  - `POST /api/admin/series/:id/restore`
  - 将已软删除的系列恢复为正常状态
  - 响应示例：
```json
{
  "success": true,
  "message": "剧集已成功恢复"
}
```

### 单集管理 Episode（系列下的具体某一集）

资源路径: `/admin/episodes`

- 列表
  - `GET /api/admin/episodes?page=1&size=20&seriesId=<系列ID>&minDuration=<最小时长>&maxDuration=<最大时长>`
  - 支持按 `seriesId` 过滤；返回包含 `series` 关系
  - 支持按时长筛选：
    - `minDuration` number（可选）：最小时长（秒），返回大于等于该时长的剧集
    - `maxDuration` number（可选）：最大时长（秒），返回小于等于该时长的剧集
    - 可以同时使用 `minDuration` 和 `maxDuration` 进行范围筛选
  - 示例：
    - 获取时长大于等于600秒的剧集：`/api/admin/episodes?minDuration=600`
    - 获取时长小于等于1800秒的剧集：`/api/admin/episodes?maxDuration=1800`
    - 获取时长在600-1800秒之间的剧集：`/api/admin/episodes?minDuration=600&maxDuration=1800`
  - 响应示例：
```json
{
  "total": 28808,
  "items": [
    {
      "id": 28808,
      "shortId": "Ry876Buxoxrc",
      "episodeNumber": 69,
      "title": "69",
      "duration": 528,
      "status": "published",
      "isVertical": false,
      "likeCount": 32,
      "dislikeCount": 0,
      "favoriteCount": 0,
      "playCount": 36,
      "seriesId": 3143,
      "createdAt": "2025-10-06T16:00:01.078Z",
      "updatedAt": "2025-10-06T16:00:01.078Z",
      "series": {
        "id": 3143,
        "title": "今天的她们112"
      }
    }
  ],
  "page": 1,
  "size": 20
}
```

**时间字段说明**：
- `createdAt`: 剧集创建时间（ISO 8601 格式，UTC时区）
- `updatedAt`: 剧集最后更新时间（ISO 8601 格式，UTC时区）

- 详情
  - `GET /api/admin/episodes/:id`
  - 返回包含 `series`、`urls` 关系

- 新增
  - `POST /api/admin/episodes`
  - 关键字段：
    - `seriesId` number（必填，所属系列）
    - `episodeNumber` number（必填，集序号）
    - `title` string（必填）
    - `duration` number（必填，单位秒）
    - `status` string（可选，默认 `published`）
  - 说明：`shortId`、`accessKey` 插入时自动生成。

- 更新
  - `PUT /api/admin/episodes/:id`

- 删除
  - `DELETE /api/admin/episodes/:id`

- 获取下载地址
  - `GET /api/admin/episodes/:id/download-urls`
  - 说明：获取指定剧集的所有清晰度播放地址，用于下载功能
  - 响应示例：
```json
{
  "success": true,
  "episodeId": 2136,
  "episodeShortId": "CcPcMmtTAHa",
  "episodeTitle": "第1集：初次相遇",
  "episodeNumber": 1,
  "seriesId": 2003,
  "seriesTitle": "朱雀堂",
  "duration": 1500,
  "downloadUrls": [
    {
      "id": 592,
      "quality": "720p",
      "cdnUrl": "https://cdn.example.com/video/720p.m3u8",
      "ossUrl": "https://oss.example.com/video/720p.mp4",
      "originUrl": "https://origin.example.com/video.mp4",
      "subtitleUrl": null,
      "accessKey": "FE27A9CA890D9B196E211D783C622716"
    },
    {
      "id": 593,
      "quality": "1080p",
      "cdnUrl": "https://cdn.example.com/video/1080p.m3u8",
      "ossUrl": "https://oss.example.com/video/1080p.mp4",
      "originUrl": "https://origin.example.com/video.mp4",
      "subtitleUrl": "https://cdn.example.com/subtitles/cn.srt",
      "accessKey": "AB12CD34EF56GH78IJ90KL12MN34OP56"
    }
  ]
}
```

### 播放地址管理 EpisodeUrl（某一集的播放源）
---

### 系列数据验证 Series Validation ⭐ 新增

资源路径: `/admin/series/validation`

**功能说明**: 检测系列数据完整性和唯一性问题

- 获取统计
  - `GET /api/admin/series/validation/stats`
  - 快速了解数据质量概览
  - 响应示例：
```json
{
  "success": true,
  "data": {
    "totalSeries": 1127,
    "seriesWithoutEpisodes": 0,
    "sampleSize": 100,
    "issuesInSample": 2,
    "estimatedTotalIssues": 23,
    "estimatedIssueRate": "2.0%"
  }
}
```

- 检查缺集（集数不连续）
  - `GET /api/admin/series/validation/check-missing-episodes`
  - 默认检查全部系列（⭐ 无需参数）
  - 检测系列内集数是否连续（如：有1,2,4,5集，缺第3集）
  - 参数：
    - `seriesId` number 可选：检查指定系列
    - `limit` number 可选：限制检查数量（最大10000）
    - `checkAll` boolean 可选：false时只检查前100个
  - 示例：
```bash
# 检查全部系列（默认）
curl "http://localhost:9090/api/admin/series/validation/check-missing-episodes"

# 只检查前100个
curl "http://localhost:9090/api/admin/series/validation/check-missing-episodes?limit=100"

# 检查指定系列
curl "http://localhost:9090/api/admin/series/validation/check-missing-episodes?seriesId=2455"
```

  - 响应示例：
```json
{
  "success": true,
  "data": {
    "total": 1,
    "checkedSeries": 1127,
    "items": [
      {
        "seriesId": 2455,
        "seriesTitle": "朱雀堂",
        "seriesShortId": "kK22TBWdV7q",
        "totalEpisodes": 20,
        "expectedEpisodes": 21,
        "missingEpisodes": [3, 15],
        "duplicateEpisodes": [],
        "status": "HAS_ISSUES",
        "issues": {
          "hasMissing": true,
          "hasDuplicates": false,
          "missingCount": 2,
          "duplicateCount": 0
        }
      }
    ]
  },
  "message": "发现 1 个系列存在集数问题"
}
```

- 检查重复系列名 ⭐
  - `GET /api/admin/series/validation/check-duplicate-names`
  - 默认检查全部系列（⭐ 无需参数）
  - 检测多个系列使用相同标题的情况
  - 参数：同上
  - 示例：
```bash
# 检查全部系列（默认）
curl "http://localhost:9090/api/admin/series/validation/check-duplicate-names"
```

  - 响应示例：
```json
{
  "success": true,
  "data": {
    "total": 1,
    "checkedSeries": 1127,
    "totalDuplicateCount": 3,
    "items": [
      {
        "title": "朱雀堂",
        "count": 3,
        "series": [
          {
            "id": 2001,
            "shortId": "abc123",
            "title": "朱雀堂",
            "externalId": "source-1",
            "createdAt": "2024-01-01T00:00:00.000Z"
          },
          {
            "id": 2455,
            "shortId": "xyz789",
            "title": "朱雀堂",
            "externalId": "source-2",
            "createdAt": "2024-06-01T00:00:00.000Z"
          }
        ]
      }
    ]
  },
  "message": "发现 1 个重复的系列名"
}
```

- 检查重复外部ID ⭐
  - `GET /api/admin/series/validation/check-duplicate-external-ids`
  - 默认检查全部系列（⭐ 无需参数）
  - 检测externalId冲突（数据一致性问题）
  - 响应格式同上

- 查看系列详细集数信息
  - `GET /api/admin/series/validation/episodes/:seriesId`
  - 查看指定系列的完整集数信息和问题详情
  - 响应示例：
```json
{
  "success": true,
  "data": {
    "series": {
      "id": 2455,
      "shortId": "kK22TBWdV7q",
      "title": "朱雀堂",
      "totalEpisodes": 20,
      "isCompleted": true
    },
    "episodes": [
      {
        "id": 12328,
        "shortId": "6JswefD4QXK",
        "episodeNumber": 1,
        "title": "第1集",
        "status": "published",
        "duration": 300
      }
    ],
    "validation": {
      "expectedCount": 21,
      "actualCount": 20,
      "isContinuous": false,
      "missingEpisodes": [3, 15],
      "duplicates": []
    }
  }
}
```

**使用建议**：
- 建议每周定期检查数据质量
- 采集新内容后及时验证
- 所有接口默认检查全部系列，性能优秀（< 1秒）

**详细文档**: 参见 `admin-series-validation-api.md`

---

### 模糊搜索 Fuzzy Search

资源路径：`/list/fuzzysearch`

- 方法：`GET /api/list/fuzzysearch?keyword=xxx&channeid=&page=1&size=20`
- 入参（FuzzySearchDto）：
  - `keyword` string 必填：搜索关键词
  - `channeid` string 可选：频道ID，不传搜全部
  - `page` number 可选：默认 1
  - `size` number 可选：默认 20
- 响应（FuzzySearchResponse）：
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 2436,
        "shortId": "kK22TBWdV7q",
        "coverUrl": "https://.../cover.gif",
        "title": "朱雀堂",
        "score": "7.7",
        "playCount": 1298564,
        "url": "kK22TBWdV7q",
        "type": "短剧",
        "isSerial": true,
        "upStatus": "已完结",
        "upCount": 0,
        "author": "演员A,演员B",
        "description": "简介...",
        "cidMapper": "1",
        "isRecommend": false,
        "createdAt": "2025-09-19 04:56",
        "channeid": 1
      }
    ],
    "total": 100,
    "page": 1,
    "size": 20,
    "hasMore": true
  },
  "msg": "success"
}
```

说明：
- 该接口不启用服务端缓存（避免键爆炸）。
- `isRecommend` 在模糊搜索中当前默认为 false（可按业务改为评分阈值或人工标记）。

### 仪表盘 Dashboard（融合各管理信息）

- 概览
  - `GET /api/admin/dashboard/overview?from=YYYY-MM-DD&to=YYYY-MM-DD`
  - 返回：用户、系列、单集、轮播、评论、播放等核心指标，以及可选时间区间内的统计
```json
{
  "users": { "total": 40689, "new24h": 123, "activeLogins": 2040, "lastLoginAtLatest": "2025-09-05T12:34:56.000Z" },
  "series": { "total": 1200 },
  "episodes": { "total": 100293 },
  "banners": { "total": 18 },
  "comments": { "total": 89000, "new24h": 450 },
  "plays": { "totalPlayCount": 1234567, "last24hVisits": 34567 },
  "range": { "usersInRange": 1000, "visitsInRange": 45000, "playActiveInRange": 22000 }
}
```

- 趋势图（按天/周）
  - `GET /api/admin/dashboard/timeseries?from=YYYY-MM-DD&to=YYYY-MM-DD&granularity=day`
  - 返回：按日期聚合的新增用户/访问活跃/播放活跃
```json
{
  "series": [
    { "date": "2025-09-01", "newUsers": 120, "visits": 4300, "playActive": 2100 },
    { "date": "2025-09-02", "newUsers": 98,  "visits": 4100, "playActive": 2300 }
  ]
}
```

- Top 榜单
  - `GET /api/admin/dashboard/top?metric=series_play|series_visit&limit=10&from=&to=`
  - 返回：播放量或访问量最高的系列列表
```json
{
  "items": [
    { "seriesId": 12, "title": "系列A", "playCount": 123456, "visitCount": 34567 }
  ]
}
```

- 最新动态
  - `GET /api/admin/dashboard/recent-activities?limit=10`
  - 返回：最近新增的用户/系列/单集/评论
```json
{
  "users": [{ "id": 1, "username": "tom", "created_at": "..." }],
  "series": [{ "id": 12, "title": "系列A", "created_at": "..." }],
  "episodes": [{ "id": 100, "seriesId": 12, "title": "第1集", "created_at": "..." }],
  "comments": [{ "id": 9, "userId": 1, "episodeId": 100, "created_at": "..." }]
}
```


当前通过单集详情接口返回 `urls` 数组；如需单独的 CRUD，可后续补充：
- 列表/新增/更新/删除 路由建议：`/admin/episode-urls`

---

### cURL 示例

```bash
# 列出轮播图（标准化）
curl -X GET "http://localhost:3000/api/banners?page=1&size=10"

# 新建轮播图（标准化）
curl -X POST "http://localhost:3000/api/banners" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "首页 Banner",
    "imageUrl": "https://cdn.example.com/banner.png",
    "categoryId": 1,
    "weight": 10,
    "isActive": true
  }'

# 新建用户（注意 bigint 主键）
curl -X POST "http://localhost:8080/api/admin/users" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 6702079700,
    "first_name": "随风",
    "last_name": "",
    "username": "seo99991",
    "is_active": true
  }'

# 新建剧集
curl -X POST "http://localhost:8080/api/admin/episodes" \
  -H "Content-Type: application/json" \
  -d '{
    "seriesId": 12,
    "episodeNumber": 1,
    "title": "第一集",
    "duration": 1500
  }'

# 获取剧集下载地址
curl -X GET "http://localhost:8080/api/admin/episodes/2136/download-urls" \
  -H "Content-Type: application/json"

# 系列管理 - 软删除功能示例

# 获取所有系列（仅未删除）
curl -X GET "http://localhost:8080/api/admin/series?page=1&size=20"

# 获取所有系列（包括已删除）
curl -X GET "http://localhost:8080/api/admin/series?page=1&size=20&includeDeleted=true"

# 获取已删除系列列表
curl -X GET "http://localhost:8080/api/admin/series/deleted?page=1&size=20"

# 软删除系列（推荐使用，不会出现外键约束错误）
curl -X DELETE "http://localhost:8080/api/admin/series/2455" \
  -H "Content-Type: application/json"

# 恢复已删除的系列
curl -X POST "http://localhost:8080/api/admin/series/2455/restore" \
  -H "Content-Type: application/json"

# 系列数据验证 ⭐

# 检查缺集（默认检查全部）
curl -X GET "http://localhost:9090/api/admin/series/validation/check-missing-episodes"

# 检查重复系列名（默认检查全部）
curl -X GET "http://localhost:9090/api/admin/series/validation/check-duplicate-names"

# 检查重复外部ID（默认检查全部）
curl -X GET "http://localhost:9090/api/admin/series/validation/check-duplicate-external-ids"

# 获取数据质量统计
curl -X GET "http://localhost:9090/api/admin/series/validation/stats"

# 查看指定系列的集数详情
curl -X GET "http://localhost:9090/api/admin/series/validation/episodes/2455"
```

---

### 备注

- 当前接口未做鉴权与验证，前端需自行保证传参正确性。
- 所有时间字段请使用 ISO 8601 字符串（如 `2025-09-05T12:00:00Z`）。
- `users` 的 `id` 为 bigint，若前端使用 JavaScript，请注意大整数精度问题（建议在 UI 层以字符串管理；传输时可用数字或字符串，按后端实际配置调整）。

#### 时间字段说明

所有接口返回的时间字段（`createdAt`、`updatedAt`、`deletedAt` 等）均采用 **ISO 8601 格式（UTC 时区）**。

**示例**：`"2025-10-06T15:53:30.250Z"`

**前端时间格式转换**：

```javascript
// 方法1：转换为本地时间字符串
const createdAt = "2025-10-06T15:53:30.250Z";
const date = new Date(createdAt);
const localTime = date.toLocaleString('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
});
// 输出：2025/10/06 23:53:30 (北京时间 UTC+8)

// 方法2：使用 Day.js 格式化
import dayjs from 'dayjs';
const formatted = dayjs(createdAt).format('YYYY-MM-DD HH:mm:ss');
// 输出：2025-10-06 23:53:30

// 方法3：相对时间（如"2天前"）
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
const relative = dayjs(createdAt).fromNow();
// 输出：2天前
```

#### 视频下载功能说明

- **下载接口**：`GET /api/admin/episodes/:id/download-urls`
  - 返回指定剧集的所有清晰度播放地址
  - 包含 CDN 地址、OSS 地址、原始地址和字幕地址
  - 不包含下载统计功能（按需求无需统计）
- **地址说明**：
  - `cdnUrl`: CDN 加速地址，适合在线播放（可能是 m3u8 流媒体格式）
  - `ossUrl`: 对象存储直链，适合直接下载（通常是 mp4 格式）
  - `originUrl`: 原始来源地址，用于追溯或回源
  - `subtitleUrl`: 外挂字幕文件地址（可选）
- **使用建议**：
  - 推荐使用 `ossUrl` 进行文件下载，速度更快且格式通用
  - 如果需要字幕，可同时下载 `subtitleUrl` 指向的字幕文件
  - 下载时可根据 `quality` 字段让用户选择清晰度

#### 软删除机制说明

- **系列删除**已改为软删除机制，解决了原有的外键约束问题
- 软删除字段：
  - `isActive`: 1=正常，0=已删除
  - `deletedAt`: 删除时间（NULL=未删除）
  - `deletedBy`: 删除者用户ID（可选）
- **优势**：
  - 避免外键约束错误（系列下有剧集时也可以删除）
  - 支持数据恢复
  - 保留数据完整性
  - 提供删除历史记录
- **前端注意事项**：
  - 默认列表只显示未删除项（`isActive=1`）
  - 可通过 `includeDeleted=true` 查看所有项
  - 使用专门的 `/deleted` 端点查看回收站
  - 删除操作返回成功消息而非简单的 `{success: true}`


