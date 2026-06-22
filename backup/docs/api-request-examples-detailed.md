# API接口详细请求示例文档

## 认证信息

**访问令牌 (Access Token):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3ODQ1MDc4ODQ0IiwiaWF0IjoxNzU0NDcwODQ2LCJleHAiOjE3NTUwNzU2NDZ9.kScM1EGRDMrPV4h5QePRqZM46g_O51w5on7griBEqWc
```

**API基础URL:** `http://localhost:8080`

---
## 1. Telegram登录

**接口信息:**
- **方法:** POST
- **路径:** `/user/telegram-login`
- **描述:** Telegram OAuth登录
- **状态:** ❌ (参数格式要求特殊)

**请求示例:**
```bash
curl -X POST \
  "http://localhost:8080/api/user/telegram-login" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 123456789,
    "first_name": "Test",
    "auth_date": 1640995200,
    "hash": "test_hash_value"
  }'
```

**请求参数:**
- `id` (number): Telegram用户ID，必填
- `first_name` (string): 用户名，必填
- `auth_date` (number): 认证时间戳，必填
- `hash` (string): 验证哈希，必填

**当前响应示例 (错误):**
```json
{
  "message": [
    "property telegram_id should not exist",
    "id must be a number conforming to the specified constraints",
    "first_name must be a string",
    "auth_date must be a number conforming to the specified constraints",
    "hash must be a string"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

---

## 2. 获取用户信息

**接口信息:**
- **方法:** GET
- **路径:** `/user/me`
- **描述:** 获取当前用户信息
- **状态:** ✅ (正常工作)

**请求示例:**
```bash
curl -X GET \
  "http://localhost:8080/api/user/me" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3ODQ1MDc4ODQ0IiwiaWF0IjoxNzU0NDcwODQ2LCJleHAiOjE3NTUwNzU2NDZ9.kScM1EGRDMrPV4h5QePRqZM46g_O51w5on7griBEqWc"
```

**请求参数:**
- 无参数，仅需要Bearer Token认证

**响应示例:**
```json
{
  "id": "7845078844",
  "username": "dinghe987",
  "firstName": "西",
  "lastName": "陈",
  "isActive": 1,
  "createdAt": "2025-07-30T06:32:42.000Z"
}
```

---

## 3. 获取主页参数视频

**接口信息:**
- **方法:** GET
- **路径:** `/api/home/gethomemodules`
- **描述:** 获取首页推荐视频列表
- **状态:** ✅ (正常工作)

**请求示例:**
```bash
curl -X GET \
  "http://localhost:8080/api/home/gethomemodules?channeid=1"\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3ODQ1MDc4ODQ0IiwiaWF0IjoxNzU0NDcwODQ2LCJleHAiOjE3NTUwNzU2NDZ9.kScM1EGRDMrPV4h5QePRqZM46g_O51w5on7griBEqWc"
```

**请求参数:**
{
  "channeid?": number  // 可选，频道ID，对应categories表中的id字段（数字类型，主键）
                       // 注意：不传入channeid参数时，接口会返回错误提示
}

**响应示例:**
```json
{
  "data": {
    "list": [
      {
        "type": 0,
        "name": "轮播图",
        "filters": [],
        "banners": [
          {
            "showURL": "https://img.example.com/banner/drama2.jpg",
            "title": "古装大剧《盛世王朝》",
            "id": 1002,
            "uuid": "p8aUvzGtbvE",
            "channeID": 1,
            "url": "1002"
          },
          {
            "showURL": "https://img.example.com/banner/hot.jpg",
            "title": "热门推荐专区",
            "id": 11,
            "channeID": 1,
            "url": "https://example.com/hot/recommend"
          },
          {
            "showURL": "https://img.example.com/banner/promotion1.jpg",
            "title": "新用户专享福利",
            "id": 9,
            "channeID": 1,
            "url": "https://example.com/promotion/new-user"
          },
          {
            "showURL": "https://img.example.com/banner/vip.jpg",
            "title": "VIP会员限时优惠",
            "id": 10,
            "channeID": 1,
            "url": "https://example.com/vip/discount"
          },
          {
            "showURL": "https://img.example.com/banner/drama3.jpg",
            "title": "悬疑剧《迷雾重重》",
            "id": 1003,
            "uuid": "KTQ6EGtPzVF",
            "channeID": 1,
            "url": "1003"
          }
        ],
        "list": []
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
          },
          {
            "channeID": 1,
            "name": "短剧",
            "title": "最新上传",
            "ids": "0,0,0,0,0"
          },
          {
            "channeID": 1,
            "name": "短剧",
            "title": "人气高",
            "ids": "1,0,0,0,0"
          },
          {
            "channeID": 1,
            "name": "短剧",
            "title": "评分高",
            "ids": "2,0,0,0,0"
          },
          {
            "channeID": 1,
            "name": "短剧",
            "title": "最新更新",
            "ids": "3,0,0,0,0"
          }
        ],
        "banners": [],
        "list": []
      },
      {
        "type": -1,
        "name": "广告",
        "filters": [],
        "banners": [],
        "list": []
      },
      {
        "type": 3,
        "name": "电视剧",
        "filters": [],
        "banners": [],
        "list": [
          {
            "id": 2001,
            "shortId": "fpcxnnFA6m9",
            "coverUrl": "https://example.com/covers/series2001.jpg",
            "title": "霸道总裁爱上我",
            "score": "9.2",
            "playCount": 156800,
            "url": "2001",
            "type": "电视剧",
            "isSerial": true,
            "upStatus": "全24集",
            "upCount": 24,
            "author": "张三,李四",
            "description": "一个普通女孩与霸道总裁的爱情故事，充满甜蜜与波折"
          },
          {
            "id": 2002,
            "shortId": "kaNqkt7QENy",
            "coverUrl": "https://example.com/covers/series2002.jpg",
            "title": "古装仙侠传",
            "score": "8.8",
            "playCount": 234500,
            "url": "2002",
            "type": "电视剧",
            "isSerial": true,
            "upStatus": "更新至第30集",
            "upCount": 30,
            "author": "仙女A,仙男B",
            "description": "修仙世界的爱恨情仇，仙侠传奇故事"
          },
          {
            "id": 1005,
            "shortId": "68jDaAEyHp4",
            "coverUrl": "https://example.com/cover5.jpg",
            "title": "古装电视剧",
            "score": "9.5",
            "playCount": 45600,
            "url": "1005",
            "type": "电视剧",
            "isSerial": true,
            "upStatus": "hot",
            "upCount": 4560,
            "author": "刘诗诗,胡歌",
            "description": "古代宫廷题材电视剧"
          },
          {
            "id": 1002,
            "shortId": "p8aUvzGtbvE",
            "coverUrl": "https://example.com/cover2.jpg",
            "title": "都市爱情剧",
            "score": "9.2",
            "playCount": 25600,
            "url": "1002",
            "type": "电视剧",
            "isSerial": true,
            "upStatus": "new",
            "upCount": 2560,
            "author": "赵丽颖,杨洋",
            "description": "现代都市背景的爱情故事"
          },
          {
            "id": 1001,
            "shortId": "jTX5ctteb9h",
            "coverUrl": "https://example.com/cover1.jpg",
            "title": "测试剧集系列",
            "score": "8.5",
            "playCount": 12580,
            "url": "1001",
            "type": "电视剧",
            "isSerial": true,
            "upStatus": "hot",
            "upCount": 1250,
            "author": "张三,李四,王五",
            "description": "这是一个用于测试的剧集系列，包含多个精彩剧集"
          }
        ]
      }
    ]
  },
  "code": 200,
  "msg": null
}
```

---



## 4. 获取筛选标签

**接口信息:**
- **方法:** GET
- **路径:** `/api/home/getfilterstags`
- **描述:** 获取首页筛选器标签
- **状态:** ✅ (正常工作)

**请求示例:**
```bash
curl -X GET \
  "http://localhost:8080/api/home/getfilterstags" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3ODQ1MDc4ODQ0IiwiaWF0IjoxNzU0NDcwODQ2LCJleHAiOjE3NTUwNzU2NDZ9.kScM1EGRDMrPV4h5QePRqZM46g_O51w5on7griBEqWc"
