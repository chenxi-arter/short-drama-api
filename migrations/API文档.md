# API 开发文档

## 首页

### 一、视频列表接口

#### 1. 接口描述

| 接口名称 | 获取视频详情                |
| ---- | --------------------- |
| 请求方式 | `GET`                 |
| 请求路径 | `/api/home/getvideos` |
| 路径参数 |                       |
| 响应类型 | `JSON`                |
| 响应状态 | `200 OK`              |

---

#### 2. 请求参数

| 参数名        | 类型     | 必填     | 说明                                 |
| ---------- | ------ | ------ | ---------------------------------- |
| `channeid` | string | 否(默认1) | 频道的唯一标识符，URL路径参数                   |
| `page`     | string | 否(默认1) | 页数，URL路径参数，page>1时，只要type=3 一个板块数据 |

---

#### 3. 响应数据

```json
{
    "data": {
        "list": [
            {               // 轮播图
                "type": 0,                // 板块类型
                "name": "轮播图",          // 搜索列表
                "filters": null, 
                "banners": [                // 轮播列表
                    {
                        "showURL": "https://static.yfsp.tv/upload/user/202507041859235983553.jpg",  // 图片的URL地址，用于显示轮播封面图片
                        "title": "水饺皇后",  // 视频的标题或名称
                        "id": 1131527,      // 视频的唯一标识符ID
                        "channeID": 1,  // 频道分类ID
                        "url": "1131527",  // 视频详情页path
                    }
                ],
                "list": [],                // 视频列表

            },
            {               // 搜索
                "type": 1001,                // 板块类型
                "name": "轮播图",
                "filters": [                // 过滤器列表
                    {
                        "channeID": 1,  // 频道分类ID
                        "name": "短剧",
                        "title": "全部",
                        "ids": "0,0,0,0,0", // 

                    },
                    {
                        "channeID": 1,  // 频道分类ID
                        "name": "短剧",
                        "title": "最新上传",
                        "ids": "0,0,0,0,0", 

                    },
                    {
                        "channeID": 1,  // 频道分类ID
                        "name": "短剧",
                        "title": "人气高",
                        "ids": "1,0,0,0,0", 

                    },
                    {
                        "channeID": 1,  // 频道分类ID
                        "name": "短剧",
                        "title": "评分高",
                        "ids": "2,0,0,0,0", 
                    },
                                        {
                        "channeID": 1,  // 频道分类ID
                        "name": "短剧",
                        "title": "最新更新",
                        "ids": "3,0,0,0,0", 

                    },
                ], 
                "banners": [],                // 轮播列表
                "list": [],                // 视频列表

            },
            {               // 广告
                "type": -1,                 // 板块类型
                "name": "广告",             // 搜索列表
                "filters": null,            // 轮播列表
                "banners": [],              // 视频列表
                "list": [],

            },
            {               // 视频
                "type": 3,                  // 板块类型
                "name": "电影",             // 搜索列表
                "filters": null,           // 轮播列表
                "banners": [],              // 视频列表
                "list": [
                    {
                        "id": 1140468,          // 视频ID
                        "coverUrl": "https://static.yfsp.tv/upload/video/202507281547324760826.gif",  // 封面图URL，视频的封面图片地址
                        "title": "兽性",        // 视频的标题
                        "score": "5.8",        // 视频评分
                        "playCount": 12785,    // 视频的播放次数
                        "url": "1140468",       // 视频详情path
                        "type": "剧情·恐怖"     // 分类映射
                        "isSerial": false,       // 是否是系列剧集，false表示不是
                        "upStatus": "全集",     // 更新到09集
                        "upCount": 0,        // 更新次数，当前为0
                    }
                ],

            },
        ]
    },
    "code": 200,
    "msg": null,
}
```

---



### 二、筛选器标签接口

#### 1. 接口描述

