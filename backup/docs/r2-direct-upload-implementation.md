# R2 直传功能实现总结

## ✅ 已完成的工作

### 1. 安装依赖包
```bash
npm install @aws-sdk/s3-request-presigner
```

### 2. 扩展 R2StorageService

**文件**: `src/core/storage/r2-storage.service.ts`

新增了两个方法：

#### `generatePresignedUploadUrl()`
生成预签名上传 URL，前端可以使用此 URL 直接上传文件到 R2。

```typescript
async generatePresignedUploadUrl(
  fileKey: string,
  contentType: string,
  expiresIn: number = 3600,
): Promise<string>
```

- **fileKey**: 文件在 R2 中的路径（如 `banners/123/image_uuid.jpg`）
- **contentType**: 文件 MIME 类型（如 `image/jpeg`）
- **expiresIn**: URL 有效期（秒），默认 3600 秒（1 小时）

#### `getPublicUrl()`
获取文件的公开访问 URL。

```typescript
getPublicUrl(fileKey: string): string
```

### 3. 创建 DTO 类

**文件**: `src/admin/dto/presigned-upload.dto.ts`

创建了 4 个 DTO 类用于参数验证：

- `GetPresignedUrlDto`: 获取图片预签名 URL 的查询参数
- `GetVideoPresignedUrlDto`: 获取视频预签名 URL 的查询参数（含清晰度）
- `UploadCompleteDto`: 图片上传完成通知的请求体
- `VideoUploadCompleteDto`: 视频上传完成通知的请求体（含清晰度）

### 4. 实现 Banner 图片上传接口

**文件**: `src/admin/controllers/admin-banners.controller.ts`

#### 4.1 获取预签名 URL
```
GET /api/admin/banners/:id/presigned-upload-url
```

**查询参数**:
- `filename`: 文件名（如 `banner.jpg`）
- `contentType`: 文件类型（如 `image/jpeg`）

**响应示例**:
```json
{
  "uploadUrl": "https://xxx.r2.cloudflarestorage.com/...",
  "fileKey": "banners/123/image_abc123.jpg",
  "publicUrl": "https://static.656932.com/banners/123/image_abc123.jpg"
}
```

**安全验证**:
- ✅ 验证 Banner 是否存在
- ✅ 验证文件类型（只允许 JPEG、PNG、WebP、GIF）
- ✅ 验证文件扩展名
- ✅ 防止路径遍历攻击（检查 `..`, `/`, `\`）
- ✅ 使用 UUID 生成唯一文件名

#### 4.2 上传完成通知
```
POST /api/admin/banners/:id/upload-complete
```

**请求体**:
```json
{
  "fileKey": "banners/123/image_abc123.jpg",
  "publicUrl": "https://static.656932.com/banners/123/image_abc123.jpg",
  "fileSize": 524288
}
```

**功能**:
- 更新 Banner 的 `imageUrl` 字段
- 更新 `updatedAt` 时间戳

### 5. 实现 Episode 视频上传接口

**文件**: `src/admin/controllers/admin-episodes.controller.ts`

#### 5.1 获取预签名 URL
```
GET /api/admin/episodes/:id/presigned-upload-url
```

**查询参数**:
- `filename`: 文件名（如 `video.mp4`）
- `contentType`: 文件类型（如 `video/mp4`）
- `quality`: 清晰度（可选，如 `720p`、`1080p`）

**响应示例**:
```json
{
  "uploadUrl": "https://xxx.r2.cloudflarestorage.com/...",
  "fileKey": "episodes/123/video_720p_abc123.mp4",
  "publicUrl": "https://static.656932.com/episodes/123/video_720p_abc123.mp4",
  "quality": "720p"
}
```

**安全验证**:
- ✅ 验证 Episode 是否存在
- ✅ 验证文件类型（只允许 MP4、MPEG、MOV、AVI、WebM）
- ✅ 验证文件扩展名
- ✅ 验证清晰度参数（360p、480p、720p、1080p、1440p、2160p）
- ✅ 防止路径遍历攻击
- ✅ 使用 UUID 生成唯一文件名
- ✅ 视频上传 URL 有效期设置为 2 小时（考虑大文件上传时间）

#### 5.2 上传完成通知
```
POST /api/admin/episodes/:id/upload-complete
```

**请求体**:
```json
{
  "fileKey": "episodes/123/video_720p_abc123.mp4",
  "publicUrl": "https://static.656932.com/episodes/123/video_720p_abc123.mp4",
  "quality": "720p",
  "fileSize": 10485760
}
```

**功能**:
- 查找是否已存在相同清晰度的记录
- 如果存在，更新 `EpisodeUrl` 记录
- 如果不存在，创建新的 `EpisodeUrl` 记录
- 保存 `cdnUrl`、`ossUrl`、`originUrl` 为公开访问 URL

### 6. 创建测试脚本

**文件**: `test-r2-direct-upload.sh`

自动化测试脚本，包含：
- Banner 图片上传接口测试
- Episode 视频上传接口测试
- 错误处理测试（文件类型、路径安全、清晰度验证）

**使用方法**:
```bash
./test-r2-direct-upload.sh
```

## 📋 API 接口总览

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 获取 Banner 预签名 URL | GET | `/api/admin/banners/:id/presigned-upload-url` | 获取图片上传 URL |
| Banner 上传完成 | POST | `/api/admin/banners/:id/upload-complete` | 通知后端更新 imageUrl |
| 获取 Episode 预签名 URL | GET | `/api/admin/episodes/:id/presigned-upload-url` | 获取视频上传 URL |
| Episode 上传完成 | POST | `/api/admin/episodes/:id/upload-complete` | 通知后端保存到 EpisodeUrl |

## 🔒 安全特性

1. **文件类型验证**
   - 图片：JPEG、PNG、WebP、GIF
   - 视频：MP4、MPEG、MOV、AVI、WebM

2. **文件名安全**
   - 使用 `crypto.randomUUID()` 生成唯一文件名
   - 防止路径遍历攻击（过滤 `..`, `/`, `\`）

3. **文件扩展名验证**
   - 白名单机制，只允许特定扩展名

4. **清晰度验证**
   - 只允许标准清晰度：360p、480p、720p、1080p、1440p、2160p

5. **资源验证**
   - 验证 Banner/Episode 是否存在
   - 使用 404 响应不存在的资源

6. **预签名 URL 有效期**
   - 图片：1 小时（3600 秒）
   - 视频：2 小时（7200 秒）

## 🚀 前端使用示例

### Banner 图片上传

```typescript
async function uploadBannerImage(bannerId: number, file: File) {
  try {
    // 1. 获取预签名 URL
    const response = await fetch(
      `/api/admin/banners/${bannerId}/presigned-upload-url?` +
      `filename=${encodeURIComponent(file.name)}&` +
      `contentType=${encodeURIComponent(file.type)}`
    );
    const { uploadUrl, fileKey, publicUrl } = await response.json();

    // 2. 直接上传到 R2
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error('Upload failed');
    }

    // 3. 通知后端
    await fetch(`/api/admin/banners/${bannerId}/upload-complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileKey,
        publicUrl,
        fileSize: file.size,
      }),
    });

    return publicUrl;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}
```

### Episode 视频上传（带进度）

```typescript
async function uploadEpisodeVideo(
  episodeId: number,
  file: File,
  quality: string,
  onProgress: (percent: number) => void
) {
  try {
    // 1. 获取预签名 URL
    const response = await fetch(
      `/api/admin/episodes/${episodeId}/presigned-upload-url?` +
      `filename=${encodeURIComponent(file.name)}&` +
      `contentType=${encodeURIComponent(file.type)}&` +
      `quality=${quality}`
    );
    const { uploadUrl, fileKey, publicUrl } = await response.json();

    // 2. 使用 XMLHttpRequest 上传并监听进度
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // 监听上传进度
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      });

      // 监听上传完成
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          resolve();
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      });

      // 监听错误
      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      // 发起上传
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });

    // 3. 通知后端
    await fetch(`/api/admin/episodes/${episodeId}/upload-complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileKey,
        publicUrl,
        quality,
        fileSize: file.size,
      }),
    });

    return publicUrl;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}