```

**请求参数:**


**响应示例:**
```json
{
  "data": [
    {
      "name": "排序",
      "list": [
        {
          "index": 0,
          "classifyId": 0,
          "classifyName": "全部",
          "isDefaultSelect": true
        },
        {
          "index": 1,
          "classifyId": 1,
          "classifyName": "最新",
          "isDefaultSelect": false
        },
        {
          "index": 2,
          "classifyId": 2,
          "classifyName": "最热",
          "isDefaultSelect": false
        },
        {
          "index": 3,
          "classifyId": 3,
          "classifyName": "评分",
          "isDefaultSelect": false
        }
      ]
    },
    {
      "name": "类型",
      "list": [
        {
          "index": 0,
          "classifyId": 0,
          "classifyName": "全部",
          "isDefaultSelect": true
        },
        {
          "index": 1,
          "classifyId": 4,
          "classifyName": "电视剧",
          "isDefaultSelect": false
        },
        {
          "index": 2,
          "classifyId": 5,
          "classifyName": "电影",
          "isDefaultSelect": false
        },
        {
          "index": 3,
          "classifyId": 6,
          "classifyName": "综艺",
          "isDefaultSelect": false
        },
        {
          "index": 4,
          "classifyId": 7,
          "classifyName": "动漫",
          "isDefaultSelect": false
        }
      ]
    },
    {
      "name": "地区",
      "list": [
        {
          "index": 0,
          "classifyId": 0,
          "classifyName": "全部",
          "isDefaultSelect": true
        },
        {
          "index": 1,
          "classifyId": 8,
          "classifyName": "中国大陆",
          "isDefaultSelect": false
        },
        {
          "index": 2,
          "classifyId": 9,
          "classifyName": "香港",
          "isDefaultSelect": false
        },
        {
          "index": 3,
          "classifyId": 10,
          "classifyName": "台湾",
          "isDefaultSelect": false
        },
        {
          "index": 4,
          "classifyId": 11,
          "classifyName": "日本",
          "isDefaultSelect": false
        },
        {
          "index": 5,
          "classifyId": 12,
          "classifyName": "韩国",
          "isDefaultSelect": false
        },
        {
          "index": 6,
          "classifyId": 13,
          "classifyName": "美国",
          "isDefaultSelect": false
        },
        {
          "index": 7,
          "classifyId": 14,
          "classifyName": "英国",
          "isDefaultSelect": false
        },
        {
          "index": 8,
          "classifyId": 15,
          "classifyName": "法国",
          "isDefaultSelect": false
        },
        {
          "index": 9,
          "classifyId": 16,
          "classifyName": "德国",
          "isDefaultSelect": false
        },
        {
          "index": 10,
          "classifyId": 17,
          "classifyName": "其他",
          "isDefaultSelect": false
        }
      ]
    },
    {
      "name": "语言",
      "list": [
        {
          "index": 0,
          "classifyId": 0,
          "classifyName": "全部",
          "isDefaultSelect": true
        },
        {
          "index": 1,
          "classifyId": 18,
          "classifyName": "中文",
          "isDefaultSelect": false
        },
        {
          "index": 2,
          "classifyId": 19,
          "classifyName": "韩语",
          "isDefaultSelect": false
        }
      ]
    },
    {
      "name": "年份",
      "list": [
        {
          "index": 0,
          "classifyId": 0,
          "classifyName": "全部",
          "isDefaultSelect": true
        },
        {
          "index": 1,
          "classifyId": 20,
          "classifyName": "全部年份",
          "isDefaultSelect": false
        },
        {
          "index": 2,
          "classifyId": 21,
          "classifyName": "2025年",
          "isDefaultSelect": false
        },
        {
          "index": 3,
          "classifyId": 22,
          "classifyName": "去年",
          "isDefaultSelect": false
        },
        {
          "index": 4,
          "classifyId": 23,
          "classifyName": "前年",
          "isDefaultSelect": false
        },
        {
          "index": 5,
          "classifyId": 24,
          "classifyName": "更早",
          "isDefaultSelect": false
        },
        {
          "index": 6,
          "classifyId": 25,
          "classifyName": "90年代",
          "isDefaultSelect": false
        }
      ]
    },
    {
      "name": "状态",
      "list": [
        {
          "index": 0,
          "classifyId": 0,
          "classifyName": "全部",
          "isDefaultSelect": true
        },
        {
          "index": 1,
          "classifyId": 26,
          "classifyName": "全部状态",
          "isDefaultSelect": false
        },
        {
          "index": 2,
          "classifyId": 27,
          "classifyName": "全集",
          "isDefaultSelect": false
        },
        {
          "index": 3,
          "classifyId": 28,
          "classifyName": "连载中",
          "isDefaultSelect": false
        }
      ]
    }
  ],
  "code": 200,
  "msg": null
}
```

---


## 5. 根据标签（ids）筛选数据

**接口信息:**
- **方法:** GET
- **路径:** `/api/list/getconditionfilterdata`
- **描述:** 根据复杂条件筛选剧集（series）数据，返回符合筛选条件的剧集列表
- **状态:** ✅ (正常工作)

**请求示例:**
```bash
curl -X GET \
  "http://localhost:8080/api/list/getconditionfilterdata?titleid=drama&ids=0,0,0,0,0,0&page=1&size=21" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3ODQ1MDc4ODQ0IiwiaWF0IjoxNzU0NDcwODQ2LCJleHAiOjE3NTUwNzU2NDZ9.kScM1EGRDMrPV4h5QePRqZM46g_O51w5on7griBEqWc"
