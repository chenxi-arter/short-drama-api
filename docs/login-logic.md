# 登录逻辑说明

本文档说明当前系统的登录、Token、登录次数、在线时长、观看时长之间的关系，并说明如果后续要按“每一次登录”统计在线时长和观看时长，需要如何改造。

---

## 1. 登录类型

当前系统主要有三类登录：

| 类型 | 接口 | 说明 |
|---|---|---|
| 邮箱登录 | `POST /api/auth/email-login` | 用户使用邮箱和密码登录 |
| 游客登录 | `POST /api/auth/guest-login` | 无需注册，系统生成游客用户和游客 token |
| 管理员登录 | `POST /api/admin/auth/login` | 管理后台登录，使用独立的管理员 token |

普通用户登录和管理员登录是两套认证体系：

- 普通用户接口使用用户 JWT
- 管理后台接口使用管理员 JWT
- 两者 token 不能混用

---

## 2. 普通用户登录流程

### 2.1 邮箱登录流程

接口：

```http
POST /api/auth/email-login
```

请求示例：

```json
{
  "email": "test@example.com",
  "password": "Test123456",
  "deviceInfo": "Chrome / Windows"
}
```

后端流程：

1. 校验邮箱和密码
2. 校验用户是否可用
3. 生成 `access_token`
4. 生成 `refresh_token`
5. 将 `refresh_token` 写入 `refresh_tokens` 表
6. 返回 token 给前端

返回示例：

```json
{
  "access_token": "eyJ...",
  "refresh_token": "abc123...",
  "expires_in": 604800,
  "token_type": "Bearer"
}
```

---

### 2.2 游客登录流程

接口：

```http
POST /api/auth/guest-login
```

后端流程：

1. 创建或复用游客用户
2. 生成 `guestToken`
3. 生成 `access_token`
4. 生成 `refresh_token`
5. 将 `refresh_token` 写入 `refresh_tokens` 表
6. 返回游客身份信息和 token

返回示例：

```json
{
  "access_token": "eyJ...",
  "refresh_token": "abc123...",
  "expires_in": 604800,
  "token_type": "Bearer",
  "guestToken": "guest_xxx",
  "isNewGuest": true,
  "userId": "1782192587781"
}
```

游客用户也可以调用心跳、观看进度、点赞、收藏等需要用户 token 的接口。

---

## 3. Token 说明

### 3.1 access_token

`access_token` 是访问接口时使用的 JWT。

前端请求需要携带：

```http
Authorization: Bearer <access_token>
```

当前普通用户 JWT payload 主要包含：

```json
{
  "sub": 1782193395702,
  "iat": 1782193396,
  "exp": 1782798196
}
```

字段说明：

| 字段 | 说明 |
|---|---|
| `sub` | 用户 ID |
| `iat` | token 签发时间 |
| `exp` | token 过期时间 |

当前 JWT 中没有登录会话 ID，所以后端只能知道“哪个用户在请求”，不能直接知道“这是该用户第几次登录产生的请求”。

---

### 3.2 refresh_token

`refresh_token` 存储在 `refresh_tokens` 表中。

每次登录会创建一条新的 `refresh_tokens` 记录。

主要字段：

| 字段 | 说明 |
|---|---|
| `id` | refresh token ID，可理解为一次登录记录 ID |
| `user_id` | 用户 ID |
| `token` | refresh token 值 |
| `expires_at` | 过期时间 |
| `is_revoked` | 是否已撤销 |
| `device_info` | 登录设备信息 |
| `ip_address` | 登录 IP |
| `created_at` | 登录时间 |

---

## 4. 登录次数统计逻辑

当前登录次数来源于 `refresh_tokens` 表。

因为每次登录都会创建一条 refresh token，所以：

```sql
SELECT COUNT(*)
FROM refresh_tokens
WHERE user_id = ?;
```

就是该用户的历史总登录次数。

### 注意

心跳接口不会增加登录次数。

观看进度接口不会增加登录次数。

只有登录时生成新的 refresh token，登录次数才会增加。

---

## 5. 在线时长统计逻辑

在线时长由心跳接口统计。

接口：

```http
POST /api/user/heartbeat
```

请求头：

```http
Authorization: Bearer <access_token>
```

返回：

```json
{
  "ok": true
}
```

当前逻辑：

1. 前端每 60 秒调用一次心跳接口
2. 后端每次心跳为该用户累计 60 秒在线时长
3. 在线时长先写入 Redis
4. 后端每 5 分钟将 Redis 数据刷入 MySQL 的 `user_online_daily` 表

Redis key 示例：

```text
online:2026-06-23
online:last:{userId}
```