```

## ⚠️ 重要提醒

### 1. 必须配置 R2 CORS

在 Cloudflare R2 控制台配置 CORS，否则前端上传会被浏览器拦截：

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://your-production-domain.com"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

**配置步骤**:
1. 登录 Cloudflare Dashboard
2. 进入 R2 → 选择 `static-storage` bucket
3. 点击 "Settings" → "CORS Policy"
4. 添加上述 CORS 规则

### 2. 环境变量

确保 `.env` 文件包含以下配置：

```bash
R2_ENDPOINT_URL=https://xxx.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=static-storage
R2_PUBLIC_BASE_URL=https://static.656932.com
```

### 3. 权限验证

建议添加认证和授权：

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Get(':id/presigned-upload-url')
async getPresignedUploadUrl(...) { ... }
```

## 📊 测试清单

- [ ] Banner 获取预签名 URL
- [ ] Banner 上传完成通知
- [ ] Episode 获取预签名 URL
- [ ] Episode 上传完成通知
- [ ] 文件类型验证
- [ ] 文件扩展名验证
- [ ] 路径安全验证
- [ ] 清晰度参数验证
- [ ] 资源存在性验证
- [ ] CORS 配置测试（前端实际上传）
- [ ] 大文件上传测试（> 100MB）
- [ ] 多清晰度视频上传测试

## 🎯 下一步

1. **配置 Cloudflare R2 CORS**（必须！）
2. **前端集成**
   - 实现文件选择组件
   - 实现上传进度条
   - 实现错误处理
3. **测试**
   - 使用测试脚本验证接口
   - 前端实际上传测试
   - 不同文件大小测试
4. **可选增强**
   - 实现分片上传（大文件 > 500MB）
   - 添加上传队列管理
   - 添加断点续传功能
   - 添加图片压缩/视频转码

## 📝 更新的文件列表

1. ✅ `package.json` - 添加依赖
2. ✅ `src/core/storage/r2-storage.service.ts` - 扩展服务
3. ✅ `src/admin/dto/presigned-upload.dto.ts` - 新建 DTO
4. ✅ `src/admin/controllers/admin-banners.controller.ts` - 添加接口
5. ✅ `src/admin/controllers/admin-episodes.controller.ts` - 添加接口
6. ✅ `test-r2-direct-upload.sh` - 测试脚本
7. ✅ `docs/backend-banner-image-upload.md` - 优化文档
8. ✅ `docs/backend-episode-video-upload.md` - 优化文档
9. ✅ `docs/r2-direct-upload-review.md` - 评估报告
10. ✅ `docs/r2-direct-upload-implementation.md` - 本文档

## 🎉 实现完成！

所有后端接口已实现完毕，可以开始前端集成和测试！

