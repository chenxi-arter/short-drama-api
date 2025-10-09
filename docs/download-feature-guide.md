# 视频下载功能指南

## 📝 功能概述

本文档介绍视频下载功能的实现方式和使用方法。该功能允许管理员获取任意剧集的所有清晰度下载地址，无需统计下载次数。

## 🔌 API 接口

### 获取剧集下载地址

**端点**: `GET /api/admin/episodes/:id/download-urls`

**方法**: GET

**路径参数**:
- `id` (number): 剧集ID

**请求示例**:
```bash
curl -X GET "http://localhost:8080/api/admin/episodes/2136/download-urls" \
  -H "Content-Type: application/json"
```

**响应格式**:
```json
{
  "success": true,
  "episodeId": 2136,
  "episodeShortId": "CcPcMmtTAHa",
  "episodeTitle": "第1集：初次相遇",
  "episodeNumber": 1,
  "seriesId": 2003,
  "seriesTitle": "朱雀堂",
  "duration": 1500,
  "downloadUrls": [
    {
      "id": 592,
      "quality": "720p",
      "cdnUrl": "https://cdn.example.com/video/720p.m3u8",
      "ossUrl": "https://oss.example.com/video/720p.mp4",
      "originUrl": "https://origin.example.com/video.mp4",
      "subtitleUrl": null,
      "accessKey": "FE27A9CA890D9B196E211D783C622716"
    },
    {
      "id": 593,
      "quality": "1080p",
      "cdnUrl": "https://cdn.example.com/video/1080p.m3u8",
      "ossUrl": "https://oss.example.com/video/1080p.mp4",
      "originUrl": "https://origin.example.com/video.mp4",
      "subtitleUrl": "https://cdn.example.com/subtitles/cn.srt",
      "accessKey": "AB12CD34EF56GH78IJ90KL12MN34OP56"
    }
  ]
}
```

**错误响应**:
```json
{
  "success": false,
  "message": "剧集不存在"
}
```

## 📊 响应字段说明

### 剧集基本信息

| 字段 | 类型 | 说明 |
|------|------|------|
| `success` | boolean | 请求是否成功 |
| `episodeId` | number | 剧集ID |
| `episodeShortId` | string | 剧集短ID（11位安全标识符） |
| `episodeTitle` | string | 剧集标题 |
| `episodeNumber` | number | 集数编号 |
| `seriesId` | number | 所属系列ID |
| `seriesTitle` | string | 所属系列标题 |
| `duration` | number | 时长（秒） |

### 下载地址字段

每个 `downloadUrls` 数组项包含：

| 字段 | 类型 | 说明 | 推荐用途 |
|------|------|------|----------|
| `id` | number | 地址记录ID | 唯一标识 |
| `quality` | string | 清晰度标识 | 显示给用户选择 |
| `cdnUrl` | string | CDN 加速地址 | 在线播放（可能是 m3u8 流） |
| `ossUrl` | string | 对象存储直链 | **推荐用于下载（通常是 mp4）** |
| `originUrl` | string | 原始来源地址 | 追溯或回源 |
| `subtitleUrl` | string\|null | 字幕文件地址 | 下载外挂字幕 |
| `accessKey` | string | 访问密钥 | 安全访问控制 |

## 💡 下载视频的方法

### 方法1: 使用下载脚本（推荐，最简单）⭐

我们提供了专门的下载脚本，可以自动获取地址并下载视频：

```bash
# 下载剧集（使用第一个可用清晰度）
node scripts/download-episode.js <episodeId>

# 下载指定清晰度
node scripts/download-episode.js <episodeId> <quality>

# 下载到指定目录
node scripts/download-episode.js <episodeId> <quality> <outputDir>
```

**示例**:
```bash
# 下载剧集28808的第一个可用清晰度到默认目录（./downloads）
node scripts/download-episode.js 28808

# 下载1080p清晰度
node scripts/download-episode.js 28808 1080p

# 下载720p到指定目录
node scripts/download-episode.js 28808 720p ./my-videos
```

**功能特性**:
- ✅ 自动获取下载地址
- ✅ 支持选择清晰度
- ✅ 自动下载字幕（如果有）
- ✅ 智能文件命名：`系列名_EP集数_清晰度.mp4`
- ✅ 进度条显示
- ✅ 自动创建目录

### 方法2: 使用 curl/wget 命令

先获取下载地址，然后使用命令行工具下载：

```bash
# 1. 获取下载地址
curl "http://localhost:8080/api/admin/episodes/28808/download-urls" | jq -r '.downloadUrls[0].cdnUrl'

# 2. 使用返回的URL下载
curl -L "https://s3.656932.com/.../video.mp4" -o video.mp4

# 或使用 wget
wget "https://s3.656932.com/.../video.mp4" -O video.mp4
```

### 方法3: 浏览器直接下载

1. 获取下载地址 API：`http://localhost:8080/api/admin/episodes/:id/download-urls`
2. 复制返回的 `cdnUrl` 或 `ossUrl`
3. 在浏览器中打开该 URL 即可下载

### 方法4: 集成到应用

在你的应用中调用 API 获取下载地址，然后触发下载：

