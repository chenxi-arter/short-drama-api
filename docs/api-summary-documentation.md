# 🚀 短剧API接口汇总文档

## 📋 项目概述

本项目是一个基于 NestJS 的短剧视频平台后端API系统，提供用户认证、视频管理、筛选搜索、分类管理、轮播图管理等功能。

**技术栈：** NestJS + TypeORM + MySQL + Redis + JWT

---

## 👤 用户相关接口

### UserController (`/user`)

| 接口名称 | 方法 | 路径 | 描述 | 认证要求 |
|---------|------|------|------|----------|
| Telegram登录 | POST/GET | `/user/telegram-login` | Telegram OAuth登录 | ❌ |
| 获取用户信息 | GET | `/user/me` 🔐 | 获取当前用户信息 | ✅ |
| 刷新令牌 | POST | `/user/refresh` 🔐 | 使用refresh_token获取新的access_token | ✅ |
| 验证令牌 | POST | `/user/verify-refresh-token` 🔐 | 验证refresh_token有效性 | ✅ |
| 登出 | POST | `/user/logout` 🔐 | 撤销指定的refresh_token | ✅ |
| 全设备登出 | POST | `/user/logout-all` 🔐 | 撤销用户所有设备的令牌 | ✅ |
| 获取设备列表 | GET | `/user/devices` 🔐 | 获取用户活跃设备列表 | ✅ |
| 撤销设备 | DELETE | `/user/devices/:id` 🔐 | 撤销指定设备的令牌 | ✅ |

#### 请求参数

**Telegram登录**
```typescript
{
  "id": number,           // 必填，Telegram用户ID
  "first_name": string,   // 必填，用户名
  "last_name?": string,   // 可选，姓氏
  "username?": string,    // 可选，用户名
  "auth_date": number,    // 必填，认证时间戳
  "hash": string,         // 必填，验证哈希
  "photo_url?": string    // 可选，头像URL
}
```

**刷新令牌 (POST /user/refresh)**
```typescript
{
  "refresh_token": string // 必填，刷新令牌
}
```

**验证令牌 (POST /user/verify-refresh-token)**
```typescript
{
  "refresh_token": string // 必填，待验证的刷新令牌
}
```

**登出 (POST /user/logout)**
```typescript
{
  "refresh_token": string // 必填，要撤销的刷新令牌
}
```

#### 响应格式

**用户信息响应**
```typescript
{
  "id": number,
  "username": string,
  "firstName": string,
  "lastName": string,
  "isActive": boolean,
  "createdAt": string
}
```

**令牌响应**
```typescript
{
  "access_token": string,   // 访问令牌
  "refresh_token": string, // 刷新令牌（仅登录时返回）
  "expires_in": number,    // 过期时间（秒）
  "token_type": "Bearer"   // 令牌类型
}
```

**设备列表响应**
```typescript
{
  "devices": [
    {
      "id": number,
      "deviceInfo": string,
      "ipAddress": string,
      "createdAt": string,
      "expiresAt": string
    }
  ],
  "total": number
}
```

**验证令牌响应**
```typescript
{
  "valid": boolean,
  "message": string
}
```

---

## 🎨 轮播图管理接口

### BannerController (`/api/banners`)

| 接口名称 | 方法 | 路径 | 描述 | 认证要求 |
|---------|------|------|------|----------|
| 创建轮播图 | POST | `/api/banners` | 创建新的轮播图 | ❌ |
| 更新轮播图 | PUT | `/api/banners/:id` | 更新指定轮播图 | ❌ |
| 删除轮播图 | DELETE | `/api/banners/:id` | 删除指定轮播图 | ❌ |
| 获取轮播图详情 | GET | `/api/banners/:id` | 获取指定轮播图详情 | ❌ |
| 获取轮播图列表 | GET | `/api/banners` 🔐 | 获取轮播图列表（分页） | ✅ |
| 切换轮播图状态 | PUT | `/api/banners/:id/status` | 启用/禁用轮播图 | ❌ |
| 更新轮播图权重 | PUT | `/api/banners/weights` | 批量更新轮播图权重 | ❌ |
| 获取活跃轮播图 | GET | `/api/banners/active/list` 🔐 | 获取活跃状态的轮播图列表 | ✅ |