```

**请求参数:**
- `titleid` (string): 分类标识，可选值：'drama'(短剧), 'movie'(电影), 'variety'(综艺)
- `ids` (string): 筛选条件ID组合，格式："sortType,categoryId,regionId,languageId,yearId,statusId"，默认"0,0,0,0,0"
- `page` (number): 页码，默认1
- `size` (number): 每页大小，默认21
- `System` (string): 系统类型，如'h5'，可选
- `AppVersion` (string): 应用版本，可选
- `SystemVersion` (string): 系统版本，可选
- `version` (string): 版本号，可选
- `DeviceId` (string): 设备ID，可选
- `i18n` (number): 国际化标识，可选
- `pub` (string): 发布标识，可选
- `vv` (string): 版本验证，可选

**响应示例:**
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 2001,
        "shortId": "fpcxnnFA6m9",
        "coverUrl": "https://example.com/covers/series2001.jpg",
        "title": "霸道总裁爱上我",
        "description": "一个普通女孩与霸道总裁的爱情故事，充满甜蜜与波折",
        "score": "9.2",
        "playCount": 156800,
        "totalEpisodes": 24,
        "isSerial": true,
        "upStatus": "全24集",
        "upCount": 24,
        "status": "completed",
        "starring": "张三,李四",
        "actor": "张三,李四,王五,赵六",
        "director": "导演A",
        "region": "",
        "language": "",
        "isCompleted": false,
        "cidMapper": "1",
        "categoryName": "电视剧",
        "isRecommend": false,
        "duration": "未知",
        "createdAt": "2025-08-05T23:55:00.000Z",
        "updateTime": "2025-08-09T06:54:54.370Z",
        "episodeCount": 24,
        "tags": []
      },
      {
        "id": 2002,
        "shortId": "kaNqkt7QENy",
        "coverUrl": "https://example.com/covers/series2002.jpg",
        "title": "古装仙侠传",
        "description": "修仙世界的爱恨情仇，仙侠传奇故事",
        "score": "8.8",
        "playCount": 234500,
        "totalEpisodes": 36,
        "isSerial": true,
        "upStatus": "更新至第30集",
        "upCount": 30,
        "status": "on-going",
        "starring": "仙女A,仙男B",
        "actor": "仙女A,仙男B,配角C,配角D",
        "director": "导演B",
        "region": "",
        "language": "",
        "isCompleted": false,
        "cidMapper": "1",
        "categoryName": "电视剧",
        "isRecommend": false,
        "duration": "未知",
        "createdAt": "2025-08-05T23:55:00.000Z",
        "updateTime": "2025-08-09T06:54:54.370Z",
        "episodeCount": 30,
        "tags": []
      },
      {
        "id": 1005,
        "shortId": "68jDaAEyHp4",
        "coverUrl": "https://example.com/cover5.jpg",
        "title": "古装电视剧",
        "description": "古代宫廷题材电视剧",
        "score": "9.5",
        "playCount": 45600,
        "totalEpisodes": 45,
        "isSerial": false,
        "upStatus": "hot",
        "upCount": 4560,
        "status": "completed",
        "starring": "刘诗诗,胡歌",
        "actor": "刘诗诗,胡歌,袁弘,林更新",
        "director": "古装剧导演D",
        "region": "中国大陆",
        "language": "中文",
        "releaseDate": "2023-12-15T00:00:00.000Z",
        "isCompleted": true,
        "cidMapper": "1",
        "categoryName": "电视剧",
        "isRecommend": false,
        "duration": "未知",
        "createdAt": "2025-08-05T23:39:01.639Z",
        "updateTime": "2025-08-09T06:54:54.370Z",
        "episodeCount": 0,
        "tags": []
      },
      {
        "id": 1002,
        "shortId": "p8aUvzGtbvE",
        "coverUrl": "https://example.com/cover2.jpg",
        "title": "都市爱情剧",
        "description": "现代都市背景的爱情故事",
        "score": "9.2",
        "playCount": 25600,
        "totalEpisodes": 20,
        "isSerial": false,
        "upStatus": "new",
        "upCount": 2560,
        "status": "ongoing",
        "starring": "赵丽颖,杨洋",
        "actor": "赵丽颖,杨洋,王子文,李现",
        "director": "著名导演A",
        "region": "中国大陆",
        "language": "中文",
        "releaseDate": "2024-02-01T00:00:00.000Z",
        "isCompleted": false,
        "cidMapper": "1",
        "categoryName": "电视剧",
        "isRecommend": false,
        "duration": "未知",
        "createdAt": "2025-08-05T23:39:01.615Z",
        "updateTime": "2025-08-09T06:54:54.370Z",
        "episodeCount": 0,
        "tags": []
      },
      {
        "id": 1001,
        "shortId": "jTX5ctteb9h",
        "coverUrl": "https://example.com/cover1.jpg",
        "title": "测试剧集系列",
        "description": "这是一个用于测试的剧集系列，包含多个精彩剧集",
        "score": "8.5",
        "playCount": 12580,
        "totalEpisodes": 10,
        "isSerial": true,
        "upStatus": "hot",
        "upCount": 1250,
        "status": "completed",
        "starring": "张三,李四,王五",
        "actor": "张三,李四,王五,赵六",
        "director": "知名导演",
        "region": "中国大陆",
        "language": "中文",
        "releaseDate": "2024-01-15T00:00:00.000Z",
        "isCompleted": true,
        "cidMapper": "1",
        "categoryName": "电视剧",
        "isRecommend": false,
        "duration": "未知",
        "createdAt": "2024-01-15T02:00:00.000Z",
        "updateTime": "2025-08-05T23:09:03.000Z",
        "episodeCount": 3,
        "tags": []
      }
    ],
    "total": 5,
    "page": 1,
    "size": 21,
    "hasMore": false
  },
  "msg": null
}
```

---

## 6. 获取剧集列表（不含播放链接）

**接口信息:**
- **方法:** GET
- **路径:** `/api/video/episodes`
- **描述:** 获取剧集列表信息，包含剧集基本信息但不包含播放链接（episode_urls）
- **状态:** ✅ (新增接口)

**请求示例:**
```bash
# 获取指定剧集的所有集数（通过shortId）
curl -X GET \
  "http://localhost:8080/api/video/episodes?seriesShortId=jTX5ctteb9h&page=1&size=20" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3ODQ1MDc4ODQ0IiwiaWF0IjoxNzU0NDcwODQ2LCJleHAiOjE3NTUwNzU2NDZ9.kScM1EGRDMrPV4h5QePRqZM46g_O51w5on7griBEqWc"

# 获取指定剧集的所有集数（通过ID）
curl -X GET \
  "http://localhost:8080/api/video/episodes?seriesId=1&page=1&size=20" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3ODQ1MDc4ODQ0IiwiaWF0IjoxNzU0NDcwODQ2LCJleHAiOjE3NTUwNzU2NDZ9.kScM1EGRDMrPV4h5QePRqZM46g_O51w5on7griBEqWc"

# 获取所有剧集列表
curl -X GET \
  "http://localhost:8080/api/video/episodes?page=1&size=20" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3ODQ1MDc4ODQ0IiwiaWF0IjoxNzU0NDcwODQ2LCJleHAiOjE3NTUwNzU2NDZ9.kScM1EGRDMrPV4h5QePRqZM46g_O51w5on7griBEqWc"
```

**请求参数:**
- `seriesUuid` (可选): 剧集seriesUuid
- `seriesId` (可选): 剧集ID（向后兼容）
- `page` (可选): 页码，默认为1
- `size` (可选): 每页数量，默认为20

**响应示例:**
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 2001,
        "shortId": "J7YUMwhxXsA",
        "episodeNumber": 1,
        "title": "第一集：开端",
        "duration": 2400,
        "status": "published",
        "createdAt": "2024-01-15T02:30:00.000Z",
        "updatedAt": "2025-08-08T22:33:37.000Z",
        "seriesId": 1001,
        "seriesTitle": "测试剧集系列",
        "seriesShortId": "jTX5ctteb9h"
      },
      {
        "id": 2002,
        "shortId": "AjSEuEQrKBQ",
        "episodeNumber": 2,
        "title": "第二集：发展",
        "duration": 2350,
        "status": "published",
        "createdAt": "2024-01-16T02:30:00.000Z",
        "updatedAt": "2025-08-08T22:33:37.000Z",
        "seriesId": 1001,
        "seriesTitle": "测试剧集系列",
        "seriesShortId": "jTX5ctteb9h"
      },
      {
        "id": 2003,
        "shortId": "9mGrm9fWWSt",
        "episodeNumber": 3,
        "title": "第三集：高潮",
        "duration": 2480,
        "status": "published",
        "createdAt": "2024-01-17T02:30:00.000Z",
        "updatedAt": "2025-08-08T22:33:37.000Z",
        "seriesId": 1001,
        "seriesTitle": "测试剧集系列",
        "seriesShortId": "jTX5ctteb9h"
      }
    ],
    "total": 3,
    "page": 1,
    "size": 20,
    "hasMore": false
  },
  "msg": null
}

