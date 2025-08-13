# 🚀 短剧API接口汇总文档

## 📋 项目概述

本项目是一个基于 NestJS 的短剧视频平台后端API系统，提供用户认证、视频管理、筛选搜索、分类管理、轮播图管理、浏览记录等功能。

**技术栈：** NestJS + TypeORM + MySQL + Redis + JWT

---

## 🔐 认证说明

### 认证要求说明

- **❌** = 不需要认证（公开接口，可直接访问）
- **✅** = 需要认证（需要有效的JWT token）

### JWT Token 使用

1. **获取Token**: 通过 `/user/telegram-login` 登录获取
2. **使用Token**: 在请求头中添加 `Authorization: Bearer <access_token>`
3. **刷新Token**: 使用 `/user/refresh` 接口刷新过期的access_token

---

## 🔑 ShortID 标识符说明

### ShortID 概述

ShortID是系统自定义的11位Base64字符标识符，用于替代传统的UUID，具有以下特点：
- **长度**: 11位字符
- **字符集**: 去除容易混淆的字符（如0、O、1、I、l等）
- **安全性**: 防枚举攻击，提高API安全性
- **可读性**: 比UUID更短，便于用户记忆和分享

### ShortID 类型和用途

#### 1. **Series ShortID** (`seriesShortId`)
- **用途**: 标识剧集系列（如：`jTX5ctteb9h`）
- **应用场景**: 
  - 获取某个系列下的所有剧集列表
  - 系列详情查询
  - 浏览历史记录

#### 2. **Episode ShortID** (`episodeShortId`)
- **用途**: 标识单个剧集（如：`k8mN2pQr7sT`）
- **应用场景**:
  - 获取单个剧集详情
  - 记录观看进度
  - 发表评论
  - 获取播放地址

### ShortID 使用流程

```
用户操作流程：
1. 浏览首页 → 获取系列列表（包含seriesShortId）
2. 点击系列 → 使用seriesShortId获取剧集列表
3. 选择剧集 → 使用episodeShortId获取剧集详情
4. 观看视频 → 使用episodeShortId记录进度
5. 发表评论 → 使用episodeShortId关联评论
```

### ShortID 参数优先级

在API调用中，ShortID参数具有以下优先级：
1. **优先使用ShortID**: 提供更好的安全性和用户体验
2. **向后兼容**: 同时支持传统的数字ID
3. **自动识别**: 系统自动判断是ShortID还是数字ID

### Token 生命周期

- **Access Token**: 短期有效（通常1小时）
- **Refresh Token**: 长期有效（通常7天）
- **自动刷新**: 客户端应在access_token过期前主动刷新

---

## 👤 用户相关接口

### UserController (`/user`)

| 接口名称 | 方法 | 路径 | 描述 | 认证要求 | 状态 |
|---------|------|------|------|----------|------|
| Telegram登录 | POST/GET | `/user/telegram-login` | Telegram OAuth登录 | ✅ | ✅ 正常工作 |
| 获取用户信息 | GET | `/user/me` | 获取当前用户信息 | ✅ | ✅ 正常工作 |
| 刷新令牌 | POST | `/user/refresh` | 使用refresh_token获取新的access_token | ✅ | ✅ 正常工作 |
| 验证令牌 | POST | `/user/verify-refresh-token` | 验证refresh_token有效性 | ✅ | ✅ 正常工作 |
| 登出 | POST | `/user/logout` | 撤销指定的refresh_token | ✅ | ✅ 正常工作 |
| 全设备登出 | POST | `/user/logout-all` | 撤销用户所有设备的令牌 | ✅ | ✅ 正常工作 |
| 获取设备列表 | GET | `/user/devices` | 获取用户活跃设备列表 | ✅ | ✅ 正常工作 |
| 撤销设备 | DELETE | `/user/devices/:id` | 撤销指定设备的令牌 | ✅ | ✅ 正常工作 |

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
  "id": string,           // 用户ID
  "username": string,     // 用户名
  "firstName": string,    // 名字
  "lastName": string,     // 姓氏
  "isActive": number,     // 是否激活
  "createdAt": string     // 创建时间
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

## 🏠 首页相关接口

### HomeController (`/api/home`)