#### 请求参数

**创建轮播图 (POST /api/banners)**
```typescript
{
  "title": string,        // 必填，轮播图标题
  "imageUrl": string,     // 必填，图片URL
  "linkUrl?": string,     // 可选，点击跳转链接
  "weight?": number,      // 可选，权重（排序用）
  "isActive?": boolean,   // 可选，是否启用
  "categoryId?": number   // 可选，关联分类ID
}
```

**更新轮播图 (PUT /api/banners/:id)**
```typescript
{
  "title?": string,
  "imageUrl?": string,
  "linkUrl?": string,
  "weight?": number,
  "isActive?": boolean,
  "categoryId?": number
}
```

**获取轮播图列表 (GET /api/banners)**
```typescript
{
  "page?": number,        // 可选，页码，默认1
  "size?": number,        // 可选，每页数量，默认10
  "isActive?": boolean,   // 可选，筛选启用状态
  "categoryId?": number   // 可选，筛选分类
}
```

**切换轮播图状态 (PUT /api/banners/:id/status)**
```typescript
{
  "isActive": boolean     // 必填，新的启用状态
}
```

**更新轮播图权重 (PUT /api/banners/weights)**
```typescript
{
  "updates": [
    {
      "id": number,       // 轮播图ID
      "weight": number    // 新权重值
    }
  ]
}
```

**获取活跃轮播图 (GET /api/banners/active/list)**
```typescript
{
  "categoryId?": number,  // 可选，筛选分类
  "limit?": number        // 可选，限制数量，默认5
}
```

#### 响应格式

**轮播图响应**
```typescript
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "id": number,
    "title": string,
    "imageUrl": string,
    "linkUrl": string,
    "weight": number,
    "isActive": boolean,
    "categoryId": number,
    "createdAt": string,
    "updatedAt": string
  }
}
```

**轮播图列表响应**
```typescript
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "data": BannerResponseDto[],
    "total": number,
    "page": number,
    "size": number
  }
}
```

---

## 📂 分类相关接口

### CategoryController (`/category`)

| 接口名称 | 方法 | 路径 | 描述 | 认证要求 |
|---------|------|------|------|----------|
| 获取分类列表 | GET | `/category/list` 🔐 | 获取所有分类列表 | ✅ |

#### 请求参数

```typescript
{
  "versionNo?": number  // 可选，版本号，用于缓存控制
}
```

#### 响应格式

```typescript
{
  "ret": number,
  "data": {
    "versionNo": number,
    "list": [
      {
        "channeid": number,    // 频道ID（对应categories表的id字段）
        "name": string,        // 分类名称
        "routeName": string    // 路由名称
      }
    ]
  },
  "msg": string | null
}
```

---

## 🏠 首页相关接口

### HomeController (`/api/home`)

| 接口名称 | 方法 | 路径 | 描述 | 认证要求 |
|---------|------|------|------|----------|
| 获取首页视频 | GET | `/api/home/gethomemodules` | 获取首页推荐视频列表 | ✅ |

#### 请求参数

**获取首页视频**
```typescript
{
  "channeid?": number,  // 可选，频道ID（对应categories表的id字段）
  "page?": number       // 可选，页码，默认1
}
```

**channeid参数说明：**
- `channeid` 对应数据库 `categories` 表中的 `id` 字段（数字类型，主键）
- 如果传入不存在的 `channeid`，将返回相关错误信息
- 不传入 `channeid` 参数时，返回错误提示："请选择具体的频道分类，不支持显示全部分类"

**分页行为说明：**
- `page=1`：返回完整数据结构，包含轮播图、搜索过滤器、广告和视频列表等4个板块
- `page>1`：仅返回视频列表板块，不包含轮播图等其他数据，提高加载性能

**请求示例：**
```bash
# 获取短剧分类视频（channeid=1）
curl "http://localhost:8080/api/home/gethomemodules?channeid=1"

# 获取电影分类视频（channeid=2）
curl "http://localhost:8080/api/home/gethomemodules?channeid=2"

# 获取综艺分类视频（channeid=3）
curl "http://localhost:8080/api/home/gethomemodules?channeid=3"

# 不传channeid参数会返回错误提示
curl "http://localhost:8080/api/home/gethomemodules"
# 返回: {"code": 400, "msg": "请选择具体的频道分类，不支持显示全部分类"}
```