```
---

## 7. 获取剧集详细信息

**接口信息:**
- **方法:** GET
- **路径:** `/api/video/details`
- **描述:** 通过shortId或ID获取视频详细信息，包含所有剧集的详细数据
- **状态:** ✅ (正常工作)

**请求示例:**
```bash
curl -X GET \
  "http://localhost:8080/api/video/details?shortId=kaNqkt7QENy" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3ODQ1MDc4ODQ0IiwiaWF0IjoxNzU0NDcwODQ2LCJleHAiOjE3NTUwNzU2NDZ9.kScM1EGRDMrPV4h5QePRqZM46g_O51w5on7griBEqWc"
```

**请求参数:**
- `shortId` (string): 视频shortId标识符（推荐使用，防枚举攻击）
- `id` (string): 视频ID（向后兼容）
- 注意：必须提供shortId或id参数中的一个

**响应示例:**
```json
{
  "code": 200,
  "data": {
    "detailInfo": {
      "starring": "仙女A,仙男B",
      "id": 2002,
      "channeName": "电视剧",
      "channeID": 1,
      "title": "古装仙侠传",
      "coverUrl": "https://example.com/covers/series2002.jpg",
      "mediaUrl": "",
      "fileName": "series-2002",
      "mediaId": "2002_0,1,4,146",
      "postTime": "2025-08-05T23:55:00.000Z",
      "contentType": "电视剧",
      "actor": "仙女A,仙男B,配角C,配角D",
      "shareCount": 0,
      "director": "导演B",
      "description": "修仙世界的爱恨情仇，仙侠传奇故事",
      "comments": 0,
      "updateStatus": "更新至第30集",
      "watch_progress": 0,
      "playCount": 234500,
      "isHot": true,
      "isVip": false,
      "episodes": [
        {
          "channeID": 1,
          "episodeId": "VkmGQB5efpt",
          "title": "第1集：初入仙门",
          "resolutionDes": "576P",
          "resolution": "576",
          "isVip": false,
          "isLast": false,
          "episodeTitle": "01",
          "opSecond": 37,
          "epSecond": 2446,
          "urls": [
            {
              "quality": "720p",
              "accessKey": "DosFGFPcJGR0dikmF7GtV2SgDsA1y9ed"
            },
            {
              "quality": "1080p",
              "accessKey": "os2mgtxrRxP76h53rdu2CwspCi82PS3H"
            },
            {
              "quality": "4K",
              "accessKey": "R0At9692x5h7qwX2tVfFEK8Zt4EC36BS"
            }
          ]
        },
        {
          "channeID": 1,
          "episodeId": "CGfQrYnXagJ",
          "title": "第2集：修炼之路",
          "resolutionDes": "576P",
          "resolution": "576",
          "isVip": false,
          "isLast": false,
          "episodeTitle": "02",
          "opSecond": 37,
          "epSecond": 2529,
          "urls": [
            {
              "quality": "720p",
              "accessKey": "tYZ9W000I1diIuL9G29mhhdAtmQwxGWe"
            },
            {
              "quality": "1080p",
              "accessKey": "A2rpejM6hwnJF4gU6ylwSo17eZd6KOT4"
            },
            {
              "quality": "4K",
              "accessKey": "9RAwEhM91w1K7HYdEwwEn9NvkHETGM6L"
            }
          ]
        },
        {
          "channeID": 1,
          "episodeId": "G9bM9G6cj7G",
          "title": "第3集：师父传艺",
          "resolutionDes": "576P",
          "resolution": "576",
          "isVip": false,
          "isLast": false,
          "episodeTitle": "03",
          "opSecond": 37,
          "epSecond": 2963,
          "urls": [
            {
              "quality": "720p",
              "accessKey": "NFutBpP6rUoBHN3fDg1e5ejXvP1HpGye"
            },
            {
              "quality": "1080p",
              "accessKey": "RZIztcIT5UX7JHDlguYYK6HFHiFmuDTG"
            },
            {
              "quality": "4K",
              "accessKey": "8aiUMBMDTuAKZYScQdfEKKuN931rB7f6"
            }
          ]
        },
        {
          "channeID": 1,
          "episodeId": "BS2UGvjmQaR",
          "title": "第4集：同门切磋",
          "resolutionDes": "576P",
          "resolution": "576",
          "isVip": false,
          "isLast": false,
          "episodeTitle": "04",
          "opSecond": 37,
          "epSecond": 2439,
          "urls": [
            {
              "quality": "720p",
              "accessKey": "8AnA4Z2grlhsTgB4JPtP1a9RPKDKAuch"
            },
            {
              "quality": "1080p",
              "accessKey": "YgSlXlAqlbfaphfLXFLd64VNmYHfe8Wi"
            },
            {
              "quality": "4K",
              "accessKey": "g0FkgEhYTVm5vr0gAIE6n8KW38KYvxyj"
            }
          ]
        },
        {
          "channeID": 1,
          "episodeId": "VVNrgRFymqP",
          "title": "第5集：历练试炼",
          "resolutionDes": "576P",
          "resolution": "576",
          "isVip": false,
          "isLast": false,
          "episodeTitle": "05",
          "opSecond": 37,
          "epSecond": 2864,
          "urls": [
            {
              "quality": "720p",
              "accessKey": "1dLPz8cFw2nFiCrFndYzYvmwvGZjPmQA"
            },
            {
              "quality": "1080p",
              "accessKey": "uIowu8dgAAGv9XleEWAhcnhqnCpptciL"
            },
            {
              "quality": "4K",
              "accessKey": "HDeAYLvVqu7bP6tlho8tGDLlTMZQr9Pi"
            }
          ]
        },
        {
          "channeID": 1,
          "episodeId": "M6n4pbWKfZx",
          "title": "第6集：邂逅红颜",
          "resolutionDes": "576P",
          "resolution": "576",
          "isVip": false,
          "isLast": false,
          "episodeTitle": "06",
          "opSecond": 37,
          "epSecond": 2460,
          "urls": [
            {
              "quality": "720p",
              "accessKey": "vsftIFguJJDB8prnuzzTJdsd9VQ732z5"
            },
            {
              "quality": "1080p",
              "accessKey": "jRCctgS1Xe7hwfwoa9t7tHZ73n3XhvUf"
            },
            {
              "quality": "4K",
              "accessKey": "WlRMxPQ6eC1QeTE22TGwVYSG4iZW6nWP"
            }
          ]
        },
        {
          "channeID": 1,
          "episodeId": "J3zJAq2XPA2",
          "title": "第7集：魔族入侵",
          "resolutionDes": "576P",
          "resolution": "576",
          "isVip": false,
          "isLast": false,
          "episodeTitle": "07",
          "opSecond": 37,
          "epSecond": 2541,
          "urls": [
            {
              "quality": "720p",
              "accessKey": "nJdReIOHMkXeUHG8hUp3nw5ZZraOdDui"
            },
            {
              "quality": "1080p",
              "accessKey": "vGnukHvJ6uxyfsxCdwlniazHnjRCJ2C8"
            },
            {
              "quality": "4K",
              "accessKey": "yzphMkqejgLWl8Th9S6KGpKwB0WYfEcK"
            }
          ]
        },
        {
          "channeID": 1,
          "episodeId": "4fqAXg79qf6",
          "title": "第8集：生死考验",
          "resolutionDes": "576P",
          "resolution": "576",
          "isVip": false,
          "isLast": false,
          "episodeTitle": "08",
          "opSecond": 37,
          "epSecond": 2819,
          "urls": [
            {
              "quality": "720p",
              "accessKey": "n8Xt8xL1M2HSZZL6yo0ZUpXDcVrdRJSy"
            },
            {
              "quality": "1080p",
              "accessKey": "Xx1WEWlWRtC75sIJRemZHu5S52fJnsex"
            },
            {
              "quality": "4K",
              "accessKey": "iXRdNy2zNJWBcAEy5CMx9zgBGEPFBT18"
            }
          ]
        },
        {
          "channeID": 1,
          "episodeId": "fdcbwwYv83h",
          "title": "第9集：突破瓶颈",
          "resolutionDes": "576P",
          "resolution": "576",
          "isVip": false,
          "isLast": false,
          "episodeTitle": "09",
          "opSecond": 37,
          "epSecond": 2866,
          "urls": [
            {
              "quality": "720p",
              "accessKey": "w351M4JPdCIepdviPw1whH3YPeFFJchP"
            },
            {
              "quality": "1080p",
              "accessKey": "bJr7sblsOFlDWywLejbshoBJ1Wm8nfoa"
            },
            {
              "quality": "4K",
              "accessKey": "3mSbCJTwpanTfq6OEsKO5VKzHz6umcCE"
            }
          ]
        },
        {
          "channeID": 1,
          "episodeId": "FZHYmDcSuQ8",
          "title": "第10集：仙界大战",
          "resolutionDes": "576P",
          "resolution": "576",
          "isVip": false,
          "isLast": false,
          "episodeTitle": "10",
          "opSecond": 37,
          "epSecond": 2702,
          "urls": [
            {
              "quality": "720p",
              "accessKey": "tNjcfp1ddfLbMvh7hPlNmzPiC8VWCXlx"
            },
            {
              "quality": "1080p",
              "accessKey": "esiHKWrf77f7UVZtaVkOyCxV6x4tsWYc"
            },
            {
              "quality": "4K",
              "accessKey": "YF2RvyqEZC4JpbycwgBYEfyChszYJ2F7"
            }
          ]
        },
        {
          "channeID": 1,
          "episodeId": "NjYnKUvpcUb",
          "title": "第11集：情深义重",
          "resolutionDes": "576P",
          "resolution": "576",
          "isVip": false,
          "isLast": false,
          "episodeTitle": "11",
          "opSecond": 37,
          "epSecond": 2753,
          "urls": [
            {
              "quality": "720p",
              "accessKey": "d76rsjzwoqCdWYFIRFPpPzFr1Wgu1HP0"
            },
            {
              "quality": "1080p",
              "accessKey": "K4O07Gf7eR95cIlyEuJYHzkIVxdLXg5K"
            },
            {
              "quality": "4K",
              "accessKey": "mRKxedksPtLWz5drvNeejQf39y1VzYzg"
            }
          ]
        },
        {
          "channeID": 1,
          "episodeId": "3vaEjrpx6k4",
          "title": "第12集：背叛与原谅",
          "resolutionDes": "576P",
          "resolution": "576",
          "isVip": false,
          "isLast": false,
          "episodeTitle": "12",
          "opSecond": 37,
          "epSecond": 2667,
          "urls": [
            {
              "quality": "720p",
              "accessKey": "INFtIjHbXLHULDnKII6kgjWz9oE9R9tr"
            },
            {
              "quality": "1080p",
              "accessKey": "3KPCUfivzyo66LH2x3fJvlHhZSeGUsVo"
            },
            {
              "quality": "4K",
              "accessKey": "NycBs8me8lS3Gyz8ICC0C8R3qMHai27Q"
            }
          ]
        },
        {
          "channeID": 1,
          "episodeId": "V6ZYsn5UcRT",
          "title": "第13集：天劫降临",
          "resolutionDes": "576P",
          "resolution": "576",
          "isVip": false,
          "isLast": false,
          "episodeTitle": "13",
          "opSecond": 37,
          "epSecond": 2958,
          "urls": [
            {
              "quality": "720p",
              "accessKey": "1mKPVR44ElACLueAob1OTR3SG2t4z1iD"
            },
            {
              "quality": "1080p",
              "accessKey": "oo3poFlzUXGX7uZ1KPTzwe4hjQ1FsVDE"
            },
            {
              "quality": "4K",
              "accessKey": "p07xWFO9ZZmOi1K4JY2cfqOVzwcgMPB6"
            }
          ]
        },
        {
          "channeID": 1,
          "episodeId": "ZPPaaaQN2RP",
          "title": "第14集：涅槃重生",
          "resolutionDes": "576P",
          "resolution": "576",
          "isVip": false,
          "isLast": false,
          "episodeTitle": "14",
          "opSecond": 37,
          "epSecond": 2631,
          "urls": [
            {
              "quality": "720p",
              "accessKey": "z9fHxzTm5lwlXHw3PyttdzLocDsygvvV"
            },
            {
              "quality": "1080p",
              "accessKey": "K8clPPMfjyYl2td9v1jV3bbvGh8V4j98"
            },
            {
              "quality": "4K",
              "accessKey": "mR4Lv7L1PEBF7mBCsYI22O1qteu3Mv81"
            }
          ]
        },
        {
          "channeID": 1,
          "episodeId": "JaRpG6xgNuh",
          "title": "第15集：仙魔恋情",
          "resolutionDes": "576P",
          "resolution": "576",
          "isVip": false,
          "isLast": false,
          "episodeTitle": "15",
          "opSecond": 37,
          "epSecond": 2863,
          "urls": [
            {
              "quality": "720p",
              "accessKey": "bTJh1Wt9TxigqPbgCD60a1LkmLyoZHtx"
            },
            {
              "quality": "1080p",
              "accessKey": "9GiM6I76JQHnyI2fGwrQ1u5lfzk1ADTf"
            },
            {
              "quality": "4K",
              "accessKey": "oClhhMepAamt0sjq6DhkzacH9HbDSTqs"
            }
          ]
        },
        {
          "channeID": 1,
          "episodeId": "eFMkvqT4TbZ",
          "title": "第16集：宗门危机",
          "resolutionDes": "576P",
          "resolution": "576",
          "isVip": false,
          "isLast": false,
          "episodeTitle": "16",
          "opSecond": 37,
          "epSecond": 2594,
          "urls": [
            {
              "quality": "720p",
              "accessKey": "FbAV3cIs9wKkSFoIhXZYT4GRJO4Ne4gv"
            },
            {
              "quality": "1080p",
              "accessKey": "Dycl1GOSux7IXDEnrJ7a7KWUQ4DTEHa2"
            },
            {
              "quality": "4K",
              "accessKey": "qX2SHRM5ZEAVWpPXShf6tniJNsqETjhE"
            }
          ]
        },
        {
          "channeID": 1,
          "episodeId": "qEgtTMtAzN3",
          "title": "第17集：英雄救美",
          "resolutionDes": "576P",
          "resolution": "576",
          "isVip": false,
          "isLast": false,
          "episodeTitle": "17",
          "opSecond": 37,
          "epSecond": 2644,
          "urls": [
            {
              "quality": "720p",
              "accessKey": "Fp8Thu0AMPRRw6o2nDmaQH9nX4v0Ldo8"
            },
            {
              "quality": "1080p",
              "accessKey": "EAPmnxTFBPTPmkI9HQFrOqDwg60anN7u"
            },
            {
              "quality": "4K",
              "accessKey": "iGvPauMEwNeJV79wSjuPx5lTflGzRWtT"
            }
          ]
        },
        {
          "channeID": 1,
          "episodeId": "ZzmmbpR5wA9",
          "title": "第18集：修为大进",
          "resolutionDes": "576P",
          "resolution": "576",
          "isVip": false,
          "isLast": false,
          "episodeTitle": "18",
          "opSecond": 37,
          "epSecond": 2469,
          "urls": [
            {
              "quality": "720p",
              "accessKey": "yYR3lUuexx9OPbBXztS0Y5AoVG01g7zq"
            },
            {
              "quality": "1080p",
              "accessKey": "WDCxkcrGpmjoaRCercYqDd7DEDLET1ue"
            },
            {
              "quality": "4K",
              "accessKey": "ax775yQoTv1gEfwzsbvfXVqCAv5xZaN0"
            }
          ]
        },
        {
          "channeID": 1,
          "episodeId": "Ck7raxdsY52",
          "title": "第19集：仙界震动",
          "resolutionDes": "576P",
          "resolution": "576",
          "isVip": false,
          "isLast": false,
          "episodeTitle": "19",
          "opSecond": 37,
          "epSecond": 2878,
          "urls": [
            {
              "quality": "720p",
              "accessKey": "ZWRGWNcSil8mQlL2l3M35jVIsoJK7swy"
            },
            {
              "quality": "1080p",
              "accessKey": "4fkpCVowLG8ryuKkyCBxbQ01aHaMKIyP"
            },
            {
              "quality": "4K",
              "accessKey": "9HC5RXYgHYUiHwacKnPhWNYiMY34xpCe"
            }
          ]
        },
        {
          "channeID": 1,
          "episodeId": "MfgUhA6kaz3",
          "title": "第20集：爱恨纠葛",
          "resolutionDes": "576P",
          "resolution": "576",
          "isVip": false,
          "isLast": false,
          "episodeTitle": "20",
          "opSecond": 37,
          "epSecond": 2743,
          "urls": [
            {
              "quality": "720p",
              "accessKey": "3rGw8Exf2AwRSF6iYTK8zvIIWNfpBOmB"
            },
            {
              "quality": "1080p",
              "accessKey": "b4XhMnPX9pP5kHPSdm38P3PrV1vf7e4t"
            },
            {
              "quality": "4K",
              "accessKey": "DwmYQB0JW900KNhA5Sodttu0LB2eE19x"
            }
          ]
        },
        {
          "channeID": 1,
          "episodeId": "QFgdhYdzwAT",
          "title": "第21集：最终决战",
          "resolutionDes": "576P",
          "resolution": "576",
          "isVip": false,
          "isLast": false,
          "episodeTitle": "21",
          "opSecond": 37,
          "epSecond": 2829,
          "urls": [
            {
              "quality": "720p",
              "accessKey": "2y7vwBxtwoB4PmQxCVc0oDxa3yA64xRk"
            },
            {
              "quality": "1080p",
              "accessKey": "SmkyBacNJd9WqHpapvCGaQFtXz5mxnQc"
            },
            {
              "quality": "4K",
              "accessKey": "gPMgPBu3mlv65d01YFmvdmFOHtPbbzhH"
            }
          ]
        },
        {
          "channeID": 1,
          "episodeId": "FynCjPfRGbJ",
          "title": "第22集：牺牲与拯救",
          "resolutionDes": "576P",
          "resolution": "576",
          "isVip": false,
          "isLast": false,
          "episodeTitle": "22",
          "opSecond": 37,
          "epSecond": 2700,
          "urls": [
            {
              "quality": "720p",
              "accessKey": "FWTxPuddf0NaNK8Kc0jUA70XX9ySrNhb"
            },
            {
              "quality": "1080p",
              "accessKey": "QkXLnFQKuzfeytcfdT8DTPumnjM63cXj"
            },
            {
              "quality": "4K",
              "accessKey": "iV2EDwB0WZcMpxYNlA1LBgQU4IPXG3zN"
            }
          ]
        },
        {
          "channeID": 1,
          "episodeId": "dBDmfntUR5P",
          "title": "第23集：仙界和平",
          "resolutionDes": "576P",
          "resolution": "576",
          "isVip": false,
          "isLast": false,
          "episodeTitle": "23",
          "opSecond": 37,
          "epSecond": 2578,
          "urls": [
            {
              "quality": "720p",
              "accessKey": "czcA0R1gyOlfDOlugheooT7STgaH5RQm"
            },
            {
              "quality": "1080p",
              "accessKey": "yKUDrDyUT0fY5LMVLcjkU5DkAbYxG8e7"
            },
            {
              "quality": "4K",
              "accessKey": "e2dAPouSDQNqpL9xHadd9yV8TIRbyn4b"
            }
          ]
        },
        {
          "channeID": 1,
          "episodeId": "MPMdG4syCB3",
          "title": "第24集：情定三生",
          "resolutionDes": "576P",
          "resolution": "576",
          "isVip": false,
          "isLast": false,
          "episodeTitle": "24",
          "opSecond": 37,
          "epSecond": 2442,
          "urls": [
            {
              "quality": "720p",
              "accessKey": "mn8P1IlALrK2U9Bj3YQIWNxPkjjS3lf4"
            },
            {
              "quality": "1080p",
              "accessKey": "2kNyCcjs9vtJOn3RNFL5TAHoxsCwt8wE"
            },
            {
              "quality": "4K",
              "accessKey": "acjlIXuW3YSm5xucVTmwZAx6WhAhHXEy"
            }
          ]
        },
        {
          "channeID": 1,
          "episodeId": "ShQYg82vcYf",
          "title": "第25集：飞升成仙",
          "resolutionDes": "576P",
          "resolution": "576",
          "isVip": false,
          "isLast": false,
          "episodeTitle": "25",
          "opSecond": 37,
          "epSecond": 2579,
          "urls": [
            {
              "quality": "720p",
              "accessKey": "nCaVKCu7wUfUixu3AWSVjt1kLHFVl3aV"
            },
            {
              "quality": "1080p",
              "accessKey": "oOeMrXUPM8ysKJn9afrjTzJprdjhUzVe"
            },
            {
              "quality": "4K",
              "accessKey": "Ft27sZDSiDxHcRkV2OnwgbrCaOXi7XJd"
            }
          ]
        },
        {
          "channeID": 1,
          "episodeId": "RjyjxJ9kZun",
          "title": "第26集：新的开始",
          "resolutionDes": "576P",
          "resolution": "576",
          "isVip": false,
          "isLast": false,
          "episodeTitle": "26",
          "opSecond": 37,
          "epSecond": 2584,
          "urls": [
            {
              "quality": "720p",
              "accessKey": "Zy7vcLMHWDtxbQirRFQ4X9H4LUuXT0nJ"
            },
            {
              "quality": "1080p",
              "accessKey": "exd5maXi6qbqYGuM0VeNCob749ijLAYf"
            },
            {
              "quality": "4K",
              "accessKey": "iQ1YoGSqfbbfJHdFumcTQAca2AJI44kM"
            }
          ]
        },
        {
          "channeID": 1,
          "episodeId": "5X3Y7DARKQa",
          "title": "第27集：仙界新秩序",
          "resolutionDes": "576P",
          "resolution": "576",
          "isVip": false,
          "isLast": false,
          "episodeTitle": "27",
          "opSecond": 37,
          "epSecond": 2671,
          "urls": [
            {
              "quality": "720p",
              "accessKey": "wWpFvbD3cZsv72VKcIBd3AromFyc0ZgO"
            },
            {
              "quality": "1080p",
              "accessKey": "HwbS63yIDDDJKMg22j4ezJla0hDqebdm"
            },
            {
              "quality": "4K",
              "accessKey": "hY4hSycpxNkbbsFTIhiZE7Qbem5q1oyR"
            }
          ]
        },
        {
          "channeID": 1,
          "episodeId": "AhHxqEqP2gK",
          "title": "第28集：传承衣钵",
          "resolutionDes": "576P",
          "resolution": "576",
          "isVip": false,
          "isLast": false,
          "episodeTitle": "28",
          "opSecond": 37,
          "epSecond": 2672,
          "urls": [
            {
              "quality": "720p",
              "accessKey": "Zvap0UAznBoMSmjXFKx4v9JxPwwuYx7I"
            },
            {
              "quality": "1080p",
              "accessKey": "h93Y8q8HOBkOBcHBLOgcKi8mmDw1ksUQ"
            },
            {
              "quality": "4K",
              "accessKey": "SiwlX04a4c1SWAXIDTgfBjX9Nf7ZwgvP"
            }
          ]
        },
        {
          "channeID": 1,
          "episodeId": "pnAJejvcKvf",
          "title": "第29集：师父归来",
          "resolutionDes": "576P",
          "resolution": "576",
          "isVip": false,
          "isLast": false,
          "episodeTitle": "29",
          "opSecond": 37,
          "epSecond": 2450,
          "urls": [
            {
              "quality": "720p",
              "accessKey": "GDh2S3UEZCM9ImYLLGa0t8yQexat2KzC"
            },
            {
              "quality": "1080p",
              "accessKey": "Fh5Y2M9ozDSCM21DlFgroZ18vFfo6PUj"
            },
            {
              "quality": "4K",
              "accessKey": "hds5nID2VIIrYHO5l9sKNLvGmQBGaIHx"
            }
          ]
        },
        {
          "channeID": 1,
          "episodeId": "bg384TzwtXv",
          "title": "第30集：圆满结局",
          "resolutionDes": "576P",
          "resolution": "576",
          "isVip": false,
          "isLast": false,
          "episodeTitle": "30",
          "opSecond": 37,
          "epSecond": 2518,
          "urls": [
            {
              "quality": "720p",
              "accessKey": "eFUbgjyZkDz1Dgj4WVV79VygikK2erLk"
            },
            {
              "quality": "1080p",
              "accessKey": "rHJySNkHEqThpdOH57Mq2y2wnjQl472L"
            },
            {
              "quality": "4K",
              "accessKey": "FpUImOXTZgxrB0vC766plbDKh0lCDzzy"
            }
          ]
        }
      ],
      "score": "8.8",
      "adGold": 20,
      "cidMapper": "电视剧",
      "regional": "大陆",
      "playRecordUrl": "https://w.anygate.vip/api/Counter/PlusOne?key=AddHitToMovie&id=2002&cid=0,1,4,146&uid=0&title=%E5%8F%A4%E8%A3%85%E4%BB%99%E4%BE%A0%E4%BC%A0&imgpath=https%3A%2F%2Fexample.com%2Fcovers%2Fseries2002.jpg",
      "labels": [],
      "isShow": true,
      "charge": 0,
      "isLive": false,
      "serialCount": 36
    },
    "userInfo": {},
    "adsPlayer": {},
    "adsSuspension": {},
    "focusStatus": false,
    "isBlackList": false,
    "like": {
      "count": 0,
      "selected": false
    },
    "disLike": {
      "count": 0,
      "selected": false
    },
    "favorites": {
      "count": 0,
      "selected": false
    },
    "languageList": [
      {
        "name": "国语"
      }
    ],
    "skipadshow": false
  },
  "msg": "1"
}
```

---


## 8. 获取特定集URL

**接口信息:**
- **方法:** GET
- **路径:** `/api/video/episode-url/:accessKey`
- **描述:** 通过访问密钥获取剧集URL
- **状态:** ✅ (正常工作)

**请求示例:**
```bash
curl -X GET \
  "http://localhost:8080/api/video/episode-url/kot4JgxK12l1hjkTq1ukph4tQIafme7a" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3ODQ1MDc4ODQ0IiwiaWF0IjoxNzU0NDcwODQ2LCJleHAiOjE3NTUwNzU2NDZ9.kScM1EGRDMrPV4h5QePRqZM46g_O51w5on7griBEqWc"
