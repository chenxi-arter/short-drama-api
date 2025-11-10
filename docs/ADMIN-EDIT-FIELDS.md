# 📝 Admin 剧集和系列可编辑字段文档

## 系列 (Series) 可编辑字段

### 接口地址
- **创建**: `POST /api/admin/series`
- **更新**: `PUT /api/admin/series/:id`
- **获取**: `GET /api/admin/series/:id`
- **列表**: `GET /api/admin/series`
- **删除**: `DELETE /api/admin/series/:id` (软删除)
- **恢复**: `POST /api/admin/series/:id/restore`

### 所有可编辑字段

#### 📄 基本信息字段

| 字段名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| `title` | string | 是 | 系列标题 | "恋爱潜伏" |
| `description` | string | 否 | 系列简介/描述 | "一部精彩的都市爱情剧..." |
| `coverUrl` | string | 否 | 封面图URL | "https://example.com/cover.jpg" |
| `externalId` | string | 否 | 外部唯一ID（用于采集与幂等） | "ext_12345" |
| `shortId` | string | 否 | 短ID标识符（11位） | "N8Tg2KtBQPN" |

#### 👥 演员和制作人员

| 字段名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| `starring` | string | 否 | 主演名单（逗号分隔） | "张三,李四,王五" |
| `actor` | string | 否 | 演员名单（逗号分隔） | "张三,李四,王五,赵六" |
| `director` | string | 否 | 导演（逗号分隔） | "陈导,刘导" |

#### 📊 统计和状态字段

| 字段名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| `score` | number | 否 | 评分（0-10） | 8.5 |
| `playCount` | number | 否 | 播放次数 | 10000 |
| `totalEpisodes` | number | 否 | 总集数 | 40 |
| `upStatus` | string | 否 | 更新状态 | "已完结" / "更新中" |
| `upCount` | number | 否 | 更新次数 | 5 |

#### 🏷️ 分类和筛选字段

| 字段名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| `categoryId` | number | 否 | 分类ID | 1 |
| `regionOptionId` | number | 否 | 地区选项ID | 1 |
| `languageOptionId` | number | 否 | 语言选项ID | 1 |
| `statusOptionId` | number | 否 | 状态选项ID | 1 |
| `yearOptionId` | number | 否 | 年份选项ID | 1 |

#### 📅 日期和状态字段

| 字段名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| `releaseDate` | Date | 否 | 发布日期 | "2025-01-01" |
| `isCompleted` | boolean | 否 | 是否完结 | true / false |
| `isActive` | number | 否 | 是否活跃（1=正常，0=已删除） | 1 |
| `deletedAt` | Date | 否 | 删除时间 | "2025-01-01T00:00:00Z" |
| `deletedBy` | number | 否 | 删除者用户ID | 123 |

---

## 剧集 (Episode) 可编辑字段

### 接口地址
- **创建**: `POST /api/admin/episodes`
- **更新**: `PUT /api/admin/episodes/:id`
- **获取**: `GET /api/admin/episodes/:id`
- **列表**: `GET /api/admin/episodes`
- **删除**: `DELETE /api/admin/episodes/:id`

### 所有可编辑字段

#### 📄 基本信息字段

| 字段名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| `seriesId` | number | 是 | 所属系列ID | 2448 |
| `episodeNumber` | number | 是 | 集数编号 | 1 |
| `title` | string | 是 | 剧集标题 | "第1集" |
| `duration` | number | 是 | 时长（秒） | 1800 |
| `status` | string | 否 | 状态 | "published" / "hidden" / "draft" |
| `shortId` | string | 否 | 短ID标识符（11位） | "xxCnjrpPEuZ" |
| `accessKey` | string | 否 | 访问密钥（64位） | "abc123..." |

#### 📊 统计字段

| 字段名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| `playCount` | number | 否 | 播放次数 | 1000 |
| `likeCount` | number | 否 | 点赞数 | 50 |
| `dislikeCount` | number | 否 | 点踩数 | 5 |
| `favoriteCount` | number | 否 | 收藏数 | 30 |

#### 🎬 播放设置

| 字段名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| `isVertical` | boolean | 否 | 是否竖屏播放 | true / false |
| `hasSequel` | boolean | 否 | 是否有续集 | true / false |

---

## 使用示例

### 创建系列

```bash
curl -X POST http://localhost:8080/api/admin/series \
  -H "Content-Type: application/json" \
  -d '{
    "title": "恋爱潜伏",
    "description": "一部精彩的都市爱情剧",
    "coverUrl": "https://example.com/cover.jpg",
    "starring": "张三,李四",
    "director": "陈导",
    "categoryId": 1,
    "score": 8.5,
    "totalEpisodes": 40,
    "isCompleted": false,
    "releaseDate": "2025-01-01"
  }'
```

### 更新系列

```bash
curl -X PUT http://localhost:8080/api/admin/series/2448 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "恋爱潜伏（修改后）",
    "score": 9.0,
    "isCompleted": true,
    "totalEpisodes": 45
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
    "isVertical": false
  }'
```