| 接口名称 | 方法 | 路径 | 描述 | 认证要求 | 状态 |
|---------|------|------|------|----------|------|
| 获取首页视频 | GET | `/api/home/gethomemodules` | 获取首页推荐视频列表 | ❌ | ✅ 正常工作 |
| 获取筛选标签 | GET | `/api/home/getfilterstags` | 获取首页筛选器标签 | ❌ | ✅ 正常工作 |
| 获取筛选数据 | GET | `/api/home/getfiltersdata` | 根据筛选条件获取首页视频列表 | ❌ | ✅ 正常工作 |
| 获取分类列表 | GET | `/api/home/categories` | 获取所有视频分类 | ❌ | ✅ 正常工作 |

#### 请求参数

**获取首页视频**
```typescript
{
  "channeid": number  // 必填，频道ID（对应categories表的id字段）
}
```

**channeid参数说明：**
- `channeid` 对应数据库 `categories` 表中的 `id` 字段（数字类型，主键）
- 如果传入不存在的 `channeid`，将返回相关错误信息
- 不传入 `channeid` 参数时，返回错误提示："请选择具体的频道分类，不支持显示全部分类"

**分页行为说明：**
- `page=1`：返回完整数据结构，包含轮播图、搜索过滤器、广告和视频列表等4个板块
- `page>1`：仅返回视频列表板块，不包含轮播图等其他数据，提高加载性能

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
  "type": number,      // 内容块类型：0(轮播图), 1001(搜索过滤器), -1(广告), 3(视频列表)
  "name": string,      // 内容块标题
  "filters": any[],    // 筛选器数据
  "banners": any[],    // 轮播图数据
  "list": any[]        // 内容列表，根据type不同而不同
}
```

**VideoItem 结构（视频列表项）：**
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

---

## 🔍 筛选和搜索接口

### ListController (`/api/list`)

| 接口名称 | 方法 | 路径 | 描述 | 认证要求 | 状态 |
|---------|------|------|------|----------|------|
| 获取筛选标签 | GET | `/api/list/getfilterstags` | 获取首页筛选器标签 | ❌ | ✅ 正常工作 |
| 获取筛选数据 | GET | `/api/list/getfiltersdata` | 根据筛选条件获取视频列表 | ❌ | ✅ 正常工作 |
| 条件筛选数据 | GET | `/api/list/getconditionfilterdata` | 根据复杂条件筛选剧集 | ❌ | ✅ 正常工作 |
| 模糊搜索 | GET | `/api/list/fuzzysearch` | 根据关键词在标题中进行模糊搜索 | ❌ | ✅ 正常工作 |
| 清除筛选缓存 | GET | `/api/list/clearfiltercache` | 清除筛选器缓存（测试用） | ❌ | ✅ 正常工作 |

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
  "titleid?": string,      // 可选，分类标识，如'drama'(短剧), 'movie'(电影), 'variety'(综艺)
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

**模糊搜索**
```typescript
{
  "keyword": string,       // 必填，搜索关键词（不能为空或纯空格）
  "channeid?": string,     // 可选，频道ID，不传则搜索全部
  "page?": number,         // 可选，页码，默认1
  "size?": number          // 可选，每页大小，默认20
}
```

**模糊搜索功能说明：**
- 支持中文和英文关键词搜索
- 在视频标题中进行模糊匹配
- 支持频道筛选，可限定在特定频道内搜索
- 支持分页查询，提高大数据量查询性能
- 使用Redis缓存，提高搜索响应速度
- 按创建时间倒序排列，最新内容优先显示

#### 响应格式

**筛选标签响应**
```typescript
{
  "code": number,
  "data": [
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
  ],
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

**条件筛选数据响应**
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
        "createdAt": string,   // 创建时间
        "totalEpisodes": number, // 总集数
        "status": string,      // 状态（completed, on-going等）
        "starring": string,    // 主演
        "actor": string,       // 演员
        "director": string,    // 导演
        "region": string,      // 地区
        "language": string,    // 语言
        "releaseDate": string, // 发布日期
        "isCompleted": boolean, // 是否完结
        "episodeCount": number, // 当前集数
        "tags": any[]          // 标签
      }
    ],
    "total": number,           // 总数量
    "page": number,            // 当前页码
    "size": number,            // 每页大小
    "hasMore": boolean         // 是否有更多数据
  },
  "msg": string | null
}
```

**模糊搜索响应**
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
        "createdAt": string,   // 创建时间
        "channeid": number     // 频道ID标识
      }
    ],
    "total": number,           // 总数量
    "page": number,            // 当前页码
    "size": number,            // 每页大小
    "hasMore": boolean         // 是否有更多数据
  },
  "msg": string | null
}
```

---

## 🎬 视频相关接口