MySQL 表：

```text
user_online_daily
```

当前表结构核心字段：

| 字段 | 说明 |
|---|---|
| `user_id` | 用户 ID |
| `date` | 日期 |
| `duration` | 当天在线秒数 |
| `updated_at` | 更新时间 |

### 当前在线时长的特点

当前在线时长是按：

```text
用户 + 日期
```

进行统计。

也就是说，目前能准确知道：

- 某个用户今天在线了多久
- 某个用户历史总在线时长
- 某个用户最近 30 天每天在线多久

但目前不能准确知道：

- 某一次登录期间在线了多久

因为心跳数据没有记录登录会话 ID。

---

## 6. 观看时长统计逻辑

观看时长主要由观看进度接口产生。

接口：

```http
POST /api/video/progress
```

请求示例：

```json
{
  "episodeIdentifier": "abc123",
  "stopAtSecond": 360
}
```

当前逻辑：

1. 前端上报当前剧集观看到第几秒
2. 后端查询用户之前的观看进度
3. 如果本次进度大于上次进度，则计算新增观看时长
4. 更新 `watch_progress`
5. 写入 `watch_logs`

示例：

| 上次进度 | 本次进度 | 新增观看时长 |
|---:|---:|---:|
| 0 | 120 | 120 秒 |
| 120 | 360 | 240 秒 |
| 360 | 300 | 0 秒 |

`watch_logs` 核心字段：

| 字段 | 说明 |
|---|---|
| `user_id` | 用户 ID |
| `episode_id` | 剧集 ID |
| `watch_duration` | 本次新增观看时长 |
| `start_position` | 开始观看位置 |
| `end_position` | 结束观看位置 |
| `watch_date` | 观看日期 |
| `created_at` | 日志创建时间 |

### 当前观看时长的特点

当前观看时长可以按用户汇总：

```sql
SELECT SUM(watch_duration)
FROM watch_logs
WHERE user_id = ?;
```

也可以按时间范围汇总：

```sql
SELECT SUM(watch_duration)
FROM watch_logs
WHERE user_id = ?
  AND created_at >= ?
  AND created_at < ?;
```

但目前不能严格按某一次登录统计，因为 `watch_logs` 没有登录会话 ID。

---

## 7. 管理后台用户详情当前逻辑

接口：

```http
GET /api/admin/users/:id
```

当前可以返回的数据包括：

| 字段 | 来源 | 说明 |
|---|---|---|
| `loginCount` | `refresh_tokens` | 历史登录次数 |
| `lastLoginAt` | `refresh_tokens.created_at` | 最后登录时间 |
| `lastLoginIp` | `refresh_tokens.ip_address` | 最后登录 IP |
| `lastLoginDevice` | `refresh_tokens.device_info` | 最后登录设备 |
| `activeLogins` | `refresh_tokens` | 当前有效登录会话数 |
| `totalWatchDuration` | `watch_logs` | 总观看时长 |
| `lastActiveAt` | Redis 心跳 / watch_logs | 最近活跃时间 |
| `isOnline` | Redis `online:last:{userId}` | 是否在线 |

---

## 8. 按每次登录统计的需求说明

目标是让管理后台可以看到：

```text
用户 A
  第 1 次登录：在线 4 分钟，观看 6 分钟
  第 2 次登录：在线 10 分钟，观看 12 分钟
  第 3 次登录：在线 1 分钟，观看 0 分钟
```

期望接口：

```http
GET /api/admin/users/:id
```

返回示例：

```json
{
  "id": 1782193395702,
  "email": "test@example.com",
  "username": "testuser",
  "totalLoginCount": 3,
  "totalOnlineDuration": 900,
  "totalWatchDuration": 1080,
  "loginSessions": [
    {
      "id": 103,
      "loginAt": "2026-06-23T10:30:00.000Z",
      "expiresAt": "2026-06-30T10:30:00.000Z",
      "isRevoked": false,
      "deviceInfo": "Chrome / Windows",
      "ipAddress": "54.151.215.196",
      "onlineDuration": 240,
      "watchDuration": 360,
      "lastHeartbeatAt": "2026-06-23T10:35:00.000Z"
    }
  ]
}
```

---

## 9. 为什么当前无法精准按每次登录统计

当前系统里：

- `refresh_tokens` 记录了每次登录
- `user_online_daily` 记录了用户每天在线总时长
- `watch_logs` 记录了用户观看日志

但是：

- 心跳数据没有记录属于哪一次登录
- 观看日志没有记录属于哪一次登录
- JWT 中没有登录会话 ID

所以当前只能按用户维度汇总，不能精准按登录维度汇总。