```

**请求参数:**
- `accessKey` (path): 访问密钥，必填

**响应示例:**
```json
{
  "id": 397,
  "episodeId": 2136,
  "quality": "720p",
  "ossUrl": "https://oss.example.com/videos/series_2001_ep_1_720p.mp4",
  "cdnUrl": "https://cdn.example.com/videos/720p/series_2001_ep_1_720p.mp4",
  "subtitleUrl": null,
  "accessKey": "kot4JgxK12l1hjkTq1ukph4tQIafme7a",
  "createdAt": "2025-08-05T23:59:19.000Z",
  "updatedAt": "2025-08-05T23:59:19.972Z",
  "episode": {
    "id": 2136,
    "shortId": "a3e862c5-96f4-4200-9597-2f1c5b38ac80",
    "seriesId": 2001,
    "episodeNumber": 1,
    "title": "第1集：初次相遇",
    "duration": 2118,
    "status": "published",
    "series": {
      "id": 2001,
      "shortId": "cfd7d3c1-acc1-4148-9d01-8c91d62ead32",
      "title": "霸道总裁爱上我",
      "description": "一个普通女孩与霸道总裁的爱情故事，充满甜蜜与波折",
      "coverUrl": "https://example.com/covers/series2001.jpg",
      "totalEpisodes": 24,
      "createdAt": "2025-08-05T23:55:00.000Z",
      "categoryId": 1,
      "score": 9.2,
      "playCount": 156800,
      "status": "completed",
      "upStatus": "全24集",
      "upCount": 24,
      "starring": "张三,李四",
      "actor": "张三,李四,王五,赵六",
      "director": "导演A"
    },
    "playCount": 36359,
    "createdAt": "2025-08-05T23:59:19.000Z",
    "updatedAt": "2025-08-05T23:59:19.969Z",
    "hasSequel": false
  }
}
```

---



## 接口状态总结

| 接口名称 | 方法 | 路径 | 状态 | 说明 |
|---------|------|------|------|------|
| Telegram登录 | POST | `/user/telegram-login` | ❌ | 参数验证失败，需要特定格式 |
| 获取用户信息 | GET | `/user/me` | ✅ | 正常返回用户信息 |
| 获取首页视频 | GET | `/api/home/getvideos` | ✅ | 正常返回首页视频列表 |
| 获取筛选标签 | GET | `/api/home/getfilterstags` | ✅ | 正常返回筛选标签数据 |
| 条件筛选数据 | GET | `/api/list/getconditionfilterdata` | ✅ | 正常返回详细筛选数据 |
| 获取剧集列表 | GET | `/api/video/episodes` | ✅ | 正常返回剧集基本信息 |
| 获取视频详情 | GET | `/api/video/details` | ✅ | 正常返回视频详情 |
| 获取剧集URL | GET | `/api/video/episode-url/:accessKey` | ✅ | 正常返回剧集播放信息 |

---

## 9. Ingest 数据采集接口（系列/剧集/播放地址）

说明：为保证批量一致性，Ingest 接口外层 HTTP 始终 200，单条失败通过 `data.items[].statusCode` 与 `data.items[].details` 体现。

### 9.1 单个系列入库（创建/更新）

接口信息:
- 方法: POST
- 路径: `/api/admin/ingest/series`
- 认证: 需要管理员 Token

请求示例:
```bash
curl -X POST "http://localhost:8080/api/admin/ingest/series" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_ADMIN_JWT>" \
  -d '{
    "externalId": "test-series-001",
    "title": "测试系列",
    "description": "用于接口连通性测试",
    "coverUrl": "https://example.com/cover.jpg",
    "categoryId": 1,
    "releaseDate": "2025-01-01",
    "isCompleted": false,
    "regionOptionName": "大陆",
    "languageOptionName": "国语",
    "statusOptionName": "连载中",
    "yearOptionName": "2025",
    "genreOptionNames": ["言情", "都市"],
    "episodes": [
      {
        "episodeNumber": 1,
        "title": "第1集",
        "duration": 1800,
        "status": "published",
        "urls": [
          {
            "quality": "720p",
            "cdnUrl": "https://cdn.example.com/ep1.m3u8",
            "originUrl": "https://origin.example.com/ep1"
          }
        ]
      }
    ]
  }'
