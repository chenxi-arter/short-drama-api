# 首页API文档

## 视频列表接口

获取首页视频列表，包括轮播图、搜索过滤器、广告和视频内容。

### 请求信息

- **URL**: `/api/home/getvideos`
- **方法**: GET
- **描述**: 获取首页视频列表数据，包括轮播图、搜索过滤器、广告和视频内容

### 请求参数

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| channeid | string | 否 | 频道唯一标识，不传则返回全部频道内容 |
| page | string | 否 | 页数，默认为1 |

### 响应数据结构

```json
{
    "data": {
        "list": [
            {               // 轮播图板块
                "type": 0,                // 板块类型：0-轮播图
                "name": "轮播图",          // 板块名称
                "filters": null,           // 过滤器列表（轮播图无过滤器）
                "banners": [                // 轮播列表
                    {
                        "showURL": "https://example.com/image.jpg",  // 图片URL地址
                        "title": "视频标题",  // 视频标题
                        "id": 1234,          // 视频ID
                        "channeID": 1,       // 频道分类ID
                        "url": "1234",       // 视频详情页path
                    }
                ],
                "list": []                 // 视频列表（轮播图板块无视频列表）
            },
            {               // 搜索过滤器板块
                "type": 1001,              // 板块类型：1001-搜索过滤器
                "name": "搜索过滤器",        // 板块名称
                "filters": [                // 过滤器列表
                    {
                        "channeID": 1,       // 频道分类ID
                        "name": "短剧",      // 频道名称
                        "title": "全部",     // 过滤器标题
                        "ids": "0,0,0,0,0"   // 过滤器ID组合
                    },
                    // 更多过滤器...
                ],
                "banners": [],              // 轮播列表（搜索过滤器板块无轮播）
                "list": []                 // 视频列表（搜索过滤器板块无视频列表）
            },
            {               // 广告板块
                "type": -1,                // 板块类型：-1-广告
                "name": "广告",            // 板块名称
                "filters": null,           // 过滤器列表（广告板块无过滤器）
                "banners": [],             // 轮播列表（广告板块无轮播）
                "list": []                 // 视频列表（广告板块无视频列表）
            },
            {               // 视频内容板块
                "type": 3,                 // 板块类型：3-视频内容
                "name": "电影",            // 板块名称
                "filters": null,           // 过滤器列表（视频内容板块无过滤器）
                "banners": [],             // 轮播列表（视频内容板块无轮播）
                "list": [                  // 视频列表
                    {
                        "id": 1234,          // 视频ID
                        "coverUrl": "https://example.com/cover.jpg",  // 封面图URL
                        "title": "视频标题",  // 视频标题
                        "score": "8.5",      // 视频评分
                        "playCount": 12345,   // 播放次数
                        "url": "1234",       // 视频详情页path
                        "type": "剧情·悬疑",   // 分类映射
                        "isSerial": true,     // 是否是系列剧集
                        "upStatus": "更新到10集", // 更新状态
                        "upCount": 2          // 更新次数
                    }
                    // 更多视频...
                ]
            }
        ]
    },
    "code": 200,
    "msg": null
}
```

### 板块类型说明

- **0**: 轮播图板块
- **1001**: 搜索过滤器板块
- **-1**: 广告板块
- **3**: 视频内容板块

### 视频类型说明

- **isSerial**: 是否是系列剧集
  - **true**: 表示这是一个电视剧系列，有多集内容
  - **false**: 表示这是一个短视频，只有单集内容

### 更新状态说明

- **upStatus**: 更新状态
  - 例如："更新到10集"、"全集"等
- **upCount**: 更新次数
  - 表示该系列最近更新的次数

### 示例请求

```
GET /api/home/getvideos?channeid=1&page=1
```

### 错误码说明

| 错误码 | 说明 |
|-------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 500 | 服务器内部错误 |