---

## 10. 推荐改造方案

推荐以 `refresh_tokens.id` 作为登录会话 ID。

### 10.1 JWT 增加 sessionId

登录时生成 refresh token 后，把 refresh token 的 ID 写入 JWT：

```json
{
  "sub": 1782193395702,
  "sid": 103
}
```

其中：

```text
sid = refresh_tokens.id
```

这样后续接口就能知道当前请求属于哪一次登录。

---

### 10.2 心跳按 session 统计

心跳接口除了继续统计用户每日在线时长，还需要按登录会话统计在线时长。

建议新增表：

```sql
CREATE TABLE IF NOT EXISTS user_login_session_online (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  login_session_id INT NOT NULL,
  duration INT NOT NULL DEFAULT 0,
  last_heartbeat_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_login_session_online (login_session_id),
  INDEX idx_user_login_session_online_user_id (user_id),
  INDEX idx_user_login_session_online_session_id (login_session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

每次心跳：

```text
user_online_daily +60 秒
user_login_session_online +60 秒
```

---

### 10.3 观看日志增加 sessionId

给 `watch_logs` 增加字段：

```sql
ALTER TABLE watch_logs
ADD COLUMN login_session_id INT NULL COMMENT '登录会话ID，对应 refresh_tokens.id',
ADD INDEX idx_watch_logs_login_session_id (login_session_id);
```

每次记录观看日志时，把当前 JWT 中的 `sid` 写入 `watch_logs.login_session_id`。

这样就可以按每次登录统计观看时长：

```sql
SELECT SUM(watch_duration)
FROM watch_logs
WHERE login_session_id = ?;
```

---

## 11. 改造后的统计逻辑

### 11.1 总登录次数

```sql
SELECT COUNT(*)
FROM refresh_tokens
WHERE user_id = ?;
```

### 11.2 每次登录列表

```sql
SELECT id, created_at, expires_at, is_revoked, device_info, ip_address
FROM refresh_tokens
WHERE user_id = ?
ORDER BY created_at DESC;
```

### 11.3 每次登录在线时长

```sql
SELECT duration, last_heartbeat_at
FROM user_login_session_online
WHERE login_session_id = ?;
```

### 11.4 每次登录观看时长

```sql
SELECT COALESCE(SUM(watch_duration), 0)
FROM watch_logs
WHERE login_session_id = ?;
```

### 11.5 用户总在线时长

```sql
SELECT COALESCE(SUM(duration), 0)
FROM user_online_daily
WHERE user_id = ?;
```

### 11.6 用户总观看时长

```sql
SELECT COALESCE(SUM(watch_duration), 0)
FROM watch_logs
WHERE user_id = ?;
```

---

## 12. 历史数据兼容说明

改造前的数据没有登录会话 ID，因此不能准确归属到某一次登录。

建议处理方式：

1. 新登录之后的数据按 session 精准统计
2. 旧观看日志的 `login_session_id` 为 `NULL`
3. 旧在线时长仍保留在 `user_online_daily` 的总统计里
4. 管理后台可以显示：
   - 用户总在线时长：包含历史数据
   - 用户总观看时长：包含历史数据
   - 每次登录统计：只保证改造后的新数据准确

---

## 13. 推荐前端展示

用户详情页建议展示：

### 13.1 汇总区域

| 指标 | 说明 |
|---|---|
| 总登录次数 | `totalLoginCount` |
| 当前有效登录 | `activeLogins` |
| 总在线时长 | `totalOnlineDuration` |
| 总观看时长 | `totalWatchDuration` |
| 最后登录时间 | `lastLoginAt` |
| 最近活跃时间 | `lastActiveAt` |
| 是否在线 | `isOnline` |

### 13.2 登录记录列表

| 字段 | 说明 |
|---|---|
| 登录时间 | `loginAt` |
| 设备 | `deviceInfo` |
| IP | `ipAddress` |
| 是否有效 | `isRevoked` / `expiresAt` |
| 本次在线时长 | `onlineDuration` |
| 本次观看时长 | `watchDuration` |
| 最后心跳时间 | `lastHeartbeatAt` |

---

## 14. 总结

当前系统已经支持：

- 登录次数统计
- 用户总在线时长统计
- 用户总观看时长统计
- 最近活跃状态
- 当前是否在线

但如果要实现“按每一次登录统计在线时长和观看时长”，需要新增登录会话统计能力：

1. JWT 增加 `sid`
2. 心跳按 `sid` 统计在线时长
3. 观看日志按 `sid` 记录观看时长
4. 管理端按 `refresh_tokens.id` 聚合每次登录数据

推荐后续按该方案改造。