```

成功响应示例（统一结构）:
```json
{
  "code": 200,
  "data": {
    "summary": { "created": 1, "updated": 0, "failed": 0, "total": 1 },
    "items": [
      { "statusCode": 200, "seriesId": 1001, "shortId": "Ab3K7mP2XyZ", "externalId": "test-series-001", "action": "created", "title": "测试系列" }
    ]
  },
  "message": "系列采集写入完成",
  "success": true,
  "timestamp": 1756402868040
}
```

### 9.2 批量系列入库

接口信息:
- 方法: POST
- 路径: `/api/admin/ingest/series/batch`

请求示例:
```bash
curl -X POST "http://localhost:8080/api/admin/ingest/series/batch" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_ADMIN_JWT>" \
  -d '{
    "items": [
      { "externalId": "series-001", "title": "系列A", "description": "desc", "coverUrl": "https://example/a.jpg", "categoryId": 1, "status": "on-going", "releaseDate": "2025-01-01", "isCompleted": false, "regionOptionId": 11, "languageOptionId": 16, "statusOptionId": 28, "yearOptionId": 21, "episodes": [{"episodeNumber":1,"title":"E1","duration":1800,"status":"published","urls":[{"quality":"720p","cdnUrl":"https://cdn/a1.m3u8","originUrl":"https://origin/a1"}]}] },
      { "externalId": "series-002", "title": "系列B", "description": "desc", "coverUrl": "https://example/b.jpg", "categoryId": 1, "status": "on-going", "releaseDate": "2025-01-02", "isCompleted": false, "regionOptionId": 11, "languageOptionId": 16, "statusOptionId": 28, "yearOptionId": 21, "episodes": [{"episodeNumber":1,"title":"E1","duration":1800,"status":"published","urls":[{"quality":"720p","cdnUrl":"https://cdn/b1.m3u8","originUrl":"https://origin/b1"}]}] },
      { "externalId": "bad-id", "title": "坏数据", "description": "", "coverUrl": "", "categoryId": 0, "status": "on-going", "releaseDate": "2025-01-03", "isCompleted": false, "regionOptionId": 0, "languageOptionId": 0, "statusOptionId": 0, "yearOptionId": 0, "episodes": [] }
    ]
  }'
