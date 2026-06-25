## Admin API 文档（供前端调用）

本模块提供管理端 CRUD 与数据统计接口。除管理员认证接口外，所有 `/admin/**` 管理端接口都需要携带管理员登录 token。

- 基础前缀（根据运行方式不同）
  - 拆分部署（推荐）：
    - 客户端 API: `http://localhost:3000/api`
    - 管理端 API: `http://localhost:8080/api`
  - 单进程（main.ts 全量运行）：
    - 所有接口: `http://localhost:3000/api`
- Admin 路由前缀: `/admin`
- 鉴权方式：`Authorization: Bearer <admin_access_token>`
- 统一返回：
  - 列表：`{ total, items, page, size }`
  - 详情/创建/更新：返回实体对象
  - 删除：`{ success: true }`

---

### 管理员认证 Admin Auth

资源路径: `/admin/auth`

- 初始化第一个管理员
  - `POST /api/admin/auth/init`
  - 仅当 `admin_users` 表为空时可用；已有管理员后会返回冲突错误
  - 请求示例：
```json
{
  "username": "admin",
  "password": "Admin123",
  "name": "超级管理员"
}
```

- 管理员登录
  - `POST /api/admin/auth/login`
  - 请求示例：
```json
{
  "username": "admin",
  "password": "Admin123"
}
```
  - 响应示例：
```json
{
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 28800,
  "admin": {
    "id": 1,
    "username": "admin",
    "name": "超级管理员",
    "role": "super_admin",
    "isActive": true
  }
}
```

- 获取当前管理员信息
  - `GET /api/admin/auth/me`
  - 请求头：`Authorization: Bearer <admin_access_token>`

- 调用其他管理端接口
```bash
curl "http://localhost:8080/api/admin/users?page=1&size=20" \
  -H "Authorization: Bearer <admin_access_token>"
```

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
  - 每个用户项附带累计登录次数、当前有效会话数、时间窗口内在线时长、时间窗口内观看时长、在线状态
  - 支持筛选参数：
    | 参数 | 类型 | 必填 | 说明 |
    |------|------|------|------|
    | `page` | number | 否 | 页码，默认 `1` |
    | `size` | number | 否 | 每页数量，默认 `20` |
    | `startDate` | string | 否 | 统计开始日期，用于框定在线时长和观看时长，格式 `YYYY-MM-DD`，例如 `2026-06-22` |
    | `endDate` | string | 否 | 统计结束日期，格式 `YYYY-MM-DD`，例如 `2026-06-22`；服务端按自然日结束开区间处理，即 `< 次日 00:00` |
    | `loginCount` | number | 否 | 精确筛选累计登录次数，来源 `refresh_tokens` 计数 |
    | `minLoginCount` | number | 否 | 累计登录次数最小值 |
    | `maxLoginCount` | number | 否 | 累计登录次数最大值 |
    | `watchDurationRange` | string | 否 | 时间窗口内总播放时长区间，单位分钟，例如 `0-60`、`60-120`、`120-180`，来源 `watch_logs.watch_duration` |
    | `minWatchMinutes` | number | 否 | 自定义时间窗口内总播放时长最小值，单位分钟 |
    | `maxWatchMinutes` | number | 否 | 自定义时间窗口内总播放时长最大值，单位分钟 |
    | `onlineDurationRange` | string | 否 | 时间窗口内心跳在线时长区间，单位分钟，例如 `0-60`、`60-120`、`120-180`，来源 `user_online_daily.duration` |
    | `minOnlineMinutes` | number | 否 | 自定义时间窗口内心跳在线时长最小值，单位分钟 |
    | `maxOnlineMinutes` | number | 否 | 自定义时间窗口内心跳在线时长最大值，单位分钟 |
  - 日期口径：`startDate` / `endDate` 不筛用户注册时间，只作为统计窗口作用于 `user_online_daily.duration` 和 `watch_logs.watch_duration`
  - 在线时长筛选口径：`onlineDurationRange` / `minOnlineMinutes` / `maxOnlineMinutes` 筛的是心跳在线时长，来源 `user_online_daily.duration`；传入在线时长筛选时，会排除统计窗口内在线时长为 `0` 的用户；`0-60` 表示 `>0` 且 `<=60` 分钟，包含 60 分钟
  - 播放时长筛选口径：`watchDurationRange` / `minWatchMinutes` / `maxWatchMinutes` 筛的是实际观看时长，来源 `watch_logs.watch_duration`；传入播放时长筛选时，会排除统计窗口内观看时长为 `0` 的用户；`0-60` 表示 `>0` 且 `<=60` 分钟，包含 60 分钟
  - 请求示例：
```http
GET /api/admin/users?page=1&size=10&startDate=2026-06-22&endDate=2026-06-22&watchDurationRange=0-60
```
  - 更多示例：