### VideoController (`/api/video`) - 需要认证

| 接口名称 | 方法 | 路径 | 描述 | 认证要求 | 状态 |
|---------|------|------|------|----------|------|
| 记录观看进度 | POST | `/api/video/progress` | 记录/更新用户观看进度（支持ID/ShortID） | ✅ | ✅ 正常工作 |
| 获取观看进度 | GET | `/api/video/progress` | 获取用户观看进度（支持ID/ShortID） | ✅ | ✅ 正常工作 |
| 发表评论 | POST | `/api/video/comment` | 发表弹幕/评论（支持ID/ShortID，支持中文内容） | ✅ | ✅ 正常工作 |
| 获取用户媒体 | GET | `/api/video/media` | 获取用户相关媒体列表 | ✅ | ✅ 正常工作 |
| 创建剧集URL | POST | `/api/video/episode-url` | 创建剧集播放URL | ✅ | ✅ 正常工作 |
| 获取剧集URL | GET | `/api/video/episode-url/:accessKey` | 通过访问密钥获取剧集URL | ❌ | ✅ 正常工作 |
| 更新剧集续集状态 | POST | `/api/video/episode-sequel` | 更新剧集是否有续集 | ✅ | ✅ 正常工作 |
| 生成访问密钥 | POST | `/api/video/generate-access-keys` | 创建剧集访问密钥 | ✅ | ✅ 正常工作 |
| 获取剧集列表 | GET | `/api/video/episodes` | 获取剧集列表信息（包含播放进度、系列信息，自动记录浏览历史） | ✅ | ✅ 正常工作 |

### BrowseHistoryController (`/api/video/browse-history`) - 需要认证

| 接口名称 | 方法 | 路径 | 描述 | 认证要求 | 状态 |
|---------|------|------|------|----------|------|
| 获取浏览记录 | GET | `/api/video/browse-history` | 获取用户浏览历史记录 | ✅ | ✅ 正常工作 |
| 获取最近浏览 | GET | `/api/video/browse-history/recent` | 获取用户最近浏览的剧集系列 | ✅ | ✅ 正常工作 |
| 同步浏览记录 | GET | `/api/video/browse-history/sync` | 同步用户浏览记录 | ✅ | ✅ 正常工作 |
| 删除指定记录 | DELETE | `/api/video/browse-history/:seriesId` | 删除指定系列的浏览记录 | ✅ | ✅ 正常工作 |
| 删除所有记录 | DELETE | `/api/video/browse-history` | 删除用户所有浏览记录 | ✅ | ✅ 正常工作 |
| 获取系统统计 | GET | `/api/video/browse-history/stats` | 获取系统统计信息（管理员接口） | ✅ | ✅ 正常工作 |
| 清理过期记录 | GET | `/api/video/browse-history/cleanup` | 清理过期浏览记录（管理员接口） | ✅ | ✅ 正常工作 |

#### 请求参数

**保存观看进度**
```typescript
{
  "episodeIdentifier": string | number,  // 必填，集数标识符（支持ID或ShortID）
  "stopAtSecond": number                 // 必填，停止时间（秒）
}
```

**获取观看进度**
```typescript
{
  "episodeIdentifier": string | number  // 必填，集数标识符（支持ID或ShortID）
}
```