```

响应示例（含统计与失败项）:
```json
{
  "code": 200,
  "data": {
    "summary": { "created": 1, "updated": 1, "failed": 1, "total": 3 },
    "items": [
      { "statusCode": 200, "seriesId": 1001, "shortId": "Ab3K7mP2XyZ", "action": "created", "externalId": "series-001", "title": "系列A" },
      { "statusCode": 200, "seriesId": 1002, "shortId": "Cd9LmQ8RtUv", "action": "updated", "externalId": "series-002", "title": "系列B" },
      { "statusCode": 400, "error": "参数验证失败", "details": [{"property":"categoryId"}], "externalId": "bad-id", "title": "坏数据" }
    ]
  },
  "message": "批量系列采集写入完成",
  "success": true,
  "timestamp": 1756402868040
}
```

### 9.3 增量更新（支持新增集数/清晰度URL）

接口信息:
- 方法: POST
- 路径: `/api/admin/ingest/series/update`

请求示例（新增第3集，并为第1集新增1080p）:
```bash
curl -X POST "http://localhost:8080/api/admin/ingest/series/update" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_ADMIN_JWT>" \
  -d '{
    "externalId": "series-001",
    "episodes": [
      { "episodeNumber": 3, "title": "第3集", "duration": 1500, "status": "published", "urls": [{"quality":"720p","cdnUrl":"https://cdn/ep3.m3u8","originUrl":"https://origin/ep3"}] },
      { "episodeNumber": 1, "urls": [{"quality":"1080p","cdnUrl":"https://cdn/ep1-1080.m3u8","originUrl":"https://origin/ep1-1080"}] }
    ],
    "removeMissingEpisodes": false,
    "removeMissingUrls": false
  }'
