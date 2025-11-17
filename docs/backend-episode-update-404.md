# ✅ 剧集更新接口 404 错误 - 已修复

## 问题描述

前端在编辑剧集并点击"保存"按钮后，调用更新接口失败，返回 404 错误。

## 修复状态

**✅ 已修复** - 2025-11-17 00:43

已实现所有缺失的CRUD接口：
- ✅ `GET /api/admin/episodes/:id` - 获取剧集详情
- ✅ `POST /api/admin/episodes` - 创建剧集
- ✅ `PUT /api/admin/episodes/:id` - 更新剧集
- ✅ `DELETE /api/admin/episodes/:id` - 删除剧集

---

## 错误信息

```
PUT http://localhost:9090/api/admin/episodes/28835 404 (Not Found)
```

---

## 涉及的接口

**接口路径**: `PUT /api/admin/episodes/:id`

**请求示例**:
```http
PUT /api/admin/episodes/28835
Content-Type: application/json

{
  "seriesId": 3152,
  "episodeNumber": 13,
  "title": "第十三集",
  "duration": 829,
  "status": "published",
  "isVertical": false,
  "hasSequel": true
}
```

**预期响应**:
```json
{
  "id": 28835,
  "seriesId": 3152,
  "episodeNumber": 13,
  "title": "第十三集",
  "duration": 829,
  "status": "published",
  "isVertical": false,
  "hasSequel": true,
  "updatedAt": "2025-11-17T00:39:00Z"
}
```

---

## 后端需要实现

### 接口定义

根据 `admin-api.md` 文档（第 503 行），后端应该实现：

```
PUT /api/admin/episodes/:id
```

### 实现示例（NestJS）

```typescript
@Put(':id')
async update(
  @Param('id') id: string,
  @Body() updateDto: UpdateEpisodeDto
): Promise<Episode> {
  const episodeId = parseInt(id);
  
  // 更新剧集信息
  const updatedEpisode = await this.episodesService.update(episodeId, {
    seriesId: updateDto.seriesId,
    episodeNumber: updateDto.episodeNumber,
    title: updateDto.title,
    duration: updateDto.duration,
    status: updateDto.status,
    isVertical: updateDto.isVertical,
    hasSequel: updateDto.hasSequel,
  });
  
  return updatedEpisode;
}
```

### 实现示例（Express）

```javascript
router.put('/episodes/:id', async (req, res) => {
  try {
    const episodeId = parseInt(req.params.id);
    const updateData = req.body;
    
    // 更新剧集
    const updatedEpisode = await db.episodes.update({
      where: { id: episodeId },
      data: {
        seriesId: updateData.seriesId,
        episodeNumber: updateData.episodeNumber,
        title: updateData.title,
        duration: updateData.duration,
        status: updateData.status,
        isVertical: updateData.isVertical,
        hasSequel: updateData.hasSequel,
        updatedAt: new Date(),
      },
    });
    
    res.json(updatedEpisode);
  } catch (error) {
    console.error('更新剧集失败:', error);
    res.status(500).json({ error: '更新失败' });
  }
});
```

---

## 前端调用代码

```typescript
// src/api/admin.ts
export const EpisodesAPI = {
  update: (id: number | string, data: EpisodeUpdatePayload) => 
    api.put(`/api/admin/episodes/${id}`, data).then(r => r.data),
};

// src/pages/EpisodesPage.tsx
const handleEditConfirm = async () => {
  await EpisodesAPI.update(editing.id, editingValues);
  message.success('已更新');
};
```

---

## 测试方法

### 使用 curl 测试

```bash
curl -X PUT "http://localhost:9090/api/admin/episodes/28835" \
  -H "Content-Type: application/json" \
  -d '{
    "seriesId": 3152,
    "episodeNumber": 13,
    "title": "第十三集",
    "duration": 829,
    "status": "published",
    "isVertical": false,
    "hasSequel": true
  }'
```

**预期结果**: 返回 200 OK 和更新后的剧集对象

---

## 影响范围

- ❌ 无法编辑剧集的基本信息（标题、集数、时长等）
- ❌ 无法修改剧集状态
- ❌ 无法更改播放方向（横屏/竖屏）
- ✅ 视频上传功能正常（使用不同的接口）

---

## 优先级

**P0 - 紧急**

这是核心功能，用户无法编辑剧集信息。

---

## 相关接口状态

| 接口 | 状态 | 说明 |
|------|------|------|
| `GET /api/admin/episodes` | ✅ 正常 | 列表查询 |
| `GET /api/admin/episodes/:id` | ✅ 正常 | 详情查询 |
| `POST /api/admin/episodes` | ✅ 正常 | 创建剧集 |
| `PUT /api/admin/episodes/:id` | ✅ 正常 | **更新剧集** |
| `DELETE /api/admin/episodes/:id` | ✅ 正常 | 删除剧集（级联删除） |
| `GET /api/admin/episodes/:id/download-urls` | ✅ 正常 | 获取下载地址 |
| `GET /api/admin/episodes/:id/presigned-upload-url` | ✅ 正常 | 获取上传URL |
| `POST /api/admin/episodes/:id/upload-complete` | ✅ 正常 | 通知上传完成 |

---

## 实现细节

### 路由顺序
为避免路由冲突，具体路由必须在通用路由之前：
```typescript
@Post()                                    // 创建
@Get(':id/download-urls')                  // 具体路由
@Get(':id/presigned-upload-url')           // 具体路由
@Post(':id/upload-complete')               // 具体路由
@Put(':id')                                // 更新（在 :id 之前）
@Delete(':id')                             // 删除（在 :id 之前）
@Get(':id')                                // 详情（最后）
```

### 测试结果
所有接口已通过完整测试，详见 `test-episodes-crud.sh`

---

## 修复完成

**修复时间**: 2025-11-17 00:43  
**测试状态**: ✅ 全部通过  
**影响范围**: 剧集管理的所有CRUD操作
