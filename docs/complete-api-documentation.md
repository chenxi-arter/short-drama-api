# 短剧API完整接口文档

## 📋 目录

- [概述](#概述)
- [快速开始](#快速开始)
- [认证模块](#1-认证模块-auth)
- [用户模块](#2-用户模块-user)
- [内容模块](#3-内容模块)
  - [首页模块](#31-首页模块-home)
  - [列表模块](#32-列表模块-list)
  - [短剧模块](#33-短剧模块-drama)
  - [电影模块](#34-电影模块-movie)
  - [综艺模块](#35-综艺模块-variety)
- [视频模块](#4-视频模块-video)
- [公共视频模块](#5-公共视频模块-public-video)
- [测试模块](#6-测试模块-test)
- [架构设计](#架构设计)
- [开发指南](#开发指南)
- [部署和监控](#部署和监控)

## 概述

本文档包含短剧API项目的所有接口定义、参数说明、响应格式和开发指南。该API提供了完整的短剧、电影、综艺内容管理和播放功能。

### 🔧 基础信息

- **基础URL**: `http://localhost:3000`
- **认证方式**: Bearer Token (JWT)
- **响应格式**: JSON
- **字符编码**: UTF-8
- **API版本**: v1.3.0
- **文档更新时间**: 2025-01-31
- **最新版本**: v1.3.0 (新增UUID防枚举攻击支持，视频列表接口返回UUID字段)

### 🚀 主要功能

- **用户认证**: Telegram OAuth登录、JWT Token管理
- **内容浏览**: 首页推荐、分类筛选、搜索功能
- **视频播放**: 多清晰度播放、观看进度记录
- **用户交互**: 评论弹幕、收藏点赞功能
- **内容管理**: 系列剧集管理、播放地址管理
- **安全特性**: UUID防枚举攻击，保护视频资源安全

## 快速开始

### 1. 环境要求

- Node.js >= 16.0.0
- MySQL >= 8.0
- Redis >= 6.0

### 2. 安装和启动

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run start:dev

# 服务将在 http://localhost:3000 启动
```

### 3. 快速测试

```bash
# 获取首页视频列表
curl "http://localhost:3000/api/home/getvideos"

# 获取公共视频分类
curl "http://localhost:3000/api/public/video/categories"

# 获取系列详情（包含剧集和播放地址）
curl "http://localhost:3000/api/public/video/series/1"
```

### 4. 认证流程

```javascript
// 1. Telegram登录
const loginResponse = await fetch('/user/telegram-login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(telegramAuthData)
});

// 2. 获取Token
const { access_token, refresh_token } = await loginResponse.json();

// 3. 使用Token访问受保护接口
const userInfo = await fetch('/user/me', {
  headers: { 'Authorization': `Bearer ${access_token}` }
});
```

### 📝 通用响应格式

```typescript
interface ApiResponse<T> {
  code: number;        // 状态码：200成功，400客户端错误，500服务器错误
  data?: T;           // 响应数据
  message?: string;   // 响应消息
  timestamp?: string; // 响应时间戳
  path?: string;      // 请求路径
}
```

### ❌ 通用错误响应

```typescript
interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}
```

### 📊 状态码说明

| 状态码 | 说明 | 示例场景 |
|--------|------|----------|
| 200 | 请求成功 | 正常获取数据 |
| 400 | 请求参数错误 | 参数格式不正确 |
| 401 | 未授权 | Token无效或过期 |
| 403 | 禁止访问 | 权限不足 |
| 404 | 资源不存在 | 请求的数据不存在 |
| 429 | 请求过于频繁 | 触发限流 |
| 500 | 服务器内部错误 | 系统异常 |

---

## 1. 🔐 认证模块 (Auth)

### 1.1 刷新访问令牌

**接口信息**
- **路径**: `POST /auth/refresh`
- **描述**: 使用refresh_token获取新的access_token
- **认证**: 无需认证

**请求参数**
```typescript
interface RefreshTokenRequest {
  refresh_token: string; // 必填，刷新令牌
}
```

**响应示例**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

**错误响应**
- `400`: refresh_token无效或已过期
- `401`: refresh_token格式错误

### 1.2 验证刷新令牌

**接口信息**
- **路径**: `POST /auth/verify-refresh-token`
- **描述**: 验证refresh_token是否有效
- **认证**: 无需认证

**请求参数**
```typescript
interface VerifyTokenRequest {
  refresh_token: string; // 必填，刷新令牌
}
```

**响应示例**
```json
{
  "valid": true,
  "message": "Refresh token 有效"
}
```

### 1.3 获取活跃设备列表

**接口信息**
- **路径**: `GET /auth/devices`
- **描述**: 获取用户的活跃设备列表
- **认证**: 需要Bearer Token

**响应示例**
```json
{
  "devices": [
    {
      "id": 1,
      "deviceInfo": "Chrome/Windows",
      "ipAddress": "192.168.1.100",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "expiresAt": "2024-01-08T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

### 1.4 撤销设备令牌

**接口信息**
- **路径**: `DELETE /auth/devices/:deviceId`
- **描述**: 撤销指定设备的refresh_token
- **认证**: 需要Bearer Token

**路径参数**
- `deviceId`: 设备ID (number)

**响应示例**
```json
{
  "message": "设备令牌已撤销"
}
```

---

## 2. 👤 用户模块 (User)

### 2.1 Telegram登录

**接口信息**
- **路径**: `POST /user/telegram-login` 或 `GET /user/telegram-login`
- **描述**: 通过Telegram OAuth进行用户登录
- **认证**: 无需认证

**请求参数**
```typescript
interface TelegramLoginRequest {
  id: number;           // 必填，Telegram用户ID
  first_name: string;   // 必填，用户名字
  last_name?: string;   // 可选，用户姓氏
  username?: string;    // 可选，用户名
  auth_date: number;    // 必填，认证时间戳
  hash: string;         // 必填，Telegram验证哈希
  photo_url?: string;   // 可选，头像URL
}
```

**响应示例**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "refresh_token_string",
  "expires_in": 3600,
  "token_type": "Bearer",
  "user": {
    "id": 123456789,
    "username": "john_doe",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### 2.2 获取用户信息

**接口信息**
- **路径**: `GET /user/me`
- **描述**: 获取当前登录用户的详细信息
- **认证**: 需要Bearer Token

**响应示例**
```json
{
  "id": 123456789,
  "username": "john_doe",
  "firstName": "John",
  "lastName": "Doe",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

## 3. 📺 内容模块

内容模块提供了短剧、电影、综艺等多媒体内容的浏览和筛选功能。所有内容模块都继承自基础模块控制器，提供统一的接口结构。

### 3.1 🏠 首页模块 (Home)

### 3.1 获取首页视频列表

**接口信息**
- **路径**: `GET /api/home/getvideos`
- **描述**: 获取首页推荐内容，包括轮播图、过滤器、视频列表
- **认证**: 无需认证
- **安全特性**: 支持UUID防枚举攻击

**请求参数**
```typescript
interface HomeVideosRequest {
  channeid?: string;  // 可选，频道ID，默认为"1"
  page?: number;      // 可选，页码，默认为1，最小值1
}
```

**响应示例**
```json
{
  "data": {
    "list": [
      {
        "type": 0,
        "name": "轮播图",
        "banners": [
          {
            "showURL": "https://example.com/banner1.jpg",
            "title": "热门剧集",
            "id": 1,
            "channeID": 1,
            "url": "1",
            "uuid": "550e8400-e29b-41d4-a716-446655440000"
          }
        ]
      },
      {
        "type": 1001,
        "name": "搜索过滤器",
        "filters": [
          {
            "channeID": 1,
            "name": "短剧",
            "title": "全部",
            "ids": "0,0,0,0,0"
          }
        ]
      },
      {
        "type": 3,
        "name": "推荐视频",
        "list": [
          {
            "id": 1,
            "coverUrl": "https://example.com/cover1.jpg",
            "title": "精彩剧集",
            "score": "8.5",
            "playCount": 12345,
            "url": "1",
            "type": "剧情",
            "isSerial": true,
            "upStatus": "更新到10集",
            "upCount": 2,
            "uuid": "123e4567-e89b-12d3-a456-426614174000"
          }
        ]
      }
    ]
  },
  "code": 200,
  "msg": null
}
```

**字段说明**
- `banners[].uuid`: 轮播图UUID标识符，用于防枚举攻击的安全访问
- `list[].uuid`: 视频UUID标识符，推荐用于视频详情查询，提升安全性
- `list[].id`: 视频数字ID，保留用于向后兼容
- `list[].url`: 视频访问路径，建议配合UUID使用

---

### 3.2 📋 列表模块 (List)

### 3.2.1 获取筛选器标签

**接口信息**
- **路径**: `GET /api/list/getfilterstags`
- **描述**: 获取视频筛选器的标签分组
- **认证**: 无需认证

**请求参数**
```typescript
interface FilterTagsRequest {
  channeid?: string;  // 可选，频道ID，默认为"1"
}
```

**响应示例**
```json
{
  "list": [
    {
      "name": "排序标签",
      "list": [
        {
          "index": 0,
          "classifyId": 0,
          "classifyName": "最新上传",
          "isDefaultSelect": true
        },
        {
          "index": 0,
          "classifyId": 1,
          "classifyName": "最近更新",
          "isDefaultSelect": false
        }
      ]
    },
    {
      "name": "分类标签",
      "list": [
        {
          "index": 1,
          "classifyId": 0,
          "classifyName": "全部类型",
          "isDefaultSelect": true
        }
      ]
    }
  ]
}
```

### 3.2.2 获取筛选器数据

**接口信息**
- **路径**: `GET /api/list/getfiltersdata`
- **描述**: 根据筛选条件获取视频列表
- **认证**: 无需认证

**请求参数**
```typescript
interface FilterDataRequest {
  channeid?: string;  // 可选，频道ID，默认为"1"
  ids?: string;       // 可选，筛选ID组合，默认为"0,0,0,0,0"
  page?: string;      // 可选，页码，默认为"1"
}
```

**响应示例**
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 828839,
        "coverUrl": "https://example.com/cover.jpg",
        "title": "狂飙",
        "playCount": 23959613,
        "upStatus": "39集全",
        "upCount": 0,
        "score": "8.8",
        "isSerial": false,
        "cidMapper": "警匪·罪案·剧情",
        "isRecommend": true,
        "uuid": "789e0123-e45f-67g8-h901-234567890abc"
      }
    ]
  },
  "msg": null
}
```

---

### 3.3 🎭 短剧模块 (Drama)

短剧模块提供专门针对短剧内容的API接口，继承自基础模块控制器，支持完整的筛选和分页功能。

### 3.3.1 获取短剧视频列表

**接口信息**
- **路径**: `GET /api/drama/getvideos`
- **描述**: 获取短剧推荐内容，包括轮播图、过滤器、视频列表
- **认证**: 无需认证
- **默认频道**: 1 (短剧频道)
- **安全特性**: 支持UUID防枚举攻击

**请求参数**
```typescript
interface DramaVideosRequest {
  channeid?: string;  // 可选，频道ID，默认为"1"
  page?: number;      // 可选，页码，默认为1，最小值1
}
```

**响应格式**: 与首页模块相同的数据结构

### 3.3.2 获取短剧筛选器标签

**接口信息**
- **路径**: `GET /api/drama/getfilterstags`
- **描述**: 获取短剧筛选器的标签分组
- **认证**: 无需认证

**请求参数**
```typescript
interface DramaFilterTagsRequest {
  channeid?: string;  // 可选，频道ID，默认为"1"
}
```

**响应格式**: 与列表模块相同的筛选器标签结构

### 3.3.3 获取短剧筛选器数据

**接口信息**
- **路径**: `GET /api/drama/getfiltersdata`
- **描述**: 根据筛选条件获取短剧列表
- **认证**: 无需认证

**请求参数**
```typescript
interface DramaFilterDataRequest {
  channeid?: string;  // 可选，频道ID，默认为"1"
  ids?: string;       // 可选，筛选ID组合，默认为"0,0,0,0,0"
  page?: string;      // 可选，页码，默认为"1"
}
```

**响应格式**: 与列表模块相同的筛选数据结构

---

### 3.4 🎬 电影模块 (Movie)

电影模块提供专门针对电影内容的API接口，继承自基础模块控制器，支持完整的筛选和分页功能。

### 3.4.1 获取电影视频列表

**接口信息**
- **路径**: `GET /api/movie/getvideos`
- **描述**: 获取电影推荐内容，包括轮播图、过滤器、视频列表
- **认证**: 无需认证
- **默认频道**: 2 (电影频道)
- **安全特性**: 支持UUID防枚举攻击

**请求参数**
```typescript
interface MovieVideosRequest {
  channeid?: string;  // 可选，频道ID，默认为"2"
  page?: number;      // 可选，页码，默认为1，最小值1
}
```

### 3.4.2 获取电影筛选器标签

**接口信息**
- **路径**: `GET /api/movie/getfilterstags`
- **描述**: 获取电影筛选器的标签分组
- **认证**: 无需认证

### 3.4.3 获取电影筛选器数据

**接口信息**
- **路径**: `GET /api/movie/getfiltersdata`
- **描述**: 根据筛选条件获取电影列表
- **认证**: 无需认证

---

### 3.5 📺 综艺模块 (Variety)

综艺模块提供专门针对综艺内容的API接口，继承自基础模块控制器，支持完整的筛选和分页功能。

### 3.5.1 获取综艺视频列表

**接口信息**
- **路径**: `GET /api/variety/getvideos`
- **描述**: 获取综艺推荐内容，包括轮播图、过滤器、视频列表
- **认证**: 无需认证
- **默认频道**: 3 (综艺频道)
- **安全特性**: 支持UUID防枚举攻击

**请求参数**
```typescript
interface VarietyVideosRequest {
  channeid?: string;  // 可选，频道ID，默认为"3"
  page?: number;      // 可选，页码，默认为1，最小值1
}
```

### 3.5.2 获取综艺筛选器标签

**接口信息**
- **路径**: `GET /api/variety/getfilterstags`
- **描述**: 获取综艺筛选器的标签分组
- **认证**: 无需认证

### 3.5.3 获取综艺筛选器数据

**接口信息**
- **路径**: `GET /api/variety/getfiltersdata`
- **描述**: 根据筛选条件获取综艺列表
- **认证**: 无需认证

---

## 4. 🎬 视频模块 (Video)

视频模块提供视频播放相关的核心功能，包括观看进度记录、评论弹幕、视频详情获取和播放地址管理等。

### 4.1 保存观看进度

**接口信息**
- **路径**: `POST /api/video/progress`
- **描述**: 记录或更新用户的观看进度
- **认证**: 需要Bearer Token

**请求参数**
```typescript
interface SaveProgressRequest {
  episodeId: number;     // 必填，剧集ID
  stopAtSecond: number;  // 必填，停止观看的秒数
}
```

**响应示例**
```json
{
  "message": "观看进度已保存",
  "progress": {
    "episodeId": 1,
    "stopAtSecond": 1200,
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### 4.2 获取观看进度

**接口信息**
- **路径**: `GET /api/video/progress`
- **描述**: 获取用户在指定剧集的观看进度
- **认证**: 需要Bearer Token

**请求参数**
```typescript
interface GetProgressRequest {
  episodeId: number;  // 必填，剧集ID
}
```

**响应示例**
```json
{
  "episodeId": 1,
  "stopAtSecond": 1200,
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

### 4.3 发表评论

**接口信息**
- **路径**: `POST /api/video/comment`
- **描述**: 为指定剧集发表评论或弹幕
- **认证**: 需要Bearer Token

**请求参数**
```typescript
interface AddCommentRequest {
  episodeId: number;      // 必填，剧集ID
  content: string;        // 必填，评论内容
  appearSecond?: number;  // 可选，弹幕出现时间（秒）
}
```

**响应示例**
```json
{
  "message": "评论发表成功",
  "comment": {
    "id": 123,
    "content": "这部剧太精彩了！",
    "episodeId": 1,
    "appearSecond": 300,
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### 4.4 获取视频详情

**接口信息**
- **路径**: `GET /api/video/details`
- **描述**: 获取视频的详细信息，包括剧集列表、演员信息、导演信息等
- **认证**: 需要Bearer Token
- **安全特性**: 支持UUID防枚举攻击

**请求参数**
```typescript
interface VideoDetailsRequest {
  uuid?: string;  // 推荐，视频UUID标识符（防枚举攻击）
  id?: string;    // 兼容，视频ID（向后兼容，建议迁移到uuid）
}
```

**参数说明**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| uuid | string | 推荐 | 视频UUID标识符，格式如：550e8400-e29b-41d4-a716-446655440000 |
| id | string | 兼容 | 视频ID（数字），向后兼容支持，建议使用uuid |

**请求示例**
```bash
# 推荐方式：使用UUID（防枚举攻击）
curl -X GET "http://localhost:3000/api/video/details?uuid=550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer your-jwt-token"

# 兼容方式：使用ID（向后兼容）
curl -X GET "http://localhost:3000/api/video/details?id=1" \
  -H "Authorization: Bearer your-jwt-token"
```

**响应示例**
```json
{
  "code": 200,
  "data": {
    "detailInfo": {
      "id": 1,
      "title": "精彩剧集",
      "coverUrl": "https://example.com/cover.jpg",
      "description": "这是一部精彩的剧集",
      "starring": "张三,李四",
      "actor": "张三,李四,王五,赵六",
      "director": "导演甲",
      "score": "8.5",
      "playCount": 12345,
      "serialCount": 24,
      "updateStatus": "更新到第10集",
      "episodes": [
        {
          "episodeId": 1,
          "title": "第1集",
          "episodeTitle": "初遇",
          "duration": 2400,
          "isVip": false
        }
      ]
    },
    "like": {
      "count": 1234,
      "selected": false
    },
    "favorites": {
      "count": 567,
      "selected": true
    }
  },
  "msg": "success"
}
```

**字段说明**
- `starring`: 主演名单，包含剧集的主要演员，多个演员用逗号分隔
- `actor`: 完整演员名单，包含剧集的所有演员，多个演员用逗号分隔
- `director`: 导演信息，包含剧集的导演，多个导演用逗号分隔
- `serialCount`: 总集数
- `updateStatus`: 更新状态，如"更新到第10集"、"全集"等
- `episodes`: 剧集列表，包含每一集的详细信息

---

### 4.5 获取播放地址

**接口信息**
- **路径**: `GET /api/video/episode-url/:accessKey`
- **描述**: 通过访问密钥获取剧集的播放地址
- **认证**: 需要Bearer Token

**路径参数**
- `accessKey`: 播放地址的访问密钥 (string)

**响应示例**
```json
{
  "id": 13,
  "episodeId": 1,
  "quality": "720p",
  "ossUrl": "https://oss.example.com/ep1_720p.mp4",
  "cdnUrl": "https://cdn.example.com/ep1_720p.mp4",
  "subtitleUrl": "https://cdn.example.com/ep1_sub.srt",
  "accessKey": "873f47e16e1d11f0a79246ab21e67dc1",
  "episode": {
    "id": 1,
    "title": "初次相遇",
    "series": {
      "id": 1,
      "title": "都市爱情故事"
    }
  }
}
```

**字段说明**
- `quality`: 视频清晰度（720p/1080p/4K）
- `ossUrl`: OSS原始播放地址
- `cdnUrl`: CDN加速播放地址（推荐使用）
- `subtitleUrl`: 字幕文件地址
- `accessKey`: 防枚举攻击的访问密钥

### 4.6 获取用户媒体列表

**接口信息**
- **路径**: `GET /api/video/media`
- **描述**: 获取用户相关的媒体内容列表
- **认证**: 需要Bearer Token

**请求参数**
```typescript
interface MediaQueryRequest {
  categoryId?: number;              // 可选，分类ID
  type?: 'short' | 'series';       // 可选，媒体类型
  sort?: 'latest' | 'like' | 'play'; // 可选，排序方式，默认latest
  page?: number;                    // 可选，页码，默认1
  size?: number;                    // 可选，每页数量，默认20，最大50
}
```

---

## 5. 🌐 公共视频模块 (Public Video)

公共视频模块提供无需认证的视频内容访问接口，包括分类浏览、系列详情、媒体列表等功能。

### 5.1 获取分类列表

**接口信息**
- **路径**: `GET /api/public/video/categories`
- **描述**: 获取所有视频分类
- **认证**: 无需认证

**响应示例**
```json
{
  "categories": [
    {
      "id": 1,
      "name": "短剧",
      "description": "精彩短剧内容",
      "sortOrder": 1
    },
    {
      "id": 2,
      "name": "电影",
      "description": "热门电影推荐",
      "sortOrder": 2
    }
  ]
}
```

### 5.2 获取系列列表

**接口信息**
- **路径**: `GET /api/public/video/series/list`
- **描述**: 获取系列剧集的完整列表
- **认证**: 无需认证

**请求参数**
```typescript
interface SeriesListRequest {
  categoryId?: number;  // 可选，分类ID
  page?: number;        // 可选，页码，默认1
  size?: number;        // 可选，每页数量，默认20
}
```

### 5.3 获取系列详情

**接口信息**
- **路径**: `GET /api/public/video/series/:id`
- **描述**: 获取指定系列的详细信息
- **认证**: 无需认证

**路径参数**
- `id`: 系列ID (number)

### 5.4 获取媒体列表

**接口信息**
- **路径**: `GET /api/public/video/media`
- **描述**: 获取公共媒体内容列表
- **认证**: 无需认证

**请求参数**
```typescript
interface PublicMediaRequest {
  categoryId?: number;              // 可选，分类ID
  type?: 'short' | 'series';       // 可选，媒体类型
  sort?: 'latest' | 'like' | 'play'; // 可选，排序方式
  page?: number;                    // 可选，页码
  size?: number;                    // 可选，每页数量
}
```

---

## 6. 🧪 测试模块 (Test)

### 6.1 测试用户信息

**接口信息**
- **路径**: `GET /test/me`
- **描述**: 测试JWT认证并获取用户信息
- **认证**: 需要Bearer Token

**响应示例**
```json
{
  "message": "登录有效",
  "user": {
    "id": 123456789,
    "username": "john_doe",
    "firstName": "John",
    "lastName": "Doe",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## 7. 🔒 安全增强指南

本章节详细说明系统的安全增强措施，特别是防枚举攻击的实施方案。

### 7.1 防枚举攻击方案

#### 7.1.1 UUID替换策略

**问题分析**
- 当前系统使用自增ID，容易被恶意用户枚举
- 攻击者可以通过ID范围推测数据规模和业务增长
- 连续ID暴露了系统的内部结构

**解决方案**
1. **数据库层面**：为主要实体添加UUID字段
2. **API层面**：优先使用UUID，保持ID向后兼容
3. **安全层面**：实施多层防护机制

**实施步骤**
```sql
-- 1. 添加UUID字段
ALTER TABLE `series` ADD COLUMN `uuid` VARCHAR(36) UNIQUE AFTER `id`;
ALTER TABLE `episodes` ADD COLUMN `uuid` VARCHAR(36) UNIQUE AFTER `id`;

-- 2. 为现有数据生成UUID
UPDATE `series` SET `uuid` = UUID() WHERE `uuid` IS NULL;
UPDATE `episodes` SET `uuid` = UUID() WHERE `uuid` IS NULL;

-- 3. 添加索引优化查询
CREATE INDEX `idx_series_uuid` ON `series`(`uuid`);
CREATE INDEX `idx_episodes_uuid` ON `episodes`(`uuid`);
```

#### 7.1.2 AccessKey机制

系统已实现AccessKey机制用于播放地址的防枚举保护：

**特性**
- 64位随机字符串，唯一性保证
- 替代直接的播放地址ID访问
- 有效防止播放资源被批量枚举

**使用示例**
```javascript
// 通过AccessKey获取播放地址
const playbackInfo = await fetch(`/api/video/episode-url/${accessKey}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

#### 7.1.3 多层防护策略

**1. 请求频率限制**
- 单IP每分钟最多20次视频详情请求
- 连续404错误超过5次触发临时封禁
- 异常访问模式自动检测和报警

**2. 智能响应策略**
- 对不存在的资源返回统一的404响应
- 不暴露具体的错误原因
- 记录可疑访问行为用于分析

**3. 监控和日志**
- 实时监控枚举攻击模式
- 详细记录安全相关事件
- 定期生成安全分析报告

### 7.2 迁移指南

#### 7.2.1 客户端迁移

**阶段一：兼容性支持（当前）**
```typescript
// 支持两种方式调用
const getVideoDetails = async (identifier: string) => {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier);
  
  const params = isUUID ? { uuid: identifier } : { id: identifier };
  return await fetch('/api/video/details', { params });
};
```

**阶段二：UUID优先（推荐）**
```typescript
// 优先使用UUID
const getVideoDetails = async (uuid: string) => {
  return await fetch(`/api/video/details?uuid=${uuid}`);
};
```

**阶段三：完全迁移（未来）**
```typescript
// 仅支持UUID
const getVideoDetails = async (uuid: string) => {
  if (!isValidUUID(uuid)) {
    throw new Error('Invalid video identifier');
  }
  return await fetch(`/api/video/details?uuid=${uuid}`);
};
```

#### 7.2.2 数据迁移

**批量生成UUID**
```sql
-- 为现有数据生成UUID
UPDATE series SET uuid = UUID() WHERE uuid IS NULL OR uuid = '';
UPDATE episodes SET uuid = UUID() WHERE uuid IS NULL OR uuid = '';
```

**验证数据完整性**
```sql
-- 检查UUID生成情况
SELECT 
  COUNT(*) as total,
  COUNT(uuid) as with_uuid,
  COUNT(*) - COUNT(uuid) as missing_uuid
FROM series;
```

### 7.3 安全最佳实践

#### 7.3.1 API设计原则

1. **最小信息暴露**：只返回必要的数据字段
2. **统一错误响应**：不暴露系统内部结构
3. **访问控制**：合理设置认证和授权
4. **输入验证**：严格验证所有输入参数

#### 7.3.2 监控指标

**关键指标**
- 404错误率：正常应 < 5%
- 连续失败请求：单IP < 10次/小时
- UUID使用率：目标 > 80%
- 响应时间：UUID查询 < 100ms

**告警规则**
```yaml
# 示例告警配置
alerts:
  - name: "枚举攻击检测"
    condition: "404_rate > 20% AND request_count > 100"
    action: "临时封禁IP + 发送告警"
  
  - name: "UUID迁移进度"
    condition: "uuid_usage_rate < 50%"
    action: "发送迁移提醒"
```

---

## 8. 🛠️ 开发指南

### 8.1 健壮性改进建议

#### 8.1.1 🚨 统一错误处理

**当前问题**:
- 错误响应格式不统一
- 缺少详细的错误码定义
- 错误信息不够友好

**改进建议**:
```typescript
// 创建全局异常过滤器
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    
    const status = exception instanceof HttpException 
      ? exception.getStatus() 
      : 500;
      
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: this.getErrorMessage(exception),
      error: this.getErrorType(status)
    };
    
    response.status(status).json(errorResponse);
  }
}
```

#### 8.1.2 ✅ 请求参数验证增强

**当前问题**:
- 部分接口缺少完整的参数验证
- 数值范围验证不够严格
- 缺少自定义验证规则

**改进建议**:
```typescript
// 增强的分页DTO
export class EnhancedPaginationDto {
  @Type(() => Number)
  @IsInt({ message: '页码必须是整数' })
  @Min(1, { message: '页码最小值为1' })
  @Max(1000, { message: '页码最大值为1000' })
  page = 1;

  @Type(() => Number)
  @IsInt({ message: '每页数量必须是整数' })
  @Min(1, { message: '每页数量最小值为1' })
  @Max(100, { message: '每页数量最大值为100' })
  size = 20;
}

// 自定义验证装饰器
export function IsValidChannelId(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidChannelId',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          return typeof value === 'string' && /^[1-9]\d*$/.test(value);
        },
        defaultMessage() {
          return '频道ID格式无效';
        }
      }
    });
  };
}
```

#### 8.1.3 📋 响应格式标准化

**当前问题**:
- 不同接口的响应格式不一致
- 缺少统一的响应包装器
- 分页信息格式不统一

**改进建议**:
```typescript
// 统一响应包装器
export class ResponseWrapper {
  static success<T>(data: T, message = 'success'): ApiResponse<T> {
    return {
      code: 200,
      data,
      message,
      timestamp: new Date().toISOString()
    };
  }
  
  static paginated<T>(
    data: T[], 
    total: number, 
    page: number, 
    size: number
  ): PaginatedResponse<T> {
    return {
      code: 200,
      data,
      pagination: {
        total,
        page,
        size,
        totalPages: Math.ceil(total / size),
        hasNext: page * size < total,
        hasPrev: page > 1
      },
      timestamp: new Date().toISOString()
    };
  }
}
```

#### 8.1.4 🔒 安全性增强

**当前问题**:
- 缺少请求频率限制
- 没有IP白名单机制
- 敏感信息可能泄露

**改进建议**:
```typescript
// 请求限流装饰器
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private readonly redis: Redis) {}
  
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip;
    const key = `rate_limit:${ip}`;
    
    const current = await this.redis.incr(key);
    if (current === 1) {
      await this.redis.expire(key, 60); // 1分钟窗口
    }
    
    if (current > 100) { // 每分钟最多100次请求
      throw new HttpException('请求过于频繁', 429);
    }
    
    return true;
  }
}

// 敏感信息过滤
export class SensitiveDataFilter {
  static filterUserData(user: any) {
    const { password, refreshTokens, ...safeData } = user;
    return safeData;
  }
}
```

#### 8.1.5 📊 日志和监控

**改进建议**:
```typescript
// 请求日志中间件
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');
  
  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('User-Agent') || '';
    
    const start = Date.now();
    
    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - start;
      
      this.logger.log(
        `${method} ${originalUrl} ${statusCode} ${duration}ms - ${ip} ${userAgent}`
      );
    });
    
    next();
  }
}
```

#### 8.1.6 🗄️ 数据库查询优化

**改进建议**:
```typescript
// 分页查询优化
export class OptimizedPaginationService {
  async findWithPagination<T>(
    repository: Repository<T>,
    options: FindManyOptions<T>,
    page: number,
    size: number
  ): Promise<PaginatedResult<T>> {
    // 使用 getManyAndCount 减少查询次数
    const [data, total] = await repository.findAndCount({
      ...options,
      skip: (page - 1) * size,
      take: size
    });
    
    return {
      data,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size)
    };
  }
}
```

#### 8.1.7 ⚡ 缓存策略

**改进建议**:
```typescript
// Redis缓存装饰器
export function Cacheable(ttl: number = 300) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;
      
      // 尝试从缓存获取
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
      
      // 执行原方法
      const result = await originalMethod.apply(this, args);
      
      // 存入缓存
      await this.redis.setex(cacheKey, ttl, JSON.stringify(result));
      
      return result;
    };
  };
}
```

---

### 8.2 🧪 测试建议

#### 8.2.1 🔬 单元测试
```typescript
// 控制器测试示例
describe('HomeController', () => {
  let controller: HomeController;
  let service: VideoService;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [HomeController],
      providers: [
        {
          provide: VideoService,
          useValue: {
            getHomeVideos: jest.fn()
          }
        }
      ]
    }).compile();
    
    controller = module.get<HomeController>(HomeController);
    service = module.get<VideoService>(VideoService);
  });
  
  it('should return home videos', async () => {
    const mockData = { data: { list: [] }, code: 200, msg: null };
    jest.spyOn(service, 'getHomeVideos').mockResolvedValue(mockData);
    
    const result = await controller.getVideos({ channeid: '1', page: 1 });
    expect(result).toEqual(mockData);
  });
});
```

#### 8.2.2 🔗 集成测试
```typescript
// E2E测试示例
describe('Auth (e2e)', () => {
  let app: INestApplication;
  
  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();
    
    app = moduleFixture.createNestApplication();
    await app.init();
  });
  
  it('/auth/refresh (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refresh_token: 'valid_token' })
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('access_token');
        expect(res.body).toHaveProperty('expires_in');
      });
  });
});
```

---

### 8.3 🚀 部署和监控

#### 8.3.1 ❤️ 健康检查
```typescript
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };
  }
}
```

#### 8.3.2 📈 性能监控
```typescript
// 性能监控中间件
@Injectable()
export class PerformanceMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = process.hrtime.bigint();
    
    res.on('finish', () => {
      const duration = Number(process.hrtime.bigint() - start) / 1000000; // ms
      
      if (duration > 1000) { // 超过1秒的请求
        console.warn(`Slow request: ${req.method} ${req.url} - ${duration}ms`);
      }
    });
    
    next();
  }
}
```

### 8.4 📚 API 使用最佳实践

#### 8.4.1 🔐 认证流程
```javascript
// 1. Telegram 登录
const loginResponse = await fetch('/api/auth/telegram/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ telegramData })
});

// 2. 获取令牌
const { accessToken, refreshToken } = await loginResponse.json();

// 3. 使用令牌访问受保护接口
const videoResponse = await fetch('/api/video/progress', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});
```

#### 8.4.2 🎬 视频播放流程
```javascript
// 1. 获取系列详情
const seriesResponse = await fetch('/api/public/video/series/1');
const series = await seriesResponse.json();

// 2. 选择剧集和播放地址
const episode = series.episodes[0];
const playUrl = episode.urls.find(url => url.quality === '720p');

// 3. 获取播放地址（需要认证）
const playResponse = await fetch(`/api/video/episode-url/${playUrl.accessKey}`, {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});
const playData = await playResponse.json();

// 4. 播放视频
const videoElement = document.getElementById('video');
videoElement.src = playData.cdnUrl; // 推荐使用 CDN 地址
```

#### 8.4.3 📊 分页和筛选
```javascript
// 获取筛选器标签
const tagsResponse = await fetch('/api/drama/getfilterstags');
const tags = await tagsResponse.json();

// 应用筛选条件
const filterParams = new URLSearchParams({
  page: '1',
  size: '20',
  sort: 'latest',
  'tags[]': ['爱情', '都市'] // 多个标签
});

const dramaResponse = await fetch(`/api/drama/getfiltersdata?${filterParams}`);
const dramas = await dramaResponse.json();
```

#### 8.4.4 ⚡ 性能优化建议
- **缓存策略**: 缓存分类列表、标签数据等静态内容
- **分页加载**: 使用合理的分页大小（建议 20-50 条）
- **图片优化**: 使用 CDN 和适当的图片格式
- **请求合并**: 避免频繁的小请求，合理批量处理
- **错误重试**: 实现指数退避的重试机制

---

## 9. 📝 总结

本文档提供了短剧API项目的完整接口说明和健壮性改进建议。

### 9.1 🎯 主要改进方向

| 优先级 | 改进项目 | 描述 | 预期效果 |
|--------|----------|------|----------|
| 🔴 高 | 统一错误处理 | 标准化错误响应格式 | 提升开发体验 |
| 🔴 高 | 参数验证增强 | 更严格的输入验证 | 减少错误请求 |
| 🟡 中 | 响应格式标准化 | 统一的API响应结构 | 提升一致性 |
| 🟡 中 | 安全性提升 | 请求限流、敏感信息保护 | 增强系统安全 |
| 🟢 低 | 性能优化 | 缓存策略、数据库查询优化 | 提升响应速度 |
| 🟢 低 | 监控和日志 | 完善的日志记录和性能监控 | 便于问题排查 |
| 🟢 低 | 测试覆盖 | 单元测试和集成测试 | 保证代码质量 |

### 9.2 💡 实施建议

1. **第一阶段** (1-2周): 实施高优先级改进项目
2. **第二阶段** (3-4周): 完成中优先级改进项目
3. **第三阶段** (5-6周): 实施低优先级改进项目
4. **持续优化**: 根据实际使用情况持续改进

### 9.3 🎉 预期收益

- ✅ **稳定性提升**: 减少系统错误和异常
- ✅ **安全性增强**: 防范常见安全威胁
- ✅ **性能优化**: 提升API响应速度
- ✅ **开发效率**: 提升开发和维护效率
- ✅ **用户体验**: 提供更好的API使用体验

---

## 10. 🏗️ 架构设计

### 10.1 基础模块控制器 (BaseModuleController)

为了减少代码重复并提高维护性，系统采用了基类控制器设计模式。所有内容模块（短剧、电影、综艺）都继承自 `BaseModuleController`。

**设计优势**:
- **代码复用**: 通用的接口逻辑只需实现一次
- **一致性**: 所有模块提供相同的API接口结构
- **维护性**: 修改通用逻辑时只需更新基类
- **扩展性**: 新增模块只需实现抽象方法

**抽象方法**:
```typescript
abstract getDefaultChannelId(): string;  // 获取模块默认频道ID
abstract getModuleVideosMethod(): string; // 获取模块视频的方法名
```

**通用接口**:
- `getvideos`: 获取推荐视频列表
- `getfilterstags`: 获取筛选器标签
- `getfiltersdata`: 获取筛选数据

### 10.2 筛选器系统架构

筛选器系统采用灵活的实体关系设计，支持动态配置筛选条件。

**核心实体**:
- `FilterType`: 筛选器类型（分类、地区、语言、年份、状态等）
- `FilterOption`: 筛选器选项（具体的筛选值）

**筛选参数结构**:
```typescript
interface FilterIds {
  sortType: number;    // 排序类型
  categoryId: number;  // 分类ID
  regionId: number;    // 地区ID
  languageId: number;  // 语言ID
  yearId: number;      // 年份ID
  statusId: number;    // 状态ID
}
```

**缓存机制**:
- 筛选器标签缓存: 24小时
- 筛选数据缓存: 10分钟
- 提高响应速度，减少数据库查询

### 10.3 模块映射关系

| 模块 | 路由前缀 | 默认频道ID | 内容类型 |
|------|----------|------------|----------|
| 短剧 | `/api/drama` | 1 | 短剧内容 |
| 电影 | `/api/movie` | 2 | 电影内容 |
| 综艺 | `/api/variety` | 3 | 综艺内容 |
| 首页 | `/api/home` | 1 | 混合推荐 |

### 10.4 UUID安全特性

**v1.3.0 新增功能**: 为了提升API安全性，防止枚举攻击，所有视频列表接口现在都返回UUID字段。

**UUID字段位置**:
- **视频列表**: `data.list[].list[].uuid` (type=3板块)
- **轮播图**: `data.list[].banners[].uuid` (type=0板块)

**使用建议**:
1. **推荐做法**: 优先使用UUID进行视频详情查询
2. **向后兼容**: 保留数字ID字段，确保现有客户端正常工作
3. **安全提升**: UUID有效防止恶意用户枚举视频资源

**示例对比**:
```bash
# 推荐方式（使用UUID）
curl "http://localhost:3000/api/video/details?uuid=123e4567-e89b-12d3-a456-426614174000"

# 兼容方式（使用ID）
curl "http://localhost:3000/api/video/details?id=1"
```

---

## 📝 更新日志

### v1.3.0 (2025-01-31)
- ✨ **新增**: 视频列表接口返回UUID字段
- 🔒 **安全**: 支持UUID防枚举攻击
- 📚 **文档**: 更新API文档，添加UUID使用说明
- 🔄 **兼容**: 保持向后兼容，同时支持ID和UUID查询

### v1.2.0 (2025-01-30)
- ✨ **新增**: 视频详情获取和播放地址管理
- 🎬 **功能**: 完善剧集播放功能
- 📊 **优化**: 改进数据库查询性能

---

*📅 文档最后更新: 2025-01-31*  
*👨‍💻 维护者: 开发团队*  
*📧 联系方式: dev@example.com*