### 更新剧集

```bash
curl -X PUT http://localhost:8080/api/admin/episodes/12345 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "第1集（修改后）",
    "duration": 1900,
    "playCount": 2000,
    "likeCount": 100
  }'
```

### 批量更新示例

```bash
# 更新系列的多个字段
curl -X PUT http://localhost:8080/api/admin/series/2448 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "新标题",
    "description": "新描述",
    "starring": "新主演1,新主演2",
    "actor": "新演员1,新演员2,新演员3",
    "director": "新导演",
    "score": 9.5,
    "playCount": 50000,
    "totalEpisodes": 50,
    "upStatus": "已完结",
    "isCompleted": true
  }'
```

---

## 字段类型说明

### 字符串 (string)
- 直接传递字符串值
- 示例: `"title": "恋爱潜伏"`

### 数字 (number)
- 传递数字或数字字符串都可以
- 示例: `"score": 8.5` 或 `"score": "8.5"`

### 布尔值 (boolean)
- 可以传递: `true`, `false`, `1`, `0`, `"true"`, `"false"`, `"1"`, `"0"`
- 示例: `"isCompleted": true` 或 `"isCompleted": "true"`

### 日期 (Date)
- 传递ISO 8601格式的日期字符串
- 示例: `"releaseDate": "2025-01-01"` 或 `"releaseDate": "2025-01-01T00:00:00Z"`

---

## 特殊字段说明

### shortId
- **长度**: 11位
- **格式**: 类似base64编码
- **用途**: 防止枚举攻击的安全标识符
- **注意**: 创建时会自动生成，也可以手动指定

### accessKey
- **长度**: 64位
- **格式**: 随机字符串
- **用途**: 剧集级访问密钥
- **注意**: 创建时会自动生成，也可以手动指定

### externalId
- **用途**: 用于数据采集和幂等性保证
- **唯一性**: 必须唯一
- **注意**: 适合用于第三方数据源的ID映射

### isActive
- **值**: 1 = 正常，0 = 已删除
- **用途**: 软删除标记
- **注意**: 删除系列时会自动设置为0

---

## 注意事项

### 1. 必填字段
创建时必须提供的字段：
- **系列**: `title`
- **剧集**: `seriesId`, `episodeNumber`, `title`, `duration`

### 2. 唯一性约束
以下字段必须唯一：
- `shortId` (系列和剧集)
- `externalId` (系列)
- `accessKey` (剧集)

### 3. 外键关联
- `categoryId` 必须存在于 `category` 表
- `regionOptionId`, `languageOptionId`, `statusOptionId`, `yearOptionId` 必须存在于 `filter_options` 表
- `seriesId` 必须存在于 `series` 表

### 4. 数据验证
- `score`: 建议范围 0-10
- `duration`: 单位为秒
- `episodeNumber`: 建议从1开始递增
- `status`: 建议值 "published", "hidden", "draft"

### 5. 软删除
- 使用 `DELETE /api/admin/series/:id` 会软删除（设置 `isActive=0`）
- 使用 `POST /api/admin/series/:id/restore` 可以恢复
- 剧集的删除是硬删除

---

## 完整字段列表速查

### 系列 (Series) - 23个可编辑字段
```typescript
{
  // 基本信息 (5)
  title, description, coverUrl, externalId, shortId,
  
  // 人员 (3)
  starring, actor, director,
  
  // 统计 (5)
  score, playCount, totalEpisodes, upStatus, upCount,
  
  // 分类 (5)
  categoryId, regionOptionId, languageOptionId, statusOptionId, yearOptionId,
  
  // 状态 (5)
  releaseDate, isCompleted, isActive, deletedAt, deletedBy
}
```

### 剧集 (Episode) - 13个可编辑字段
```typescript
{
  // 基本信息 (7)
  seriesId, episodeNumber, title, duration, status, shortId, accessKey,
  
  // 统计 (4)
  playCount, likeCount, dislikeCount, favoriteCount,
  
  // 设置 (2)
  isVertical, hasSequel
}
```

---

## 前端表单建议

### 系列编辑表单分组

1. **基本信息**
   - 标题、描述、封面图

2. **人员信息**
   - 主演、演员、导演

3. **分类信息**
   - 分类、地区、语言、状态、年份

4. **统计信息**
   - 评分、播放次数、总集数

5. **状态信息**
   - 更新状态、是否完结、发布日期

### 剧集编辑表单分组

1. **基本信息**
   - 所属系列、集数、标题、时长

2. **播放设置**
   - 状态、是否竖屏、是否有续集

3. **统计信息**
   - 播放次数、点赞数、点踩数、收藏数

---

## 更新日志

- **2025-11-10**: 增强所有可编辑字段支持，包括 shortId, accessKey, totalEpisodes, hasSequel 等
- **2025-11-10**: 添加完整的字段文档和使用示例