#### 响应格式

**成功响应：**
```typescript
{
  "code": 200,
  "msg": "success",
  "data": {
    "list": ContentBlock[]  // 内容块数组
  }
}
```

**ContentBlock 结构：**
```typescript
{
  "type": string,     // 内容块类型："banner" | "search_filter" | "advertisement" | "video_list"
  "title": string,    // 内容块标题
  "list": any[]       // 内容列表，根据type不同而不同
}
```

**VideoItem 结构（video_list 类型的 ContentBlock 中的 list 项）：**
```typescript
{
  "id": number,           // 视频ID
  "uuid": string,         // 视频唯一标识符
  "coverUrl": string,     // 封面图片URL
  "title": string,        // 视频标题
  "score": string,        // 视频评分（格式如"9.2"，范围0-10分）
  "playCount": number,    // 播放次数
  "url": string,          // 视频访问URL
  "type": string,         // 视频类型（如"电视剧"、"电影"等）
  "isSerial": boolean,    // 是否为连续剧
  "upStatus": string,     // 更新状态（如"全24集"、"更新至第10集"）
  "upCount": number,      // 集数统计
  "author": string,       // 作者/演员信息
  "description": string,  // 视频描述
  "cidMapper": string,    // 分类映射ID
  "isRecommend": boolean, // 是否推荐
  "createdAt": string     // 创建时间（ISO格式）
}
```