```http
# 统计 2026-06-22 当天在线/观看时长
GET /api/admin/users?page=1&size=10&startDate=2026-06-22&endDate=2026-06-22

# 统计窗口内观看 60-120 分钟的用户
GET /api/admin/users?page=1&size=10&startDate=2026-06-22&endDate=2026-06-22&watchDurationRange=60-120

# 统计窗口内心跳在线 0-60 分钟的用户
GET /api/admin/users?page=1&size=10&startDate=2026-06-22&endDate=2026-06-22&onlineDurationRange=0-60

# 同时筛选心跳在线 0-60 分钟且实际观看 0-60 分钟的用户
GET /api/admin/users?page=1&size=10&startDate=2026-06-22&endDate=2026-06-22&onlineDurationRange=0-60&watchDurationRange=0-60

# 累计登录次数 1-5 次的用户
GET /api/admin/users?page=1&size=10&minLoginCount=1&maxLoginCount=5

# 精确筛选累计登录次数为 3 次的用户
GET /api/admin/users?page=1&size=10&loginCount=3
```
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
      "nickname": "游客042857",
      "is_active": true,
      "isGuest": false,
      "created_at": "2025-01-01T12:00:00.000Z",
      "lastLoginAt": "2025-09-05T12:34:56.000Z",
      "lastLoginIp": "203.0.113.10",
      "lastLoginDevice": "iPhone 15 iOS 18",
      "activeLogins": 2,
      "loginCount": 8,
      "totalOnlineDuration": 7200,
      "totalOnlineMinutes": 120,
      "totalWatchDuration": 12580,
      "totalWatchMinutes": 209,
      "lastActiveAt": "2026-06-22T14:30:00.000Z",
      "isOnline": true
    }
  ],
  "page": 1,
  "size": 20
}
```

- 字段说明：
  | 字段 | 类型 | 说明 |
  |------|------|------|
  | `lastLoginAt` | string/null | 最后一次登录时间 |
  | `lastLoginIp` | string/null | 最后登录 IP |
  | `lastLoginDevice` | string/null | 最后登录设备信息 |
  | `activeLogins` | number | 当前有效的登录会话数（未撤销且未过期 refresh token 数量） |
  | `loginCount` | number | 累计登录次数，来源：refresh_tokens 表 COUNT(*) |
  | `totalOnlineDuration` | number | 统计窗口内总在线时长（秒），来源：user_online_daily 表 SUM(duration) |
  | `totalOnlineMinutes` | number | 统计窗口内总在线时长（分钟，向下取整） |
  | `totalWatchDuration` | number | 统计窗口内总观看时长（秒），来源：watch_logs 表 SUM(watch_duration) |
  | `totalWatchMinutes` | number | 统计窗口内总观看时长（分钟，向下取整） |
  | `lastActiveAt` | string/null | 最后活跃时间（优先显示心跳时间；无心跳时显示统计窗口内最后观看时间） |
  | `isOnline` | boolean | 是否在线（5分钟内有心跳上报则为 true；通过 Redis `online:last:{userId}` 判断） |

- 详情
  - `GET /api/admin/users/:id?startDate=2026-06-01&endDate=2026-06-23`
  - 返回字段与列表项一致，包含 `totalWatchDuration`、`lastActiveAt`、`isOnline`
  - 额外返回 `onlineDaily`：按天统计在线时长和观看时长；`startDate` / `endDate` 可选，默认最近 30 天
  - `onlineDaily.days` 只包含有心跳在线时长的日期，不用登录次数做统计
  - `onlineDaily.days[].watchDuration` 就是每一天的观看时长，按同一天 `watch_logs.watch_date` 汇总
  - 详情响应中的 `onlineDaily` 示例：
```json
{
  "onlineDaily": {
    "userId": 1001,
    "startDate": "2026-06-01",
    "endDate": "2026-06-23",
    "totalOnlineDuration": 54000,
    "totalWatchDuration": 12580,
    "days": [
      {
        "date": "2026-06-23",
        "onlineDuration": 3600,
        "watchDuration": 1800,
        "onlineHours": 1,
        "onlineMinutes": 0,
        "watchHours": 0,
        "watchMinutes": 30
      }
    ]
  }
}
```

- 登录日志
  - `GET /api/admin/users/:id/login-logs?page=1&size=20`
  - 数据来源：`refresh_tokens`，用于查看最近登录设备和 token 状态，不作为在线天数或登录次数统计口径
  - 响应示例：
```json
{
  "total": 18,
  "items": [
    {
      "id": 9001,
      "createdAt": "2026-06-20T11:34:00.000Z",
      "expiresAt": "2026-06-27T11:34:00.000Z",
      "isRevoked": false,
      "deviceInfo": "Guest User",
      "ipAddress": "203.0.113.10"
    }
  ],
  "page": 1,
  "size": 20,
  "userSummary": {
    "userId": 1001,
    "totalOnlineDuration": 7200,
    "isOnline": true,
    "lastActiveAt": "2026-06-23T12:30:00.000Z"
  }
}
```
  - `userSummary` 字段说明：
    - `totalOnlineDuration`: 用户总在线时长（秒），来自 `user_online_daily` 表汇总
    - `isOnline`: 当前是否在线（5分钟内有心跳则为 true）
    - `lastActiveAt`: 最后一次心跳时间（来自 Redis `online:last:{userId}`）

- 每日在线时长统计
  - `GET /api/admin/users/:id/online-daily?startDate=2026-06-01&endDate=2026-06-23`
  - 数据来源：`user_online_daily` 表，前端每 60 秒调用一次心跳接口 `POST /api/user/heartbeat`，后端累加在线时长并每 5 分钟刷入 MySQL
  - 查询参数：
    - `startDate`: 开始日期（可选，默认最近 30 天）
    - `endDate`: 结束日期（可选，默认今天）
  - 响应示例：
```json
{
  "userId": 1001,
  "startDate": "2026-06-01",
  "endDate": "2026-06-23",
  "totalOnlineDuration": 54000,
  "totalWatchDuration": 12580,
  "days": [
    {
      "date": "2026-06-23",
      "onlineDuration": 3600,
      "watchDuration": 1800,
      "onlineHours": 1,
      "onlineMinutes": 0,
      "watchHours": 0,
      "watchMinutes": 30
    },
    {
      "date": "2026-06-22",
      "onlineDuration": 7200,
      "watchDuration": 5400,
      "onlineHours": 2,
      "onlineMinutes": 0,
      "watchHours": 1,
      "watchMinutes": 30
    }
  ]
}
```
  - 字段说明：
    - `totalOnlineDuration`: 时间范围内总在线时长（秒），只统计有心跳的日期，来源 `user_online_daily.duration`
    - `totalWatchDuration`: 返回的在线日期内总观看时长（秒），来源 `watch_logs.watch_duration`
    - `days`: 按日期倒序的每日在线记录；只包含有心跳在线时长的日期
    - `days[].onlineDuration`: 当天在线时长（秒），来源 `user_online_daily.duration` + Redis 未刷库心跳
    - `days[].watchDuration`: 当天观看时长（秒），来源 `watch_logs` 按 `watch_date` 汇总
    - `days[].onlineHours` / `days[].onlineMinutes`: 当天在线时长的小时和分钟展示值
    - `days[].watchHours` / `days[].watchMinutes`: 当天观看时长的小时和分钟展示值

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
  - `GET /api/admin/series?page=1&size=20&includeDeleted=false&categoryId=3`
  - 参数：
    - `includeDeleted=true` 显示所有系列（包括已删除）
    - `includeDeleted=false` 或不传：仅显示未删除系列（默认）
    - `categoryId` number（可选）：按分类筛选，如 1-短剧、2-电影、3-电视剧
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

#### 系列封面上传（推荐使用前端直传 R2）

- **获取预签名上传 URL**（推荐）
  - `GET /api/admin/series/:id/presigned-upload-url?filename=cover.jpg&contentType=image/jpeg`
  - 参数：
    - `filename` string（必填）：文件名，如 `cover.jpg`
    - `contentType` string（必填）：文件 MIME 类型，如 `image/jpeg`、`image/png`
  - 说明：获取预签名 URL，前端可直接上传到 R2，无需经过后端服务器
  - 响应示例：
```json
{
  "uploadUrl": "https://0d5622368be0547ffbf1909c86bec606.r2.cloudflarestorage.com/static-storage/series/123/cover_abc123.jpg?X-Amz-Algorithm=...",
  "fileKey": "series/123/cover_abc123.jpg",
  "publicUrl": "https://static.656932.com/series/123/cover_abc123.jpg"
}
```

- **通知上传完成**
  - `POST /api/admin/series/:id/upload-complete`
  - 请求体：
```json
{
  "fileKey": "series/123/cover_abc123.jpg",
  "publicUrl": "https://static.656932.com/series/123/cover_abc123.jpg",
  "fileSize": 524288
}
```
  - 说明：前端上传到 R2 成功后，调用此接口通知后端更新系列的 `coverUrl` 字段
  - 响应示例：
```json
{
  "success": true,
  "message": "Cover upload completed",
  "coverUrl": "https://static.656932.com/series/123/cover_abc123.jpg"
}
```

- **直传文件（备用方案）**
  - `POST /api/admin/series/:id/cover`
  - 表单字段：`file`（图片文件）
  - 说明：服务端将图片存入 R2，并把生成的 URL 写回该系列的 `coverUrl` 字段
  - cURL 示例：
```bash
curl -X POST "http://localhost:8080/api/admin/series/123/cover" \
  -H "Accept: application/json" \
  -F "file=@/path/to/cover.jpg"
```

- **从 URL 拉取封面（备用方案）**
  - `POST /api/admin/series/:id/cover-from-url`
  - 请求体：`{ "url": "https://example.com/cover.jpg" }`
  - 说明：后端从该 URL 抓取图片，上传到 R2，并更新 `coverUrl`
  - cURL 示例：
```bash
curl -X POST "http://localhost:8080/api/admin/series/123/cover-from-url" \
  -H "Content-Type: application/json" \
  -d '{ "url": "https://example.com/cover.jpg" }'
```

**前端直传完整流程示例**：
```typescript
// 1. 获取预签名 URL
const response1 = await fetch(
  `/api/admin/series/${seriesId}/presigned-upload-url?filename=${file.name}&contentType=${file.type}`
);
const { uploadUrl, fileKey, publicUrl } = await response1.json();

// 2. 直接上传到 R2（不经过后端）
await fetch(uploadUrl, {
  method: 'PUT',
  body: file,
  headers: { 'Content-Type': file.type },
});

// 3. 通知后端更新 coverUrl
await fetch(`/api/admin/series/${seriesId}/upload-complete`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ fileKey, publicUrl, fileSize: file.size }),
});
```

**安全限制**：
- 仅支持图片格式：JPEG, PNG, WebP, GIF
- 预签名 URL 有效期：1 小时
- 建议文件大小：≤ 10MB

**详细文档**：参见 `docs/backend-series-cover-upload.md`

---

### 单集管理 Episode（系列下的具体某一集）

资源路径: `/admin/episodes`

- 列表 ⭐ 已优化
  - `GET /api/admin/episodes?page=1&size=20&seriesId=<系列ID>&minDuration=<最小时长>&maxDuration=<最大时长>`
  - 支持按 `seriesId` 过滤；返回包含 `series` 关系
  - **✨ 新增 `seriesTitle` 字段**：直接返回系列标题，前端无需再访问嵌套对象
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
      "seriesId": 3143,
      "seriesTitle": "今天的她们112",
      "episodeNumber": 69,
      "title": "69",
      "duration": 528,
      "status": "published",
      "isVertical": false,
      "likeCount": 32,
      "dislikeCount": 0,
      "favoriteCount": 0,
      "playCount": 36,
      "createdAt": "2025-10-06T16:00:01.078Z",
      "updatedAt": "2025-10-06T16:00:01.078Z",
      "series": {
        "id": 3143,
        "title": "今天的她们112",
        "description": "...",
        "coverUrl": "..."
      }
    }
  ],
  "page": 1,
  "size": 20
}
```

**字段说明**：
- `seriesId`: 系列ID（数字）
- `seriesTitle`: ✨ 系列标题（字符串，新增字段，方便前端直接访问）
- `series`: 完整系列对象（保留，向后兼容）
- `createdAt`: 剧集创建时间（ISO 8601 格式，UTC时区）
- `updatedAt`: 剧集最后更新时间（ISO 8601 格式，UTC时区）

**前端使用建议**：
```typescript
// ✅ 推荐：直接使用 seriesTitle
const title = episode.seriesTitle;

// ✅ 也支持：访问完整 series 对象（向后兼容）
const title = episode.series?.title;
const description = episode.series?.description;
```

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

- 获取统计 ⭐
  - `GET /api/admin/series/validation/stats`
  - **全量准确统计**（非抽样估算）
  - 了解数据质量概览和问题分布
  - 响应示例：
