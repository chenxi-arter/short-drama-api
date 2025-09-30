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
      "created_at": "2025-09-01T12:00:00.000Z"
    }
  ],
  "page": 1,
  "size": 20
}
```

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
  - `GET /api/admin/episodes?page=1&size=20&seriesId=<系列ID>`
  - 支持按 `seriesId` 过滤；返回包含 `series` 关系

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

### 播放地址管理 EpisodeUrl（某一集的播放源）
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
```

---

### 备注

- 当前接口未做鉴权与验证，前端需自行保证传参正确性。
- 所有时间字段请使用 ISO 8601 字符串（如 `2025-09-05T12:00:00Z`）。
- `users` 的 `id` 为 bigint，若前端使用 JavaScript，请注意大整数精度问题（建议在 UI 层以字符串管理；传输时可用数字或字符串，按后端实际配置调整）。

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