**响应示例：**
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "list": [
      {
        "type": "banner",
        "title": "轮播图",
        "list": [...]
      },
      {
        "type": "search_filter",
        "title": "搜索过滤器",
        "list": [...]
      },
      {
        "type": "advertisement",
        "title": "广告",
        "list": [...]
      },
      {
        "type": "video_list",
        "title": "视频列表",
        "list": [
          {
            "id": 2001,
            "uuid": "fpcxnnFA6m9",
            "coverUrl": "https://thinkingking.top/images/92c9e51924f825603f0d1d76ea9374a4.png",
            "title": "霸道总裁爱上我",
            "score": "9.2",
            "playCount": 156800,
            "url": "2001",
            "type": "电视剧",
            "isSerial": true,
            "upStatus": "全24集",
            "upCount": 24,
            "author": "张三,李四",
            "description": "一个普通女孩与霸道总裁的爱情故事，充满甜蜜与波折",
            "cidMapper": "1",
            "isRecommend": false,
            "createdAt": "2025-08-05T23:55:00.000Z"
          }
        ]
      }
    ]
  }
}
```

---

## 📋 视频列表列表筛选接口

### ListController (`/api/list`)

| 接口名称 | 方法 | 路径 | 描述 | 认证要求 |
|---------|------|------|------|----------|
| 获取筛选标签 | GET | `/api/list/getfilterstags` | 获取筛选器标签配置 | ✅ |
| 获取筛选数据 | GET | `/api/list/getfiltersdata`  | 根据筛选条件获取视频列表 | ✅ |
| 条件筛选数据 | GET | `/api/list/getconditionfilterdata`  | 根据复杂条件筛选视频 | ✅ |
| 清除筛选缓存 | GET | `/api/list/clearfiltercache` 🔐 | 清除筛选器缓存（测试用） | ✅ |

#### 请求参数

**获取筛选标签**
```typescript
{
  "channeid?": string  // 可选，频道ID，默认"1"
}
```

**获取筛选数据**
```typescript
{
  "channeid?": string, // 可选，频道ID，默认"1"
  "ids?": string,      // 可选，筛选条件ID，默认"0,0,0,0,0"
  "page?": string      // 可选，页码，默认"1"
}
```

**条件筛选数据**
```typescript
{
  "titleid?": string,      // 可选，标题ID（如'drama','movie','variety'）
  "ids?": string,          // 可选，筛选标识，默认"0,0,0,0,0"
  "page?": number,         // 可选，页数，默认1
  "size?": number,         // 可选，每页大小，默认21
  "System?": string,       // 可选，系统类型（如'h5'）
  "AppVersion?": string,   // 可选，应用版本
  "SystemVersion?": string,// 可选，系统版本
  "version?": string,      // 可选，版本号
  "DeviceId?": string,     // 可选，设备ID
  "i18n?": number,         // 可选，国际化标识
  "pub?": string,          // 可选，发布标识
  "vv?": string            // 可选，版本验证
}
```

#### 响应格式

**筛选标签响应**
```typescript
{
  "code": number,
  "data": {
    "list": [
      {
        "name": string,        // 标签组名称
        "list": [
          {
            "index": number,           // 标签索引
            "classifyId": number,      // 分类ID
            "classifyName": string,    // 分类名称
            "isDefaultSelect": boolean // 是否默认选中
          }
        ]
      }
    ]
  },
  "msg": string | null
}
```

**筛选数据响应**
```typescript
{
  "code": number,
  "data": {
    "list": [
      {
        "id": number,          // 视频ID
        "uuid": string,        // UUID标识符
        "coverUrl": string,    // 封面图URL
        "title": string,       // 视频标题
        "score": string,       // 视频评分（格式如"9.2"，范围0-10分）
        "playCount": number,   // 播放次数
        "url": string,         // 访问URL
        "type": string,        // 视频类型（如"短剧"、"电影"、"综艺"等）
        "isSerial": boolean,   // 是否是系列剧集
        "upStatus": string,    // 更新状态
        "upCount": number,     // 更新次数
        "author": string,      // 作者/主演信息
        "description": string, // 视频描述
        "cidMapper": string,   // 分类映射
        "isRecommend": boolean,// 是否推荐
        "createdAt": string    // 创建时间
      }
    ]
  },
  "msg": string | null
}
```

---

## 🎬 视频相关接口

### VideoController (`/api/video`) - 需要认证

| 接口名称 | 方法 | 路径 | 描述 | 认证要求 |
|---------|------|------|------|----------|
| 记录观看进度 | POST | `/api/video/progress` 🔐 | 记录/更新用户观看进度（支持ID/UUID） | ✅ |
| 获取观看进度 | GET | `/api/video/progress` 🔐 | 获取用户观看进度（支持ID/UUID） | ✅ |
| 发表评论 | POST | `/api/video/comment` 🔐 | 发表弹幕/评论（支持ID/UUID） | ✅ |
| 获取用户媒体 | GET | `/api/video/media` 🔐 | 获取用户相关媒体列表 | ✅ |
| 获取视频详情 | GET | `/api/video/details` 🔐 | 获取视频详细信息 | ✅ |
| 创建剧集URL | POST | `/api/video/episode-url` 🔐 | 创建剧集播放URL | ✅ |
| 获取剧集URL | GET | `/api/video/episode-url/:accessKey` | 通过访问密钥获取剧集URL | ❌ |
| 更新剧集续集状态 | POST | `/api/video/episode-sequel` 🔐 | 更新剧集是否有续集 | ✅ |
| 生成访问密钥 | POST | `/api/video/generate-access-keys` 🔐 | 为现有剧集生成访问密钥 | ✅ |

#### 请求参数

**保存观看进度**
```typescript
{
  "episodeIdentifier": string | number,  // 必填，集数标识符（支持ID或UUID）
  "stopAtSecond": number                 // 必填，停止时间（秒）
}
```

**获取观看进度**
```typescript
{
  "episodeIdentifier": string | number  // 必填，集数标识符（支持ID或UUID）
}
```

**发表评论/弹幕**
```typescript
{
  "episodeIdentifier": string | number,  // 必填，集数标识符（支持ID或UUID）
  "content": string,                     // 必填，评论内容
  "appearSecond?": number                // 可选，弹幕出现时间（秒），不填则为普通评论
}
```

**获取媒体列表**
```typescript
{
  "categoryId?": number,                    // 可选，分类ID
  "type?": "short" | "series",            // 可选，类型
  "sort?": "latest" | "like" | "play",   // 可选，排序方式，默认"latest"
  "page?": number,                         // 可选，页码，默认1
  "size?": number                          // 可选，每页数量，默认20，最大50
}
```

**获取视频详情**
```typescript
{
  "uuid?": string,  // 可选，视频UUID（推荐）
  "id?": string     // 可选，视频ID（向后兼容）
  // 注：uuid和id至少提供一个
}
```

**创建剧集URL (POST /api/video/episode-url)**
```typescript
{
  "episodeId": number,      // 必填，剧集ID
  "quality": string,        // 必填，视频质量
  "ossUrl": string,         // 必填，OSS存储URL
  "cdnUrl": string,         // 必填，CDN加速URL
  "subtitleUrl?": string    // 可选，字幕文件URL
}
```

**更新剧集续集状态 (POST /api/video/episode-sequel)**
```typescript
{
  "episodeId": number,      // 必填，剧集ID
  "hasSequel": boolean      // 必填，是否有续集
}
```

**更新续集状态**
```typescript
{
  "episodeId": number,   // 必填，集数ID
  "hasSequel": boolean   // 必填，是否有续集
}
```

---

### PublicVideoController (`/api/public/video`) - 公开接口

| 接口名称 | 方法 | 路径 | 描述 | 认证要求 |
|---------|------|------|------|----------|
| 获取分类列表 | GET | `/api/public/video/categories` 🔐 | 获取所有视频分类 | ✅ |
| 获取系列列表（完整） | GET | `/api/public/video/series/list` 🔐 | 获取系列列表（支持分页） | ✅ |
| 获取系列列表（按分类） | GET | `/api/public/video/series` | 根据分类获取系列列表 | ❌ |
| 获取系列详情 | GET | `/api/public/video/series/:id` | 获取指定系列的详细信息 | ❌ |
| 获取媒体列表 | GET | `/api/public/video/media` | 获取媒体内容列表 | ❌ |

#### 请求参数

**获取系列列表/媒体列表**
```typescript
{
  "categoryId?": number,                    // 可选，分类ID
  "type?": "short" | "series",            // 可选，类型
  "sort?": "latest" | "like" | "play",   // 可选，排序方式
  "page?": number,                         // 可选，页码，默认1
  "size?": number                          // 可选，每页数量，默认20
}
```



---

## 🎪 轮播图相关接口

### BannerController (`/banner`) - 管理接口

| 接口名称 | 方法 | 路径 | 描述 | 认证要求 |
|---------|------|------|------|----------|
| 创建轮播图 | POST | `/banner` 🔐 | 创建新的轮播图 | ✅ |
| 更新轮播图 | PUT | `/banner/:id` 🔐 | 更新指定轮播图 | ✅ |
| 删除轮播图 | DELETE | `/banner/:id` 🔐 | 删除指定轮播图 | ✅ |
| 获取轮播图列表 | GET | `/banner` | 获取轮播图列表 | ❌ |
| 获取轮播图详情 | GET | `/banner/:id` | 获取指定轮播图详情 | ❌ |

#### 请求参数

**创建/更新轮播图**
```typescript
{
  "title": string,         // 必填，轮播图标题
  "imageUrl": string,      // 必填，图片URL
  "categoryId": number,    // 必填，分类ID
  "seriesId?": number,     // 可选，关联系列ID
  "linkUrl?": string,      // 可选，跳转链接
  "weight?": number,       // 可选，权重，默认0
  "isActive?": boolean,    // 可选，是否启用，默认true
  "startTime?": string,    // 可选，开始时间
  "endTime?": string,      // 可选，结束时间
  "description?": string   // 可选，描述信息
}
```

**查询轮播图列表**
```typescript
{
  "categoryId?": number,   // 可选，分类ID筛选
  "isActive?": boolean,    // 可选，启用状态筛选
  "page?": number,         // 可选，页码，默认1
  "size?": number          // 可选，每页数量，默认10
}
```

---

## 🔍 健康检查接口

### HealthController (`/health`)

| 接口名称 | 方法 | 路径 | 描述 | 认证要求 |
|---------|------|------|------|----------|
| 基础健康检查 | GET | `/health` 🔐 | 检查服务基本状态 | ✅ |
| 详细健康检查 | GET | `/health/detailed` 🔐 | 检查服务详细状态 | ✅ |
| 系统信息 | GET | `/health/system` 🔐 | 获取系统信息 | ✅ |

---

## 🧪 测试接口

### TestController (`/test`)

| 接口名称 | 方法 | 路径 | 描述 | 认证要求 |
|---------|------|------|------|----------|
| 获取当前用户 | GET | `/test/me` 🔐 | 测试JWT认证并获取用户信息 | ✅ |

---

## 📊 通用响应格式

### 成功响应
```typescript
{
  "code": number,          // 状态码，200表示成功
  "data": any,             // 响应数据
  "message?": string,      // 响应消息
  "timestamp?": string,    // 时间戳
  "path?": string          // 请求路径
}
```

### 分页响应
```typescript
{
  "code": number,
  "data": any[],           // 数据列表
  "pagination": {
    "total": number,        // 总数量
    "page": number,         // 当前页码
    "size": number,         // 每页数量
    "totalPages": number,   // 总页数
    "hasNext": boolean,     // 是否有下一页
    "hasPrev": boolean      // 是否有上一页
  },
  "message?": string,
  "timestamp?": string
}
```

### 错误响应
```typescript
{
  "code": number,          // 错误状态码
  "message": string,       // 错误消息
  "error?": string,        // 错误类型
  "details?": any,         // 错误详情
  "timestamp": string,     // 时间戳
  "path?": string,         // 请求路径
  "requestId?": string     // 请求ID
}
```

---

## 🔒 认证说明

### JWT Token 使用

1. **获取Token**: 通过 `/user/telegram-login` 登录获取
2. **使用Token**: 在请求头中添加 `Authorization: Bearer <access_token>`
3. **刷新Token**: 使用 `/user/refresh` 接口刷新过期的access_token

### Token 生命周期

- **Access Token**: 短期有效（通常1小时）
- **Refresh Token**: 长期有效（通常7天）
- **自动刷新**: 客户端应在access_token过期前主动刷新

---

## 📂 分类管理接口

### CategoryController (`/category`)

| 接口名称 | 方法 | 路径 | 描述 | 认证要求 |
|---------|------|------|------|----------|
| 获取分类列表 | GET | `/category/list` | 获取分类列表（支持版本控制） | ❌ |

#### 请求参数

**获取分类列表 (GET /category/list)**
```typescript
{
  "versionNo?": string    // 可选，版本号，用于缓存控制
}
```

#### 响应格式

**分类列表响应**
```typescript
{
  "code": 200,
  "msg": "获取成功",
  "data": [
    {
      "id": number,
      "name": string,
      "description": string,
      "isActive": boolean,
      "createdAt": string,
      "updatedAt": string
    }
  ]
}
```

---

## 🧪 测试接口

### TestController (`/test`) - 需要认证

| 接口名称 | 方法 | 路径 | 描述 | 认证要求 |
|---------|------|------|------|----------|
| 测试用户信息 | GET | `/test/me` 🔐 | 测试JWT认证和用户信息获取 | ✅ |

#### 响应格式

**测试用户信息响应**
```typescript
{
  "message": "登录有效",
  "user": {
    "id": number,
    "username": string,
    "firstName": string,
    "lastName": string,
    "isActive": boolean,
    "createdAt": string
  }
}
```

---

## 🚀 接口使用示例

### 1. 用户登录流程

```bash
# 1. Telegram登录
curl -X POST "http://localhost:8080/user/telegram-login" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 123456789,
    "first_name": "张三",
    "auth_date": 1640995200,
    "hash": "abc123..."
  }'