```json
{
  "success": true,
  "code": 200,
  "message": "数据质量统计获取成功",
  "timestamp": "2025-10-25T11:34:29.725Z",
  "data": {
    "overview": {
      "totalSeries": 1139,
      "totalEpisodes": 26635,
      "healthySeries": 1125,
      "issuesSeries": 14
    },
    "issues": {
      "missingEpisodes": 9,
      "duplicateEpisodes": 1,
      "duplicateNames": 1,
      "duplicateExternalIds": 0,
      "emptySeries": 3
    },
    "breakdown": {
      "onlyMissing": 9,
      "onlyDuplicate": 1,
      "bothIssues": 1,
      "empty": 3
    },
    "quality": {
      "score": 99,
      "grade": "A+",
      "trend": "stable",
      "issueRate": "1.2%"
    },
    "lastCheck": {
      "timestamp": "2025-10-25T11:34:29.725Z",
      "duration": 639
    }
  }
}
```

**字段说明**：
- `overview.totalSeries`: 总系列数
- `overview.healthySeries`: 健康系列数（无问题）
- `overview.issuesSeries`: 有问题的系列数
- `issues.missingEpisodes`: 缺集问题数（只有缺集的系列）
- `issues.duplicateEpisodes`: 重复集数问题数（只有重复的系列）
- `issues.duplicateNames`: 重复名称组数（表示有多少组不同系列使用了相同的名称）
- `issues.duplicateExternalIds`: 重复外部ID组数（表示有多少组不同系列使用了相同的外部ID）
- `issues.emptySeries`: 空系列数（无剧集）
- `breakdown`: 问题系列的详细分类（只有缺集、只有重复、两者都有、空系列）
- `quality.score`: 数据质量评分（0-100），基于问题率计算
- `quality.grade`: 质量等级（A+/A/B+/B/C+/C/D/F）
- `quality.issueRate`: 问题率百分比

- 检查缺集（集数不连续）⭐
  - `GET /api/admin/series/validation/check-missing-episodes`
  - **默认全量扫描所有活跃系列**（无需参数）
  - 检测系列内集数是否连续（如：有1,2,4,5集，缺第3集）
  - 检测重复集数（如：第5集出现2次）
  - 参数：
    - `seriesId` number 可选：检查指定系列
  - 示例：
```bash
# 检查全部系列（默认）
curl "http://localhost:9090/api/admin/series/validation/check-missing-episodes"

# 检查指定系列
curl "http://localhost:9090/api/admin/series/validation/check-missing-episodes?seriesId=2455"
```

  - 响应示例：
```json
{
  "success": true,
  "data": {
    "total": 14,
    "checkedSeries": 1138,
    "items": [
      {
        "seriesId": 3152,
        "seriesTitle": "[测试]复合问题系列-宫廷风云",
        "seriesShortId": "pYSstgdmiUV",
        "totalEpisodes": 10,
        "expectedEpisodes": 10,
        "missingEpisodes": [4],
        "duplicateEpisodes": [6],
        "status": "HAS_ISSUES",
        "issues": {
          "hasMissing": true,
          "hasDuplicates": true,
          "missingCount": 1,
          "duplicateCount": 1
        }
      },
      {
        "seriesId": 3156,
        "seriesTitle": "你好",
        "seriesShortId": "bQJBThKvm9r",
        "totalEpisodes": 0,
        "missingEpisodes": [],
        "status": "NO_EPISODES",
        "message": "该系列没有任何剧集"
      }
    ]
  },
  "message": "发现 14 个系列存在集数问题",
  "timestamp": "2025-10-25T11:22:02.642Z"
}
```

**字段说明**：
- `data.total`: 发现的问题系列总数
- `data.checkedSeries`: 检查的系列总数
- `data.items[]`: 问题系列列表

**问题系列字段**：
- `seriesId`: 系列ID
- `seriesTitle`: 系列标题
- `seriesShortId`: 系列短ID
- `totalEpisodes`: 实际剧集数
- `expectedEpisodes`: 预期剧集数（最大集数）
- `missingEpisodes[]`: 缺失的集数数组
- `duplicateEpisodes[]`: 重复的集数数组
- `status`: 状态 (`HAS_ISSUES` 有问题 | `NO_EPISODES` 无剧集)
- `issues`: 问题详情对象（仅当 status 为 HAS_ISSUES 时存在）