| 接口名称 | 获取视频详情                     |
| ---- | -------------------------- |
| 请求方式 | `GET`                      |
| 请求路径 | `/api/list/getfilterstags` |
| 路径参数 |                            |
| 响应类型 | `JSON`                     |
| 响应状态 | `200 OK`                   |

---

#### 2. 请求参数

| 参数名        | 类型     | 必填     | 说明       |
| ---------- | ------ | ------ | -------- |
| `channeid` | string | 否(默认1) | 频道的唯一标识符 |

#### 3. 响应数据

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
        },
        {
          "index": 0,
          "classifyId": 2,
          "classifyName": "人气最高",
          "isDefaultSelect": false
        },
      ],
    },
    {
      "name": "二级标签",
      "list": [
        {
          "index": 1,
          "classifyId": 0,
          "classifyName": "全部类型",
          "isDefaultSelect": true
        },
        {
          "index": 1,
          "classifyId": 129,
          "classifyName": "偶像",
          "isDefaultSelect": false
        },
        {
          "index": 1,
          "classifyId": 127,
          "classifyName": "言情",
          "isDefaultSelect": false
        },
        // .......
      ],
    },
    // ......
  ]
}
```

---



### 三、筛选器列表接口

#### 1. 接口描述

| 接口名称 | 获取视频详情                     |
| ---- | -------------------------- |
| 请求方式 | `GET`                      |
| 请求路径 | `/api/list/getfiltersdata` |
| 路径参数 |                            |
| 响应类型 | `JSON`                     |
| 响应状态 | `200 OK`                   |

* * *

#### 2. 请求参数

| 参数名        | 类型     | 必填             | 说明         |
| ---------- | ------ | -------------- | ---------- |
| `channeid` | string | 否(默认1)         | 频道的唯一标识符   |
| `ids`      | string | 否(默认0,0,0,0,0) | 筛选标识       |
| `page`     | string | 否(默认1)         | 页数，URL路径参数 |

#### 3. 响应数据

```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 828839,                // 视频ID
        "coverUrl": "https://static.yfsp.tv/upload/video/202301141233423360235.gif",  // 封面图URL
        "title": "狂飙",                // 视频的标题
        "playCount": 23959613,        // 视频的播放次数
        "upStatus": "39集全",        // 更新状态
        "upCount": 0,                // 更新次数，当前为0
        "score": "8.8",                // 视频评分
        "isSerial": false,            // 是否是系列剧集，false表示不是
        "cidMapper": "警匪·罪案·剧情",    // 分类映射
        "isRecommend": true,         // 是否推荐
      },
     // ......
    ]
  },
  "msg": null
}
```



---

### 四、详情页接口

#### 1. 接口描述

| 接口名称 | 获取视频详情               |
| ---- | -------------------- |
| 请求方式 | `GET`                |
| 请求路径 | `/api/video/details` |
| 路径参数 |                      |
| 响应类型 | `JSON`               |
| 响应状态 | `200 OK`             |

* * *

#### 2. 请求参数

| 参数名  | 类型     | 必填  | 说明       |
| ---- | ------ | --- | -------- |
| `id` | string | 是   | 视频的唯一标识符 |

#### 3. 响应数据

```json