# 2. 使用返回的token访问受保护接口
curl -X GET "http://localhost:8080/user/me" \
  -H "Authorization: Bearer <access_token>"
```

### 2. 获取视频列表

```bash
# 获取首页视频
curl -X GET "http://localhost:8080/api/home/getvideos?catid=1&page=1"

# 获取筛选标签
curl -X GET "http://localhost:8080/api/list/getFiltersTags?channeid=2"

# 根据条件筛选视频
curl -X GET "http://localhost:8080/api/list/getfiltersdata?channeid=1&ids=1,2,0,0,0&page=1"
```

### 3. 视频播放相关

```bash
# 获取视频详情
curl -X GET "http://localhost:8080/api/video/details?uuid=550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer <access_token>"

# 保存观看进度（使用UUID）
curl -X POST "http://localhost:8080/api/video/progress" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "episodeIdentifier": "550e8400-e29b-41d4-a716-446655440001",
    "stopAtSecond": 1800
  }'

# 保存观看进度（使用ID）
curl -X POST "http://localhost:8080/api/video/progress" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "episodeIdentifier": 123,
    "stopAtSecond": 1800
  }'

# 获取观看进度
curl -X GET "http://localhost:8080/api/video/progress?episodeIdentifier=550e8400-e29b-41d4-a716-446655440001" \
  -H "Authorization: Bearer <access_token>"