**发表评论/弹幕**
```typescript
{
  "episodeIdentifier": string | number,  // 必填，集数标识符（支持ID或ShortID）
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

**获取剧集列表**
```typescript
{
  "seriesShortId?": string,  // 可选，剧集系列shortId（推荐，11位Base64字符）
  "seriesId?": string,       // 可选，剧集系列ID（向后兼容）
  "page?": string,           // 可选，页码，默认"1"
  "size?": string            // 可选，每页数量，默认"20"
}
```

**同步浏览记录**
```typescript
{
  "seriesId": string,           // 必填，剧集系列ID
  "browseType?": string,        // 可选，浏览类型，默认"episode_list"
  "lastEpisodeNumber?": string  // 可选，最后访问的集数
}
```

#### 响应格式

**剧集列表响应**
```typescript
{
  "code": number,
  "data": {
    "seriesInfo": {
      "starring": string,        // 主演
      "id": number,             // 系列ID
      "channeName": string,     // 频道名称
      "channeID": number,       // 频道ID
      "title": string,          // 系列标题
      "coverUrl": string,       // 封面URL
      "mediaUrl": string,       // 媒体URL
      "fileName": string,       // 文件名
      "mediaId": string,        // 媒体ID
      "postTime": string,       // 发布时间
      "contentType": string,    // 内容类型
      "actor": string,          // 演员
      "shareCount": number,     // 分享次数
      "director": string,       // 导演
      "description": string,    // 描述
      "comments": number,       // 评论数
      "updateStatus": string,   // 更新状态
      "watch_progress": number, // 观看进度
      "playCount": number,      // 播放次数
      "isHot": boolean,         // 是否热门
      "isVip": boolean          // 是否VIP
    },
    "userProgress": {
      "currentEpisode": number,           // 当前观看集数
      "currentEpisodeShortId": string,    // 当前观看集数ShortID
      "watchProgress": number,            // 观看进度（秒）
      "watchPercentage": number,          // 观看百分比
      "totalWatchTime": number,           // 总观看时间
      "lastWatchTime": string,            // 最后观看时间
      "isCompleted": boolean              // 是否完成观看
    },
    "list": [
      {
        "id": number,              // 剧集ID
        "shortId": string,         // 剧集shortId
        "episodeNumber": number,   // 集数编号
        "title": string,           // 剧集标题
        "duration": number,        // 时长（秒）
        "status": string,          // 状态（published、hidden、draft等）
        "createdAt": string,       // 创建时间
        "updatedAt": string,       // 更新时间
        "seriesId": number,        // 所属剧集ID
        "seriesTitle": string,     // 所属剧集标题
        "seriesShortId": string,   // 所属剧集shortId
        "watchProgress": number,   // 观看进度（秒）
        "watchPercentage": number, // 观看百分比
        "isWatched": boolean,      // 是否已观看
        "lastWatchTime": string    // 最后观看时间
      }
    ],
    "total": number,               // 总数量
    "page": number,                // 当前页码
    "size": number,                // 每页大小
    "hasMore": boolean             // 是否有更多数据
  },
  "msg": string | null
}
```

**浏览记录响应**
```typescript
{
  "code": number,
  "data": {
    "list": [
      {
        "id": number,              // 浏览记录ID
        "seriesId": number,        // 剧集系列ID
        "seriesTitle": string,     // 剧集系列标题
        "seriesShortId": string,   // 剧集系列shortId
        "seriesCoverUrl": string,  // 剧集系列封面URL
        "categoryName": string,    // 分类名称
        "browseType": string,      // 浏览类型
        "lastEpisodeNumber": number, // 最后访问的集数
        "visitCount": number,      // 访问次数
        "lastVisitTime": string,   // 最后访问时间
        "durationSeconds": number  // 浏览时长（秒）
      }
    ],
    "total": number,               // 总数量
    "page": number,                // 当前页码
    "size": number,                // 每页大小
    "hasMore": boolean             // 是否有更多数据
  },
  "msg": string | null
}
```

**最近浏览响应**
```typescript
{
  "code": number,
  "data": [
    {
      "seriesId": number,          // 剧集系列ID
      "seriesTitle": string,       // 剧集系列标题
      "seriesShortId": string,     // 剧集系列shortId
      "seriesCoverUrl": string,    // 剧集系列封面URL
      "categoryName": string,      // 分类名称
      "lastEpisodeNumber": number, // 最后访问的集数
      "lastVisitTime": string,     // 最后访问时间
      "visitCount": number         // 访问次数
    }
  ],
  "msg": string | null
}
```

**系统统计响应**
```typescript
{
  "code": 200,
  "data": {
    "totalRecords": number,        // 总记录数
    "activeUsers": number,         // 活跃用户数（24小时内）
    "totalOperations": number      // 总操作数
  },
  "msg": null
}
```

---

## 🎨 轮播图管理接口

### BannerController (`/api/banners`)

| 接口名称 | 方法 | 路径 | 描述 | 认证要求 | 状态 |
|---------|------|------|------|----------|------|
| 创建轮播图 | POST | `/api/banners` | 创建新的轮播图 | ❌ | ✅ 正常工作 |
| 更新轮播图 | PUT | `/api/banners/:id` | 更新指定轮播图 | ❌ | ✅ 正常工作 |
| 删除轮播图 | DELETE | `/api/banners/:id` | 删除指定轮播图 | ❌ | ✅ 正常工作 |
| 获取轮播图详情 | GET | `/api/banners/:id` | 获取指定轮播图详情 | ❌ | ✅ 正常工作 |
| 获取轮播图列表 | GET | `/api/banners` | 获取轮播图列表（分页） | ❌ | ✅ 正常工作 |
| 切换轮播图状态 | PUT | `/api/banners/:id/status` | 启用/禁用轮播图 | ❌ | ✅ 正常工作 |
| 更新轮播图权重 | PUT | `/api/banners/weights` | 批量更新轮播图权重 | ❌ | ✅ 正常工作 |
| 获取活跃轮播图 | GET | `/api/banners/active/list` | 获取活跃状态的轮播图列表 | ❌ | ✅ 正常工作 |

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

| 接口名称 | 方法 | 路径 | 描述 | 认证要求 | 状态 |
|---------|------|------|------|----------|------|
| 获取分类列表 | GET | `/category/list` | 获取所有分类列表 | ❌ | ✅ 正常工作 |

---

## 🌐 公共视频接口

### PublicVideoController (`/api/public/video`)

| 接口名称 | 方法 | 路径 | 描述 | 认证要求 | 状态 |
|---------|------|------|------|----------|------|
| 获取系列列表（完整） | GET | `/api/public/video/series/list` | 获取系列列表（支持分页） | ❌ | ✅ 正常工作 |
| 获取系列列表（按分类） | GET | `/api/public/video/series` | 根据分类获取系列列表 | ❌ | ✅ 正常工作 |
| 获取系列详情 | GET | `/api/public/video/series/:id` | 获取指定系列的详细信息 | ❌ | ✅ 正常工作 |
| 获取媒体列表 | GET | `/api/public/video/media` | 获取媒体内容列表 | ❌ | ✅ 正常工作 |

#### 请求参数

**获取分类列表**
```typescript
{
  "versionNo?": number  // 可选，版本号，用于缓存控制
}
```

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

#### 响应格式

**分类列表响应**
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

**系列列表响应**
```typescript
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": number,
        "title": string,
        "description": string,
        "coverUrl": string,
        "categoryId": number,
        "episodeCount": number,
        "status": string,
        "createdAt": string
      }
    ],
    "total": number,
    "page": number,
    "size": number
  },
  "msg": string | null
}
```

**媒体列表响应**
```typescript
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": number,
        "title": string,
        "description": string,
        "coverUrl": string,
        "type": string,
        "categoryId": number,
        "episodeCount": number,
        "status": string,
        "createdAt": string
      }
    ],
    "total": number,
    "page": number,
    "size": number
  },
  "msg": string | null
}
```

---

## 🏠 应用根接口

### AppController (`/`)

| 接口名称 | 方法 | 路径 | 描述 | 认证要求 | 状态 |
|---------|------|------|------|----------|------|
| 应用根路径 | GET | `/` | 应用根路径，返回Hello World | ❌ | ✅ 正常工作 |

---

## 🔍 健康检查接口

### HealthController (`/health`)

| 接口名称 | 方法 | 路径 | 描述 | 认证要求 | 状态 |
|---------|------|------|------|----------|------|
| 基础健康检查 | GET | `/health` | 检查服务基本状态 | ❌ | ✅ 正常工作 |
| 详细健康检查 | GET | `/health/detailed` | 检查服务详细状态 | ❌ | ✅ 正常工作 |
| 系统信息 | GET | `/health/system` | 获取系统信息 | ❌ | ✅ 正常工作 |

---

## 🧪 测试接口

### TestController (`/test`)

| 接口名称 | 方法 | 路径 | 描述 | 认证要求 | 状态 |
|---------|------|------|------|----------|------|
| 获取当前用户 | GET | `/test/me` | 测试JWT认证并获取用户信息 | ✅ | ✅ 正常工作 |

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
    "size": number,         // 每页大小
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

## 🚀 接口使用示例

### 1. 用户登录流程

```bash
# 1. Telegram登录（注意：无 /api 前缀）
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
curl -X GET "http://localhost:8080/api/home/gethomemodules?channeid=1" \
  -H "Authorization: Bearer <access_token>"