- 检查重复系列名 ⭐
  - `GET /api/admin/series/validation/check-duplicate-names`
  - **默认全量扫描所有活跃系列**（无需参数）
  - 检测多个系列使用相同标题的情况
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
    "checkedSeries": 1138,
    "totalDuplicateCount": 3,
    "items": [
      {
        "title": "[测试]重复名称系列",
        "count": 3,
        "series": [
          {
            "id": 3146,
            "shortId": "h8KHWWqgvgi",
            "title": "[测试]重复名称系列",
            "externalId": "test-duplicate-name-001",
            "createdAt": "2025-10-23T18:11:37.000Z"
          },
          {
            "id": 3148,
            "shortId": "IUeTPpr2wXN",
            "title": "[测试]重复名称系列",
            "externalId": "test-duplicate-name-003",
            "createdAt": "2025-10-23T18:11:38.000Z"
          }
        ]
      }
    ]
  },
  "message": "发现 1 个重复的系列名",
  "timestamp": "2025-10-25T11:22:02.647Z"
}
```

- 检查重复外部ID ⭐
  - `GET /api/admin/series/validation/check-duplicate-external-ids`
  - **默认全量扫描所有有外部ID的活跃系列**（无需参数）
  - 检测externalId冲突（数据一致性问题）
  - 响应格式与重复系列名类似

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
- 所有接口已优化为**默认全量扫描**，无需手动设置参数
- 统计接口为**全量准确统计**（非抽样估算），数据100%准确
- 性能优秀：扫描1000+系列仅需 < 1秒
- 建议每周定期检查数据质量
- 采集新内容后及时验证
- 接口会详细指出每个问题系列的具体问题（缺失集数、重复集数等）

**性能参考**（基于1138个系列的实测）：
- 统计信息: ~639ms (全量准确统计)
- 缺集检查: ~589ms (全量扫描)
- 重复名称: ~18ms
- 重复外部ID: ~9ms

**数据准确性**：
- ✅ 统计接口与缺集检查接口数据完全一致
- ✅ 所有问题系列都能被正确识别和分类
- ✅ 质量评分和问题率实时准确

**详细文档**: 参见 `docs/series-validation-frontend-guide.md`

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
  "users": { "total": 40689, "newToday": 123, "activeLogins": 2040, "lastLoginAtLatest": "2025-09-05T12:34:56.000Z" },
  "series": { "total": 1200 },
  "episodes": { "total": 100293 },
  "banners": { "total": 18 },
  "comments": { "total": 89000, "newToday": 450 },
  "plays": { "totalPlayCount": 1234567, "todayVisits": 34567 },
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

### 📊 高级数据分析 Analytics ⭐ 新增

资源路径: `/admin/dashboard`

#### 综合数据统计

- **获取所有核心指标**
  - `GET /api/admin/dashboard/stats`
  - 返回：活跃用户、留存率、播放量、完播率、新增注册等所有核心指标
  - 响应示例：
```json
{
  "code": 200,
  "message": "数据统计获取成功",
  "timestamp": "2025-11-04T13:30:00.000Z",
  "data": {
    "activeUsers": {
      "dau": 1250,              // 日活跃用户数
      "wau": 5430,              // 周活跃用户数
      "mau": 18900,             // 月活跃用户数
      "dau7DayAvg": 1180,       // 7天平均DAU
      "sticky": 6.61            // 粘性系数 (DAU/MAU * 100)
    },
    "retention": {
      "day1": {
        "totalUsers": 120,       // 昨天注册的用户总数
        "retainedUsers": 45,     // 次日回访的用户数
        "retentionRate": 37.5    // 次日留存率 (%)
      },
      "day7": {
        "totalUsers": 850,       // 7天前注册的用户总数
        "retainedUsers": 210,    // 7日后仍活跃的用户数
        "retentionRate": 24.71   // 7日留存率 (%)
      }
    },
    "content": {
      "totalPlayCount": 1234567,           // 总播放次数
      "uniqueWatchedEpisodes": 45000,     // 被观看的唯一剧集数
      "averagePlayCountPerEpisode": 27    // 每剧集平均播放次数
    },
    "watching": {
      "averageWatchProgress": 320,        // 平均日观看时长（秒）= 总观看时长 ÷ 活跃用户数
      "averageWatchPercentage": 65.8,     // 平均观看百分比 (%)
      "totalWatchTime": 45678900,         // 总观看时长（秒）
      "completionRate": 42.5              // 完播率 (%)
    },
    "registration": {
      "today": 45,              // 今日新增注册
      "yesterday": 52,          // 昨日新增注册
      "last7Days": 380,         // 最近7天新增
      "last30Days": 1580        // 最近30天新增
    }
  }
}
```

**字段说明**：
- `dau`: 日活跃用户数，统一口径为当日新增注册用户 ∪ 当日心跳在线用户 ∪ 当日观看用户，按 `user_id` 去重
- `wau`: 周活跃用户数（最近7天窗口内，观看用户 ∪ 注册用户 去重）
- `mau`: 月活跃用户数（最近30天窗口内，观看用户 ∪ 注册用户 去重）
- `sticky`: 粘性系数（DAU/MAU × 100），衡量用户活跃度，>20%为优秀
- `retentionRate`: 留存率（回访用户数/注册用户数 × 100）
- `completionRate`: 完播率（观看进度≥90%的记录数/总记录数 × 100）

#### 活跃用户统计

**口径补充说明**：
- `dashboard/active-users` 是概览卡片接口；`export/overview-stats.content_active_users` 和 `export/user-stats.dau` 是导出统计接口。
- 三个接口的 DAU 已统一为同一口径：当日新增注册用户 ∪ 当日心跳在线用户 ∪ 当日观看用户，按 `user_id` 去重。
- 因此当日新增用户会计入活跃用户；如果某天只有注册、没有心跳或观看，DAU 也会至少包含这些新增用户。
- `dashboard/active-users` 不接收日期参数，返回“今天 / 近 7 个业务日 / 近 30 个业务日”的统计；如果要看指定日期，请使用 `export/overview-stats` 或 `export/user-stats`。

- **获取DAU/WAU/MAU详细数据**
  - `GET /api/admin/dashboard/active-users`
  - 响应示例：
```json
{
  "code": 200,
  "data": {
    "dau": 1250,
    "wau": 5430,
    "mau": 18900,
    "dau7DayAvg": 1180,
    "sticky": 6.61
  },
  "message": "活跃用户统计获取成功",
  "timestamp": "2026-04-06T08:00:00.000Z"
}
```

**返回字段说明**：

| 字段 | 类型 | 含义 | 前端处理建议 |
|------|------|------|--------------|
| `code` | `number` | 业务状态码，`200` 表示成功 | 先判断 `code === 200`，失败时展示 `message` |
| `data.dau` | `number` | 今日活跃用户数，口径为：今日新增注册用户 ∪ 今日心跳在线用户 ∪ 今日观看用户，按 `user_id` 去重 | 直接按整数展示，建议显示为“今日日活” |
| `data.wau` | `number` | 最近 7 个业务日访问活跃规模，当前按最近 7 日 DAU 累加计算 | 直接展示；不要与自然周混淆，它是“近 7 天访问活跃规模” |
| `data.mau` | `number` | 最近 30 个业务日访问活跃规模，当前按最近 30 日 DAU 累加计算 | 直接展示；不要理解为自然月 |
| `data.dau7DayAvg` | `number` | 最近 7 天 DAU 平均值，已四舍五入 | 可用于和 `dau` 对比，展示趋势高低 |
| `data.sticky` | `number` | 粘性系数，计算方式为 `DAU / MAU × 100`，保留 2 位小数 | 建议前端展示为百分比，如 `6.61%` |
| `message` | `string` | 接口返回说明 | 失败提示直接透传即可 |
| `timestamp` | `string` | 服务端返回时间，ISO 8601 格式 | 如需展示，转本地时区格式 |

**处理办法 / 使用建议**：

- 建议卡片展示：
  - `dau`：今日活跃
  - `wau`：近7日活跃
  - `mau`：近30日活跃
  - `dau7DayAvg`：7日平均日活
  - `sticky`：用户粘性
- `sticky` 是数值型百分比，不是小数比值；前端不要再乘以 `100`。
- 该接口返回的 `dau`、`wau`、`mau` 全部为整数，适合直接做概览卡片，不建议做货币/小数格式化。
- 若接口失败：
  - `code !== 200` 时展示 `message`
  - `data === null` 时使用 `--` 占位
- 若要做人性化展示，建议统一格式：
  - `< 10000`：原样展示
  - `>= 10000`：可转为 `1.2万` 这类简写

**前端更新建议**：

- 首页概览卡片：
  - `GET /api/admin/dashboard/overview` 的 `users.newToday` 展示为“今日新增用户”。
  - `GET /api/admin/dashboard/active-users` 的 `data.dau` 展示为“今日日活”。
  - 两者都是“今天”的指标，可以并排展示，但含义不同：新增用户是注册人数，DAU 是新增 ∪ 心跳 ∪ 观看后的去重活跃人数。
- 导出/运营趋势页：
  - 指定日期区间请使用 `GET /api/admin/export/overview-stats?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`。
  - 使用 `new_users` 展示“新增用户”。
  - 使用 `content_active_users` 展示“活跃用户 / DAU”。
  - 使用 `new_user_ratio` 展示“新增占比”，前端展示百分比时需要乘以 `100`，例如 `0.7895` 展示为 `78.95%`。
- 用户统计导出页：
  - `GET /api/admin/export/user-stats` 中的 `dau` 与 `overview-stats.content_active_users` 口径一致。
  - 该接口的 `date` 是中文展示格式，例如 `6月23日`；如果前端需要排序或和其他接口合并，建议以请求区间生成的原始 `YYYY-MM-DD` 作为内部 key。
- 不要把 `series-details` 当作 DAU 来源：
  - `GET /api/admin/export/series-details` 是“日期 × 系列”的内容明细接口，不返回平台级 DAU。
  - 如果前端当前在系列明细页展示“活跃用户”，应改为从 `overview-stats.content_active_users` 或 `user-stats.dau` 读取。
- 缓存刷新：
  - 如果前端用了 React Query / SWR / Pinia / Vue Query 等缓存，请在接口口径变更后清理旧缓存，或给相关 query key 加上日期区间参数。
  - 推荐 query key：`['dashboard-active-users']`、`['dashboard-overview']`、`['export-overview-stats', startDate, endDate]`、`['export-user-stats', startDate, endDate]`。

#### 用户留存率

- **获取指定队列的留存率**
  - `GET /api/admin/dashboard/retention?retentionDays=1&cohortDate=2025-11-03`
  - 参数：
    - `retentionDays`: 留存天数（1=次日留存，7=7日留存），默认1
    - `cohortDate`: 队列日期（YYYY-MM-DD格式），默认昨天
  - 响应示例：
```json
{
  "code": 200,
  "data": {
    "totalUsers": 120,        // 该日注册的用户总数
    "retainedUsers": 45,      // 留存的用户数
    "retentionRate": 37.5     // 留存率 (%)
  }
}
```

- **获取留存率趋势**
  - `GET /api/admin/dashboard/retention-trend?days=7&retentionDays=1`
  - 参数：
    - `days`: 统计最近N天，默认7
    - `retentionDays`: 留存天数（1或7），默认1
  - 响应示例：
```json
{
  "code": 200,
  "data": [
    {
      "date": "2025-10-28",
      "totalUsers": 85,
      "retainedUsers": 32,
      "retentionRate": 37.65
    },
    {
      "date": "2025-10-29",
      "totalUsers": 92,
      "retainedUsers": 35,
      "retentionRate": 38.04
    }
  ]
}
```

#### 内容播放统计

- **获取内容播放数据**
  - `GET /api/admin/dashboard/content-stats`
  - 响应示例：
```json
{
  "code": 200,
  "data": {
    "totalPlayCount": 1234567,           // 总播放次数
    "uniqueWatchedEpisodes": 45000,      // 被观看过的剧集数
    "averagePlayCountPerEpisode": 27,    // 每剧集平均播放次数
    "top10Episodes": [
      {
        "episodeId": 12345,
        "shortId": "6JswefD4QXK",
        "title": "热门剧集 第01集",
        "playCount": 89450
      }
    ]
  }
}
```

#### 观看行为统计

- **获取完播率和平均观影时长**
  - `GET /api/admin/dashboard/watch-stats`
  - 响应示例：
```json
{
  "code": 200,
  "data": {
    "averageWatchProgress": 320,        // 平均日观看时长（秒）= 总观看时长 ÷ 活跃用户数
    "averageWatchPercentage": 65.8,     // 平均观看百分比 (%)
    "totalWatchTime": 45678900,         // 总观看时长（秒）
    "totalWatchRecords": 125000,        // 总观看记录数
    "completedRecords": 53125,          // 完播记录数（≥90%）
    "completionRate": 42.5              // 完播率 (%)
  }
}
```

**重要说明**：
- `averageWatchProgress`: 从 v2.0 开始，计算方式改为 **总观看时长 ÷ 活跃用户数**，更准确地反映"平均每个用户在平台上花费的时间"
- 数据来源：优先使用 `watch_logs` 表（2026年1月后的新数据），降级使用 `watch_progress` 表（历史数据）

#### 观看日志管理

- **获取观看日志统计信息**
  - `GET /api/admin/dashboard/watch-logs-stats`
  - 用于查看观看日志的存储情况和清理建议
  - 响应示例：
```json
{
  "code": 200,
  "data": {
    "totalLogs": 125000,              // 总日志记录数
    "logsOlderThan1Year": 0,          // 1年前的日志数
    "logsOlderThan6Months": 8500,     // 6个月前的日志数
    "logsOlderThan3Months": 32000,    // 3个月前的日志数
    "oldestLogDate": "2026-01-01",    // 最早日志日期
    "newestLogDate": "2026-01-29"     // 最新日志日期
  },
  "message": "获取观看日志统计成功"
}
```

- **手动触发观看日志归档**
  - `POST /api/admin/dashboard/archive-watch-logs`
  - 用于手动清理或归档旧的观看日志数据
  - 请求参数：
```json
{
  "daysToKeep": 365,              // 保留最近N天的数据（默认365天）
  "archiveBeforeDelete": false    // 是否在删除前先归档到archive表（默认false）
}
```
  - 响应示例：
```json
{
  "code": 200,
  "data": {
    "success": true,
    "message": "归档任务完成: 归档了 0 条记录，删除了 8500 条记录",
    "archivedCount": 0,             // 归档的记录数
    "deletedCount": 8500,           // 删除的记录数
    "duration": 1250                // 执行耗时（毫秒）
  },
  "message": "归档任务执行成功"
}
```

**使用场景**：
- 定期清理历史观看日志，控制数据库大小
- 在数据库容量不足时紧急清理旧数据
- 归档重要历史数据到archive表（设置 `archiveBeforeDelete: true`）

**注意事项**：
- 归档操作不可逆，建议先设置 `archiveBeforeDelete: true` 进行测试
- 系统每年1月1日凌晨2点自动执行归档任务（保留365天）
- 归档的数据会保存到 `watch_logs_archive` 表，可用于历史分析

**指标解释**：

| 指标 | 说明 | 行业参考值 |
|------|------|-----------|
| DAU | 日活跃用户数 | 越高越好 |
| 粘性系数 | DAU/MAU × 100 | >20%优秀，>10%良好 |
| 次日留存率 | 注册次日回访的用户占比 | 30-50%优秀 |
| 7日留存率 | 注册7天后仍活跃的用户占比 | 20-35%优秀 |
| 完播率 | 观看进度≥90%的记录占比 | 短剧: 40-60%优秀 |

**使用场景**：
- 监控平台日常运营状况
- 评估运营活动效果
- 分析用户质量和内容质量
- 识别优质内容和流失原因


当前通过单集详情接口返回 `urls` 数组；如需单独的 CRUD，可后续补充：
- 列表/新增/更新/删除 路由建议：`/admin/episode-urls`

---

### cURL 示例

```bash
# ========== 管理员认证 ==========

