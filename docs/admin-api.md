## Admin API 文档（供前端调用）

本模块提供基础的管理端 CRUD 接口，无需鉴权与参数验证（临时方案，后续可能增加）。

- 基础前缀: `http://localhost:3000/api`
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

资源路径: `/admin/banners`

- 列表
  - `GET /api/admin/banners?page=1&size=20`

- 详情
  - `GET /api/admin/banners/:id`

- 新增
  - `POST /api/admin/banners`
  - 字段：
    - `title` string（必填）
    - `imageUrl` string（必填）
    - `categoryId` number（必填）
    - `seriesId` number（可选）
    - `linkUrl` string（可选）
    - `weight` number（可选，默认 0）
    - `isActive` boolean（可选，默认 true）
    - `startTime` string ISO 时间（可选）
    - `endTime` string ISO 时间（可选）
    - `description` string（可选）
  - 请求示例：
```json
{
  "title": "首页 Banner",
  "imageUrl": "https://cdn.example.com/banner.png",
  "categoryId": 1,
  "seriesId": 12,
  "weight": 10,
  "isActive": true
}
```

- 更新
  - `PUT /api/admin/banners/:id`
  - 请求示例：
```json
{ "title": "首页 Banner - 更新", "weight": 20 }
```

- 删除
  - `DELETE /api/admin/banners/:id`

- 曝光/点击埋点（简单调用，方便前端）
  - `POST /api/banners/:id/impression` 记录展示 +1
  - `POST /api/banners/:id/click` 记录点击 +1
  - 字段变更：`banners` 实体新增 `impressions`、`clicks` 两个整数字段
  - 读取统计：管理端列表/详情接口会返回当前累计 `impressions` 与 `clicks`
  - 按日统计（趋势图）：`GET /api/banners/:id/stats?from=YYYY-MM-DD&to=YYYY-MM-DD`
```json
[
  { "date": "2025-09-01", "impressions": 2300, "clicks": 80 },
  { "date": "2025-09-02", "impressions": 2100, "clicks": 95 }
]
```

---

### 系列管理 Series

资源路径: `/admin/series`

- 列表
  - `GET /api/admin/series?page=1&size=20`

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

- 删除
  - `DELETE /api/admin/series/:id`

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
# 列出轮播图
curl -X GET "http://localhost:3000/api/admin/banners?page=1&size=10"

# 新建轮播图
curl -X POST "http://localhost:3000/api/admin/banners" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "首页 Banner",
    "imageUrl": "https://cdn.example.com/banner.png",
    "categoryId": 1,
    "weight": 10,
    "isActive": true
  }'

# 新建用户（注意 bigint 主键）
curl -X POST "http://localhost:3000/api/admin/users" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 6702079700,
    "first_name": "随风",
    "last_name": "",
    "username": "seo99991",
    "is_active": true
  }'

# 新建剧集
curl -X POST "http://localhost:3000/api/admin/episodes" \
  -H "Content-Type: application/json" \
  -d '{
    "seriesId": 12,
    "episodeNumber": 1,
    "title": "第一集",
    "duration": 1500
  }'
```

---

### 备注

- 当前接口未做鉴权与验证，前端需自行保证传参正确性。
- 所有时间字段请使用 ISO 8601 字符串（如 `2025-09-05T12:00:00Z`）。
- `users` 的 `id` 为 bigint，若前端使用 JavaScript，请注意大整数精度问题（建议在 UI 层以字符串管理；传输时可用数字或字符串，按后端实际配置调整）。