{
    "code": 200,  // 返回状态码，200表示请求成功
    "data": {
        "detailInfo": {
            "starring": "边天扬,吉舒亦,陈鹏万里,耿艺展",  // 主演名单
            "id": 1140591,  // 视频的唯一ID
            "channeName": "电视剧",  // 频道namee
            "channeID": 1,  // 频道ID
            "title": "春迟",  // 视频标题
            "coverUrl": "https://static.yfsp.tv/upload/video/202507290536333603731.gif",  // 视频封面图片URL
            "mediaUrl": "",  // 视频播放地址，空表示未提供
            "fileName": "lxj-cc-01-00FA6D517",  // 视频文件名
            "mediaId": "41519_0,1,4,146",  // 媒体ID，用于标识该视频资源
            "postTime": "2025-07-30T04:00:00Z",  // 发布时间
            "contentType": "爱情",  // 内容类型（如爱情、科幻等）
            "actor": "边天扬,吉舒亦,陈鹏万里,耿艺展",  // 演员名单
            "shareCount": 7,  // 视频的分享次数
            "director": "",  // 导演，当前为空
            "description": "商会千金赵春漫为父报仇潜入玉春戏院，却不幸死于义帮二当家周迟之手。时间重置，赵春漫发现事情似有不同。为查清父亲死亡真相，改变自己的结局，春漫一次次面对命运的抉择，步步为营，也在与周迟的感情中攻城略地。",  // 视频简介
            "comments": 1,  // 评论数量

            "updateStatus": "更新到09",  // 更新状态，表示已更新到第9集
            "watch_progress": 0,  // 用户观看时长(秒)，0表示未开始观看
            "playCount": 17152,  // 播放次数
            "isHot": false,  // 是否热门，当前为false
            "isVip": false,  // 是否为VIP视频，当前为false
            "episodes": [  // 视频的所有集数信息
                {
                    "channeID": 1,
                    "episodeId": 1140591,  // 集数ID
                    "title": "春迟",  // 视频标题
                    "resolutionDes": "576P",  // 分辨率描述
                    "resolution": "576",  // 分辨率，单位：P
                    "isVip": false,  // 是否VIP，当前为false
                    "isLast": false,  // 是否为最后一集，当前为false
                    "episodeTitle": "01",  // 集数标题，如“01”
                    "opSecond": 37,  // 开头广告时长
                    "epSecond": 1086  // 集数总时长（秒）
                },
                // 省略其他集数数据...
            ],


            "score": "",  // 当前视频的评分，当前为空
            "adGold": 20,  // 广告金（可能是广告收益）
            "cidMapper": "短剧·剧情·爱情",  // 视频分类标签
            "regional": "大陆",  // 视频地区



            "playRecordUrl": "https://w.anygate.vip/api/Counter/PlusOne?key=AddHitToMovie&id=41519&cid=0,1,4,146&uid=0&title=Cz5JR1jC0L2&imgpath=https://static.yfsp.tv/upload/video/202507290536333603731.gif&mixattr=爱情,2025,大陆,国语",  // 播放记录URL，用于统计播放次数等
            "labels": [],  // 标签，当前为空
            "isShow": true,  // 是否显示，当前为true
            "charge": 0,  // 收费标识，0表示免费
            "isLive": false,  // 是否为直播视频，当前为false
            "serialCount": 26  // 总集数
        },
        "userInfo": {    // 上传者
        },
        "adsPlayer": {},  // 广告播放器配置，当前为空
        "adsSuspension": {},  // 广告悬浮配置，当前为空
        "focusStatus": false,  // 是否已关注，当前为false
        "isBlackList": false,  // 是否在黑名单中，当前为false
        "like": {
            "count": 4,  // 点赞数量
            "selected": false  // 是否已点赞，当前为false
        },
        "disLike": {
            "count": 1,  // 踩数量
            "selected": false  // 是否已踩，当前为false
        },
        "favorites": {
            "count": 37,  // 收藏数量
            "selected": false  // 是否已收藏，当前为false
        },
        "languageList": [
            {
                "name": "国语",  // 语言名称
            }
        ],
        "skipadshow": false  // 是否跳过广告，当前为false
    },
    "msg": "1"  // 消息状态
}

```













# 模板

#### 1. 接口描述

| 接口名称 | 获取视频详情            |
| ---- | ----------------- |
| 请求方式 | `GET`             |
| 请求路径 | `/home/getvideos` |
| 路径参数 |                   |
| 响应类型 | `JSON`            |
| 响应状态 | `200 OK`          |

* * *

#### 2. 请求参数

| 参数名        | 类型     | 必填     | 说明         |
| ---------- | ------ | ------ | ---------- |
| `channeid` | string | 否(默认1) | 频道的唯一标识符   |
| `page`     | string | 否(默认1) | 页数，URL路径参数 |

#### 3. 响应数据





---
