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
  "http://localhost:8080/user/telegram-login" \
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
  "http://localhost:8080/user/me" \
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
- **路径:** `/api/home/getvideos`
- **描述:** 获取首页推荐视频列表
- **状态:** ✅ (正常工作)

**请求示例:**
```bash
curl -X GET \
  "http://localhost:8080/api/home/getvideos" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3ODQ1MDc4ODQ0IiwiaWF0IjoxNzU0NDcwODQ2LCJleHAiOjE3NTUwNzU2NDZ9.kScM1EGRDMrPV4h5QePRqZM46g_O51w5on7griBEqWc"
```

**请求参数:**
{
  "channeid?": string  // 可选，频道ID（注意：当前API不支持此参数）
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
            "uuid": "550e8400-e29b-41d4-a716-446655440002",
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
            "uuid": "550e8400-e29b-41d4-a716-446655440003",
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
        "name": "全部",
        "banners": [],
        "list": [
          {
            "id": 1005,
            "uuid": "550e8400-e29b-41d4-a716-446655440005",
            "coverUrl": "https://example.com/cover5.jpg",
            "title": "古装电视剧",
            "score": "9.5",
            "playCount": 45600,
            "url": "1005",
            "type": "电视剧",
            "isSerial": true,
            "upStatus": "hot",
            "upCount": 4560
          },
          {
            "id": 1004,
            "uuid": "550e8400-e29b-41d4-a716-446655440004",
            "coverUrl": "https://example.com/cover4.jpg",
            "title": "搞笑综艺",
            "score": "8",
            "playCount": 32100,
            "url": "1004",
            "type": "综艺",
            "isSerial": true,
            "upStatus": "popular",
            "upCount": 3210
          },
          {
            "id": 1003,
            "uuid": "550e8400-e29b-41d4-a716-446655440003",
            "coverUrl": "https://example.com/cover3.jpg",
            "title": "悬疑电影",
            "score": "8.8",
            "playCount": 18900,
            "url": "1003",
            "type": "电影",
            "isSerial": true,
            "upStatus": "hot",
            "upCount": 1890
          },
          {
            "id": 1002,
            "uuid": "550e8400-e29b-41d4-a716-446655440002",
            "coverUrl": "https://example.com/cover2.jpg",
            "title": "都市爱情剧",
            "score": "9.2",
            "playCount": 25600,
            "url": "1002",
            "type": "电视剧",
            "isSerial": true,
            "upStatus": "new",
            "upCount": 2560
          },
          {
            "id": 1001,
            "uuid": "550e8400-e29b-41d4-a716-446655440001",
            "coverUrl": "https://example.com/cover1.jpg",
            "title": "测试剧集系列",
            "score": "8.5",
            "playCount": 12580,
            "url": "1001",
            "type": "电视剧",
            "isSerial": true,
            "upStatus": "hot",
            "upCount": 1250
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
  "http://localhost:8080/api/list/getconditionfilterdata?titleid=drama&ids=0,0,0,0,0&page=1&size=21" \
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
        "uuid": "cfd7d3c1-acc1-4148-9d01-8c91d62ead32",
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
        "updateTime": "2025-08-06T11:49:33.754Z",
        "episodeCount": 24,
        "tags": []
      },
      {
        "id": 2002,
        "uuid": "a1b5b77d-9fdd-40b8-b233-f29ab6a94877",
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
        "updateTime": "2025-08-06T11:49:33.754Z",
        "episodeCount": 30,
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
# 获取指定剧集的所有集数（通过UUID）
curl -X GET \
  "http://localhost:8080/api/video/episodes?seriesUuid=cfd7d3c1-acc1-4148-9d01-8c91d62ead32&page=1&size=20" \
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
- `seriesUuid` (可选): 剧集UUID
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
        "id": 1,
        "uuid": "episode-uuid-1",
        "episodeNumber": 1,
        "title": "第1集",
        "duration": 1086,
        "status": "active",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "seriesId": 1,
        "seriesTitle": "示例剧集",
        "seriesUuid": "cfd7d3c1-acc1-4148-9d01-8c91d62ead32"
      }
    ],
    "total": 10,
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
- **描述:** 通过UUID或ID获取视频详细信息，包含所有剧集的详细数据
- **状态:** ✅ (正常工作)

**请求示例:**
```bash
curl -X GET \
  "http://localhost:8080/api/video/details?uuid=cfd7d3c1-acc1-4148-9d01-8c91d62ead32" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3ODQ1MDc4ODQ0IiwiaWF0IjoxNzU0NDcwODQ2LCJleHAiOjE3NTUwNzU2NDZ9.kScM1EGRDMrPV4h5QePRqZM46g_O51w5on7griBEqWc"
```

**请求参数:**
- `uuid` (string): 视频UUID标识符（推荐使用，防枚举攻击）
- `id` (string): 视频ID（向后兼容）
- 注意：必须提供uuid或id参数中的一个

**响应示例:**
```json
{
  "code": 200,
  "data": {
    "detailInfo": {
      "starring": "张三,李四",
      "id": 2001,
      "channeName": "电视剧",
      "channeID": 1,
      "title": "霸道总裁爱上我",
      "coverUrl": "https://example.com/covers/series2001.jpg",
      "mediaUrl": "",
      "fileName": "series-2001",
      "mediaId": "2001_0,1,4,146",
      "postTime": "2025-08-05T23:55:00.000Z",
      "contentType": "电视剧",
      "actor": "张三,李四,王五,赵六",
      "shareCount": 0,
      "director": "导演A",
      "description": "一个普通女孩与霸道总裁的爱情故事，充满甜蜜与波折",
      "comments": 0,
      "updateStatus": "全24集",
      "watch_progress": 0,
      "playCount": 156800,
      "isHot": true,
      "isVip": false,
      "episodes": [
        {
          "channeID": 1,
          "episodeId": "a3e862c5-96f4-4200-9597-2f1c5b38ac80",
          "title": "第1集：初次相遇",
          "resolutionDes": "576P",
          "resolution": "576",
          "isVip": false,
          "isLast": false,
          "episodeTitle": "01",
          "opSecond": 37,
          "epSecond": 2118,
          "urls": [
            {
              "quality": "720p",
              "accessKey": "kot4JgxK12l1hjkTq1ukph4tQIafme7a"
            },
            {
              "quality": "1080p",
              "accessKey": "CFWMo6cdUi5Rhx3F7FMAst0TjhLzcgS4"
            },
            {
              "quality": "4K",
              "accessKey": "APoC3chZnDKCPSyh3PHL9EsjpWSz2VPt"
            }
          ]
        },
        {
          "channeID": 1,
          "episodeId": "1751f0c3-ce01-4581-b992-62a684da6c4d",
          "title": "第2集：误会重重",
          "resolutionDes": "576P",
          "resolution": "576",
          "isVip": false,
          "isLast": false,
          "episodeTitle": "02",
          "opSecond": 37,
          "epSecond": 2211,
          "urls": [
            {
              "quality": "720p",
              "accessKey": "uNDdU4QDIURn6ukQe6i3C0gJNWpavnlv"
            },
            {
              "quality": "1080p",
              "accessKey": "lJtIhPzxS2fSxDiTi2poG8wlV3n1u7XF"
            },
            {
              "quality": "4K",
              "accessKey": "wksU7uum9UpVLfcQwI46i8tBYAp3g3jA"
            }
          ]
        },
        {
          "channeID": 1,
          "episodeId": "df54aa43-8974-4840-91bb-c3458c211fe9",
          "title": "第3集：渐生情愫",
          "resolutionDes": "576P",
          "resolution": "576",
          "isVip": false,
          "isLast": false,
          "episodeTitle": "03",
          "opSecond": 37,
          "epSecond": 2333,
          "urls": [
            {
              "quality": "720p",
              "accessKey": "DnmuYm2NISRvFMREI056pSJJhWNzBVCG"
            },
            {
              "quality": "1080p",
              "accessKey": "dteWkjsI9kD9RiSZ2SbKfEWj74j52EDt"
            },
            {
              "quality": "4K",
              "accessKey": "QZfH5PD3B0BEJhhpFzaRseJBGT5zBByZ"
            }
          ]
        }
      ],
      "score": "9.2",
      "adGold": 20,
      "cidMapper": "电视剧",
      "regional": "大陆",
      "playRecordUrl": "https://w.anygate.vip/api/Counter/PlusOne?key=AddHitToMovie&id=2001&cid=0,1,4,146&uid=0&title=%E9%9C%B8%E9%81%93%E6%80%BB%E8%A3%81%E7%88%B1%E4%B8%8A%E6%88%91&imgpath=https%3A%2F%2Fexample.com%2Fcovers%2Fseries2001.jpg",
      "labels": [],
      "isShow": true,
      "charge": 0,
      "isLive": false,
      "serialCount": 24
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
    "uuid": "a3e862c5-96f4-4200-9597-2f1c5b38ac80",
    "seriesId": 2001,
    "episodeNumber": 1,
    "title": "第1集：初次相遇",
    "duration": 2118,
    "status": "published",
    "series": {
      "id": 2001,
      "uuid": "cfd7d3c1-acc1-4148-9d01-8c91d62ead32",
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

## 注意事项

1. **认证要求**: 大部分接口需要在请求头中包含 `Authorization: Bearer {token}`
2. **错误处理**: 部分接口目前存在500内部服务器错误，需要后端修复
3. **参数验证**: Telegram登录接口对参数格式要求严格
4. **数据格式**: 所有成功响应都包含统一的数据结构
5. **测试环境**: 当前测试基于 `localhost:8080` 端口

---

*文档生成时间: 2025年1月6日*
*基于实际API测试结果生成*