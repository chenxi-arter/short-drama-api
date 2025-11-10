# 📝 Admin 系列和剧集编辑权限说明

## 系列 (Series) 字段权限

### ✅ 可编辑字段

#### 基本信息
- `title` - 标题
- `description` - 描述
- `coverUrl` - 封面图URL

#### 人员信息
- `starring` - 主演（逗号分隔）
- `actor` - 演员（逗号分隔）
- `director` - 导演（逗号分隔）

#### 分类信息（支持中文名称或ID）
- `categoryId` - 分类ID
- `region` / `regionOptionId` - 地区（中文名称或ID）
- `language` / `languageOptionId` - 语言（中文名称或ID）
- `status` / `statusOptionId` - 状态（中文名称或ID）
- `year` / `yearOptionId` - 年份（中文名称或ID）

#### 状态信息
- `score` - 评分（0-10）
- `upStatus` - 更新状态（如"已完结"、"更新中"）
- `upCount` - 更新次数
- `releaseDate` - 发布日期
- `isCompleted` - 是否完结
- `isActive` - 是否活跃（1=正常，0=已删除）

### 🔒 只读字段（只展示，不可编辑）

#### 系统字段
- `id` - 主键ID
- `shortId` - 短ID标识符（11位，防枚举攻击）
- `externalId` - 外部ID（用于采集与幂等）
- `createdAt` - 创建时间
- `updatedAt` - 更新时间

#### 统计字段
- `playCount` - 播放次数
- `totalEpisodes` - 总集数

#### 删除相关
- `deletedAt` - 删除时间
- `deletedBy` - 删除者用户ID

---

## 剧集 (Episode) 字段权限

### ✅ 可编辑字段

#### 基本信息
- `seriesId` - 所属系列ID
- `episodeNumber` - 集数编号
- `title` - 标题
- `duration` - 时长（秒）
- `status` - 状态（published/hidden/draft）

#### 播放设置
- `isVertical` - 是否竖屏播放
- `hasSequel` - 是否有续集

### 🔒 只读字段（只展示，不可编辑）

#### 系统字段
- `id` - 主键ID
- `shortId` - 短ID标识符（11位）
- `accessKey` - 访问密钥（64位）
- `createdAt` - 创建时间
- `updatedAt` - 更新时间

#### 统计字段
- `playCount` - 播放次数
- `likeCount` - 点赞数
- `dislikeCount` - 点踩数
- `favoriteCount` - 收藏数

---

## 🌟 中文分类字段支持

### 使用方式

你可以使用**中文名称**或**ID**来设置分类信息，系统会自动识别并转换。

#### 方式1：使用中文名称（推荐）

```bash
curl -X PUT http://localhost:8080/api/admin/series/2448 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "恋爱潜伏",
    "region": "大陆",
    "language": "国语",
    "status": "连载",
    "year": "2024"
  }'
```

#### 方式2：使用ID

```bash
curl -X PUT http://localhost:8080/api/admin/series/2448 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "恋爱潜伏",
    "regionOptionId": 1,
    "languageOptionId": 2,
    "statusOptionId": 3,
    "yearOptionId": 4
  }'
```

#### 方式3：混合使用

```bash
curl -X PUT http://localhost:8080/api/admin/series/2448 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "恋爱潜伏",
    "region": "大陆",           # 使用中文
    "languageOptionId": 2,      # 使用ID
    "status": "连载",           # 使用中文
    "yearOptionId": 4           # 使用ID
  }'
```

### 支持的中文字段

| 中文字段 | 对应ID字段 | 筛选器类型 | 示例值 |
|---------|-----------|----------|--------|
| `region` | `regionOptionId` | region | "大陆"、"香港"、"台湾"、"美国" |
| `language` | `languageOptionId` | language | "国语"、"粤语"、"英语" |
| `status` | `statusOptionId` | status | "连载"、"完结" |
| `year` | `yearOptionId` | year | "2024"、"2023" |

### 查询可用的分类选项

```bash
# 查询所有筛选器类型和选项
curl http://localhost:8080/api/video/filters
```

返回示例：
```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "name": "地区",
      "code": "region",
      "options": [
        { "id": 1, "name": "大陆" },
        { "id": 2, "name": "香港" },
        { "id": 3, "name": "台湾" }
      ]
    },
    {
      "id": 2,
      "name": "语言",
      "code": "language",
      "options": [
        { "id": 4, "name": "国语" },
        { "id": 5, "name": "粤语" }
      ]
    }
  ]
}
```

---

## 使用示例

### 创建系列（使用中文分类）

```bash
curl -X POST http://localhost:8080/api/admin/series \
  -H "Content-Type: application/json" \
  -d '{
    "title": "恋爱潜伏",
    "description": "一部精彩的都市爱情剧",
    "coverUrl": "https://example.com/cover.jpg",
    "starring": "张三,李四",
    "actor": "张三,李四,王五",
    "director": "陈导",
    "categoryId": 1,
    "region": "大陆",
    "language": "国语",
    "status": "连载",
    "year": "2024",
    "score": 8.5,
    "releaseDate": "2025-01-01",
    "isCompleted": false
  }'
```

### 更新系列（只修改部分字段）

