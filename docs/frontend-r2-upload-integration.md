# 前端 R2 直传功能集成文档

本文档专门为前端开发人员准备，包含所有必要的接口信息、代码示例和注意事项。

---

## 📋 目录

1. [API 接口说明](#api-接口说明)
2. [前端实现示例](#前端实现示例)
3. [错误处理](#错误处理)
4. [注意事项](#注意事项)
5. [常见问题](#常见问题)

---

## 🔌 API 接口说明

### 基础信息

- **后端地址**: `http://localhost:9090` (开发环境)
- **API 前缀**: `/api/admin`
- **请求头**: `Content-Type: application/json`

---

## 📸 Banner 图片上传

### 1. 获取预签名上传 URL

**接口**: `GET /api/admin/banners/:id/presigned-upload-url`

**请求参数** (Query String):
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `filename` | string | 是 | 文件名，如 `banner.jpg` |
| `contentType` | string | 是 | 文件 MIME 类型，如 `image/jpeg` |

**支持的图片类型**:
- `image/jpeg`
- `image/jpg`
- `image/png`
- `image/webp`
- `image/gif`

**响应示例**:
```json
{
  "uploadUrl": "https://xxx.r2.cloudflarestorage.com/static-storage/banners/16/image_uuid.jpg?X-Amz-Algorithm=...",
  "fileKey": "banners/16/image_uuid.jpg",
  "publicUrl": "https://static.656932.com/banners/16/image_uuid.jpg"
}
```

**响应字段说明**:
- `uploadUrl`: 预签名上传 URL，前端直接使用此 URL 上传文件
- `fileKey`: 文件在 R2 中的路径
- `publicUrl`: 文件的公开访问 URL（上传完成后使用）

---

### 2. 通知后端上传完成

**接口**: `POST /api/admin/banners/:id/upload-complete`

**请求参数** (Path):
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | number | 是 | Banner ID |

**请求体** (JSON):
```json
{
  "fileKey": "banners/16/image_uuid.jpg",
  "publicUrl": "https://static.656932.com/banners/16/image_uuid.jpg",
  "fileSize": 524288
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "Image upload completed",
  "imageUrl": "https://static.656932.com/banners/16/image_uuid.jpg"
}
```

---

## 🎬 Episode 视频上传

### 1. 获取预签名上传 URL

**接口**: `GET /api/admin/episodes/:id/presigned-upload-url`

**请求参数** (Query String):
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `filename` | string | 是 | 文件名，如 `video.mp4` |
| `contentType` | string | 是 | 文件 MIME 类型，如 `video/mp4` |
| `quality` | string | 否 | 清晰度，如 `720p`（默认: `720p`）|

**支持的视频类型**:
- `video/mp4`
- `video/mpeg`
- `video/quicktime` (MOV)
- `video/x-msvideo` (AVI)
- `video/webm`

**支持的清晰度**:
- `360p`
- `480p`
- `720p`
- `1080p`
- `1440p`
- `2160p` (4K)

**响应示例**:
```json
{
  "uploadUrl": "https://xxx.r2.cloudflarestorage.com/static-storage/episodes/28872/video_720p_uuid.mp4?X-Amz-Algorithm=...",
  "fileKey": "episodes/28872/video_720p_uuid.mp4",
  "publicUrl": "https://static.656932.com/episodes/28872/video_720p_uuid.mp4",
  "quality": "720p"
}
```

---

### 2. 通知后端上传完成

**接口**: `POST /api/admin/episodes/:id/upload-complete`

**请求参数** (Path):
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | number | 是 | Episode ID |

**请求体** (JSON):
```json
{
  "fileKey": "episodes/28872/video_720p_uuid.mp4",
  "publicUrl": "https://static.656932.com/episodes/28872/video_720p_uuid.mp4",
  "quality": "720p",
  "fileSize": 10485760
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "Video upload completed",
  "publicUrl": "https://static.656932.com/episodes/28872/video_720p_uuid.mp4",
  "quality": "720p",
  "fileSize": 10485760
}
```

---

## 💻 前端实现示例

### Banner 图片上传（基础版）

```typescript
/**
 * Banner 图片上传
 * @param bannerId Banner ID
 * @param file 图片文件
 * @returns 公开访问 URL
 */
async function uploadBannerImage(bannerId: number, file: File): Promise<string> {
  try {
    // 1. 获取预签名 URL
    const response = await fetch(
      `http://localhost:9090/api/admin/banners/${bannerId}/presigned-upload-url?` +
      `filename=${encodeURIComponent(file.name)}&` +
      `contentType=${encodeURIComponent(file.type)}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '获取上传 URL 失败');
    }

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
      throw new Error('上传文件失败');
    }

    // 3. 通知后端上传完成
    const completeResponse = await fetch(
      `http://localhost:9090/api/admin/banners/${bannerId}/upload-complete`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileKey,
          publicUrl,
          fileSize: file.size,
        }),
      }
    );

    if (!completeResponse.ok) {
      throw new Error('通知后端失败');
    }

    return publicUrl;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}
