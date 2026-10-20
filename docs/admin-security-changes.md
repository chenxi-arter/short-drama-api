# Admin 安全更新变更说明

> 本文档记录本轮安全加固对 Admin 端接口的改动，供前端/联调对照修改。
> 仅涉及管理端与部分写接口，普通客户端（看剧、登录、Banner 展示）不受影响。

## 目录

- [一、管理员认证与权限](#一管理员认证与权限)
- [二、上传完成接口（upload-complete）](#二上传完成接口upload-complete)
- [三、远程图片导入（SSRF 防护）](#三远程图片导入ssrf-防护)
- [四、Banner 写接口与链接校验](#四banner-写接口与链接校验)
- [五、视频播放地址写接口](#五视频播放地址写接口)
- [六、游客管理接口](#六游客管理接口)
- [七、Banner 曝光/点击限流](#七banner-曝光点击限流)
- [八、环境变量新增](#八环境变量新增)
- [九、前端改动清单](#九前端改动清单)

## 一、管理员认证与权限

### 1.1 初始化首个管理员需要部署密钥

`POST /api/admin/auth/init`

改动前：只要 `admin_users` 表为空即可调用。

改动后：必须在请求头带一次性部署密钥。

请求头：

```http
x-init-admin-token: <INIT_ADMIN_TOKEN>
```

失败返回：

```json
{ "statusCode": 401, "message": "初始化令牌无效" }
```

调用示例：

```bash
curl -X POST "http://localhost:8080/api/admin/auth/init" \
  -H "Content-Type: application/json" \
  -H "x-init-admin-token: <INIT_ADMIN_TOKEN>" \
  -d '{ "username": "admin", "password": "Admin123", "name": "超级管理员" }'
```

### 1.2 管理员管理接口仅限 super_admin

以下接口现在只有 `role = super_admin` 可以调用，普通 `admin` 返回 `403`：

| 接口 | 说明 |
|------|------|
| `GET /api/admin/auth/list` | 管理员列表 |
| `POST /api/admin/auth/add` | 新增管理员 |
| `PUT /api/admin/auth/reset-password/:id` | 重置他人密码 |
| `DELETE /api/admin/auth/:id` | 删除管理员 |

失败返回：

```json
{ "statusCode": 403, "message": "仅超级管理员可执行该操作" }
```

未改动：`login`、`me`、`change-password`（改自己密码）不变。

## 二、上传完成接口（upload-complete）

涉及接口：

- `POST /api/admin/banners/:id/upload-complete`
- `POST /api/admin/series/:id/upload-complete`
- `POST /api/admin/episodes/:id/upload-complete`

改动前：后端信任前端传入的 `publicUrl` 直接写库。

改动后：

1. 后端忽略前端传的 `publicUrl`
2. 只接受 `fileKey`，并校验前缀（`banners/:id/`、`series/:id/`、`admin.v1.0.0.t1/`）
3. 调用 R2 `HEAD` 确认对象真实存在
4. 由后端根据 `fileKey` 生成最终 URL 返回

请求体（去掉 publicUrl）：

```json
{ "fileKey": "banners/1/image_xxx.jpg" }
```

Episode 额外字段：

```json
{ "fileKey": "admin.v1.0.0.t1/xx/xx/720p/video.mp4", "quality": "720p", "fileSize": 123456 }
```

对象不存在时返回：

```json
{ "statusCode": 400, "message": "Uploaded object not found" }
```

前端调用顺序必须是：获取 presigned URL → 上传到 R2 成功 → 调 upload-complete。

## 三、远程图片导入（SSRF 防护）

涉及接口：

- `POST /api/admin/banners/:id/image-from-url`
- `POST /api/admin/series/:id/cover-from-url`

改动后限制：

- 仅允许 `https://`
- 禁止 localhost、内网 IP（10/172.16-31/192.168/127/169.254/100.64 等）、IPv6 本地地址
- 禁止跟随重定向，最大响应 10MB，超时 15s

非法地址返回 `400`。前端提交前应校验必须是 HTTPS 公网地址。

## 四、Banner 写接口与链接校验

以下接口现在需要 admin token：

- `POST /api/banners`
- `PUT /api/banners/:id`
- `DELETE /api/banners/:id`
- `PUT /api/banners/:id/status`
- `PUT /api/banners/weights`

此外 `linkUrl` 必须是 HTTPS URL，否则返回：

```json
{ "statusCode": 400, "message": "linkUrl必须是 HTTPS URL" }
```

被拒绝示例：`http://...`、`javascript:...`、`data:...`、`//example.com`。

未改动（保持公开）：`GET /api/banners`、`GET /api/banners/:id`、`GET /api/banners/active/list`、`GET /api/banners/:id/stats`。

## 五、视频播放地址写接口

以下接口现在需要 admin token：

- `POST /api/video/url/episode`（另要求 `ossUrl`/`cdnUrl`/`subtitleUrl` 必须 HTTPS）
- `POST /api/video/url/episode/sequel`
- `POST /api/video/url/generate-keys`

未改动（客户端只读，保持公开）：

- `GET /api/video/url/access/:accessKey`
- `POST /api/video/url/query`

## 六、游客管理接口

以下接口现在需要 admin token：

- `POST /api/auth/admin/clean-inactive-guests`
- `GET /api/auth/admin/guest-statistics`
- `POST /api/auth/admin/reactivate-guest/:userId`

> ⚠️ **已变更**：内容导入模块（`/api/admin/ingest/*`、`/api/admin/test-ingest`）此前确实按需求暂不加 token，
> 后续审计（C4 / XG-04 同批）已补上 `AdminJwtAuthGuard`，现在**必须带管理员 token**，否则返回 `401 缺少管理员登录凭证`。
> 采集端如果之前是匿名调用，需要先登录 `POST /api/admin/auth/login` 换 token。

另：`POST /api/video/episode-url`（兼容旧接口）也一并从用户级控制器迁出，
改挂 `AdminJwtAuthGuard` 且 `ossUrl`/`cdnUrl`/`subtitleUrl` 必须是 HTTPS —— 原实现只要登录用户即可覆盖任意剧集的播放源（XG-04）。

## 七、Banner 曝光/点击限流

以下接口保持公开，但新增限流（同 IP + 同路由，60 次/分钟）：

- `POST /api/banners/:id/impression`
- `POST /api/banners/:id/click`
- `POST /api/banners/track`

超限返回：

```json
{ "statusCode": 429, "message": "统计上报过于频繁，请稍后再试" }
```

> 限流按 `X-Forwarded-For` 识别真实 IP，需确认 Nginx 已透传（`proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`），否则全体用户会共享同一计数。

## 八、环境变量新增

```env
# 管理后台 JWT 独立密钥（必须与 JWT_SECRET 不同）
ADMIN_JWT_SECRET=your_admin_jwt_secret_key_here_at_least_32_characters
ADMIN_JWT_EXPIRES_IN=8h

# 初始化首个管理员的一次性部署密钥
INIT_ADMIN_TOKEN=your_one_time_admin_init_token_here
```

> 若新增 `ADMIN_JWT_SECRET`，旧的 admin token 会失效，管理员需重新登录（账号本身不受影响）。

## 九、前端改动清单

| 优先级 | 改动点 | 说明 |
|--------|--------|------|
| 高 | upload-complete 去掉 `publicUrl` | 只传 `fileKey`，以后端返回 URL 为准 |
| 高 | 所有写接口带 admin token | 检查请求拦截器统一带 `Authorization` |
| 中 | 管理员管理页面加角色判断 | 非 `super_admin` 隐藏相关操作或处理 403 |
| 中 | linkUrl / 图片 URL 表单校验 HTTPS | Banner 跳转链接、远程图片导入 |
| 低 | 初始化管理员加 header | 部署时一次性操作 |
| 低 | Banner 上报处理 429 | 静默忽略即可，正常用户不会触发 |