# 发表评论
curl -X POST "http://localhost:8080/api/video/comment" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "episodeIdentifier": "550e8400-e29b-41d4-a716-446655440001",
    "content": "这部剧太好看了！"
  }'

# 发表弹幕
curl -X POST "http://localhost:8080/api/video/comment" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "episodeIdentifier": 123,
    "content": "精彩！",
    "appearSecond": 120
  }'

# 创建剧集播放URL
curl -X POST "http://localhost:8080/api/video/episode-url" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "episodeId": 1,
    "quality": "1080p",
    "ossUrl": "https://oss.example.com/video.mp4",
    "cdnUrl": "https://cdn.example.com/video.mp4",
    "subtitleUrl": "https://cdn.example.com/subtitle.srt"
  }'

# 获取剧集播放URL
curl -X GET "http://localhost:8080/api/video/episode-url/abc123def456" \
  -H "Authorization: Bearer <access_token>"

# 更新剧集续集状态
curl -X POST "http://localhost:8080/api/video/episode-sequel" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "episodeId": 1,
    "hasSequel": true
  }'

# 生成访问密钥
curl -X POST "http://localhost:8080/api/video/generate-access-keys" \
  -H "Authorization: Bearer <access_token>"
```

### 4. 轮播图管理

```bash
# 创建轮播图
curl -X POST "http://localhost:8080/api/banners" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "热门推荐",
    "imageUrl": "https://cdn.example.com/banner1.jpg",
    "linkUrl": "https://example.com/series/1",
    "weight": 100,
    "isActive": true,
    "categoryId": 1
  }'