# 获取筛选标签
curl -X GET "http://localhost:8080/api/list/getfilterstags" \
  -H "Authorization: Bearer <access_token>"

# 获取所有分类列表
curl -X GET "http://localhost:8080/api/home/categories"

# 根据筛选条件获取视频列表
curl -X GET "http://localhost:8080/api/list/getfiltersdata?channeid=1&ids=1,2,0,0,0&page=1" \
  -H "Authorization: Bearer <access_token>"

# 根据条件筛选视频
curl -X GET "http://localhost:8080/api/list/getconditionfilterdata?titleid=drama&ids=0,0,0,0,0&page=1&size=21" \
  -H "Authorization: Bearer <access_token>"

# 模糊搜索（搜索全部频道）
curl -G "http://localhost:8080/api/list/fuzzysearch" \
  --data-urlencode "keyword=霸道总裁&page=1&size=20" \
  -H "Authorization: Bearer <access_token>"

# 模糊搜索（指定频道）
curl -G "http://localhost:8080/api/list/fuzzysearch" \
  --data-urlencode "keyword=爱情" \
  --data-urlencode "channeid=1" \
  -H "Authorization: Bearer <access_token>"
```

### 3. 视频播放相关

```bash
# 保存观看进度（使用episodeShortId）
curl -X POST "http://localhost:8080/api/video/progress" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "episodeIdentifier": "k8mN2pQr7sT",
    "stopAtSecond": 1800
  }'