```

成功响应示例：
```json
{
  "code": 200,
  "data": {
    "summary": { "created": 0, "updated": 1, "failed": 0, "total": 1 },
    "items": [
      { "statusCode": 200, "seriesId": 1001, "shortId": "Ab3K7mP2XyZ", "externalId": "series-001", "action": "updated", "title": "系列A" }
    ]
  },
  "message": "系列采集写入完成",
  "success": true,
  "timestamp": 1756402868040
}
```

### 9.4 失败示例（参数校验）

请求示例（缺少必须字段）:
```bash
curl -X POST "http://localhost:8080/api/admin/ingest/series" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_ADMIN_JWT>" \
  -d '{ "externalId": "bad-id" }'
```

响应示例（HTTP 200，items 内部 400）:
```json
{
  "code": 200,
  "data": {
    "summary": { "created": 0, "updated": 0, "failed": 1, "total": 1 },
    "items": [
      {
        "statusCode": 400,
        "error": "参数验证失败",
        "details": [ { "property": "title" }, { "property": "description" }, { "property": "coverUrl" } ],
        "externalId": "bad-id",
        "title": null
      }
    ]
  },
  "message": "系列采集写入完成",
  "success": true,
  "timestamp": 1756402868040
}
```

## 注意事项

1. **认证要求**: 大部分接口需要在请求头中包含 `Authorization: Bearer {token}`
2. **错误处理**: 部分接口目前存在500内部服务器错误，需要后端修复
3. **参数验证**: Telegram登录接口对参数格式要求严格
4. **数据格式**: 所有成功响应都包含统一的数据结构
5. **测试环境**: 当前测试基于 `localhost:8080` 端口

---

*文档生成时间: 2025年1月6日*
*基于实际API测试结果生成*