```javascript
// JavaScript 示例
async function downloadEpisode(episodeId) {
  // 1. 获取下载地址
  const response = await fetch(`/api/admin/episodes/${episodeId}/download-urls`);
  const data = await response.json();
  
  // 2. 创建下载链接
  const downloadUrl = data.downloadUrls[0].ossUrl || data.downloadUrls[0].cdnUrl;
  const filename = `${data.seriesTitle}_EP${data.episodeNumber}.mp4`;
  
  // 3. 触发浏览器下载
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = filename;
  a.click();
}
```

## 💡 使用建议

### 1. 选择下载地址

根据不同场景选择合适的地址：

- **直接下载**: 优先使用 `ossUrl`
  - 通常是 mp4 格式，兼容性好
  - 可以直接下载到本地
  - 速度稳定，适合大文件下载

- **在线播放**: 使用 `cdnUrl`
  - 可能是 m3u8 流媒体格式
  - 支持自适应码率
  - 适合在线观看

- **源站回溯**: 使用 `originUrl`
  - 原始采集地址
  - 用于数据追溯或验证

### 2. 清晰度选择

常见清晰度及其特点：

| 清晰度 | 分辨率 | 文件大小（参考） | 适用场景 |
|--------|--------|------------------|----------|
| 360p | 640x360 | ~200MB/小时 | 移动网络、低速连接 |
| 480p | 854x480 | ~400MB/小时 | 标清观看 |
| 720p | 1280x720 | ~800MB/小时 | 高清观看 |
| 1080p | 1920x1080 | ~1.5GB/小时 | 全高清观看 |
| 4K | 3840x2160 | ~4GB/小时 | 超高清观看 |

### 3. 字幕处理

如果 `subtitleUrl` 不为空：
- 可以同时下载字幕文件
- 常见格式：srt, vtt, ass
- 建议保存在同一目录，文件名保持一致

### 4. 批量下载

如需批量下载某个系列的所有剧集：

```bash
# 1. 先获取系列的所有剧集列表
curl -X GET "http://localhost:8080/api/admin/episodes?seriesId=2003&size=200"

# 2. 遍历每个剧集ID，调用下载地址接口
for episode_id in episode_ids:
    curl -X GET "http://localhost:8080/api/admin/episodes/${episode_id}/download-urls"
```

## 🧪 测试方法

### 使用测试脚本

项目提供了专门的测试脚本：

```bash
# 测试指定剧集的下载地址
node scripts/test-download-urls.js 2136

# 使用自定义 API 地址
ADMIN_API_URL=http://your-server:8080/api node scripts/test-download-urls.js 2136
```

### 手动测试

**步骤1**: 获取一个剧集ID
```bash
# 查看剧集列表
curl -X GET "http://localhost:8080/api/admin/episodes?page=1&size=10"
```

**步骤2**: 使用剧集ID获取下载地址
```bash
# 替换 {episodeId} 为实际的剧集ID
curl -X GET "http://localhost:8080/api/admin/episodes/{episodeId}/download-urls" \
  -H "Content-Type: application/json"
```

**步骤3**: 验证响应
- 检查 `success` 字段是否为 `true`
- 确认 `downloadUrls` 数组不为空
- 验证各个 URL 是否可访问

## 🔒 安全建议

1. **访问控制**
   - 该接口应仅限管理员使用
   - 建议添加身份验证中间件
   - 记录访问日志以备审计

2. **URL 安全**
   - 返回的 URL 包含访问密钥
   - 避免在日志中记录完整 URL
   - 设置适当的 URL 过期时间（根据存储服务配置）

3. **限流保护**
   - 建议添加请求频率限制
   - 防止滥用导致存储服务压力
   - 可以使用 Redis 实现限流

## 📋 实现细节

### 代码位置

- **控制器**: `src/admin/controllers/admin-episodes.controller.ts`
- **方法**: `getDownloadUrls()`
- **实体**: 
  - `Episode` - 剧集实体
  - `EpisodeUrl` - 播放地址实体

### 数据流程

```
客户端请求
    ↓
AdminEpisodesController.getDownloadUrls()
    ↓
查询数据库（Episode + EpisodeUrl）
    ↓
格式化响应数据
    ↓
返回JSON响应
```

### 数据库查询

```typescript
const episode = await this.episodeRepo.findOne({ 
  where: { id: Number(id) }, 
  relations: ['series', 'urls'] 
});
```

## 🚀 未来扩展

虽然当前版本不包含统计功能，但如果后续需要，可以考虑：

1. **下载统计**
   - 记录下载次数
   - 统计热门清晰度
   - 分析下载时段

2. **下载限制**
   - 单IP限流
   - 并发下载数控制
   - VIP用户优先级

3. **文件管理**
   - 支持断点续传
   - 压缩打包下载
   - 自动清理过期文件

## 📞 技术支持

如遇问题，请检查：
- 服务是否正常运行（管理端端口 8080）
- 数据库连接是否正常
- 剧集ID是否存在
- 查看服务端日志获取详细错误信息

相关文档：
- [Admin API 文档](./admin-api.md)
- [测试脚本说明](../scripts/README.md)
- [开发指南](./development-guide.md)