# 获取观看进度（使用episodeShortId）
curl -X GET "http://localhost:8080/api/video/progress?episodeIdentifier=k8mN2pQr7sT" \
  -H "Authorization: Bearer <access_token>"

# 发表评论（使用episodeShortId）
curl -X POST "http://localhost:8080/api/video/comment" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "episodeIdentifier": "k8mN2pQr7sT",
    "content": "这部剧太好看了！"
  }'

# 获取剧集列表（通过seriesShortId）
curl -X GET "http://localhost:8080/api/video/episodes?seriesShortId=jTX5ctteb9h&page=1&size=20" \
  -H "Authorization: Bearer <access_token>"

# 获取用户浏览记录
curl -X GET "http://localhost:8080/api/video/browse-history?page=1&size=20" \
  -H "Authorization: Bearer <access_token>"

# 同步浏览记录
curl -X GET "http://localhost:8080/api/video/browse-history/sync?seriesId=1&browseType=episode_list&lastEpisodeNumber=5" \
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
curl -X GET "http://localhost:8080/api/banners?page=1&size=10&isActive=true" \
  -H "Authorization: Bearer <access_token>"

# 获取活跃轮播图
curl -X GET "http://localhost:8080/api/banners/active/list?categoryId=1&limit=5" \
  -H "Authorization: Bearer <access_token>"

### 5. 公共视频接口

