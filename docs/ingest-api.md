### 采集入库接口文档（Crawler Ingestion API）

本接口用于将爬虫抓取的内容写入系统数据库，支持系列、剧集与每集播放 URL 的入库与更新。当前接口默认无需认证（建议后续增加签名/Token）。

---

## 基本信息

- 基础路径：`/api/admin/ingest`
- 数据格式：`Content-Type: application/json`
- 超时建议：60s
- 幂等性：通过 `externalId` 保证。相同 `externalId` 的系列会被定位并更新。
- 文件上传：不接收二进制文件。请先把视频/字幕上传到对象存储（OSS/CDN），将地址以 URL 的形式传入。

---

## 一、创建/覆盖入库（全量）

- 方法与路径：`POST /api/admin/ingest/series`
- 作用：按 `externalId` upsert 一个完整系列（系列信息 + 若干剧集 + 每集若干 URL）。
- 幂等：`externalId` 作为唯一键进行 upsert。

请求体（IngestSeriesDto）字段摘要：

- 顶层（系列）：
  - `externalId` string 必填：外部唯一ID（强烈建议使用源站ID或规范化URL的hash）
  - `title` string ≤255 必填
  - `description` string 必填
  - `coverUrl` string ≤255 必填
  - `categoryId` int ≥1 必填（需为已存在的分类）
  - `isCompleted` boolean 必填：系列完结状态
  - `releaseDate` string 必填：ISO日期时间（如 `2024-08-01T12:34:56Z`）
  - `status` string 可选：仅用于软删除（传 "deleted"）
  - `score` number [0,10] 可选：评分
  - `playCount` int ≥0 可选：播放次数
  - `starring` string 可选（主演，逗号分隔）
  - `actor` string 可选（全演员，逗号分隔）
  - `director` string ≤255 可选
  - `regionOptionName`/`languageOptionName`/`statusOptionName`/`yearOptionName` string 必填（按名称自动创建选项）
  - `genreOptionNames` string[] 可选（题材多选，按名称自动创建）

- `episodes` 数组（至少1项）：
  - `episodeNumber` int ≥1 必填
  - `title` string ≤255 必填
  - `duration` int ≥1 必填（秒）
  - `status` enum 必填：`published` | `hidden` | `draft`
  - `urls` 数组（至少1项）：
    - `quality` enum 必填：`360p` | `480p` | `720p` | `1080p` | `4K`
    - `ossUrl` string ≤255 必填
    - `cdnUrl` string ≤255 必填
    - `subtitleUrl` string ≤255 可选
    - `originUrl` string ≤255 必填（原站/采集来源播放地址）

示例请求：
```json
{
  "externalId": "srcSite-abc-123",
  "title": "示例系列",
  "description": "简介...",
  "coverUrl": "https://cdn.example.com/cover/xxx.jpg",
  "categoryId": 1,
  "status": "on-going",
  "releaseDate": "2024-08-01T12:34:56Z",
  "isCompleted": false,
  "score": 8.2,
  "playCount": 0,
  "upStatus": "更新中",
  "upCount": 1,
  "starring": "主演A,主演B",
  "actor": "演员A,演员B,演员C",
  "director": "导演X",
  "regionOptionId": 1,
  "languageOptionId": 2,
  "statusOptionId": 3,
  "yearOptionId": 2024,
  "episodes": [
    {
      "episodeNumber": 1,
      "title": "第1集",
      "duration": 900,
      "status": "published",
      "urls": [
        { "quality": "720p", "ossUrl": "https://oss/ep1-720.m3u8", "cdnUrl": "https://cdn/ep1-720.m3u8" }
      ]
    }
  ]
}
```

成功响应（统一格式）：
```json
{ "code": 200, "data": { "seriesId": 123 }, "message": "系列采集写入成功", "success": true, "timestamp": 1710000000000 }
```

---

## 二、批量入库（全量）

- 方法与路径：`POST /api/admin/ingest/series/batch`
- 作用：批量 upsert 多个系列。

请求体：
```json
{ "items": [ IngestSeriesDto, ... ] }
```

成功响应：
```json
{ "code": 200, "data": { "created": [ { "seriesId": 123 }, { "seriesId": 124 } ] }, "message": "批量系列采集写入成功", "success": true, "timestamp": 1710000000000 }
```

---

## 三、增量更新（按 externalId）

- 方法与路径：`POST /api/admin/ingest/series/update`
- 作用：按 `externalId` 定位已有系列，增量更新指定字段/剧集/URL。可选清理缺失项。

请求体（UpdateIngestSeriesDto）关键字段：

- `externalId` string 必填：定位系列
- 其他系列字段均可选；仅在传递时更新
- `episodes` 数组可选：
  - `episodeNumber` 用于定位；`title/duration/status` 可选更新
  - `urls` 可选：按 `quality` 定位；`ossUrl/cdnUrl/subtitleUrl` 可选更新
- `removeMissingEpisodes` boolean 可选：为 true 时删除此次未出现的剧集（及其URL）
- `removeMissingUrls` boolean 可选：为 true 时删除每集中此次未出现的URL

示例请求（只更新部分字段）：
```json
{
  "externalId": "srcSite-abc-123",
  "status": "completed",
  "isCompleted": true,
  "upStatus": "已完结",
  "episodes": [
    {
      "episodeNumber": 1,
      "urls": [
        { "quality": "720p", "cdnUrl": "https://cdn/new-ep1-720.m3u8" }
      ]
    }
  ],
  "removeMissingUrls": false
}
```

成功响应：
```json
{ "code": 200, "data": { "seriesId": 123 }, "message": "系列采集更新成功", "success": true, "timestamp": 1710000000000 }
```

---

## 键与稳定性说明

- `externalId`：系列的外部唯一键；用于幂等写入与更新；强烈建议使用。
- `shortId`：`Series`/`Episode` 在首次插入时自动生成并保持不变。
- `access_key`（Episode）自动生成；`episode_urls.access_key`：
  - 若带 `externalId`，使用 `hash(externalId:episodeNumber:quality)` 生成稳定值；
  - 否则回退为 `(episodeId + quality)` 的确定性值；
  - URL 更新会保留原有 `access_key`。

---

## 错误返回

- 参数校验失败（示例）：
```json
{
  "statusCode": 400,
  "message": [
    "episodes must contain at least 1 elements",
    "status must be one of the following values: on-going, completed"
  ],
  "error": "Bad Request"
}
```

- 业务错误（示例）：
```json
{ "code": 400, "data": null, "message": "系列不存在（externalId 不匹配）", "success": false, "timestamp": 1710000000000 }
```

---

## 调用建议

- 文件上传：请先上传到 OSS/CDN，接口只接收 URL；`cdnUrl` 建议传加速地址。
- 批量入库：建议分批 100 条以内，避免超时；必要时做重试（同一 `externalId` 幂等）。
- 速率：建议控制在 5~10 QPS，视数据库与网络情况调整。
- 时序：先入库 `series` 与第1批 `episodes`，后续按 `series/update` 增量补充。