# 初始化第一个管理员（仅首次部署时调用一次）
curl -X POST "http://localhost:8080/api/admin/auth/init" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin123",
    "name": "超级管理员"
  }'

# 管理员登录（获取 token）
curl -X POST "http://localhost:8080/api/admin/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin123"
  }'
# 响应中 access_token 即为后续所有管理端接口的鉴权凭证

# 获取当前管理员信息
curl -X GET "http://localhost:8080/api/admin/auth/me" \
  -H "Authorization: Bearer <admin_access_token>"

# ========== 以下所有管理端接口均需带 Authorization 头 ==========
# 示例中用 $TOKEN 代替实际 token，使用时替换为登录返回的 access_token

# 列出轮播图（标准化，前台接口无需管理员 token）
curl -X GET "http://localhost:3000/api/banners?page=1&size=10"

# 新建轮播图（管理端）
curl -X POST "http://localhost:8080/api/admin/banners" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
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
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "id": 6702079700,
    "first_name": "随风",
    "last_name": "",
    "username": "seo99991",
    "is_active": true
  }'

# 获取用户登录日志
curl -X GET "http://localhost:8080/api/admin/users/1001/login-logs?page=1&size=20" \
  -H "Authorization: Bearer $TOKEN"

# 新建剧集
curl -X POST "http://localhost:8080/api/admin/episodes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "seriesId": 12,
    "episodeNumber": 1,
    "title": "第一集",
    "duration": 1500
  }'

# 获取剧集列表（返回包含 seriesTitle 字段）
curl -X GET "http://localhost:8080/api/admin/episodes?page=1&size=5" \
  -H "Authorization: Bearer $TOKEN"

# 获取剧集下载地址
curl -X GET "http://localhost:8080/api/admin/episodes/2136/download-urls" \
  -H "Authorization: Bearer $TOKEN"

# 系列管理 - 软删除功能示例

# 获取所有系列（仅未删除）
curl -X GET "http://localhost:8080/api/admin/series?page=1&size=20" \
  -H "Authorization: Bearer $TOKEN"

# 获取所有系列（包括已删除）
curl -X GET "http://localhost:8080/api/admin/series?page=1&size=20&includeDeleted=true" \
  -H "Authorization: Bearer $TOKEN"

# 按分类筛选系列（短剧）
curl -X GET "http://localhost:8080/api/admin/series?page=1&size=20&categoryId=1" \
  -H "Authorization: Bearer $TOKEN"

# 按分类筛选系列（电影）
curl -X GET "http://localhost:8080/api/admin/series?page=1&size=20&categoryId=2" \
  -H "Authorization: Bearer $TOKEN"

# 按分类筛选系列（电视剧）
curl -X GET "http://localhost:8080/api/admin/series?page=1&size=20&categoryId=3" \
  -H "Authorization: Bearer $TOKEN"

# 获取已删除系列列表
curl -X GET "http://localhost:8080/api/admin/series/deleted?page=1&size=20" \
  -H "Authorization: Bearer $TOKEN"

# 软删除系列（推荐使用，不会出现外键约束错误）
curl -X DELETE "http://localhost:8080/api/admin/series/2455" \
  -H "Authorization: Bearer $TOKEN"

# 恢复已删除的系列
curl -X POST "http://localhost:8080/api/admin/series/2455/restore" \
  -H "Authorization: Bearer $TOKEN"

# 系列数据验证 ⭐ (默认全量扫描)

# 获取数据质量统计
curl -X GET "http://localhost:9090/api/admin/series/validation/stats" \
  -H "Authorization: Bearer $TOKEN"

# 检查缺集和重复集数（全量扫描所有系列）
curl -X GET "http://localhost:9090/api/admin/series/validation/check-missing-episodes" \
  -H "Authorization: Bearer $TOKEN"

# 检查指定系列的缺集问题
curl -X GET "http://localhost:9090/api/admin/series/validation/check-missing-episodes?seriesId=2455" \
  -H "Authorization: Bearer $TOKEN"

# 检查重复系列名（全量扫描）
curl -X GET "http://localhost:9090/api/admin/series/validation/check-duplicate-names" \
  -H "Authorization: Bearer $TOKEN"

# 检查重复外部ID（全量扫描）
curl -X GET "http://localhost:9090/api/admin/series/validation/check-duplicate-external-ids" \
  -H "Authorization: Bearer $TOKEN"

# 查看指定系列的详细集数信息
curl -X GET "http://localhost:9090/api/admin/series/validation/episodes/2455" \
  -H "Authorization: Bearer $TOKEN"

# 数据分析接口 ⭐ (高级统计)

# 获取综合数据统计（包含所有核心指标）
curl -X GET "http://localhost:8080/api/admin/dashboard/stats" \
  -H "Authorization: Bearer $TOKEN"

# 获取 Dashboard 概览卡片数据
curl -X GET "http://localhost:8080/api/admin/dashboard/overview" \
  -H "Authorization: Bearer $TOKEN"

# 获取活跃用户统计（DAU/WAU/MAU）
curl -X GET "http://localhost:8080/api/admin/dashboard/active-users" \
  -H "Authorization: Bearer $TOKEN"

# 获取昨天注册用户的次日留存率
curl -X GET "http://localhost:8080/api/admin/dashboard/retention?retentionDays=1" \
  -H "Authorization: Bearer $TOKEN"

# 获取7天前注册用户的7日留存率
curl -X GET "http://localhost:8080/api/admin/dashboard/retention?retentionDays=7&cohortDate=2025-10-28" \
  -H "Authorization: Bearer $TOKEN"

# 获取最近7天的次日留存率趋势
curl -X GET "http://localhost:8080/api/admin/dashboard/retention-trend?days=7&retentionDays=1" \
  -H "Authorization: Bearer $TOKEN"

# 获取内容播放统计（包含Top10热门剧集）
curl -X GET "http://localhost:8080/api/admin/dashboard/content-stats" \
  -H "Authorization: Bearer $TOKEN"

# 获取完播率和平均观影时长
curl -X GET "http://localhost:8080/api/admin/dashboard/watch-stats" \
  -H "Authorization: Bearer $TOKEN"