```bash
# 获取系列列表（完整）
curl -X GET "http://localhost:8080/api/public/video/series/list?categoryId=1&page=1&size=20"

# 根据分类获取系列列表
curl -X GET "http://localhost:8080/api/public/video/series?categoryId=1"

# 获取系列详情
curl -X GET "http://localhost:8080/api/public/video/series/1"

# 获取媒体列表
curl -X GET "http://localhost:8080/api/public/video/media?categoryId=1&type=series&sort=latest&page=1&size=20"
```
```

---

## 📊 接口统计总览

**认证要求说明：**
- **❌** = 不需要认证（公开接口）
- **✅** = 需要认证（需要JWT token）

| 控制器 | 接口数量 | 认证要求 | 状态 |
|--------|----------|----------|------|
| AppController | 1 | ❌ | ✅ 正常 |
| UserController | 8 | ✅ | ✅ 正常 |
| HomeController | 4 | ❌ | ✅ 正常 |
| ListController | 5 | ❌ | ✅ 正常 |
| VideoController | 9 | ✅ | ✅ 正常 |
| BrowseHistoryController | 7 | ✅ | ✅ 正常 |
| BannerController | 8 | ❌ | ✅ 正常 |
| CategoryController | 1 | ❌ | ✅ 正常 |
| PublicVideoController | 4 | ❌ | ✅ 正常 |
| HealthController | 3 | ❌ | ✅ 正常 |
| TestController | 1 | ✅ | ✅ 正常 |
| **总计** | **61** | - | **✅ 全部正常** |

---

## 📝 注意事项

1. **接口路径说明**: 
   - 用户认证接口：`/user/*`（无 `/api` 前缀）
   - 其他业务接口：`/api/*`（有 `/api` 前缀）

2. **认证流程**: 
   - 通过 `/user/telegram-login` 获取 JWT token
   - 在请求头中使用 `Authorization: Bearer <token>`
   - Token 有效期为 7 天

3. **ShortID 使用**: 
   - 推荐使用 ShortID 进行 API 调用
   - 支持 ID 和 ShortID 自动识别
   - ShortID 格式：11位 Base64 字符

4. **观看进度功能**: 
   - `/api/video/episodes` 接口已集成播放进度
   - 返回用户当前观看集数和总体进度
   - 自动记录浏览历史

5. **评论系统**: 
   - 支持普通评论和弹幕评论
   - 评论内容支持中文，编码正常
   - 评论与剧集通过 ShortID 关联

6. **浏览历史**: 
   - 访问剧集列表时自动记录
   - 支持访问统计和最后访问时间
   - 提供个性化推荐基础数据

7. **防刷机制**: 
   - 查询接口：每分钟最多100次请求
   - 同步/删除接口：每分钟最多10次请求
   - 用户操作：每分钟最多10次浏览记录操作
   - IP操作：每分钟最多50次操作

8. **缓存策略**: 筛选器相关接口使用了缓存，数据更新可能有延迟

9. **参数兼容**: 观看进度和评论接口支持ID和ShortID两种标识符，系统会自动识别参数类型

10. **推荐使用ShortID**: 新开发建议使用ShortID标识符，ID方式主要用于向后兼容

11. **错误处理**: 请根据返回的状态码和错误信息进行适当的错误处理

12. **安全考虑**: 敏感操作需要JWT认证，请妥善保管token

13. **模糊搜索**: 搜索关键词不能为空或纯空格，支持中英文混合搜索，使用Redis缓存提高性能

14. **URL编码**: 模糊搜索接口建议使用`--data-urlencode`参数，避免中文关键词编码问题

15. **剧集列表**: 获取剧集列表接口不包含播放链接，仅返回基本信息，播放链接需通过其他接口获取

16. **浏览记录**: 访问剧集列表接口时会自动记录用户浏览历史，支持个性化推荐和用户行为分析

17. **防刷机制**: 系统具备完善的防刷机制，包括用户操作频率限制、IP黑名单、批量操作保护等

18. **数据清理**: 系统会自动清理30天前的过期浏览记录，管理员可通过接口手动清理

---

## 🧪 测试数据验证

### 测试账号信息
- **用户ID**: 6702079700
- **用户名**: 随风 (seo99991)
- **认证方式**: Telegram OAuth

### 测试数据状态
✅ **用户数据**: 已插入，包含中文姓名和用户名  
✅ **观看进度**: 5条记录，覆盖多个剧集  
✅ **评论数据**: 5条中文评论 + 测试评论  
✅ **浏览历史**: 2个系列的浏览记录  
✅ **中文编码**: 所有中文内容显示正常  

### 功能测试结果
✅ **Telegram 登录**: 正常生成 JWT token  
✅ **观看进度接口**: 正确返回播放进度和百分比  
✅ **评论功能**: 支持中文评论，数据存储正常  
✅ **浏览历史**: 正确记录和返回浏览数据  
✅ **系列信息**: 完整返回系列基本信息和描述  
✅ **分页功能**: 支持分页查询，返回正确的分页元数据  

### 接口测试示例
```bash
# 1. 生成 Token
curl -X POST "http://localhost:8080/user/telegram-login" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 6702079700,
    "first_name": "随风",
    "username": "seo99991",
    "auth_date": 1754642628,
    "hash": "cd671f60a4393b399d9cb269ac4327c8a47a3807c5520077c37477544ae93c07"
  }'

# 2. 测试观看进度（包含播放进度信息）
curl -X GET "http://localhost:8080/api/video/episodes?seriesShortId=fpcxnnFA6m9&page=1&size=3" \
  -H "Authorization: Bearer <YOUR_TOKEN>"

# 3. 测试评论功能
curl -X POST "http://localhost:8080/api/video/comment" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "episodeIdentifier": "CcPcMmtTAHa",
    "content": "测试评论：这部剧真的很精彩！",
    "appearSecond": 0
  }'

# 4. 测试浏览历史
curl -X GET "http://localhost:8080/api/video/browse-history?page=1&size=10" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

---

## 📞 技术支持

如有接口使用问题，请联系开发团队或查看项目文档。

**文档版本**: v2.9  
**最后更新**: 2025年1月  
**API基础URL**: `http://localhost:8080` (开发环境)

## 📝 更新日志

### v2.9 (2025年1月)
- ✅ 新增测试数据验证章节，包含完整的测试结果
- ✅ 更新接口路径说明，明确区分有无 `/api` 前缀的接口
- ✅ 完善观看进度功能说明，包含播放进度集成
- ✅ 更新评论系统说明，支持中文评论和弹幕
- ✅ 新增浏览历史自动记录功能说明
- ✅ 完善认证流程说明，包含 Telegram 登录流程
- ✅ 更新接口测试示例，使用最新的测试数据
- ✅ 新增中文编码支持说明
- ✅ 更新文档版本和最后更新时间

### v2.8 (2025年1月)
- ✅ 新增 `/api/video/episodes` 接口播放进度功能
- ✅ 在剧集列表中添加用户观看进度信息
- ✅ 新增系列基本信息和用户总体播放进度
- ✅ 优化播放进度计算逻辑，支持批量查询
- ✅ 更新接口描述和文档示例，展示播放进度功能
- ✅ 更新文档版本和最后更新时间

### v2.7 (2025年1月)
- ✅ 修复代码中UUID字段混淆问题，统一使用ShortID字段
- ✅ 更新DTO接口定义，将uuid字段改为shortId字段
- ✅ 修复视频服务中的字段映射，确保返回数据使用正确的字段名
- ✅ 更新接口注释，将UUID相关描述改为ShortID
- ✅ 修复类型错误，确保代码编译通过
- ✅ 更新文档版本和最后更新时间

### v2.6 (2025年1月)
- ✅ 新增ShortID标识符详细说明，明确区分Series ShortID和Episode ShortID
- ✅ 更新所有接口参数说明，将UUID改为正确的ShortID格式
- ✅ 添加ShortID使用流程和参数优先级说明
- ✅ 更新接口使用示例，使用正确的ShortID格式（如：jTX5ctteb9h、k8mN2pQr7sT）
- ✅ 修正观看进度、评论等接口的参数说明
- ✅ 更新文档版本和最后更新时间

### v2.5 (2025年1月)
- ✅ 更新所有接口的认证要求状态，明确区分需要认证和不需要认证的接口
- ✅ 移除错误的🔐符号标记
- ✅ 修正HomeController和ListController接口的认证要求（从✅改为❌）
- ✅ 修正CategoryController接口的认证要求（从✅改为❌）
- ✅ 更新文档版本和最后更新时间

### v2.4 (2025年1月)
- ✅ 将获取分类列表接口从PublicVideoController移动到HomeController
- ✅ 更新接口路径：`/api/public/video/categories` → `/api/home/categories`
- ✅ 调整接口统计总览中的接口数量
- ✅ 更新接口使用示例，将分类列表示例移动到首页接口部分
- ✅ 更新文档版本和最后更新时间

### v2.3 (2025年1月)
- ✅ 补全所有缺失的接口到文档中
- ✅ 新增公共视频接口完整文档（PublicVideoController）
- ✅ 新增应用根接口文档（AppController）
- ✅ 完善首页筛选接口文档（getfilterstags, getfiltersdata）
- ✅ 添加公共视频接口的请求参数和响应格式
- ✅ 新增公共视频接口的使用示例
- ✅ 更新文档版本和最后更新时间

### v2.2 (2025年1月)
- ✅ 按照详细请求示例流程重新整理接口顺序
- ✅ 更新所有接口状态信息，标注正常工作/异常状态
- ✅ 完善浏览记录功能完整文档和示例
- ✅ 新增系统统计和清理过期记录接口
- ✅ 添加防刷机制和频率限制说明
- ✅ 优化接口使用示例，使用正确的curl参数格式
- ✅ 更新文档版本和最后更新时间

### v2.1 (2025年8月)
- ✅ 完善模糊搜索接口文档，添加详细功能说明
- ✅ 新增模糊搜索测试示例和响应示例
- ✅ 优化接口使用示例，使用正确的curl参数格式
- ✅ 添加模糊搜索注意事项和最佳实践
- ✅ 新增获取剧集列表接口完整文档
- ✅ 新增浏览记录功能完整实现和文档
- ✅ 更新文档版本和最后更新时间

### v2.0 (2024年12月)
- ✅ 新增轮播图管理接口 (`/api/banners`)
- ✅ 新增分类管理接口 (`/category`)
- ✅ 新增测试接口 (`/test`)
- ✅ 完善认证接口，新增登出和设备管理功能
- ✅ 视频接口支持ID/ShortID自动识别
- ✅ 新增剧集URL管理和续集状态更新功能
- ✅ 完善公共视频接口，支持分页和筛选
- ✅ 新增模糊搜索接口 (`/api/list/fuzzysearch`)
- ✅ 更新所有接口的请求参数和响应格式说明
- ✅ 新增详细的使用示例和错误处理说明

### v1.0 (2024年11月)
- 🎉 初始版本发布
- ✅ 基础认证、用户、视频接口
- ✅ 首页和列表筛选功能
