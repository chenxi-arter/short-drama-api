# 🚀 前端API接口文档 v2.0

## 📋 文档说明

本文档专为前端开发者设计，按照功能模块组织，包含完整的接口说明和参数解释。

**技术栈**: NestJS + TypeORM + MySQL + Redis + JWT  
**基础URL**: 
- 生产环境: `https://your-domain.com`
- 开发环境: `http://localhost` (客户端API)
- 管理后台: `http://localhost:8080` (管理API)

**文档版本**: v2.3  
**最后更新**: 2025年11月8日

---

## 📑 目录

- [1. 认证相关](#1-认证相关)
- [2. 内容浏览](#2-内容浏览)
- [3. 剧集详情](#3-剧集详情)
- [4. 用户交互](#4-用户交互) ⭐
- [5. 收藏管理](#5-收藏管理)
- [6. 评论功能](#6-评论功能)
- [7. 个人中心](#7-个人中心) ⭐ 更新
- [8. 推荐流](#8-推荐流)
- [9. 数据类型定义](#9-数据类型定义)

---

## 1. 认证相关

### 1.1 邮箱注册

**接口**: `POST /api/auth/register`

**请求参数**:
```json
{
  "email": "string",           // 必填，邮箱地址
  "password": "string",        // 必填，密码（6-20位，包含字母和数字）
  "confirmPassword": "string", // 必填，确认密码（必须与password一致）
  "username": "string",        // 必填，用户名（唯一）
  "firstName": "string",       // 必填，名字
  "lastName": "string"         // 可选，姓氏
}
```

**返回数据**:
```json
{
  "id": "string",              // 用户ID
  "shortId": "string",         // 用户短ID
  "email": "string",           // 邮箱地址
  "username": "string",        // 用户名
  "isActive": 1,               // 激活状态
  "createdAt": "string"        // 创建时间
}
```

---

### 1.2 邮箱登录

**接口**: `POST /api/auth/email-login`

**请求参数**:
```json
{
  "email": "string",           // 必填，邮箱地址
  "password": "string",        // 必填，密码
  "deviceInfo": "string"       // 可选，设备信息
}
```

**返回数据**:
```json
{
  "access_token": "string",    // 访问令牌（有效期2小时）
  "refresh_token": "string",   // 刷新令牌（有效期30天）
  "expires_in": 7200,          // 过期时间（秒）
  "token_type": "Bearer"       // 令牌类型
}
```

---

### 1.3 Telegram WebApp 登录

**接口**: `POST /api/auth/telegram/webapp-login`

**请求参数**:
```json
{
  "initData": "string",        // 必填，Telegram WebApp的initData
  "deviceInfo": "string"       // 可选，设备信息
}
```

**返回数据**: 同邮箱登录（access_token、refresh_token等）

---

### 1.4 获取用户信息

**接口**: `GET /api/user/me`  
**认证**: 必需

**返回数据**:
```json
{
  "email": "string | null",    // 邮箱地址
  "username": "string",        // 用户名
  "nickname": "string",        // 显示昵称（优先级：nickname > 姓名 > username）
  "firstName": "string",       // 名字
  "lastName": "string",        // 姓氏
  "photoUrl": "string | null", // 用户头像URL
  "hasTelegram": false,        // 是否绑定Telegram
  "isActive": true,            // 是否激活
  "createdAt": "string"        // 创建时间
}
```

---

### 1.5 刷新Token

**接口**: `POST /api/user/refresh`  
**认证**: 必需

**请求参数**:
```json
{
  "refresh_token": "string"    // 必填，刷新令牌
}
```

**返回数据**:
```json
{
  "access_token": "string",    // 新的访问令牌
  "expires_in": 7200,          // 过期时间（秒）
  "token_type": "Bearer"       // 令牌类型
}
```

---

## 2. 内容浏览

### 2.1 获取分类列表

**接口**: `GET /api/home/categories`

**返回数据**:
```json
[
  {
    "id": 1,                   // 分类ID
    "name": "string",          // 分类名称
    "routeName": "string",     // 路由名称
    "isEnabled": true          // 是否启用
  }
]
```

---

### 2.2 获取首页内容

**接口**: `GET /api/home/gethomemodules?channeid=1&page=1`

**请求参数**:
```
channeid: number   // 必填，分类ID
page: number       // 必填，页码，默认1
```

**返回数据**:
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "type": 0,             // 模块类型：0=轮播图
        "name": "热门推荐",
        "banners": [           // 轮播图数据
          {
            "id": 1,
            "title": "精彩剧集",
            "imageUrl": "https://example.com/banner.jpg",
            "linkUrl": "https://example.com/series/xxx",
            "seriesId": 2448,
            "shortId": "N8Tg2KtBQPN"
          }
        ]
      },
      {
        "type": 1001,          // 模块类型：1001=筛选器
        "name": "筛选",
        "filters": [           // 筛选器数据
          {
            "name": "题材",
            "list": [
              { "classifyId": 1, "classifyName": "爱情" },
              { "classifyId": 2, "classifyName": "悬疑" }
            ]
          }
        ]
      },
      {
        "type": 3,             // 模块类型：3=视频列表
        "name": "最新上线",
        "list": [              // 视频列表（VideoItem）
          {
            "id": 2448,
            "shortId": "N8Tg2KtBQPN",
            "title": "恋爱潜伏",
            "coverUrl": "https://example.com/cover.jpg",
            "score": "8.3",
            "playCount": 304648,
            "upStatus": "更新至第21集",
            "upCount": 2,      // 当天新增2集
            "isRecommend": true,
            "description": "外科医生顾念救了毒贩K后..."
          }
        ]
      }
    ]
  }
}
```

---

### 2.3 获取筛选标签

**接口**: `GET /api/list/getfilterstags?channeid=1`

**请求参数**:
```
channeid: number   // 必填，频道ID（对应分类ID）
```

**返回数据**:
```json
{
  "code": 200,
  "data": [
    {
      "name": "题材",        // 标签组名称（如"题材"、"地区"）
      "list": [
        {
          "index": 1,          // 标签索引
          "classifyId": 2,     // 分类ID
          "classifyName": "爱情", // 分类名称
          "isDefaultSelect": false // 是否默认选中
        }
      ]
    }
  ]
}
```

---

### 2.4 条件筛选

**接口**: `GET /api/list/getfiltersdata?channeid=1&ids=1,2,0,0,0,0&page=1`

**请求参数**:
```
channeid: number   // 必填，频道ID
ids: string        // 必填，筛选条件（6位，用逗号分隔）
                   // 格式：sort,genre,region,language,year,status
                   // 示例：1,2,0,0,0,0（单选题材）
                   //       1,2-5-7,0,0,0,0（多选题材1、3、5）
page: number       // 必填，页码
```

**筛选参数位置说明**:
```
位置0: 排序（sort）
位置1: 题材（genre） - 支持多选，用连字符连接，如 1-3-5
位置2: 地区（region）
位置3: 语言（language）
位置4: 年份（year）
位置5: 状态（status）
```

**返回数据**:
```json
{
  "code": 200,
  "data": {
    "list": [                // VideoItem[] 视频列表
      {
        "id": 2448,
        "shortId": "N8Tg2KtBQPN",
        "title": "恋爱潜伏",
        "coverUrl": "https://example.com/cover.jpg",
        "score": "8.3",
        "playCount": 304648,
        "upStatus": "更新至第21集",
        "upCount": 2,
        "isRecommend": true,
        "description": "外科医生顾念救了毒贩K后..."
      }
    ],
    "total": 100,            // 总数
    "page": 1,               // 当前页
    "size": 20,              // 每页数量
    "hasMore": true          // 是否有更多
  }
}
```

---

### 2.5 模糊搜索

**接口**: `GET /api/list/fuzzysearch?keyword=霸道总裁&categoryId=1&page=1&size=20`

**请求参数**:
```
keyword: string    // 必填，搜索关键词
categoryId: number // 可选，分类ID（1-短剧，2-电影，3-电视剧等）⭐
page: number       // 可选，页码，默认1
size: number       // 可选，每页数量，默认20
```

**返回数据**: 同筛选接口（包含 list、total、page、size、hasMore）

**错误响应**（无效分类ID）:
```json
{
  "code": 400,
  "msg": "分类ID 999 不存在，请使用有效的分类ID。可用的分类: 1-短剧、2-电影、3-电视剧",
  "data": null
}
```

**使用示例**:
```bash
# 搜索所有分类
GET /api/list/fuzzysearch?keyword=爱情

# 只搜索短剧分类
GET /api/list/fuzzysearch?keyword=爱情&categoryId=1

# 只搜索电影分类
GET /api/list/fuzzysearch?keyword=爱情&categoryId=2
```

**说明**: 
- ⭐ **支持分类筛选**：传入 `categoryId` 参数可筛选特定分类的搜索结果
- 无效的分类ID会返回友好的错误提示和可用分类列表
- 不传 `categoryId` 时搜索所有分类
- **智能验证**：自动验证分类ID是否存在且启用

---

### 2.6 热门搜索建议 ⭐ 新增

**接口**: `GET /api/search/hot-keywords?limit=5&categoryId=1`

**说明**: 返回最近热度最高的剧集标题，用于搜索框展示，每次随机打乱顺序

**请求参数**:
```
limit: number       // 可选，返回数量，默认5（最大20）
categoryId: number  // 可选，分类ID（1-短剧，2-电影，3-电视剧）
```

**返回数据**:
```json
{
  "code": 200,
  "message": "获取热门关键词成功",
  "data": [
    "唐朝诡事录之西行",
    "宁安如梦",
    "狂飙",
    "蛮好的人生",
    "后宫甄嬛传"
  ]
}
```

**使用场景**:
- 搜索框placeholder轮播展示
- 热门搜索标签云
- 搜索历史推荐

**特点**:
- ⭐ 按热度排序（播放量70% + 评分30%）
- 默认只返回最近30天的剧集
- 缓存6小时，性能优秀
- 排序稳定，每次返回相同顺序

---

### 2.7 热门搜索建议（完整版）⭐ 新增

**接口**: `GET /api/search/hot-suggestions?limit=10&categoryId=1&daysRange=30`

**说明**: 返回热门剧集的完整信息，包含ID、分类、播放量、评分等，适用于搜索建议下拉框

**请求参数**:
```
limit: number       // 可选，返回数量，默认10（最大50）
categoryId: number  // 可选，分类ID（1-短剧，2-电影，3-电视剧）
daysRange: number   // 可选，时间范围（天数），默认30，0表示不限时间
```

**返回数据**:
```json
{
  "code": 200,
  "message": "获取热门搜索建议成功",
  "data": [
    {
      "id": 2645,
      "title": "我是刑警",
      "shortId": "abc123def",
      "categoryName": "电视剧",
      "playCount": 9458688,
      "score": "9.0"
    },
    {
      "id": 2448,
      "title": "长月烬明",
      "shortId": "xyz789uvw",
      "categoryName": "电视剧",
      "playCount": 9875200,
      "score": "7.0"
    }
  ],
  "timestamp": "2025-11-06T14:30:00.000Z"
}
```

**字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | number | 剧集系列ID |
| `title` | string | 剧集标题 |
| `shortId` | string | 剧集短ID（可用于跳转到详情页） |
| `categoryName` | string | 分类名称（如"短剧"、"电影"） |
| `playCount` | number | 播放量（越高越热门） |
| `score` | string | 评分（如"9.0"） |

**使用场景**:
- 搜索建议下拉框（可点击跳转）
- 热门推荐区域
- 首页热搜榜

**热度计算**:
```
综合热度 = 播放量 × 0.7 + 评分 × 1000 × 0.3
```

**示例**:
```bash
# 获取10条热门剧集（所有分类）
GET /api/search/hot-suggestions?limit=10

# 只获取短剧的热门建议
GET /api/search/hot-suggestions?limit=10&categoryId=1

# 只看最近7天的热门剧
GET /api/search/hot-suggestions?limit=5&daysRange=7
```

**性能说明**:
- 缓存时间：6小时（21600秒）
- 每6小时自动更新一次热门列表
- 同一缓存周期内多次请求返回相同数据（顺序固定）
- 按热度排序，最热的排在前面
- 节省数据库查询，提高响应速度

---

## 3. 剧集详情

### 3.1 获取剧集列表

**接口**: 
- `GET /api/video/episodes`（需认证，返回用户状态）
- `GET /api/public/video/episodes`（公开，无用户状态）

**请求参数**:
```
seriesShortId: string   // 二选一，系列ShortID（推荐）
seriesId: number        // 二选一，系列ID（兼容）
page: number            // 可选，页码，默认1
size: number            // 可选，每页数量，默认20，最大200
```

**返回数据**:
```json
{
  "code": 200,
  "data": {
    "seriesInfo": {
      "id": 2448,
      "shortId": "N8Tg2KtBQPN",
      "title": "恋爱潜伏",
      "description": "string",
      "coverUrl": "string",
      "totalEpisodes": 21,
      "isCompleted": true,
      "score": "8.3",
      "tags": ["爱情", "悬疑", "都市"]
    },
    "userProgress": {        // 仅认证时返回 ⭐
      "currentEpisode": 5,   // 当前观看到第几集
      "watchProgress": 120,  // 观看进度（秒）
      "watchPercentage": 50, // 观看百分比
      "isCompleted": false   // 是否看完
    },
    "list": [
      {
        "id": 12328,
        "shortId": "6JswefD4QXK",
        "episodeNumber": 1,
        "title": "第1集",
        "duration": 300,       // 时长（秒）
        "isVertical": false,   // 是否竖屏（false=横屏16:9，true=竖屏9:16）
        "likeCount": 156,      // 点赞数
        "dislikeCount": 12,    // 点踩数
        "favoriteCount": 89,   // 收藏数
        "episodeAccessKey": "F5F06D9B...",
        "urls": [
          {
            "quality": "720p",
            "accessKey": "abc123def456..."
          },
          {
            "quality": "1080p",
            "accessKey": "xyz789uvw012..."
          }
        ],
        "userInteraction": {   // 仅认证时返回 ⭐
          "liked": true,       // 是否点赞了这一集
          "disliked": false,   // 是否点踩了这一集
          "favorited": true    // 是否收藏了这个系列（同系列所有集相同）
        }
      }
    ],
    "total": 21,
    "page": 1,
    "size": 20,
    "hasMore": true,
    "tags": ["爱情", "悬疑", "都市"],
    "currentEpisode": "05"   // 当前观看集数
  }
}
```

**字段说明**:
```
EpisodeItem: {
  // 基础信息
  id, shortId, episodeNumber, title, duration, isVertical
  
  // 互动数据（公开）
  likeCount, dislikeCount, favoriteCount
  
  // 播放地址
  episodeAccessKey, urls[]
  
  // 用户状态（仅认证时返回）⭐
  userInteraction?: {
    liked: boolean,        // 是否点赞了这一集
    disliked: boolean,     // 是否点踩了这一集
    favorited: boolean     // 是否收藏了这个系列（同系列所有集相同）
  }
}

userProgress: {            // 仅认证时返回 ⭐
  currentEpisode: number,  // 当前观看到第几集
  watchProgress: number,   // 观看进度（秒）
  watchPercentage: number, // 观看百分比
  isCompleted: boolean     // 是否看完
}
```

---

### 3.2 获取播放地址

**接口**: `POST /api/video/url/query`

**请求参数**:
```json
{
  "type": "episode",       // 必填，'episode'（剧集级）或 'url'（地址级）
  "accessKey": "string"    // 必填，对应类型的访问密钥
}
```

**返回数据**:
```json
{
  "episodeId": 12328,
  "episodeShortId": "6JswefD4QXK",
  "episodeTitle": "第1集",
  "seriesId": 2448,
  "seriesShortId": "N8Tg2KtBQPN",
  "urls": [
    {
      "id": 1,
      "quality": "720p",     // 清晰度
      "cdnUrl": "https://cdn.example.com/video/720p.m3u8",
      "ossUrl": "https://oss.example.com/video/720p.m3u8",
      "subtitleUrl": null,   // 字幕地址（可为null）
      "accessKey": "abc123def456...",
      "createdAt": "2025-10-15T10:00:00.000Z",
      "updatedAt": "2025-10-15T10:00:00.000Z"
    },
    {
      "id": 2,
      "quality": "1080p",
      "cdnUrl": "https://cdn.example.com/video/1080p.m3u8",
      "ossUrl": "https://oss.example.com/video/1080p.m3u8",
      "subtitleUrl": "https://cdn.example.com/subtitle.srt",
      "accessKey": "xyz789uvw012...",
      "createdAt": "2025-10-15T10:00:00.000Z",
      "updatedAt": "2025-10-15T10:00:00.000Z"
    }
  ],
  "accessKeySource": "episode"  // 'episode' 或 'url'
}
```

---

### 3.3 保存观看进度

**接口**: `POST /api/video/progress`  
**认证**: 必需

**请求参数**:
```json
{
  "episodeIdentifier": "string", // 必填，剧集ShortID或ID
  "stopAtSecond": 120            // 必填，停止时间（秒）
}
```

**返回数据**:
```json
{
  "stopAtSecond": 120            // 观看进度（秒）
}
```

---

## 4. 用户交互 ⭐

### 4.1 点赞剧集

**接口**: `POST /api/video/episode/activity`  
**认证**: 必需

**请求参数**:
```json
{
  "shortId": "6JswefD4QXK",  // 必填，剧集ShortID
  "type": "like"             // 必填，固定值 'like'
}
```

**返回数据**:
```json
{
  "code": 200,
  "data": {
    "episodeId": 12328,
    "shortId": "6JswefD4QXK",
    "type": "like",
    "changed": true,         // 是否改变了状态
    "previousType": "dislike" // 之前的状态（如果有）
  },
  "message": "已更新"
}
```

**说明**: 
- 如果用户已点赞，返回 `changed: false`，message: "已是该状态"
- 如果用户之前点踩，切换为点赞会自动调整计数，返回 `previousType: 'dislike'`
- 点赞和点踩互斥

---

### 4.2 点踩剧集

**接口**: `POST /api/video/episode/activity`  
**认证**: 必需

**请求参数**:
```json
{
  "shortId": "6JswefD4QXK",  // 必填，剧集ShortID
  "type": "dislike"          // 必填，固定值 'dislike'
}
```

**返回数据**: 同点赞接口（changed、previousType等）

---

### 4.3 取消点赞/点踩

**接口**: `POST /api/video/episode/reaction/remove`  
**认证**: 必需

**请求参数**:
```json
{
  "shortId": "6JswefD4QXK"   // 必填，剧集ShortID
}
```

**返回数据**:
```json
{
  "code": 200,
  "data": {
    "episodeId": 12328,
    "shortId": "6JswefD4QXK",
    "removed": true            // 是否成功取消
  },
  "message": "已取消"
}
```

**说明**: 
- 取消操作不区分点赞还是点踩，会移除用户的任何反应
- 如果没有反应记录，返回 `removed: false`

---

### 4.4 播放计数

**接口**: `POST /api/video/episode/activity`
**认证**: 可选

**请求参数**:
```json
{
  "shortId": "6JswefD4QXK",  // 必填，剧集ShortID
  "type": "play"             // 必填，固定值 'play'
}
```

**返回数据**:
```json
{
  "code": 200,
  "data": {
    "episodeId": 12328,
    "shortId": "6JswefD4QXK",
    "type": "play"
  },
  "message": "已更新"
}
```

**说明**: 自动增加该集的 `playCount`

---

## 5. 收藏管理

### 5.1 收藏系列 ⭐

**接口**: `POST /api/video/episode/activity`
**认证**: 必需

**请求参数**:
```json
{
  "shortId": "6JswefD4QXK",  // 必填，剧集ShortID（该系列的任意一集）
  "type": "favorite"         // 必填，固定值 'favorite'
}
```

**返回数据**:
```json
{
  "code": 200,
  "data": {
    "episodeId": 12328,      // 触发收藏的剧集ID
    "shortId": "6JswefD4QXK", // 触发收藏的剧集ShortID
    "type": "favorite",
    "seriesId": 2448         // 被收藏的系列ID ⭐
  },
  "message": "已收藏系列"
}
```

**⭐ 重要说明**:
- **收藏是针对整个系列的**，不是针对单集
- 传入该系列任意一集的 `shortId` 都会收藏整个系列
- 收藏后，该系列所有剧集的 `userInteraction.favorited` 都为 `true`
- 重复收藏不会报错

**示例**: 用户在第5集点击收藏 → 收藏整个系列 → 第1-21集的 `userInteraction.favorited` 都是 `true`

---

### 5.2 取消收藏

**接口**: `POST /api/user/favorites/remove`  
**认证**: 必需

**请求参数**:
```json
{
  "shortId": "6JswefD4QXK"   // 必填，剧集ShortID（该系列的任意一集）
}
```

**返回数据**:
```json
{
  "code": 200,
  "data": {
    "removed": true,         // 是否成功移除
    "shortId": "6JswefD4QXK",
    "seriesId": 2448,        // 系列ID
    "favoriteType": "series" // 收藏类型
  },
  "message": "取消收藏成功"
}
```

**说明**: 
- 取消整个系列的收藏
- 该系列所有剧集的 `userInteraction.favorited` 都变为 `false`

---

### 5.3 获取收藏列表

**接口**: `GET /api/user/favorites?page=1&size=20&categoryId=1`  
**认证**: 必需

**请求参数**:
```
page: number       // 可选，页码，默认1
size: number       // 可选，每页数量，默认20
categoryId: number // 可选，分类ID（1-短剧，2-电影，3-电视剧等）⭐ 新增
```

**返回数据**:
```json
{
  "code": 200,
  "message": "获取收藏列表成功",
  "data": {
    "list": [
      {
        "seriesId": 2448,
        "seriesShortId": "N8Tg2KtBQPN",
        "seriesTitle": "恋爱潜伏",
        "seriesCoverUrl": "string",
        "categoryName": "短剧",
        "description": "string",
        "score": "8.3",
        "playCount": 304648,
        "totalEpisodeCount": 21,    // 该系列总集数
        "upCount": 2,               // 当天新增集数（用于角标）
        "isCompleted": true,
        "favoriteTime": "2025-10-15 14:30"
      }
    ],
    "total": 10,             // 收藏的系列总数
    "page": 1,
    "size": 20,
    "hasMore": false
  }
}
```

**错误响应**（无效分类ID）:
```json
{
  "code": 400,
  "message": "分类ID 999 不存在，请使用有效的分类ID。可用的分类: 1-短剧、2-电影、3-电视剧",
  "data": null
}
```

**说明**: 
- 列表按系列显示，每个系列只出现一次
- ⭐ **支持分类筛选**：传入 `categoryId` 参数可筛选特定分类的收藏
- 无效的分类ID会返回友好的错误提示和可用分类列表
- 不传 `categoryId` 时返回所有分类的收藏

---

### 5.4 获取收藏统计

**接口**: `GET /api/user/favorites/stats`
**认证**: 必需

**返回数据**:
```json
{
  "code": 200,
  "data": {
    "total": 10,             // 总收藏数
    "seriesCount": 10,       // 收藏系列数
    "episodeCount": 0        // 收藏剧集数（当前为0）
  }
}
```

---

## 6. 评论功能

### 6.1 发表主楼评论

**接口**: `POST /api/video/episode/comment`  
**认证**: 必需

**请求参数**:
```json
{
  "shortId": "6JswefD4QXK",  // 必填，剧集ShortID
  "content": "这部剧太好看了！" // 必填，评论内容（≤500字）
}
```

**返回数据**:
```json
{
  "code": 200,
  "data": {
    "id": 501,               // 评论ID
    "content": "这部剧太好看了！",
    "createdAt": "2025-10-15T14:22:12.655Z"
  },
  "message": "评论发表成功"
}
```

---

### 6.2 回复评论

**接口**: `POST /api/video/episode/comment/reply`  
**认证**: 必需

**请求参数**:
```json
{
  "episodeShortId": "6JswefD4QXK",  // 必填，剧集ShortID
  "parentId": 501,                  // 必填，要回复的评论ID
  "content": "我也觉得！"            // 必填，回复内容（≤500字）
}
```

**返回数据**:
```json
{
  "code": 200,
  "data": {
    "id": 502,                       // 回复ID
    "parentId": 501,                 // 父评论ID
    "rootId": 501,                   // 主楼ID
    "floorNumber": 1,                // 楼层号
    "content": "我也觉得！",
    "username": "test_user",
    "nickname": "测试用户",
    "photoUrl": "string | null",
    "replyToUsername": "main_user",
    "replyToNickname": "主楼用户",
    "createdAt": "2025-10-15T14:22:12.696Z"
  },
  "message": "回复成功"
}
```

---

### 6.3 获取评论列表

**接口**: `GET /api/video/comments?episodeShortId=6JswefD4QXK&page=1&size=20`

**请求参数**:
```
episodeShortId: string   // 必填，剧集ShortID
page: number             // 可选，页码，默认1
size: number             // 可选，每页数量，默认20
```

**返回数据**:
```json
{
  "code": 200,
  "data": {
    "comments": [
      {
        "id": 501,                      // 主楼ID
        "content": "这部剧太好看了！",
        "replyCount": 3,                // 回复数量
        "username": "user123",
        "nickname": "张三",
        "photoUrl": "string | null",    // 用户头像URL
        "createdAt": "2025-10-15 14:22",
        "recentReplies": [              // 最新2条回复预览
          {
            "id": 502,
            "content": "我也觉得！",
            "floorNumber": 1,
            "username": "user456",
            "nickname": "李四",
            "photoUrl": "string | null",
            "createdAt": "2025-10-15 14:25"
          }
        ]
      }
    ],
    "total": 23,
    "page": 1,
    "size": 20,
    "totalPages": 2
  }
}
```

**说明**: 只返回主楼评论，每条主楼附带最新2条回复预览

---

### 6.4 获取评论回复

**接口**: `GET /api/video/episode/comments/501/replies?page=1&size=20`

**路径参数**:
```
commentId: number    // 主楼评论ID（在URL中）
```

**查询参数**:
```
page: number         // 可选，页码，默认1
size: number         // 可选，每页数量，默认20
```

**返回数据**:
```json
{
  "code": 200,
  "data": {
    "rootComment": {              // 主楼信息
      "id": 501,
      "content": "这部剧太好看了！",
      "username": "user123",
      "nickname": "张三",
      "photoUrl": "string | null",
      "replyCount": 10,
      "createdAt": "2025-10-15 14:22"
    },
    "replies": [                  // 回复列表（按楼层号升序）
      {
        "id": 502,
        "parentId": 501,
        "floorNumber": 1,
        "content": "我也觉得！",
        "username": "user456",
        "nickname": "李四",
        "photoUrl": "string | null",
        "createdAt": "2025-10-15 14:25"
      }
    ],
    "total": 10,
    "page": 1,
    "size": 20,
    "totalPages": 1
  }
}
```

---

## 7. 个人中心 ⭐

### 7.1 获取收藏列表

见 [5.3 获取收藏列表](#53-获取收藏列表)

---

### 7.2 获取点赞列表 ⭐ 新增

**接口**: `GET /api/user/liked?page=1&size=20&categoryId=1`  
**认证**: 必需

**请求参数**:
```
page: number       // 可选，页码，默认1
size: number       // 可选，每页数量，默认20
categoryId: number // 可选，分类ID（1-短剧，2-电影，3-电视剧等）
```

**返回数据**:
```json
{
  "code": 200,
  "message": "获取点赞列表成功",
  "data": {
    "list": [
      {
        "seriesId": 2645,
        "seriesShortId": "abc123",
        "seriesTitle": "山河烬：将女归途",
        "seriesCoverUrl": "https://...",
        "categoryName": "短剧",
        "description": "剧集简介",
        "score": "8.5",
        "playCount": 50000,
        "totalEpisodeCount": 21,    // 该系列总集数
        "likedEpisodeCount": 3,     // 用户点赞了该系列的几集 ⭐
        "upCount": 0,               // 当天新增集数
        "isCompleted": true,
        "likeTime": "2025-11-02 04:02"  // 最近点赞时间
      }
    ],
    "total": 5,              // 点赞的系列总数
    "page": 1,
    "size": 20,
    "hasMore": false
  }
}
```

**错误响应**（无效分类ID）:
```json
{
  "code": 400,
  "message": "分类ID 999 不存在，请使用有效的分类ID。可用的分类: 1-短剧、2-电影、3-电视剧",
  "data": null
}
```

**说明**: 
- 按系列聚合显示用户点赞的剧集
- `likedEpisodeCount` 显示用户点赞了该系列的几集
- 支持分类筛选（categoryId参数）
- 与收藏列表类似，但基于点赞数据（`episode_reactions` 表）
- 点赞是针对单集的，但列表按系列聚合展示，更清晰

**与收藏的区别**:
- 点赞：轻量级互动，针对单集
- 收藏：重度关注，针对系列

---

### 7.3 获取点赞统计

**接口**: `GET /api/user/liked/stats`  
**认证**: 必需

**返回数据**:
```json
{
  "code": 200,
  "message": "获取统计成功",
  "data": {
    "totalLikedEpisodes": 5,    // 点赞的剧集总数（单集计数）
    "likedSeriesCount": 3       // 涉及的系列数
  }
}
```

**说明**: 
- `totalLikedEpisodes`: 用户点赞了多少集（如点赞了5集）
- `likedSeriesCount`: 这些剧集来自几个系列（如来自3个系列）

---

### 7.4 获取浏览历史

**接口**: `GET /api/video/browse-history?page=1&size=20&categoryId=1`  
**认证**: 必需

**请求参数**:
```
page: number       // 可选，页码，默认1
size: number       // 可选，每页数量，默认20
categoryId: number // 可选，分类ID（1-短剧，2-电影，3-电视剧等）⭐ 新增
```

**返回数据**:
```json
{
  "code": 200,
  "message": "获取浏览记录成功",
  "data": {
    "list": [
      {
        "id": 123,
        "seriesId": 2448,
        "seriesTitle": "恋爱潜伏",
        "seriesShortId": "N8Tg2KtBQPN",
        "seriesCoverUrl": "string",
        "categoryName": "短剧",
        "categoryId": 1,            // 分类ID ⭐ 新增
        "browseType": "episode_watch",
        "browseTypeDesc": "观看剧集",
        "lastEpisodeNumber": 5,        // 最后观看集数
        "lastEpisodeTitle": "第5集",
        "visitCount": 5,               // 访问次数（观看过的不同集数）
        "durationSeconds": 120,        // 最后观看集的观看时长（秒）
        "lastVisitTime": "2025-10-15 14:30",
        "watchStatus": "观看至第5集"
      }
    ],
    "total": 15,
    "page": 1,
    "size": 20,
    "hasMore": false
  }
}
```

**错误响应**（无效分类ID）:
```json
{
  "code": 400,
  "message": "分类ID 999 不存在，请使用有效的分类ID。可用的分类: 1-短剧、2-电影、3-电视剧",
  "data": null,
  "timestamp": "2025-11-06T12:30:00.000Z"
}
```

**说明**: 
- 浏览历史基于观看进度自动聚合，按系列分组显示
- ⭐ **新增分类筛选**：传入 `categoryId` 参数可筛选特定分类的浏览记录
- 无效的分类ID会返回友好的错误提示和可用分类列表
- 不传 `categoryId` 时返回所有分类的浏览记录

---

### 7.5 更新用户头像

**接口**: `POST /api/user/update-avatar`  
**认证**: 必需

**请求参数**:
```json
{
  "photo_url": "https://example.com/avatar.jpg"  // 必填，头像URL（≤500字符）
}
```

**返回数据**:
```json
{
  "success": true,
  "message": "头像更新成功",
  "photo_url": "https://example.com/avatar.jpg"
}
```

**说明**: 
- 仅支持URL地址，不支持文件上传
- URL需要是有效的图片链接
- 更新后立即生效，评论、个人信息等处都会显示新头像

**💡 默认头像**: 
新注册用户会自动分配以下5个默认头像之一：
1. `https://static.656932.com/defaultavatar/1.png`
2. `https://static.656932.com/defaultavatar/2.png`
3. `https://static.656932.com/defaultavatar/3.png`
4. `https://static.656932.com/defaultavatar/4.png`
5. `https://static.656932.com/defaultavatar/5.png`

---


---

## 8. 推荐流

### 8.1 获取推荐剧集

**接口**: `GET /api/video/recommend?page=1&size=20`

**请求参数**:
```
page: number       // 可选，页码，默认1
size: number       // 可选，每页数量，默认20
```

**返回数据**:
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "shortId": "6JswefD4QXK",        // 剧集ShortID
        "episodeNumber": 1,
        "title": "第1集",
        "duration": 716,                 // 时长（秒）
        "isVertical": true,              // 是否竖屏播放
        "seriesShortId": "N8Tg2KtBQPN",  // 系列ShortID（用于跳转）
        "seriesTitle": "恋爱潜伏",
        "seriesCoverUrl": "string",
        "seriesDescription": "string",
        "seriesScore": "8.3",            // 系列评分 ⭐
        "seriesStarring": "张三, 李四",   // 主演 ⭐
        "seriesActor": "张三, 李四, 王五", // 演员 ⭐
        "playCount": 1,
        "likeCount": 156,
        "dislikeCount": 12,
        "favoriteCount": 89,
        "commentCount": 5,
        "episodeAccessKey": "string",
        "urls": [
          { "quality": "720p", "accessKey": "abc123..." },
          { "quality": "1080p", "accessKey": "xyz789..." }
        ],
        "topComments": [                 // 评论预览（最新3条）
          {
            "id": 501,
            "content": "太好看了！",
            "username": "user123",
            "nickname": "张三",
            "photoUrl": "https://example.com/avatar.jpg",
            "createdAt": "2025-10-15 14:20"
          }
        ],
        "userInteraction": {             // 仅认证时返回 ⭐
          "liked": true,
          "disliked": false,
          "favorited": true
        },
        "recommendScore": 139            // 推荐分数（调试用）
      }
    ],
    "page": 1,
    "size": 20,
    "hasMore": true
  }
}
```

**推荐算法**:
```
推荐分数 = (点赞数 × 3 + 收藏数 × 5) × 随机权重(0.5-1.5) + 大随机因子(0-500) + 新鲜度分数(0-300)
```

**说明**: 
- 使用随机权重和大随机因子，确保推荐内容高度随机化
- 优质内容（高点赞、高收藏）更容易被推荐，但不会总是排在最前面
- 新内容和冷门内容也有机会出现在推荐流中
- **新鲜度加成**: 最近发布的内容有额外300分加成，30天后归零（每天递减10分）
  - 今天发布：+300分
  - 1周内：+230分
  - 2周内：+160分
  - 30天以上：+0分

**字段说明**:
| 字段 | 类型 | 说明 |
|------|------|------|
| seriesScore | string | 系列评分（如"8.3"） |
| seriesStarring | string | 主演（逗号分隔） |
| seriesActor | string | 演员列表（逗号分隔） |
| userInteraction | object | 用户交互状态（仅登录时返回） |

**说明**:
- 无需认证即可访问
- 如果用户已登录，会返回 `userInteraction` 字段
- 包含随机因子，每次刷新都有不同内容
- 返回系列的评分、主演、演员信息，方便前端展示

---

## 9. 数据类型定义

### 9.1 UserInteraction（用户交互状态）

**仅在用户登录时返回**

```json
{
  "liked": false,        // 是否点赞了这一集（每集独立）
  "disliked": false,     // 是否点踩了这一集（每集独立，与liked互斥）
  "favorited": true      // 是否收藏了这个系列（同系列所有集相同）⭐
}
```

**关键点**:
- `liked` 和 `disliked`：每集独立，用户可以点赞第1集，点踩第2集
- `favorited`：同一系列的所有集都相同（要么全true，要么全false）
- 未登录用户不会有此字段

---

### 9.2 UserProgress（用户观看进度）

**仅在用户登录时返回**

```json
{
  "currentEpisode": 5,       // 当前观看到第几集
  "watchProgress": 120,      // 当前集的观看进度（秒）
  "watchPercentage": 50,     // 观看百分比
  "isCompleted": false       // 是否看完整个系列
}
```

**特点**:
- 系列级别的数据（不是每集都有）
- 仅在响应的 `data` 根级别返回

---

### 9.3 EpisodeItem（剧集项）

```json
{
  "id": 12328,
  "shortId": "6JswefD4QXK",
  "episodeNumber": 1,
  "title": "第1集",
  "duration": 300,
  "isVertical": false,
  "seriesId": 2448,
  "seriesTitle": "恋爱潜伏",
  "seriesShortId": "N8Tg2KtBQPN",
  "likeCount": 156,           // 公开数据
  "dislikeCount": 12,         // 公开数据
  "favoriteCount": 89,        // 公开数据
  "episodeAccessKey": "string",
  "urls": [
    { "quality": "720p", "accessKey": "abc123..." },
    { "quality": "1080p", "accessKey": "xyz789..." }
  ],
  "userInteraction": {        // 仅登录时返回 ⭐
    "liked": true,
    "disliked": false,
    "favorited": true
  }
}
```

---

### 9.4 SeriesInfo（系列信息）

```json
{
  "id": 2448,
  "shortId": "N8Tg2KtBQPN",
  "title": "恋爱潜伏",
  "description": "string",
  "coverUrl": "string",
  "categoryId": 1,
  "categoryName": "短剧",
  "score": "8.3",
  "playCount": 304648,
  "totalEpisodes": 21,
  "isCompleted": true,
  "starring": "string",
  "actor": "string",
  "director": "string",
  "releaseDate": "2024-08-01",
  "tags": ["爱情", "悬疑"]
}
```

---

---

## ⚠️ 注意事项

### 1. 认证要求

**需要认证的接口**:
- 所有用户交互接口（点赞、点踩、收藏）
- 评论发表和回复
- 观看进度保存
- 浏览历史查询
- 收藏列表查询

**公开接口**（无需认证）:
- 分类列表、首页内容、筛选、搜索
- 剧集列表（公开版本）
- 推荐列表
- 评论列表（查看）

### 2. 用户状态字段

用户相关字段仅在认证时返回:
- `userProgress`: 观看进度（系列级别）
- `userInteraction`: 交互状态（剧集级别）

前端应检查字段是否存在：
```typescript
if (episode.userInteraction) {
  // 用户已登录
  const isLiked = episode.userInteraction.liked;
    } else {
  // 用户未登录，提示登录
}
```

### 3. 收藏的特殊性 ⭐

- 收藏是针对系列的，不是针对单集
- 同一系列的所有集，`userInteraction.favorited` 都相同
- 收藏/取消收藏后，前端需要同步更新该系列所有剧集的状态

### 4. 点赞点踩互斥

- 用户不能同时点赞和点踩同一集
- 切换时会自动调整计数
- 可以通过取消接口移除反应

---

## 💡 重要设计说明

### 用户列表功能对比 ⭐

| 列表类型 | 接口路径 | 数据来源 | 聚合方式 | 分类筛选 | 特殊字段 |
|---------|---------|---------|---------|---------|---------|
| **收藏列表** | `/api/user/favorites` | favorites表 | 系列级别 | ✅ | `favoriteTime` |
| **点赞列表** ⭐ | `/api/user/liked` | episode_reactions表 | 剧集→系列聚合 | ✅ | `likedEpisodeCount`, `likeTime` |
| **浏览记录** | `/api/video/browse-history` | browse_history表 | 系列级别 | ✅ | `lastEpisodeNumber`, `visitCount` |
| **模糊搜索** ⭐ | `/api/list/fuzzysearch` | series表 | 系列级别 | ✅ | 搜索结果 |

**使用场景**:
- **收藏列表**: 用户想追的剧（重度关注）
- **点赞列表**: 用户喜欢的剧集（轻度互动）
- **浏览记录**: 用户看过的剧（历史追踪）
- **模糊搜索**: 按关键词搜索剧集（内容发现）

**分类筛选示例**:
```bash
# 收藏列表 - 只看短剧收藏
GET /api/user/favorites?categoryId=1

# 点赞列表 - 只看电影点赞
GET /api/user/liked?categoryId=2

# 浏览记录 - 只看电视剧浏览
GET /api/video/browse-history?categoryId=3

# 模糊搜索 - 只搜索短剧 ⭐ 新增
GET /api/list/fuzzysearch?keyword=爱情&categoryId=1
```

---

### 用户交互功能对比

| 功能 | 针对对象 | 字段位置 | 状态范围 |
|------|---------|---------|---------|
| 点赞 | 单集 | `userInteraction.liked` | 每集独立 |
| 点踩 | 单集 | `userInteraction.disliked` | 每集独立 |
| **收藏** | **系列** ⭐ | `userInteraction.favorited` | 同系列统一 |
| 观看进度 | 系列 | `userProgress` | 系列级别 |

### 为什么收藏是针对系列的？

1. **追剧需求**：短剧通常较短（20-100集），用户收藏是为了追完整个系列
2. **列表清晰**：避免同一系列在收藏列表中重复出现
3. **更新提醒**：可以显示"更新X集"角标
4. **用户习惯**：符合用户对"收藏"的认知（收藏一部剧）

### 前端实现要点

**收藏操作后的状态同步**:
```typescript
// 用户收藏后，需要更新该系列所有剧集的状态
episodes.map(ep => 
  ep.seriesId === targetSeriesId 
    ? { ...ep, userInteraction: { ...ep.userInteraction, favorited: true } }
    : ep
)
```

---

## 📊 完整示例

### 示例1：已登录用户获取剧集列表

**请求**:
```bash
GET /api/video/episodes?seriesShortId=N8Tg2KtBQPN&page=1&size=2
Authorization: Bearer YOUR_TOKEN
```

**响应**:
```json
{
  "code": 200,
  "data": {
    "seriesInfo": {
      "id": 2448,
      "shortId": "N8Tg2KtBQPN",
      "title": "恋爱潜伏",
      "description": "外科医生顾念救了毒贩K后，却深陷毒枭窝中...",
      "coverUrl": "https://static.example.com/cover.gif",
      "categoryName": "短剧",
      "totalEpisodes": 21,
      "isCompleted": true,
      "score": "8.3",
      "playCount": 304648,
      "tags": ["爱情", "悬疑", "都市"]
    },
    "userProgress": {
      "currentEpisode": 5,
      "watchProgress": 120,
      "watchPercentage": 50,
      "isCompleted": false
    },
    "list": [
      {
        "id": 12328,
        "shortId": "6JswefD4QXK",
        "episodeNumber": 1,
        "episodeTitle": "01",
        "title": "第1集",
        "duration": 300,
        "status": "published",
        "isVertical": false,
        "seriesId": 2448,
        "seriesTitle": "恋爱潜伏",
        "seriesShortId": "N8Tg2KtBQPN",
        "likeCount": 156,
        "dislikeCount": 12,
        "favoriteCount": 89,
        "watchProgress": 0,
        "watchPercentage": 0,
        "isWatched": false,
        "episodeAccessKey": "F5F06D9B7748D702...",
        "urls": [
          { "quality": "720p", "accessKey": "abc123..." },
          { "quality": "1080p", "accessKey": "def456..." }
        ],
        "userInteraction": {
          "liked": true,         // 用户点赞了第1集
          "disliked": false,
          "favorited": true      // 用户收藏了这个系列
        }
      },
      {
        "id": 12329,
        "shortId": "xyz789ABC",
        "episodeNumber": 2,
        "episodeTitle": "02",
        "title": "第2集",
        "duration": 320,
        "status": "published",
        "isVertical": false,
        "seriesId": 2448,
        "seriesTitle": "恋爱潜伏",
        "seriesShortId": "N8Tg2KtBQPN",
        "likeCount": 140,
        "dislikeCount": 8,
        "favoriteCount": 89,
        "watchProgress": 180,
        "watchPercentage": 56,
        "isWatched": false,
        "episodeAccessKey": "G6G17E8C8859E813...",
        "urls": [
          { "quality": "720p", "accessKey": "ghi789..." },
          { "quality": "1080p", "accessKey": "jkl012..." }
        ],
        "userInteraction": {
          "liked": false,
          "disliked": true,      // 用户点踩了第2集
          "favorited": true      // 同一系列，favorited相同 ⭐
        }
      }
    ],
    "total": 21,
    "page": 1,
    "size": 2,
    "hasMore": true,
    "tags": ["爱情", "悬疑", "都市"],
    "currentEpisode": "05"
  }
}
```

---

### 示例2：未登录用户获取剧集列表

**请求**:
```bash
GET /api/public/video/episodes?seriesShortId=N8Tg2KtBQPN&page=1&size=2
```

**响应**:
```json
{
  "code": 200,
  "data": {
    "seriesInfo": {
      "shortId": "N8Tg2KtBQPN",
      "title": "恋爱潜伏",
      "totalEpisodes": 21
    },
    "list": [
      {
        "shortId": "6JswefD4QXK",
        "episodeNumber": 1,
        "title": "第1集",
        "duration": 300,
        "likeCount": 156,
        "dislikeCount": 12,
        "favoriteCount": 89,
        "episodeAccessKey": "F5F06D9B...",
        "urls": [
          { "quality": "720p", "accessKey": "abc123..." }
        ]
        // ⭐ 没有 userProgress 和 userInteraction 字段
      }
    ],
    "total": 21,
    "hasMore": true
  }
}
```

---

## 💡 关键设计说明

### 用户交互功能设计

| 功能 | 针对对象 | 字段位置 | 状态范围 |
|------|---------|---------|---------|
| 点赞 | 单集 | `userInteraction.liked` | 每集独立 |
| 点踩 | 单集 | `userInteraction.disliked` | 每集独立 |
| 收藏 | **系列** ⭐ | `userInteraction.favorited` | 同系列统一 |
| 观看进度 | 系列 | `userProgress` | 系列级别 |

### 收藏功能特别说明

**为什么收藏是针对系列的？**
1. 短剧通常较短（20-100集），用户收藏是为了追完整个系列
2. 收藏列表更清晰，避免同一系列重复出现
3. 可以显示"更新X集"角标，提醒用户追剧

**前端实现要点**:
- 收藏/取消收藏后，要更新该系列所有剧集的 `favorited` 状态
- 收藏按钮文案建议使用"收藏系列"而不是"收藏剧集"
- 同一系列的所有集，收藏按钮状态应该一致

---

## 🔐 认证说明

### Token使用

**请求头格式**:
```
Authorization: Bearer <access_token>
```

**Token有效期**:
- access_token: 2小时
- refresh_token: 30天

**自动刷新**: 建议在 access_token 过期前5分钟自动刷新

---

## ⚠️ 注意事项

### 1. 认证接口

以下接口需要 JWT 认证：
- ✅ 所有用户交互接口（点赞、点踩、收藏）
- ✅ 评论发表和回复
- ✅ 观看进度保存
- ✅ 浏览历史查询
- ✅ 收藏列表查询

### 2. 公开接口

以下接口无需认证：
- ❌ 分类列表
- ❌ 首页内容
- ❌ 筛选标签
- ❌ 视频搜索
- ❌ 剧集列表（公开版本）
- ❌ 推荐列表
- ❌ 评论列表（查看）

### 3. 响应字段

**用户相关字段仅在认证时返回**:
- `userProgress`: 用户观看进度
- `userInteraction`: 用户交互状态（点赞、点踩、收藏）

**未登录用户不会获得这些字段**，前端应做好判断：
```typescript
if (episode.userInteraction) {
  // 用户已登录，显示交互状态
    } else {
  // 用户未登录，提示登录
}
```

### 4. 假评论说明 ⭐

评论列表中可能包含假评论（用于丰富内容）：

**识别假评论**：
```typescript
// 方法1: 通过 isFake 字段
if (comment.isFake === true) {
  // 这是假评论
}

// 方法2: 通过ID判断（假评论ID为负数）
if (comment.id < 0) {
  // 这是假评论
}
```

**假评论特点**：
- ❌ **不能被回复**：假评论不存储在数据库中，无法作为回复目标
- ✅ **有默认头像**：假评论随机分配5个默认头像之一
- ✅ **有昵称**：使用预设的假用户昵称
- 💡 建议：前端可以隐藏假评论的"回复"按钮

---

## 📞 技术支持

**相关文档**:
- [收藏功能详解](./favorites-api-guide.md)
- [点赞点踩功能](./episode-reactions-api-guide.md)
- [评论功能详解](./comment-reply-usage-guide.md)
- [数据库架构](./database-schema-documentation.md)

**快速开始**: 查看项目根目录的 `QUICK_START.md`

---

## 📝 更新日志

### v2.3 (2025-11-08) ⭐ 最新
- ✅ **模糊搜索支持分类筛选**（categoryId参数）⭐
- ✅ 模糊搜索支持智能验证（无效分类ID返回友好提示）

### v2.2 (2025-11-06)
- ✅ **新增热门搜索建议接口**（GET /api/search/hot-keywords）⭐
- ✅ **新增完整搜索建议接口**（GET /api/search/hot-suggestions）
- ✅ **新增用户点赞列表接口**（GET /api/user/liked）
- ✅ **新增点赞统计接口**（GET /api/user/liked/stats）
- ✅ **收藏列表支持分类筛选**（categoryId参数）
- ✅ **浏览记录支持分类筛选**（categoryId参数）
- ✅ 统一的分类验证器（动态验证，不写死）
- ✅ 无效分类ID返回友好错误提示和可用分类列表
- ✅ 三大列表接口（收藏、点赞、浏览记录）全部支持分类筛选
- ✅ 热门搜索支持随机展示，避免总是相同内容

### v2.1 (2025-11-05)
- ✅ 新增用户头像功能（photoUrl字段）
- ✅ 新增更新头像接口（POST /api/user/update-avatar）
- ✅ 用户注册时自动分配默认头像（5个随机头像）
- ✅ 评论系统支持显示用户头像和昵称
- ✅ 假评论也包含随机默认头像
- ✅ 用户信息接口返回头像和昵称

### v2.0 (2025-10-15)
- ✅ 新增用户交互功能（点赞、点踩）
- ✅ 优化收藏功能（改为系列收藏）
- ✅ 统一响应结构（userInteraction）
- ✅ 重新整理文档结构

### v1.1 (2025-09-12)
- ✅ 新增收藏管理功能
- ✅ 新增认证和账号绑定功能
- ✅ 新增推荐功能
- ✅ 优化筛选语法

---

## 🎯 快速参考

### 核心接口速查

| 功能 | 接口 | 方法 | 认证 |
|------|------|------|------|
| **热门搜索词** ⭐ | `/api/search/hot-keywords` | GET | 无需 |
| **模糊搜索** ⭐ | `/api/list/fuzzysearch` | GET | 无需 |
| 获取用户信息 | `/api/user/me` | GET | 必需 |
| 更新头像 | `/api/user/update-avatar` | POST | 必需 |
| 获取剧集列表 | `/api/video/episodes` | GET | 可选 |
| 获取播放地址 | `/api/video/url/query` | POST | 可选 |
| 点赞 | `/api/video/episode/activity` | POST | 必需 |
| 点踩 | `/api/video/episode/activity` | POST | 必需 |
| 取消点赞/点踩 | `/api/video/episode/reaction/remove` | POST | 必需 |
| 收藏系列 | `/api/video/episode/activity` | POST | 必需 |
| 取消收藏 | `/api/user/favorites/remove` | POST | 必需 |
| **获取收藏列表** | `/api/user/favorites` | GET | 必需 |
| **获取点赞列表** ⭐ | `/api/user/liked` | GET | 必需 |
| **获取浏览记录** | `/api/video/browse-history` | GET | 必需 |
| 发表评论 | `/api/video/episode/comment` | POST | 必需 |
| 获取推荐 | `/api/video/recommend` | GET | 可选 |

### 用户交互操作

**操作接口**:
```bash
# 点赞
POST /api/video/episode/activity
{ "shortId": "xxx", "type": "like" }

# 点踩
POST /api/video/episode/activity
{ "shortId": "xxx", "type": "dislike" }

# 收藏系列（通过任意一集）⭐
POST /api/video/episode/activity
{ "shortId": "xxx", "type": "favorite" }

# 取消点赞/点踩
POST /api/video/episode/reaction/remove
{ "shortId": "xxx" }

# 取消收藏
POST /api/user/favorites/remove
{ "shortId": "xxx" }
```

**查询列表**（支持分类筛选）:
```bash
# 获取收藏列表
GET /api/user/favorites                    # 所有分类
GET /api/user/favorites?categoryId=1       # 只看短剧

# 获取点赞列表 ⭐ 新增
GET /api/user/liked                        # 所有分类
GET /api/user/liked?categoryId=1           # 只看短剧

# 获取浏览记录
GET /api/video/browse-history              # 所有分类
GET /api/video/browse-history?categoryId=1 # 只看短剧

# 获取统计信息
GET /api/user/favorites/stats              # 收藏统计
GET /api/user/liked/stats                  # 点赞统计 ⭐
```

---

**文档结束**

