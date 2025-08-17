# 剧集级 AccessKey 规范与使用说明

最后更新：2025-08-16

## 变更摘要
- 引入 `episodes.access_key` 作为“剧集级访问密钥”。
- `GET /api/video/episode-url/:accessKey` 同时支持“剧集级 accessKey”和“地址级 accessKey”
  - 优先匹配“剧集级 accessKey”；未命中则按“地址级 accessKey”回退，并聚合同集的全部地址返回
- 已为所有历史剧集批量回填 `episodes.access_key`。

## 数据库
- 表：`episodes`
  - 新增列：`access_key VARCHAR(64) UNIQUE NULL`
  - 已回填：对 `NULL/空` 的行生成 32 位十六进制随机密钥

## 接口
- 路由：`GET /api/video/episode-url/:accessKey`
- 认证：需要登录（Authorization: Bearer <token>）
- 参数：
  - `:accessKey` 为剧集级密钥（`episodes.access_key`）
- 响应：
```json
{
  "episodeId": 2201,
  "episodeShortId": "JZPp2rgGQRE",
  "episodeTitle": "第12集：尾声",
  "seriesId": 2003,
  "seriesShortId": "GyPHPsWxknr",
  "urls": [
    { "id": 592, "quality": "720p",  "cdnUrl": "...", "ossUrl": "...", "subtitleUrl": null },
    { "id": 594, "quality": "4K",    "cdnUrl": "...", "ossUrl": "...", "subtitleUrl": null },
    { "id": 593, "quality": "1080p", "cdnUrl": "...", "ossUrl": "...", "subtitleUrl": "..." }
  ],
  "accessKeySource": "episode"
}
```

## 如何获取 accessKey（推荐）
- 通过剧集列表接口直接获取每一集的 `episodeAccessKey`
  - 认证接口：`GET /api/video/episodes?seriesShortId=...`
  - 公开接口：`GET /api/public/video/episodes?seriesShortId=...`
- 字段位置：`data.list[].episodeAccessKey`

例如，`/api/video/episodes` 的列表项包含：
```json
{
  "id": 2136,
  "shortId": "CcPcMmtTAHa",
  "episodeNumber": 1,
  "episodeTitle": "01",
  "title": "第1集：初次相遇",
  "episodeAccessKey": "FE27A9CA890D9B196E211D783C622716",
  "urls": [
    { "quality": "720p",  "accessKey": "..." },
    { "quality": "1080p", "accessKey": "..." }
  ]
}
```

## 取用示例（可直接运行）
```bash
TELEGRAM='{"id":6702079700,"first_name":"随风","username":"seo99991","auth_date":1754642628,"hash":"cd671f60a4393b399d9cb269ac4327c8a47a3807c5520077c37477544ae93c07"}'; \
ACCESS=$(curl -s -H "Content-Type: application/json" -X POST -d "$TELEGRAM" http://localhost:8080/user/telegram-login | jq -r .access_token); \
SERIES_SHORT=$(curl -s "http://localhost:8080/api/list/getfiltersdata?channeid=1&ids=0,0,0,0,0&page=1" | jq -r '.data.list[0].shortId'); \
EP_KEY=$(curl -s -H "Authorization: Bearer $ACCESS" "http://localhost:8080/api/video/episodes?seriesShortId=$SERIES_SHORT&page=1&size=1" | jq -r '.data.list[0].episodeAccessKey'); \
echo "ACCESS=${ACCESS:0:24}..."; echo "SERIES_SHORT_ID=$SERIES_SHORT"; echo "EPISODE_ACCESS_KEY=$EP_KEY"; \
curl -s -H "Authorization: Bearer $ACCESS" "http://localhost:8080/api/video/episode-url/$EP_KEY" | jq .
```

## 前端接入要点
- 不再使用地址级 accessKey 作为入口；统一保留剧集级 accessKey 以聚合所有清晰度地址。
- 仍可在响应 `urls[]` 中获取各清晰度的地址级 accessKey（内部追溯需要时）。

## 回滚说明
- 若需回滚为兼容模式，仅需在服务中恢复“按地址级 accessKey 回退查找”的分支逻辑即可。

## 实现细节（代码）

### 1) 剧集实体 `episodes.access_key`
```typescript
// src/video/entity/episode.entity.ts
@Column({ type: 'varchar', length: 64, unique: true, nullable: true, name: 'access_key' })
accessKey: string;

@BeforeInsert()
generateShortId() {
  if (!this.shortId) {
    this.shortId = ShortIdUtil.generate();
  }
  if (!this.accessKey) {
    this.accessKey = AccessKeyUtil.generateAccessKey(32);
  }
}
```

### 2) 仅按“剧集级 accessKey”返回整集所有地址
```typescript
// src/video/services/episode.service.ts
async getEpisodeUrlByAccessKey(accessKey: string) {
  if (!AccessKeyUtil.isValidAccessKey(accessKey)) {
    throw new BadRequestException('无效的访问密钥格式');
  }
  const episode = await this.episodeRepo.findOne({ where: { accessKey }, relations: ['series'] });
  if (!episode) {
    throw new NotFoundException('播放地址不存在或已过期');
  }
  const urls = await this.episodeUrlRepo.find({ where: { episodeId: episode.id }, order: { quality: 'DESC' } });
  return {
    episodeId: episode.id,
    episodeShortId: episode.shortId,
    episodeTitle: episode.title,
    seriesId: episode.series?.id,
    seriesShortId: episode.series?.shortId,
    urls: urls.map(u => ({ id: u.id, quality: u.quality, ossUrl: u.ossUrl, cdnUrl: u.cdnUrl, subtitleUrl: u.subtitleUrl, accessKey: u.accessKey })),
    accessKeySource: 'episode',
  };
}
```

### 3) 在剧集列表接口返回 `episodeAccessKey`
```typescript
// src/video/video.service.ts （getEpisodeList 中）
{
  id: ep.id,
  shortId: ep.shortId,
  episodeNumber: ep.episodeNumber,
  episodeTitle: ep.episodeNumber.toString().padStart(2, '0'),
  title: ep.title,
  ...,
  seriesShortId: ep.series?.shortId || '',
  episodeAccessKey: ep.accessKey, // ← 供前端直连 episode-url 接口
  urls: ep.urls?.map(url => ({ quality: url.quality, accessKey: url.accessKey })) || [],
}
```

### 4) 数据回填（一次性执行）
```sql
-- 若列不存在则添加
-- ALTER TABLE episodes ADD COLUMN access_key VARCHAR(64) UNIQUE NULL;

-- 为缺失 access_key 的剧集回填 32 位十六进制随机密钥
UPDATE episodes
SET access_key = LPAD(HEX(RANDOM_BYTES(16)), 32, '0')
WHERE access_key IS NULL OR access_key = '';
```
