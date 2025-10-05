# isVertical 字段实现文档

**实施日期**: 2025-10-05  
**功能**: 为剧集添加横屏/竖屏播放标识

---

## 📋 功能概述

为 `episodes` 表添加了 `is_vertical` 字段，用于标识视频是横屏还是竖屏播放。

- **横屏播放**: `isVertical = false` (默认)
- **竖屏播放**: `isVertical = true`

---

## 🗄️ 数据库变更

### 迁移脚本

**文件**: `migrations/add_is_vertical_to_episodes.sql`

```sql
ALTER TABLE `episodes`
ADD COLUMN `is_vertical` TINYINT(1) NOT NULL DEFAULT 0 
COMMENT '是否竖屏播放（0=横屏，1=竖屏）' 
AFTER `status`;
```

### 字段说明

| 字段名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `is_vertical` | TINYINT(1) | 0 | 0=横屏播放，1=竖屏播放 |

---

## 💻 代码变更

### 1. Entity 实体类

**文件**: `src/video/entity/episode.entity.ts`

```typescript
@Column({ type: 'boolean', default: false, name: 'is_vertical' })
isVertical: boolean;
```

### 2. DTO 接口定义

**文件**: `src/video/dto/episode-list.dto.ts`

```typescript
export interface EpisodeBasicInfo {
  // ... 其他字段
  status: string;                // 状态
  isVertical: boolean;           // 是否竖屏播放（false=横屏，true=竖屏）
  createdAt: string;             // 创建时间
  // ... 其他字段
}
```

### 3. Service 服务层

**文件**: `src/video/services/content.service.ts`

```typescript
return {
  id: ep.id,
  shortId: ep.shortId,
  episodeNumber: ep.episodeNumber,
  episodeTitle: String(ep.episodeNumber).padStart(2, '0'),
  title: ep.title,
  duration: ep.duration,
  status: ep.status,
  isVertical: Boolean(ep.isVertical),  // ✅ 新增字段
  createdAt: DateUtil.formatDateTime(ep.createdAt),
  // ... 其他字段
};
```

---

## 🔌 API 接口

### 获取剧集列表（公开接口）

**请求示例**:
```bash
curl "http://localhost:8080/api/public/video/episodes?seriesShortId=N8Tg2KtBQPN&size=2"
```

**响应示例**:
```json
{
  "code": 200,
  "msg": null,
  "data": {
    "total": 21,
    "page": 1,
    "size": 2,
    "list": [
      {
        "id": 12328,
        "shortId": "6JswefD4QXK",
        "episodeNumber": 1,
        "title": "01",
        "duration": 716,
        "status": "published",
        "isVertical": true,  // ✅ 竖屏播放
        "createdAt": "2025-01-15 10:30:00",
        "updatedAt": "2025-01-15 10:30:00",
        "seriesId": 1001,
        "seriesTitle": "示例剧集",
        "seriesShortId": "N8Tg2KtBQPN"
      },
      {
        "id": 12331,
        "shortId": "dxMXenqKsy5",
        "episodeNumber": 2,
        "title": "02",
        "duration": 743,
        "status": "published",
        "isVertical": false,  // ✅ 横屏播放
        "createdAt": "2025-01-15 10:35:00",
        "updatedAt": "2025-01-15 10:35:00",
        "seriesId": 1001,
        "seriesTitle": "示例剧集",
        "seriesShortId": "N8Tg2KtBQPN"
      }
    ]
  }
}
```

### 相关接口

所有返回剧集列表的接口都包含 `isVertical` 字段：

1. **公开接口**: `GET /api/public/video/episodes`
2. **认证接口**: `GET /api/video/episodes` (需要 JWT token)

---

## 🎯 使用场景

### 前端播放器适配

```typescript
interface Episode {
  id: number;
  shortId: string;
  title: string;
  isVertical: boolean;  // ✅ 根据此字段选择播放器方向
  // ... 其他字段
}

// 前端代码示例
function initPlayer(episode: Episode) {
  const playerOrientation = episode.isVertical ? 'portrait' : 'landscape';
  
  if (episode.isVertical) {
    // 初始化竖屏播放器（9:16 比例）
    initVerticalPlayer(episode);
  } else {
    // 初始化横屏播放器（16:9 比例）
    initHorizontalPlayer(episode);
  }
}
```

### 数据库更新示例

```sql
-- 将某个剧集设置为竖屏播放
UPDATE episodes SET is_vertical = 1 WHERE id = 12328;

-- 将某个系列的所有剧集设置为竖屏播放
UPDATE episodes SET is_vertical = 1 WHERE series_id = 1001;

-- 查询所有竖屏剧集
SELECT id, episode_number, title, is_vertical 
FROM episodes 
WHERE is_vertical = 1;
```

---

## ✅ 测试验证

### 1. 数据库字段验证

```bash
docker exec short-drama-mysql mysql -uroot -p123456 -e \
  "USE short_drama; SHOW COLUMNS FROM episodes;" | grep is_vertical
```

**预期输出**:
```
is_vertical	tinyint(1)	NO		0
```

### 2. API 响应验证

```bash
curl -s "http://localhost:8080/api/public/video/episodes?seriesShortId=N8Tg2KtBQPN&size=2" \
  | jq '.data.list[] | {episodeNumber, title, isVertical}'
```

**预期输出**:
```json
{
  "episodeNumber": 1,
  "title": "01",
  "isVertical": true
}
{
  "episodeNumber": 2,
  "title": "02",
  "isVertical": false
}
```

---

## 📝 注意事项

1. **默认值**: 所有现有剧集的 `isVertical` 默认为 `false` (横屏)
2. **数据类型**: TypeORM 将 MySQL 的 `TINYINT(1)` 映射为 JavaScript 的 `boolean` 类型
3. **向后兼容**: 此字段为新增字段，不影响现有 API 的其他功能
4. **缓存**: 如果启用了 Redis 缓存，更新剧集的 `isVertical` 后需要清除缓存或等待缓存过期

---

## 🔄 后续优化建议

1. **批量更新工具**: 可以创建管理接口，批量设置某个系列的所有剧集为竖屏/横屏
2. **筛选功能**: 在筛选接口中添加按播放方向筛选的功能
3. **统计分析**: 统计横屏/竖屏剧集的播放数据，用于内容策略优化
4. **Admin 接口**: 在后台管理系统中添加编辑 `isVertical` 的功能

---

## 📚 相关文档

- [前端 API 使用指南](./frontend-api-guide.md)
- [数据库架构文档](./database-schema-documentation.md)
- [API 变更文档](./api-changes-documentation.md)
