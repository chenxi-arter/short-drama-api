# 接口问题清单（本地联调用例）

最后更新：2025-08-16

## 总览
- 覆盖范围：登录、首页/筛选、剧集、播放地址、进度、评论、浏览历史、轮播图、缓存
- 环境：`http://localhost:8080`（本地），MySQL/Redis 正常

---

## 已确认正常
- 登录与鉴权
  - POST /api/user/telegram-login → 201（access_token/refresh_token）
  - GET /api/user/me → 200
  - POST /api/user/refresh → 201
- 首页与分类/筛选
  - GET /api/home/categories → 200
  - GET /api/home/gethomemodules?channeid=1&page=1 → 200
  - GET /api/list/getfilterstags?channeid=1 → 200
  - GET /api/list/getfiltersdata?channeid=1&ids=0,0,0,0,0,0&page=1 → 200（含分页）
- 剧集与播放
  - GET /api/public/video/episodes?seriesShortId=fpcxnnFA6m9&page=1&size=3 → 200
  - GET /api/video/episode-url/:accessKey（需登录）→ 200
- 观看进度
  - POST /api/video/progress（需登录）→ 201
  - GET /api/video/progress?episodeIdentifier=CcPcMmtTAHa（需登录）→ 200，返回 stopAtSecond=60
- 评论
  - POST /api/video/comment（需登录）→ 201
- 浏览历史
  - /api/video/browse-history（list/recent/sync/stats）→ 200
- 轮播与缓存
  - GET /api/banners/active/list?categoryId=1&limit=5 → 200
  - GET /api/cache/stats / warmup → 200

---

## 待关注与建议

1) 模糊搜索输出采样解析异常（仅测试脚本侧）
- 现象：GET /api/list/fuzzysearch?keyword=爱&page=1&size=5 的 jq 采样输出为空；接口应为 200。
- 建议：测试脚本打印完整 JSON 再校验 shortId；后端无需改动。

2) 标签字段位置对齐
- 现状：剧集接口统一在 seriesInfo.tags 返回；文档已同步。
- 建议：前端只读 seriesInfo.tags。

3) episode-url 接口鉴权
- 现状：/api/video/episode-url/:accessKey 需登录，未登录 401；已登录 200。
- 结论：保持现状。

4) EADDRINUSE（端口占用）
- 现象：本地热更新时偶发 8080 被占用。
- 建议：确保单进程；必要时手动释放端口后再启动。

---

## 取样数据（节选）

- Public episodes（含 tags）
```json
{"code":200,"seriesTags":["电视剧","大陆","国语","全集"],"first":{"id":2136,"shortId":"CcPcMmtTAHa","episodeNumber":1,"episodeTitle":"01","title":"第1集：初次相遇","duration":2118,"urls":[{"quality":"720p"},{"quality":"1080p"},{"quality":"4K"},{"quality":"720P"}]}}
```

- Progress GET
```json
{"stopAtSecond":60}
```

- Episode URL（需登录）
返回 id/episodeId/quality/cdnUrl/ossUrl/subtitleUrl/accessKey

---

## 结论
- 功能整体可用；shortId、分页字段、seriesInfo.tags 与文档一致。
- 暂无必须后端改动；有新需求可新增条目。