# 获取观看日志统计信息
curl -X GET "http://localhost:8080/api/admin/dashboard/watch-logs-stats" \
  -H "Authorization: Bearer $TOKEN"

# 手动触发观看日志归档（删除1年前的数据）
curl -X POST "http://localhost:8080/api/admin/dashboard/archive-watch-logs" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"daysToKeep": 365, "archiveBeforeDelete": false}'

# 归档并保存历史数据（先保存到archive表，再删除）
curl -X POST "http://localhost:8080/api/admin/dashboard/archive-watch-logs" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"daysToKeep": 365, "archiveBeforeDelete": true}'
```

---

### 备注

- 所有 `/admin/**` 管理端接口均需携带管理员 token（`Authorization: Bearer <admin_access_token>`），认证接口 `/admin/auth/login` 和 `/admin/auth/init` 除外。
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

---

---

### Dashboard 概览卡片

`GET /api/admin/dashboard/overview`

返回管理后台首页概览卡片数据。

**口径说明（已与核心运营数据统一的字段）**：
- `users.newToday`：今日业务日新增用户数。
- `comments.newToday`：今日业务日新增评论数。
- `plays.todayVisits`：今日业务日访问数。
- 以上“业务日”统一按北京时间（UTC+8）自然日边界计算，与核心运营数据导出保持一致。

**响应示例**：
```json
{
  "users": { "total": 40689, "newToday": 123, "activeLogins": 2040, "lastLoginAtLatest": "2025-09-05T12:34:56.000Z" },
  "series": { "total": 1150 },
  "episodes": { "total": 26640 },
  "banners": { "total": 6, "totalClicks": 7, "totalImpressions": 5, "ctr": 1.4 },
  "comments": { "total": 302613, "newToday": 18 },
  "plays": { "totalPlayCount": 45352229, "todayVisits": 321 }
}
```

**字段说明**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `users.total` | number | 用户总数 |
| `users.newToday` | number | 今日业务日新增用户数 |
| `users.activeLogins` | number | 当前未撤销且未过期的活跃登录会话数 |
| `users.lastLoginAtLatest` | string\|null | 最近一次登录时间 |
| `comments.total` | number | 评论总数 |
| `comments.newToday` | number | 今日业务日新增评论数 |
| `plays.totalPlayCount` | number | 播放总量（按 `episodes.play_count` 汇总） |
| `plays.todayVisits` | number | 今日业务日访问数 |

---

## 📤 数据导出 Export

资源路径: `/admin/export`

> 用于运营人员导出 Excel 所需的核心统计数据，所有接口均按日期区间查询，返回 JSON 数组，前端可直接用 xlsx 等库转换为 Excel。

---

### 播放数据统计

`GET /api/admin/export/play-stats?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`

按日期汇总全平台播放量、完播率、平均观看时长、点赞数、收藏数。

**参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `startDate` | string | 是 | 开始日期，格式 `YYYY-MM-DD` |
| `endDate` | string | 是 | 结束日期，格式 `YYYY-MM-DD` |

**响应示例**：
```json
{
  "code": 200,
  "message": "播放数据统计获取成功",
  "timestamp": "2026-03-30T15:05:38.103Z",
  "data": [
    {
      "date": "3月28日",
      "playCount": 3,
      "avgWatchDuration": 70,
      "completionRate": 0.0,
      "likeCount": 0,
      "shareCount": 0,
      "favoriteCount": 0
    }
  ]
}
```

**字段说明**：
- `date`: 格式化日期（如 `3月28日`）
- `playCount`: 播放量，来源 `watch_logs` 记录数，不去重
- `avgWatchDuration`: 平均单次观看时长（秒），来源 `AVG(watch_logs.watch_duration)`
- `completionRate`: 完播率，来源 `watch_logs.end_position >= episodes.duration * 0.9` 的记录占比（0~1）
- `likeCount`: 当日点赞数，按 UTC+8 业务日统计 `episode_reactions.created_at`
- `shareCount`: 分享数（暂无数据，固定返回 0）
- `favoriteCount`: 当日收藏数，按 UTC+8 业务日统计 `favorites.created_at`

---

### 用户数据统计

`GET /api/admin/export/user-stats?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`

按日期汇总新增用户、日活（DAU）、次日留存率、平均观影时长。

**响应示例**：
```json
{
  "code": 200,
  "message": "用户数据统计获取成功",
  "timestamp": "2026-03-30T15:05:38.344Z",
  "data": [
    {
      "date": "3月28日",
      "newUsers": 3,
      "nextDayRetention": 0.3333,
      "dau": 3,
      "avgWatchDuration": 0,
      "newUserSource": "自然增长"
    }
  ]
}
```

**字段说明**：
- `date`: 格式化日期
- `newUsers`: 当日新增注册用户数，按 UTC+8 业务日统计 `users.created_at`
- `nextDayRetention`: 次日留存率（0~1）。以当日新增用户为 cohort，统计次日 `user_online_daily.duration > 0` 的去重用户数；今日及未来日期返回 `null`
- `dau`: 日活跃用户数，统一口径为：当日新增注册用户 ∪ 当日心跳在线用户 ∪ 当日观看用户，按 `user_id` 去重。数据来源包括 `users.created_at`、`user_online_daily.duration > 0`、`watch_logs.watch_date`
- `avgWatchDuration`: 人均观影时长（秒），来源 `watch_logs`：当天总 `watch_duration` ÷ 当天有观看日志的去重用户数
- `newUserSource`: 新增来源，当前固定返回 `"自然增长"`

---

### 系列明细数据

`GET /api/admin/export/series-details?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&categoryId=1`

按日期 × 系列维度返回每个剧集的详细运营数据。

**参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `startDate` | string | 是 | 开始日期 |
| `endDate` | string | 是 | 结束日期 |
| `categoryId` | number | 否 | 按分类筛选，如 1=短剧、2=电影 |

**响应示例**：
```json
{
  "code": 200,
  "message": "success",
  "timestamp": "2026-03-30T15:06:00.000Z",
  "data": [
    {
      "date": "2026-03-30",
      "seriesId": 2015,
      "seriesTitle": "反诈·猎蜂者",
      "categoryName": "短剧",
      "episodeCount": 27,
      "playCount": 2,
      "completionRate": 0,
      "avgWatchDuration": 75,
      "likeCount": 0,
      "dislikeCount": 0,
      "shareCount": 0,
      "favoriteCount": 0,
      "commentCount": 0
    }
  ]
}
```

**字段说明**：
- `date`: 日期（`YYYY-MM-DD` 格式，保持原始格式方便排序）
- `seriesId` / `seriesTitle` / `categoryName`: 系列信息
- `episodeCount`: 系列总集数
- `playCount`: 当日播放量，来源该系列下所有剧集的 `watch_logs` 记录数
- `completionRate`: 当日完播率，来源 `watch_logs.end_position >= episodes.duration * 0.9` 的记录占比（0~1）
- `avgWatchDuration`: 平均单次观看时长（秒），来源 `AVG(watch_logs.watch_duration)`
- `likeCount` / `dislikeCount`: 点赞/点踩数，按 UTC+8 业务日统计
- `shareCount`: 分享数（暂无，固定 0）
- `favoriteCount`: 收藏数，按 UTC+8 业务日统计
- `commentCount`: 评论数，按 UTC+8 业务日统计

**排序规则**：日期降序，同日内按播放量降序。

**注意**：该接口是内容/系列维度明细，不返回平台级 DAU / 活跃用户。如果前端需要在同一页面展示活跃用户，请额外请求 `GET /api/admin/export/overview-stats`，使用对应日期的 `content_active_users` 字段。

---

### 运营核心指标总览

`GET /api/admin/export/overview-stats?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`

按日期返回运营核心指标，按日期**倒序**排列。

**统一口径**：
- 日期均按 UTC+8 业务日统计。
- `content_active_users` / DAU 统一表示当日活跃用户数，口径为：当日新增注册用户 ∪ 当日心跳在线用户 ∪ 当日观看用户，按 `user_id` 去重。
- 具体数据来源：
  - 当日新增注册用户：`users.created_at` 落在该 UTC+8 业务日内；
  - 当日心跳在线用户：`user_online_daily.date = 当日` 且 `duration > 0`；
  - 当日观看用户：`watch_logs.watch_date = 当日`。
- 因此当日新增用户会计入 DAU；`content_active_users` 通常应大于或等于 `new_users`，除非存在数据清洗或跨时区脏数据。
- 观看次数和观看时长来源 `watch_logs`，不再用 `watch_progress` 作为播放量主口径。
- 次日留存以新增用户为 cohort，统计次日 `user_online_daily.duration > 0` 的用户。

**参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `startDate` | string | 是 | 开始日期 |
| `endDate` | string | 是 | 结束日期 |

**响应示例**：
```json
{
  "code": 200,
  "data": [
    {
      "date": "2026-06-24",
      "new_users": 7,
      "content_active_users": 12,
      "watch_progress_updates": 5,
      "total_users": 1213,
      "new_user_ratio": 0.5833,
      "next_day_content_retention": null,
      "avg_session_duration": 55,
      "avg_daily_duration": 92,
      "avg_daily_watch_sessions": 1.67
    }
  ]
}
```

**字段说明**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `date` | string | 日期 `YYYY-MM-DD` |
| `new_users` | number | 当日新增注册用户数，按 UTC+8 业务日统计 `users.created_at` |
| `content_active_users` | number | 日活跃用户数，统一口径为：当日新增注册用户 ∪ 当日心跳在线用户 ∪ 当日观看用户，按 `user_id` 去重 |
| `watch_progress_updates` | number | 字段名历史保留；当前含义为当天观看会话数，即 `watch_logs` 记录数 |
| `total_users` | number | 截止当日的累计注册用户总数 |
| `new_user_ratio` | number | 新用户占比 = `new_users / content_active_users`（0~1，最大不超过 1） |
| `next_day_content_retention` | number\|null | 次日留存率（0~1）；今日及未来日期返回 `null`，次日起才可计算 |
| `avg_session_duration` | number | 平均单次观看时长（秒）= `SUM(watch_logs.watch_duration) / COUNT(watch_logs)` |
| `avg_daily_duration` | number\|null | 人均观看时长（秒）= 当天总观看时长 ÷ 当天有观看日志的去重用户数 |
| `avg_daily_watch_sessions` | number\|null | 人均观看次数 = 当天观看日志总条数 ÷ 当天有观看日志的去重用户数 |

**性能说明**：
- 接口使用批量 SQL 按日期聚合，不再逐日 N+1 查询。
- DAU 会同时合并新增、心跳、观看三类用户，并按用户去重。
- 当天心跳尚未从 Redis 刷入 `user_online_daily` 时，DAU 仍会包含当天新增用户和观看用户；心跳部分会在下一次心跳刷库后体现。

**cURL 示例**：
```bash
# 获取播放数据统计
curl "http://localhost:9090/api/admin/export/play-stats?startDate=2026-03-01&endDate=2026-03-30"

# 获取用户数据统计
curl "http://localhost:9090/api/admin/export/user-stats?startDate=2026-03-01&endDate=2026-03-30"

# 获取系列明细（按分类筛选）
curl "http://localhost:9090/api/admin/export/series-details?startDate=2026-03-01&endDate=2026-03-30&categoryId=1"

# 获取运营核心指标
curl "http://localhost:9090/api/admin/export/overview-stats?startDate=2026-03-25&endDate=2026-03-30"
```

---

## 📝 更新日志

### v1.4.0 (2026-06-22)

#### ✨ 新增功能

**管理员认证体系 `/api/admin/auth`**
- ✅ `POST /api/admin/auth/init` — 初始化首个管理员账号（仅可调用一次）
- ✅ `POST /api/admin/auth/login` — 管理员登录，返回 JWT token
- ✅ `GET /api/admin/auth/me` — 获取当前管理员信息
- ✅ 独立 `admin_users` 表，不与前台用户混用
- ✅ 支持 `ADMIN_JWT_SECRET` / `ADMIN_JWT_EXPIRES_IN` 环境变量（可选，回退 `JWT_SECRET`）

**管理端接口全局鉴权保护**
- ✅ 所有 `/admin/**` 管理端接口（除 login/init 外）已加 `AdminJwtAuthGuard`
- ✅ 未携带有效管理员 token 时返回 `401 Unauthorized`
- ✅ 覆盖范围：users、series、episodes、banners、categories、options、dashboard、export、ingest、advertising

**用户在线时长与登录日志**
- ✅ `GET /api/admin/users` 用户列表新增筛选参数：
  - `startDate` / `endDate`：作为统计时间窗口使用，用来框定 `user_online_daily.duration` 在线时长和 `watch_logs.watch_duration` 观看时长；不筛用户注册时间
  - `loginCount`：精确筛选累计登录次数
  - `minLoginCount` / `maxLoginCount`：按累计登录次数区间筛选
  - `watchDurationRange`：按时间窗口内总播放时长筛选，单位为分钟，例如 `0-60`、`60-120`、`120-180`；传入播放时长筛选时会排除窗口内观看时长为 0 的用户
  - `minWatchMinutes` / `maxWatchMinutes`：按时间窗口内总播放时长分钟区间筛选，适合自定义范围
- ✅ 用户列表新增返回 `loginCount`、`totalOnlineDuration`、`totalOnlineMinutes`、`totalWatchMinutes`，其中 `totalOnlineDuration` 和 `totalWatchDuration` 均为秒
- ✅ 用户列表/详情使用 `activeLogins` 表示当前有效登录会话数
- ✅ `GET /api/admin/users/:id/login-logs` — 查看用户登录日志，仅用于设备/token 状态查看
- ✅ 用户在线/观看明细以 `user_online_daily` 和 `watch_logs` 为准

**Dashboard / Export 活跃用户口径统一**
- ✅ `GET /api/admin/dashboard/active-users` 的 `dau` 与导出接口统一口径
- ✅ `GET /api/admin/export/user-stats` 的 `dau` 与 `GET /api/admin/export/overview-stats` 的 `content_active_users` 统一口径
- ✅ DAU / 活跃用户 = 当日新增注册用户 ∪ 当日心跳在线用户 ∪ 当日观看用户，按 `user_id` 去重
- ✅ 当日新增用户会计入活跃用户，避免出现“新增用户大于活跃用户”的展示问题

#### 🔒 安全改进

- 管理端不再无鉴权暴露，公网部署安全性大幅提升
- 管理员密码使用 bcrypt（12 轮 salt）加密存储
- token 中嵌入 `typ: "admin"` 标识，与前台用户 token 互不通用

---

### v1.3.0 (2026-03-30)

#### ✨ 新增功能

**数据导出模块 `/api/admin/export`**
- ✅ `GET /api/admin/export/play-stats` — 按日播放量、完播率、平均时长、点赞/收藏
- ✅ `GET /api/admin/export/user-stats` — 按日新增用户、DAU、次日留存率、平均观影时长
- ✅ `GET /api/admin/export/series-details` — 按日 × 系列明细（支持 `categoryId` 筛选）
- ✅ `GET /api/admin/export/overview-stats` — 运营核心指标总览（统一 DAU：新增注册用户 ∪ 心跳在线用户 ∪ 观看用户）

#### 🐛 性能修复

**`overview-stats` 次日留存率 N+1 查询优化**
- 原实现：逐日循环发 SQL，日期范围越长越慢，长范围必然超时
- 新实现：改为 2 条批量 SQL（JOIN + DATE_ADD），O(N) → O(1) 条查询
- 效果：10 天范围从超时（>30s）降至正常响应（<2s）

**Redis 连接统一管理**
- 新增 `RedisModule`（`src/core/redis/redis.module.ts`），全局共享单一 Redis 客户端
- `DauService` 和 `WatchProgressService` 改为注入 `REDIS_CLIENT`，不再各自建立连接
- 启动日志：MySQL 和 Redis 连接成功/失败均有彩色 LOG 输出

#### 📌 接口调用注意

`POST /api/video/progress` 保存观看进度，请求体字段名为 `episodeIdentifier`（非 `episodeId`）：
```json
{ "episodeIdentifier": "VKeU7SMQ6VV", "stopAtSecond": 100 }
```
支持传入 11 位 shortId 或数字 ID，服务端自动识别。

### v1.1.0 (2025-10-27)

#### ✨ 新增功能

**剧集列表接口优化**
- ✅ 剧集列表（`GET /api/admin/episodes`）新增 `seriesTitle` 字段
- ✅ 前端可直接访问 `item.seriesTitle` 获取系列标题
- ✅ 无需再通过 `item.series.title` 嵌套访问
- ✅ 完全向后兼容，保留原有 `series` 对象

**使用示例**：
```typescript
// ❌ 旧方式（仍然支持）
const title = episode.series?.title || `系列 #${episode.seriesId}`;

// ✅ 新方式（推荐）
const title = episode.seriesTitle;

// Ant Design Table 直接绑定
{
  title: '系列',
  dataIndex: 'seriesTitle',  // 直接绑定
  key: 'seriesTitle',
}
```

**详细文档**：
- [剧集列表 API 增强说明](./episode-list-api-enhancement.md)
- 测试脚本：`scripts/test-episode-list-api.js`

**受影响的接口**：
- `GET /api/admin/episodes` - 列表接口（已优化）

**不受影响的接口**：
- `GET /api/admin/episodes/:id` - 详情接口（保持不变）
- `POST /api/admin/episodes` - 创建接口（保持不变）
- `PUT /api/admin/episodes/:id` - 更新接口（保持不变）
- `DELETE /api/admin/episodes/:id` - 删除接口（保持不变）

---

## � 广告投放管理

### 广告计划管理

资源路径: `/admin/advertising/campaigns`

#### 基本操作

- **获取计划列表**
  - `GET /api/admin/advertising/campaigns?page=1&size=20`
  - 支持筛选参数：`platform`, `status`, `keyword`, `startDate`, `endDate`
  
- **获取计划详情**
  - `GET /api/admin/advertising/campaigns/:id`
  
- **创建计划**
  - `POST /api/admin/advertising/campaigns`
  - 请求体：
  ```json
  {
    "name": "微信推广计划",
    "description": "微信朋友圈广告",
    "platform": "wechat",
    "targetUrl": "https://example.com",
    "budget": 10000,
    "targetClicks": 5000,
    "targetConversions": 500,
    "startDate": "2025-11-01",
    "endDate": "2025-11-30"
  }
  ```

- **更新计划**
  - `PUT /api/admin/advertising/campaigns/:id`
  
- **更新状态**
  - `PUT /api/admin/advertising/campaigns/:id/status`
  - 请求体：`{ "status": "active" }` 或 `{ "status": "paused" }`
  
- **删除计划**
  - `DELETE /api/admin/advertising/campaigns/:id`

#### 统计数据

返回数据中的 `stats` 字段包含实时统计：

```json
{
  "stats": {
    "totalClicks": 1234,
    "totalViews": 5678,
    "totalConversions": 89,
    "conversionRate": 0.0722,
    "cost": 2468.00,
    "cpc": 2.00,
    "cpa": 27.73
  }
}
```

**字段说明**：
- `totalClicks`: 总点击数
- `totalViews`: 总浏览数
- `totalConversions`: 总转化数
- `conversionRate`: 转化率（转化数/点击数）
- `cost`: 总成本
- `cpc`: 单次点击成本
- `cpa`: 单次转化成本

---

### 广告平台管理

资源路径: `/admin/advertising/platforms`

- **获取平台列表**
  - `GET /api/admin/advertising/platforms`
  
- **创建平台**
  - `POST /api/admin/advertising/platforms`
  - 请求体：
  ```json
  {
    "name": "微信",
    "code": "wechat",
    "description": "微信广告平台"
  }
  ```

---

### 广告数据统计 Dashboard ⭐ 新增

资源路径: `/admin/advertising`

- **获取仪表盘统计数据**
  - `GET /api/admin/advertising/dashboard?from=YYYY-MM-DD&to=YYYY-MM-DD`
  - 参数：
    - `from` (可选): 开始日期，格式 YYYY-MM-DD
    - `to` (可选): 结束日期，格式 YYYY-MM-DD
  - ⭐ **时间参数说明**：
    - **不传时间参数**：返回全部统计数据（所有时间的数据）
    - **只传 `from`**：返回从指定日期到当前的所有数据
    - **只传 `to`**：返回从最早到指定日期的所有数据
    - **两个都传**：返回指定时间范围内的数据
  - 返回所有广告投放的核心统计数据
  - 响应示例：
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "totalCampaigns": 15,           // 总投放计划数
      "activeCampaigns": 8,            // 活跃计划数
      "totalSpend": 0,                 // 总花费（暂未实现，返回0）
      "totalViews": 5000,              // 总访问量（浏览量，VIEW事件数）
      "totalClicks": 1250,             // 总点击数（CLICK事件数）
      "totalConversions": 89,          // 总转化量
      "avgConversionRate": 0.0712,     // 平均转化率（总转化数/总点击数）
      "platformStats": [               // 按平台分组的统计
        {
          "platform": "wechat",
          "campaigns": 5,
          "clicks": 800,
          "conversions": 60,
          "spend": 0
        }
      ],
      "recentEvents": [                // 最近事件列表
        {
          "id": 123,
          "campaignCode": "WX_20251117_8FA5D0",
          "eventType": "click",
          "eventTime": "2025-11-18T10:30:00.000Z"
        }
      ]
    }
  }
  ```

**字段说明**：
- `totalCampaigns`: 总投放计划数（所有状态）
- `activeCampaigns`: 活跃计划数（status='active' 且 isActive=true）
- `totalSpend`: 总花费（暂未实现，返回0）
- `totalClicks`: 总点击数（在时间范围内的所有 CLICK 事件数）
- `totalConversions`: 总转化量（在时间范围内的所有转化记录数）
- `avgConversionRate`: 平均转化率（totalConversions / totalClicks，如果 totalClicks 为0则返回0）
- `platformStats`: 按平台分组的统计数据数组
- `recentEvents`: 最近的事件记录（最多10条）

**前端字段映射**（根据图片显示）：
- 总投放计划 ← `data.totalCampaigns`
- 活跃计划 ← `data.activeCampaigns`
- 总访问量 ← `data.totalClicks`（总点击数）
- 总转化量 ← `data.totalConversions`
- 平均转化率 ← `data.avgConversionRate`（前端需要乘以100并格式化，如：`(avgConversionRate * 100).toFixed(2) + '%'`）

**使用示例**：
```bash
# 获取全部统计数据（不传时间参数）
curl "http://localhost:8080/api/admin/advertising/dashboard"

# 获取指定时间范围的统计数据
curl "http://localhost:8080/api/admin/advertising/dashboard?from=2025-11-01&to=2025-11-30"

# 只传开始日期（从指定日期到当前）
curl "http://localhost:8080/api/admin/advertising/dashboard?from=2025-11-01"

# 只传结束日期（从最早到指定日期）
curl "http://localhost:8080/api/admin/advertising/dashboard?to=2025-11-30"
```

---

## 📈 轮播图统计管理

### 轮播图数据统计

- **获取统计数据**
  - `GET /api/banners/:id/stats?from=2025-11-01&to=2025-11-30`
  - 返回按日统计的点击和曝光数据
  
  **返回示例**：
  ```json
  {
    "code": 200,
    "msg": "ok",
    "data": [
      {
        "date": "2025-11-18",
        "impressions": 1500,
        "clicks": 120,
        "ctr": 0.08
      },
      {
        "date": "2025-11-17",
        "impressions": 1200,
        "clicks": 95,
        "ctr": 0.079
      }
    ],
    "success": true
  }
  ```

**字段说明**：
- `impressions`: 曝光数
- `clicks`: 点击数
- `ctr`: 点击率（clicks/impressions）

### 轮播图管理（已有）

轮播图的基本CRUD操作请参考前文 [轮播图管理 Banners](#轮播图管理-banners) 章节。

---

## 🔗 短链接服务

### 创建短链接

**接口**: `POST /api/short-links`

**功能**: 将长URL转换为短链接，用于分享和推广

**认证**: 无需认证（公开接口）

**请求参数**:
```json
{
  "originalURL": "string",      // 必填，原始长URL
  "domain": "string",           // 必填，短链接域名（如：xgtv.short.gy），必须与配置的域名一致
  "allowDuplicates": false,     // 可选，是否允许重复创建，默认false。设为false时，相同URL会返回已存在的短链接
  "ttl": "string"               // 可选，过期时间（ISO 8601格式，如：2026-01-18T00:00:00Z），不设置则永久有效
}
```

**返回数据**:
```json
{
  "code": 200,
  "message": "短链接创建成功",
  "data": {
    "id": "lnk_6JzS_VEbhQej0E0zmqJwwVL6rr",
    "originalURL": "https://t.me/xgshort_bot/xgapp?startapp=__series__BmK2rTAsXW9___eid=n5fpRH7ZCzH",
    "shortURL": "https://xgtv.short.gy/bmTfvb",
    "domain": "xgtv.short.gy",
    "expiresAt": "2026-01-18T00:00:00Z",
    "createdAt": "2026-01-07T13:29:24.009Z"
  },
  "timestamp": "2026-01-07T13:29:24.009Z"
}
```

**使用示例**:
```bash
# 创建短链接
curl -X POST "http://localhost:8080/api/short-links" \
  -H "Content-Type: application/json" \
  -d '{
    "originalURL": "https://t.me/xgshort_bot/xgapp?startapp=__series__BmK2rTAsXW9",
    "domain": "xgtv.short.gy",
    "allowDuplicates": false,
    "ttl": "2026-12-31T23:59:59Z"
  }'
```

**配置说明**:
- 需要在 `.env` 文件中配置 `SHORT_IO_API_KEY`
- API key 安全存储在后端，前端无需传递
- 使用 Short.io 服务提供短链接功能
- 接口无需认证，可公开访问

---

## 📚 相关文档

- [剧集列表 API 增强说明](./episode-list-api-enhancement.md) - `seriesTitle` 字段详细说明
- [系列验证接口使用指南](./series-validation-frontend-guide.md) - 数据质量检查
- [数据分析 API 详细指南](./admin-analytics-api.md) - DAU/WAU/MAU、留存率、完播率等高级统计
- [API 变更文档](./api-changes-documentation.md) - 完整的 API 变更历史
- [广告投放管理指南](./admin-advertising-guide.md) - 广告系统完整使用说明 ⭐ 新增