```

---

### Banner 图片上传（带进度和错误处理）

```typescript
/**
 * Banner 图片上传（带进度回调）
 * @param bannerId Banner ID
 * @param file 图片文件
 * @param onProgress 进度回调 (0-100)
 * @returns 公开访问 URL
 */
async function uploadBannerImageWithProgress(
  bannerId: number,
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  try {
    // 1. 获取预签名 URL
    const response = await fetch(
      `http://localhost:9090/api/admin/banners/${bannerId}/presigned-upload-url?` +
      `filename=${encodeURIComponent(file.name)}&` +
      `contentType=${encodeURIComponent(file.type)}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '获取上传 URL 失败');
    }

    const { uploadUrl, fileKey, publicUrl } = await response.json();

    // 2. 使用 XMLHttpRequest 上传并监听进度
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // 监听上传进度
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      });

      // 监听上传完成
      xhr.addEventListener('load', () => {
        if (xhr.status === 200 || xhr.status === 204) {
          resolve();
        } else {
          reject(new Error(`上传失败: ${xhr.status}`));
        }
      });

      // 监听错误
      xhr.addEventListener('error', () => {
        reject(new Error('上传失败'));
      });

      // 监听取消
      xhr.addEventListener('abort', () => {
        reject(new Error('上传已取消'));
      });

      // 发起上传
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });

    // 3. 通知后端上传完成
    const completeResponse = await fetch(
      `http://localhost:9090/api/admin/banners/${bannerId}/upload-complete`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileKey,
          publicUrl,
          fileSize: file.size,
        }),
      }
    );

    if (!completeResponse.ok) {
      const error = await completeResponse.json();
      throw new Error(error.message || '通知后端失败');
    }

    const result = await completeResponse.json();
    return result.imageUrl;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}
```

---

### Episode 视频上传（带进度）

```typescript
/**
 * Episode 视频上传（带进度回调）
 * @param episodeId Episode ID
 * @param file 视频文件
 * @param quality 清晰度 (720p, 1080p, etc.)
 * @param onProgress 进度回调 (0-100)
 * @returns 公开访问 URL
 */