```bash
curl -X PUT http://localhost:8080/api/admin/series/2448 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "恋爱潜伏（修改后）",
    "score": 9.0,
    "status": "完结",
    "isCompleted": true
  }'
```

### 创建剧集

```bash
curl -X POST http://localhost:8080/api/admin/episodes \
  -H "Content-Type: application/json" \
  -d '{
    "seriesId": 2448,
    "episodeNumber": 1,
    "title": "第1集",
    "duration": 1800,
    "status": "published",
    "isVertical": false,
    "hasSequel": true
  }'
```

### 更新剧集

```bash
curl -X PUT http://localhost:8080/api/admin/episodes/12345 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "第1集（修改后）",
    "duration": 1900,
    "status": "published"
  }'
```

---

## 返回数据说明

### 更新系列后的返回

更新系列后，返回的数据会包含关联的分类信息：

```json
{
  "id": 2448,
  "shortId": "N8Tg2KtBQPN",
  "title": "恋爱潜伏",
  "description": "一部精彩的都市爱情剧",
  "coverUrl": "https://example.com/cover.jpg",
  "externalId": null,
  "starring": "张三,李四",
  "actor": "张三,李四,王五",
  "director": "陈导",
  "score": 9.0,
  "playCount": 10000,
  "totalEpisodes": 40,
  "upStatus": "已完结",
  "upCount": 5,
  "isCompleted": true,
  "isActive": 1,
  "releaseDate": "2025-01-01T00:00:00.000Z",
  "createdAt": "2024-11-02T00:00:00.000Z",
  "updatedAt": "2025-11-10T15:00:00.000Z",
  "deletedAt": null,
  "deletedBy": null,
  "categoryId": 1,
  "regionOptionId": 1,
  "languageOptionId": 4,
  "statusOptionId": 3,
  "yearOptionId": 10,
  "category": {
    "id": 1,
    "name": "都市"
  },
  "regionOption": {
    "id": 1,
    "name": "大陆"
  },
  "languageOption": {
    "id": 4,
    "name": "国语"
  },
  "statusOption": {
    "id": 3,
    "name": "完结"
  },
  "yearOption": {
    "id": 10,
    "name": "2024"
  }
}
```

---

## 注意事项

### 1. 只读字段保护
- ❌ 尝试编辑 `shortId`、`externalId`、`playCount` 等只读字段会被忽略
- ✅ 只有明确标记为可编辑的字段才会被更新

### 2. 中文分类字段
- ✅ 支持使用中文名称（如"大陆"、"国语"）
- ✅ 支持使用ID（如 `regionOptionId: 1`）
- ✅ 中文名称会自动查找对应的ID
- ⚠️ 如果中文名称不存在，该字段会被忽略

### 3. 数据验证
- `score`: 建议范围 0-10
- `duration`: 单位为秒
- `episodeNumber`: 建议从1开始递增
- `status`: 建议值 "published", "hidden", "draft"

### 4. 软删除
- 使用 `DELETE /api/admin/series/:id` 会软删除（设置 `isActive=0`）
- 使用 `POST /api/admin/series/:id/restore` 可以恢复
- 剧集的删除是硬删除

---

## 前端表单建议

### 系列编辑表单

```typescript
interface SeriesFormData {
  // 基本信息
  title: string;
  description?: string;
  coverUrl?: string;
  
  // 人员信息
  starring?: string;
  actor?: string;
  director?: string;
  
  // 分类信息（使用中文）
  region?: string;      // "大陆"、"香港"等
  language?: string;    // "国语"、"粤语"等
  status?: string;      // "连载"、"完结"等
  year?: string;        // "2024"、"2023"等
  categoryId?: number;
  
  // 状态信息
  score?: number;
  upStatus?: string;
  upCount?: number;
  releaseDate?: string;
  isCompleted?: boolean;
  isActive?: number;
}
```

### 剧集编辑表单

```typescript
interface EpisodeFormData {
  // 基本信息
  seriesId: number;
  episodeNumber: number;
  title: string;
  duration: number;
  status?: string;
  
  // 播放设置
  isVertical?: boolean;
  hasSequel?: boolean;
}
```

---

## 字段权限总结

### 系列 - 18个可编辑字段
```
基本信息: title, description, coverUrl
人员: starring, actor, director
分类: categoryId, region/regionOptionId, language/languageOptionId, 
      status/statusOptionId, year/yearOptionId
状态: score, upStatus, upCount, releaseDate, isCompleted, isActive
```

### 系列 - 10个只读字段
```
系统: id, shortId, externalId, createdAt, updatedAt
统计: playCount, totalEpisodes
删除: deletedAt, deletedBy
```

### 剧集 - 7个可编辑字段
```
基本: seriesId, episodeNumber, title, duration, status
设置: isVertical, hasSequel
```

### 剧集 - 9个只读字段
```
系统: id, shortId, accessKey, createdAt, updatedAt
统计: playCount, likeCount, dislikeCount, favoriteCount
```

---

## 更新日志

- **2025-11-10**: 移除敏感字段（shortId、externalId、accessKey）的编辑权限
- **2025-11-10**: 移除统计字段（playCount、likeCount等）的编辑权限
- **2025-11-10**: 保留 score 和 isActive 的编辑权限
- **2025-11-10**: 新增中文分类字段支持（region、language、status、year）