# 获取轮播图列表
curl -X GET "http://localhost:8080/api/banners?page=1&size=10&isActive=true"

# 获取活跃轮播图
curl -X GET "http://localhost:8080/api/banners/active/list?categoryId=1&limit=5"

# 更新轮播图状态
curl -X PUT "http://localhost:8080/api/banners/1/status" \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": false
  }'

# 批量更新轮播图权重
curl -X PUT "http://localhost:8080/api/banners/weights" \
  -H "Content-Type: application/json" \
  -d '{
    "updates": [
      {"id": 1, "weight": 200},
      {"id": 2, "weight": 150}
    ]
  }'
```

---

## 📝 注意事项

1. **频率限制**: 所有接口都有频率限制，请合理控制请求频率
2. **缓存策略**: 筛选器相关接口使用了缓存，数据更新可能有延迟
3. **参数兼容**: 观看进度和评论接口支持ID和UUID两种标识符，系统会自动识别参数类型
4. **推荐使用UUID**: 新开发建议使用UUID标识符，ID方式主要用于向后兼容
5. **错误处理**: 请根据返回的状态码和错误信息进行适当的错误处理
6. **安全考虑**: 敏感操作需要JWT认证，请妥善保管token

---

## 📞 技术支持

如有接口使用问题，请联系开发团队或查看项目文档。

**文档版本**: v2.0  
**最后更新**: 2024年12月  
**API基础URL**: `http://localhost:8080` (开发环境)

## 📝 更新日志

### v2.0 (2024年12月)
- ✅ 新增轮播图管理接口 (`/api/banners`)
- ✅ 新增分类管理接口 (`/category`)
- ✅ 新增测试接口 (`/test`)
- ✅ 完善认证接口，新增登出和设备管理功能
- ✅ 视频接口支持ID/UUID自动识别
- ✅ 新增剧集URL管理和续集状态更新功能
- ✅ 完善公共视频接口，支持分页和筛选
- ✅ 更新所有接口的请求参数和响应格式说明
- ✅ 新增详细的使用示例和错误处理说明

### v1.0 (2024年11月)
- 🎉 初始版本发布
- ✅ 基础认证、用户、视频接口
- ✅ 首页和列表筛选功能