async function uploadEpisodeVideo(
  episodeId: number,
  file: File,
  quality: string = '720p',
  onProgress?: (percent: number) => void
): Promise<string> {
  try {
    // 1. 获取预签名 URL
    const response = await fetch(
      `http://localhost:9090/api/admin/episodes/${episodeId}/presigned-upload-url?` +
      `filename=${encodeURIComponent(file.name)}&` +
      `contentType=${encodeURIComponent(file.type)}&` +
      `quality=${quality}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '获取上传 URL 失败');
    }

    const { uploadUrl, fileKey, publicUrl } = await response.json();

    // 2. 使用 XMLHttpRequest 上传并监听进度
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // 监听上传进度
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      });

      // 监听上传完成
      xhr.addEventListener('load', () => {
        if (xhr.status === 200 || xhr.status === 204) {
          resolve();
        } else {
          reject(new Error(`上传失败: ${xhr.status}`));
        }
      });

      // 监听错误
      xhr.addEventListener('error', () => {
        reject(new Error('上传失败'));
      });

      // 监听取消
      xhr.addEventListener('abort', () => {
        reject(new Error('上传已取消'));
      });

      // 发起上传
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });

    // 3. 通知后端上传完成
    const completeResponse = await fetch(
      `http://localhost:9090/api/admin/episodes/${episodeId}/upload-complete`,
      {
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
      }
    );

    if (!completeResponse.ok) {
      const error = await completeResponse.json();
      throw new Error(error.message || '通知后端失败');
    }

    const result = await completeResponse.json();
    return result.publicUrl;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}
```

---

### React 组件示例

```tsx
import React, { useState } from 'react';

interface UploadBannerProps {
  bannerId: number;
  onUploadComplete: (imageUrl: string) => void;
}

export const UploadBanner: React.FC<UploadBannerProps> = ({ bannerId, onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('不支持的文件类型，请上传 JPEG、PNG、WebP 或 GIF 图片');
      return;
    }

    // 验证文件大小（10MB）
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('文件大小不能超过 10MB');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const imageUrl = await uploadBannerImageWithProgress(
        bannerId,
        file,
        (percent) => setProgress(percent)
      );
      onUploadComplete(imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        disabled={uploading}
      />
      
      {uploading && (
        <div>
          <progress value={progress} max={100} />
          <span>{progress}%</span>
        </div>
      )}
      
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
};
```

---

### Vue 组件示例

```vue
<template>
  <div>
    <input
      type="file"
      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
      @change="handleFileChange"
      :disabled="uploading"
    />
    
    <div v-if="uploading">
      <progress :value="progress" :max="100" />
      <span>{{ progress }}%</span>
    </div>
    
    <div v-if="error" style="color: red">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  bannerId: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  uploadComplete: [imageUrl: string];
}>();

const uploading = ref(false);
const progress = ref(0);
const error = ref<string | null>(null);

const handleFileChange = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  // 验证文件类型
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    error.value = '不支持的文件类型，请上传 JPEG、PNG、WebP 或 GIF 图片';
    return;
  }

  // 验证文件大小（10MB）
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    error.value = '文件大小不能超过 10MB';
    return;
  }

  uploading.value = true;
  progress.value = 0;
  error.value = null;

  try {
    const imageUrl = await uploadBannerImageWithProgress(
      props.bannerId,
      file,
      (percent) => (progress.value = percent)
    );
    emit('uploadComplete', imageUrl);
  } catch (err) {
    error.value = err instanceof Error ? err.message : '上传失败';
  } finally {
    uploading.value = false;
  }
};
</script>
```

---

## 🚨 错误处理

### 常见错误码

| HTTP 状态码 | 说明 | 处理方式 |
|------------|------|----------|
| 400 | 参数错误（文件类型、文件名等） | 提示用户检查文件 |
| 404 | Banner/Episode 不存在 | 提示资源不存在 |
| 500 | 服务器错误 | 提示稍后重试 |

### 错误响应示例

```json
{
  "message": "Invalid image type. Allowed: JPEG, PNG, WebP, GIF",
  "error": "Bad Request",
  "statusCode": 400
}
```

### 错误处理示例

```typescript
try {
  const imageUrl = await uploadBannerImage(bannerId, file);
  // 成功处理
} catch (error) {
  if (error.response?.status === 400) {
    // 参数错误，提示用户
    alert('文件格式不正确，请上传 JPEG、PNG、WebP 或 GIF 图片');
  } else if (error.response?.status === 404) {
    // 资源不存在
    alert('Banner 不存在');
  } else {
    // 其他错误
    alert('上传失败，请稍后重试');
  }
}
```

---

## ⚠️ 注意事项

### 1. CORS 配置（重要！）

**必须在 Cloudflare R2 控制台配置 CORS**，否则前端上传会被浏览器拦截。

如果遇到 CORS 错误，请联系后端开发人员配置 CORS。

### 2. 文件大小限制

- **图片**: 建议不超过 10MB
- **视频**: 
  - 720p: 建议不超过 200MB
  - 1080p: 建议不超过 500MB
  - 4K: 建议不超过 2GB

### 3. 预签名 URL 有效期

- **图片**: 1 小时
- **视频**: 2 小时

如果上传时间较长，URL 可能过期。建议：
- 大文件使用分片上传（未来功能）
- 显示上传进度，让用户知道上传状态

### 4. 文件类型验证

前端也应该验证文件类型，提供更好的用户体验：

```typescript
// 图片类型
const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

// 视频类型
const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
```

### 5. 上传进度

对于大文件，建议显示上传进度，提升用户体验。

### 6. 错误处理

建议实现完善的错误处理：
- 网络错误
- 文件格式错误
- 文件大小超限
- 上传失败重试

---

## ❓ 常见问题

### Q1: 上传时提示 CORS 错误

**A**: 需要在 Cloudflare R2 控制台配置 CORS。请联系后端开发人员。

### Q2: 上传大文件时 URL 过期

**A**: 视频上传 URL 有效期为 2 小时。如果上传时间超过 2 小时，需要重新获取 URL。

### Q3: 如何取消上传？

**A**: 使用 `XMLHttpRequest.abort()` 可以取消上传：

```typescript
const xhr = new XMLHttpRequest();
// ... 设置 xhr
xhr.abort(); // 取消上传
```

### Q4: 上传失败后如何重试？

**A**: 需要重新获取预签名 URL，然后重新上传。

### Q5: 支持断点续传吗？

**A**: 当前版本不支持断点续传。未来可能会实现分片上传功能。

---

## 📞 联系支持

如有问题，请联系后端开发人员或查看以下文档：

- [后端实现文档](./backend-banner-image-upload.md)
- [后端实现文档](./backend-episode-video-upload.md)
- [测试报告](./r2-direct-upload-test-report.md)

---

**文档版本**: 1.0  
**最后更新**: 2025-11-08

